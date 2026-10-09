//! Сетевой слой лаунчера: загрузка манифеста, скачивание файлов,
//! проверка целостности по SHA-256, распаковка архивов и запись
//! локального состояния установки.

use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Instant;

use futures::future::join_all;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use tauri::{AppHandle, Emitter};
use zip::ZipArchive;
use crate::logger;

/// Базовый URL раздачи файлов игры (статика на сервере владельца).
pub const BASE_URL: &str = "http://62.217.178.72";

/// Описание одного файла в манифесте.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManifestFile {
    pub path: String,
    pub sha256: String,
    pub size: u64,
    pub url: String,
}

/// Манифест версии: что скачивать и как проверять.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Manifest {
    pub version: String,
    pub updated: String,
    #[serde(default)]
    pub files: Vec<ManifestFile>,
    #[serde(default)]
    pub changelog: Vec<String>,
}

/// Статус локальной копии файла относительно манифеста.
#[derive(Debug, Clone, Serialize)]
pub struct FileStatus {
    pub path: String,
    pub status: String,
    pub size: u64,
}

/// Прогресс одного скачивания; летит во фронтенд через событие download-progress.
#[derive(Debug, Clone, Serialize)]
pub struct DownloadProgress {
    pub file: String,
    pub percent: f64,
    pub speed_mbps: f64,
    pub done: bool,
    pub error: Option<String>,
}

/// Итог пачки параллельных скачиваний.
#[derive(Debug, Clone, Serialize)]
pub struct BatchResult {
    pub ok: usize,
    pub failed: Vec<String>,
    pub total: usize,
}

/// Локальное состояние установленной версии (installed.json).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstalledState {
    pub version: String,
    pub installed_at: String,
}

/// Флаг отмены текущего процесса загрузки.
static DOWNLOAD_CANCELLED: AtomicBool = AtomicBool::new(false);

/// Путь к файлу состояния установки внутри appdata.
fn installed_path(_app: &AppHandle) -> Result<PathBuf, String> {
    Ok(base_data_dir()?.join("installed.json"))
}

/// Общая папка данных: %APPDATA%/ValheimRouge
/// app_data_dir() даёт %APPDATA%/<identifier>, а нам нужна папка без identifier.
fn base_data_dir() -> Result<PathBuf, String> {
    let base = dirs_next::config_dir()
        .ok_or_else(|| "Не удалось определить %APPDATA%".to_string())?;
    Ok(base.join("ValheimRouge"))
}

/// Путь к папке загрузок: %APPDATA%/ValheimRouge/downloads/
fn downloads_dir(_app: &AppHandle) -> Result<PathBuf, String> {
    let dir = base_data_dir()?.join("downloads");
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Не удалось создать папку загрузок: {e}"))?;
    Ok(dir)
}

/// Скачивает и парсит manifest.json с сервера.
#[tauri::command]
pub async fn fetch_manifest(url: String) -> Result<Manifest, String> {
    tauri::async_runtime::spawn_blocking(move || {
        fetch_manifest_blocking(url)
    })
    .await
    .map_err(|e| format!("Task join error: {e}"))?
}

fn fetch_manifest_blocking(url: String) -> Result<Manifest, String> {
    let response = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Не удалось создать HTTP-клиент: {e}"))?
        .get(&url)
        .send()
        .map_err(|e| format!("Сбой запроса манифеста: {e}"))?;

    if !response.status().is_success() {
        return Err(format!(
            "Манифест недоступен: HTTP {}",
            response.status().as_u16()
        ));
    }

    let bytes = response
        .bytes()
        .map_err(|e| format!("Сбой чтения манифеста: {e}"))?;
    let text = String::from_utf8(bytes.to_vec())
        .map_err(|_| "Манифест не является корректным UTF-8".to_string())?;
    parse_manifest_text(&text)
}

/// Парсер манифеста вынесен отдельно для возможности тестирования.
fn parse_manifest_text(text: &str) -> Result<Manifest, String> {
    serde_json::from_str::<Manifest>(text)
        .map_err(|e| format!("Некорректный формат манифеста: {e}"))
}

/// Проверяет наличие, размер и SHA-256 каждого файла из манифеста.
#[tauri::command]
pub async fn check_files(
    app: AppHandle,
    manifest: Manifest,
    install_dir: String,
) -> Result<Vec<FileStatus>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        check_files_blocking_with_progress(&app, manifest, install_dir)
    })
    .await
    .map_err(|e| format!("Task join error: {e}"))?
}

fn check_files_blocking_with_progress(
    app: &AppHandle,
    manifest: Manifest,
    install_dir: String,
) -> Result<Vec<FileStatus>, String> {
    if install_dir.trim().is_empty() {
        return Err("Папка установки не задана".to_string());
    }
    let root = Path::new(&install_dir);
    let total = manifest.files.len();
    let mut statuses = Vec::with_capacity(total);

    for (i, file) in manifest.files.iter().enumerate() {
        statuses.push(FileStatus {
            path: file.path.clone(),
            status: local_file_status(root, file),
            size: file.size,
        });

        // Эмитим прогресс каждые 10 файлов.
        if i % 10 == 0 || i == total - 1 {
            let _ = app.emit(
                "check-progress",
                serde_json::json!({
                    "checked": i + 1,
                    "total": total,
                    "current": file.path,
                }),
            );
        }
    }

    Ok(statuses)
}

fn check_files_blocking(
    manifest: Manifest,
    install_dir: String,
) -> Result<Vec<FileStatus>, String> {
    if install_dir.trim().is_empty() {
        return Err("Папка установки не задана".to_string());
    }
    let root = Path::new(&install_dir);
    let statuses = manifest
        .files
        .iter()
        .map(|file| FileStatus {
            path: file.path.clone(),
            status: local_file_status(root, file),
            size: file.size,
        })
        .collect();
    Ok(statuses)
}

/// Статус одного файла на диске.
fn local_file_status(root: &Path, file: &ManifestFile) -> String {
    let full_path = root.join(&file.path);
    if !full_path.exists() {
        return "MISSING".to_string();
    }
    match fs::metadata(&full_path) {
        Ok(meta) if meta.len() != file.size => "OUTDATED".to_string(),
        Ok(_) => match sha256_of_file(&full_path) {
            Ok(hash) if hash.eq_ignore_ascii_case(&file.sha256) => "OK".to_string(),
            Ok(_) => "OUTDATED".to_string(),
            Err(_) => "ERROR".to_string(),
        },
        Err(_) => "ERROR".to_string(),
    }
}

/// HEX SHA-256 файла, читается блоками чтобы не грузить память.
fn sha256_of_file(path: &Path) -> Result<String, String> {
    let mut file = File::open(path).map_err(|e| format!("Файл не открыт: {e}"))?;
    let mut hasher = Sha256::new();
    let mut buffer = vec![0u8; 64 * 1024];
    loop {
        let read = file
            .read(&mut buffer)
            .map_err(|e| format!("Сбой чтения: {e}"))?;
        if read == 0 {
            break;
        }
        hasher.update(&buffer[..read]);
    }
    Ok(hex_digest(&hasher.finalize()))
}

/// Даёт хеш готового файла без повтора кода чтения.
fn hex_digest(bytes: &[u8]) -> String {
    let mut out = String::with_capacity(bytes.len() * 2);
    for byte in bytes {
        out.push_str(&format!("{byte:02x}"));
    }
    out
}

/// Скачивает один файл во временный путь, проверяет хеш и кладёт на место.
#[tauri::command]
pub fn download_file(
    url: String,
    dest: String,
    expected_sha256: String,
    app: AppHandle,
) -> Result<(), String> {
    let outcome = run_download(&url, &dest, &expected_sha256, Some(&app));
    if outcome.is_ok() {
        emit_progress(&app, &dest, 100.0, 0.0, true, None);
    }
    outcome
}

/// Общая логика одиночной загрузки: прогресс шлём только если передан app handle.
fn run_download(
    url: &str,
    dest: &str,
    expected_sha256: &str,
    app: Option<&AppHandle>,
) -> Result<(), String> {
    let response = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(1800))
        .build()
        .map_err(|e| format!("Не удалось создать HTTP-клиент: {e}"))?
        .get(url)
        .send()
        .map_err(|e| format!("Сбой запроса файла: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("HTTP {}", response.status().as_u16()));
    }

    let total = response.content_length().unwrap_or(0);
    let file_name = Path::new(dest)
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or(dest)
        .to_string();

    let mut tmp_path = PathBuf::from(dest);
    let file_name_tmp = format!(
        "{}.part",
        tmp_path
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("download")
    );
    tmp_path.set_file_name(file_name_tmp);

    if let Some(parent) = Path::new(dest).parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Не удалось создать папку {}: {e}", parent.display()))?;
    }

    let mut out = File::create(&tmp_path)
        .map_err(|e| format!("Не удалось создать временный файл: {e}"))?;
    let mut hasher = Sha256::new();
    let mut received: u64 = 0;
    let started = Instant::now();
    let mut last_emit = Instant::now();
    let mut chunk = [0u8; 64 * 1024];

    let mut stream = response;
    loop {
        match stream_chunk(&mut stream, &mut chunk) {
            Ok(0) => break,
            Err(e) => {
                let _ = fs::remove_file(&tmp_path);
                return Err(format!("Сбой приёма данных: {e}"));
            }
            Ok(n) => {
                out.write_all(&chunk[..n])
                    .map_err(|e| format!("Сбой записи на диск: {e}"))?;
                hasher.update(&chunk[..n]);
                received += n as u64;

                if let Some(handle) = app {
                    if DOWNLOAD_CANCELLED.load(Ordering::Relaxed) {
                        let _ = fs::remove_file(&tmp_path);
                        return Err("Загрузка отменена пользователем".to_string());
                    }
                    if last_emit.elapsed().as_millis() >= 200 {
                        let seconds = started.elapsed().as_secs_f64().max(0.001);
                        let speed_mbps = (received as f64 / seconds) / (1024.0 * 1024.0);
                        let percent = if total > 0 {
                            (received as f64 / total as f64) * 100.0
                        } else {
                            0.0
                        };
                        emit_progress(handle, &file_name, percent, speed_mbps, false, None);
                        last_emit = Instant::now();
                    }
                }
            }
        }
    }

    out.flush().map_err(|e| format!("Сбой сброса буфера: {e}"))?;
    drop(out);

    let actual = hex_digest(&hasher.finalize());
    if !actual.eq_ignore_ascii_case(expected_sha256) {
        let _ = fs::remove_file(&tmp_path);
        return Err(format!(
            "SHA-256 не совпал: ожидался {expected_sha256}, получен {actual}"
        ));
    }

    fs::rename(&tmp_path, dest)
        .map_err(|e| format!("Не удалось переместить файл на место: {e}"))?;
    Ok(())
}

/// Читает следующий кусок тела ответа.
fn stream_chunk(
    stream: &mut reqwest::blocking::Response,
    buffer: &mut [u8],
) -> Result<usize, String> {
    stream.read(buffer).map_err(|e| e.to_string())
}

/// Отправка payload события download-progress.
fn emit_progress(
    app: &AppHandle,
    file: &str,
    percent: f64,
    speed_mbps: f64,
    done: bool,
    error: Option<String>,
) {
    let payload = DownloadProgress {
        file: file.to_string(),
        percent,
        speed_mbps,
        done,
        error,
    };
    app.emit("download-progress", &payload).ok();
}

/// Скачивает файлы батчем.
#[tauri::command]
pub async fn download_batch(
    app: AppHandle,
    items: Vec<(String, String, String)>,
) -> Result<BatchResult, String> {
    DOWNLOAD_CANCELLED.store(false, Ordering::Relaxed);
    const MAX_CONCURRENT_DOWNLOADS: usize = 3;

    let total = items.len();
    let shared_app = Arc::new(app);
    let mut ok = 0usize;
    let mut failed: Vec<String> = Vec::new();

    for wave in items.chunks(MAX_CONCURRENT_DOWNLOADS) {
        let tasks: Vec<_> = wave
            .iter()
            .cloned()
            .map(|(url, dest, sha)| {
                let app_clone = Arc::clone(&shared_app);
                tauri::async_runtime::spawn_blocking(move || {
                    let outcome = run_download(&url, &dest, &sha, Some(&app_clone));
                    match &outcome {
                        Ok(_) => emit_progress(&app_clone, &dest, 100.0, 0.0, true, None),
                        Err(e) => emit_progress(&app_clone, &dest, 0.0, 0.0, true, Some(e.clone())),
                    }
                    (dest, outcome)
                })
            })
            .collect();

        for result in join_all(tasks).await {
            match result {
                Ok((_, Ok(()))) => ok += 1,
                Ok((dest, Err(_))) => failed.push(dest),
                Err(_) => failed.push("поток задачи завершился с ошибкой".to_string()),
            }
        }

        if DOWNLOAD_CANCELLED.load(Ordering::Relaxed) {
            break;
        }
    }

    Ok(BatchResult {
        ok,
        failed,
        total,
    })
}

/// Сигнал отмены активной загрузки.
#[tauri::command]
pub fn cancel_download() -> Result<(), String> {
    DOWNLOAD_CANCELLED.store(true, Ordering::Relaxed);
    Ok(())
}

/// Возвращает полный путь, куда лаунчер должен качать файл из манифеста.
#[tauri::command]
pub fn resolve_download_path(app: AppHandle, rel_path: String) -> Result<String, String> {
    let dir = downloads_dir(&app)?;
    let name = Path::new(&rel_path)
        .file_name()
        .and_then(|s| s.to_str())
        .ok_or_else(|| format!("Некорректный путь в манифесте: {rel_path}"))?;
    Ok(dir.join(name).to_string_lossy().to_string())
}

/// Распаковывает ZIP-архив в целевую папку.
#[tauri::command]
pub fn unpack_zip(zip_path: String, dest_dir: String) -> Result<usize, String> {
    let src = Path::new(&zip_path);
    if !src.is_file() {
        return Err(format!("Архив не найден: {zip_path}"));
    }
    let dst = Path::new(&dest_dir);
    fs::create_dir_all(dst)
        .map_err(|e| format!("Не удалось создать папку распаковки: {e}"))?;

    let file = File::open(src).map_err(|e| format!("Не открыть архив: {e}"))?;
    let mut archive = ZipArchive::new(file)
        .map_err(|e| format!("Битый ZIP-архив: {e}"))?;

    let mut count = 0usize;
    for i in 0..archive.len() {
        let mut entry = archive
            .by_index(i)
            .map_err(|e| format!("Ошибка чтения записи {i}: {e}"))?;

        let Some(rel_path) = entry.enclosed_name() else {
            continue;
        };
        let out_path = dst.join(rel_path);

        if entry.is_dir() {
            fs::create_dir_all(&out_path)
                .map_err(|e| format!("Не создать папку {}: {e}", out_path.display()))?;
            continue;
        }

        if let Some(parent) = out_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Не создать родителя {}: {e}", parent.display()))?;
        }

        let mut out = File::create(&out_path)
            .map_err(|e| format!("Не создать файл {}: {e}", out_path.display()))?;
        std::io::copy(&mut entry, &mut out)
            .map_err(|e| format!("Не записать {}: {e}", out_path.display()))?;
        count += 1;
    }

    Ok(count)
}

/// Читает установленную версию из installed.json; если файла нет — "0.0.0".
#[tauri::command]
pub fn get_installed_version(app: AppHandle) -> Result<String, String> {
    let path = installed_path(&app)?;
    if !path.exists() {
        return Ok("0.0.0".to_string());
    }
    let mut text = String::new();
    File::open(&path)
        .map_err(|e| format!("Не удалось открыть installed.json: {e}"))?
        .read_to_string(&mut text)
        .map_err(|e| format!("Не удалось прочитать installed.json: {e}"))?;
    let state: InstalledState = serde_json::from_str(&text)
        .map_err(|e| format!("Некорректный installed.json: {e}"))?;
    Ok(state.version)
}

/// Записывает установленную версию в installed.json.
#[tauri::command]
pub fn set_installed_version(app: AppHandle, version: String) -> Result<(), String> {
    let path = installed_path(&app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Не удалось создать папку данных: {e}"))?;
    }
    let state = InstalledState {
        version,
        installed_at: current_date_string(),
    };
    let json = serde_json::to_string_pretty(&state)
        .map_err(|e| format!("Не удалось сериализовать состояние: {e}"))?;
    fs::write(&path, json).map_err(|e| format!("Не удалось записать installed.json: {e}"))?;
    Ok(())
}

/// Текущая дата в формате YYYY-MM-DD.
fn current_date_string() -> String {
    let secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);
    days_to_date(secs / 86400)
}

/// Гражданская дата из числа дней с 1970-01-01.
fn days_to_date(days: i64) -> String {
    let z = days + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = if m <= 2 { y + 1 } else { y };
    format!("{year:04}-{m:02}-{d:02}")
}

// Проверяет, лежит ли в папке загрузок файл с ожидаемым SHA-256.
// Используется, чтобы не перекачивать ZIP, если он уже в кеше.
#[tauri::command]
pub fn check_cached_zip(app: AppHandle, rel_path: String, expected_sha256: String) -> Result<bool, String> {
    let dir = downloads_dir(&app)?;
    let name = Path::new(&rel_path)
        .file_name()
        .and_then(|s| s.to_str())
        .ok_or_else(|| format!("Некорректный путь в манифесте: {rel_path}"))?;
    let full = dir.join(name);
    if !full.is_file() {
        return Ok(false);
    }
    let actual = sha256_of_file(&full)?;
    Ok(actual.eq_ignore_ascii_case(&expected_sha256))
}

// Информация о версии лаунчера на сервере.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LauncherVersion {
    pub version: String,
    pub download_url: String,
    #[serde(default)]
    pub release_notes: String,
    #[serde(default)]
    pub published_at: String,
}

// Проверка обновления лаунчера: скачивает launcher-version.json
// и сравнивает semver с текущей версией.
#[tauri::command]
pub fn check_launcher_update(current_version: String) -> Result<Option<LauncherVersion>, String> {
    let url = format!("{}/launcher-version.json", BASE_URL);
    let response = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| format!("HTTP-клиент: {e}"))?
        .get(&url)
        .send()
        .map_err(|e| format!("Запрос версии лаунчера: {e}"))?;

    if !response.status().is_success() {
        return Ok(None);
    }

    let bytes = response.bytes().map_err(|e| format!("Чтение ответа: {e}"))?;
    let text = String::from_utf8(bytes.to_vec())
        .map_err(|_| "Ответ не UTF-8".to_string())?;

    let info: LauncherVersion = serde_json::from_str(&text)
        .map_err(|e| format!("Некорректный launcher-version.json: {e}"))?;

    if is_newer_version(&info.version, &current_version) {
        Ok(Some(info))
    } else {
        Ok(None)
    }
}

// Сравнение semver-подобных строк: "0.2.0" > "0.1.5"
fn is_newer_version(remote: &str, current: &str) -> bool {
    let parse = |s: &str| -> Vec<u32> {
        s.split('.')
            .filter_map(|p| p.trim().parse::<u32>().ok())
            .collect()
    };
    let r = parse(remote);
    let c = parse(current);
    for i in 0..3 {
        let rv = r.get(i).copied().unwrap_or(0);
        let cv = c.get(i).copied().unwrap_or(0);
        if rv > cv { return true; }
        if rv < cv { return false; }
    }
    false
}

// Скачивает установщик по URL и запускает его.
// После запуска установщика приложение должно закрыться.
#[tauri::command]
pub fn download_and_install_update(_app: AppHandle, url: String) -> Result<(), String> {
    logger::log_info("Updater", &format!("Начало обновления: {url}"));

    let unique = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);

    let updates_dir = dirs_next::data_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("ValheimRouge")
        .join("updates")
        .join(format!("update-{unique}"));

    std::fs::create_dir_all(&updates_dir)
        .map_err(|e| format!("Не удалось создать папку обновлений: {e}"))?;

    let url_path = url.split('?').next().unwrap_or(&url);
    let filename = url_path.split('/').last().unwrap_or("update.exe");
    let dest = updates_dir.join(filename);

    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(600))
        .build()
        .map_err(|e| format!("HTTP-клиент: {e}"))?;

    let response = client
        .get(&url)
        .send()
        .map_err(|e| format!("Не удалось начать скачивание: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("Ошибка скачивания: HTTP {}", response.status().as_u16()));
    }

    let mut file = File::create(&dest)
        .map_err(|e| format!("Не удалось создать файл: {e}"))?;

    let mut content = response;
    std::io::copy(&mut content, &mut file)
        .map_err(|e| format!("Ошибка записи: {e}"))?;

    drop(file);

    logger::log_info("Updater", &format!("Установщик скачан: {}", dest.display()));

    // Даём антивирусу время закончить сканирование
    std::thread::sleep(std::time::Duration::from_millis(1500));

    // Пробуем запустить через opener (использует ShellExecute на Windows)
    let mut last_err = String::new();
    let mut success = false;

    for attempt in 1..=5 {
        match opener::open(&dest) {
            Ok(_) => {
                success = true;
                logger::log_info("Updater", &format!("Установщик запущен (попытка {attempt})"));
                break;
            }
            Err(e) => {
                last_err = e.to_string();
                logger::log_warn("Updater", &format!("Попытка {attempt}: {last_err}"));
                std::thread::sleep(std::time::Duration::from_millis(1000));
            }
        }
    }

    if !success {
        return Err(format!("Не удалось запустить установщик: {last_err}"));
    }

    // Закрываем лаунчер, чтобы установщик мог заменить файлы
    std::thread::sleep(std::time::Duration::from_millis(800));
    logger::log_info("Updater", "Закрываем приложение для установки.");
    std::process::exit(0);
}

// === АУТЕНТИФИКАЦИЯ ===

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AuthResponse {
    pub token: String,
    pub user_id: i64,
    pub email: String,
    pub username: String,
}

#[derive(Debug, Clone, serde::Deserialize)]
struct ApiError {
    detail: String,
}

fn post_auth(url: &str, body: serde_json::Value) -> Result<AuthResponse, String> {
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| format!("HTTP-клиент: {e}"))?;

    let response = client
        .post(url)
        .json(&body)
        .send()
        .map_err(|e| format!("Сетевая ошибка: {e}"))?;

    let status = response.status();
    let text = response.text().map_err(|e| format!("Чтение ответа: {e}"))?;

    if !status.is_success() {
        if let Ok(err) = serde_json::from_str::<ApiError>(&text) {
            return Err(err.detail);
        }
        return Err(format!("HTTP {}", status.as_u16()));
    }

    serde_json::from_str::<AuthResponse>(&text)
        .map_err(|e| format!("Некорректный ответ сервера: {e}"))
}

#[tauri::command]
pub fn register_user(email: String, password: String, username: String) -> Result<AuthResponse, String> {
    let url = format!("{}/api/register", BASE_URL);
    let body = serde_json::json!({
        "email": email,
        "password": password,
        "username": username,
    });
    post_auth(&url, body)
}

#[tauri::command]
pub fn login_user(email: String, password: String) -> Result<AuthResponse, String> {
    let url = format!("{}/api/login", BASE_URL);
    let body = serde_json::json!({
        "email": email,
        "password": password,
    });
    post_auth(&url, body)
}
