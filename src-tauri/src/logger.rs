// Логирование лаунчера. Пишет в %APPDATA%/ValheimRouge/logs/launcher.log
// с ротацией: 5 файлов по 10 МБ.

use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use std::sync::{Mutex, OnceLock};

const MAX_FILE_SIZE: u64 = 10 * 1024 * 1024;
const MAX_FILES: usize = 5;
const LOG_FILE_NAME: &str = "launcher.log";

static LOGGER: OnceLock<Mutex<LoggerState>> = OnceLock::new();

struct LoggerState {
    dir: PathBuf,
}

/// Инициализация логгера. Вызывается один раз при старте приложения.
pub fn init(log_dir: PathBuf) -> Result<(), String> {
    fs::create_dir_all(&log_dir)
        .map_err(|e| format!("Не удалось создать папку логов: {e}"))?;

    LOGGER
        .set(Mutex::new(LoggerState { dir: log_dir }))
        .map_err(|_| "Логгер уже инициализирован".to_string())?;

    log_info("Logger", "Логгер инициализирован");
    Ok(())
}

/// Путь к текущему файлу лога.
pub fn current_log_path() -> Result<PathBuf, String> {
    let state = LOGGER
        .get()
        .ok_or("Логгер не инициализирован")?
        .lock()
        .map_err(|_| "Не удалось получить доступ к логгеру")?;
    Ok(state.dir.join(LOG_FILE_NAME))
}

/// Папка с логами.
pub fn logs_dir() -> Result<PathBuf, String> {
    let state = LOGGER
        .get()
        .ok_or("Логгер не инициализирован")?
        .lock()
        .map_err(|_| "Не удалось получить доступ к логгеру")?;
    Ok(state.dir.clone())
}

/// Записать строку в лог.
pub fn log(level: &str, tag: &str, message: &str) {
    let state = match LOGGER.get() {
        Some(s) => s,
        None => return,
    };

    let mut guard = match state.lock() {
        Ok(g) => g,
        Err(_) => return,
    };

    let path = guard.dir.join(LOG_FILE_NAME);

    // Ротация по размеру
    if let Ok(meta) = fs::metadata(&path) {
        if meta.len() >= MAX_FILE_SIZE {
            rotate(&guard.dir);
        }
    }

    let timestamp = current_time();
    let line = format!("[{timestamp}] [{level}] [{tag}] {message}\n");

    if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(&path) {
        let _ = f.write_all(line.as_bytes());
    }

    // stderr для dev-режима
    eprint!("{line}");

    // Подавляем warning о неиспользуемом mut
    let _ = &mut guard;
}

pub fn log_info(tag: &str, message: &str) {
    log("INFO", tag, message);
}

pub fn log_warn(tag: &str, message: &str) {
    log("WARN", tag, message);
}

pub fn log_error(tag: &str, message: &str) {
    log("ERROR", tag, message);
}

/// Ротация: launcher.log -> launcher.1.log -> ... -> launcher.4.log
fn rotate(dir: &PathBuf) {
    // Удаляем самый старый
    let oldest = dir.join(format!("launcher.{}.log", MAX_FILES - 1));
    let _ = fs::remove_file(&oldest);

    // Сдвигаем остальные
    for i in (1..MAX_FILES - 1).rev() {
        let from = dir.join(format!("launcher.{}.log", i));
        let to = dir.join(format!("launcher.{}.log", i + 1));
        if from.exists() {
            let _ = fs::rename(&from, &to);
        }
    }

    // Текущий -> launcher.1.log
    let current = dir.join(LOG_FILE_NAME);
    let first = dir.join("launcher.1.log");
    if current.exists() {
        let _ = fs::rename(&current, &first);
    }
}

/// Текущее время в формате YYYY-MM-DD HH:MM:SS
fn current_time() -> String {
    let secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);

    let days = secs / 86400;
    let time_of_day = secs % 86400;
    let h = time_of_day / 3600;
    let m = (time_of_day % 3600) / 60;
    let s = time_of_day % 60;

    let (year, month, day) = days_to_ymd(days);
    format!("{year:04}-{month:02}-{day:02} {h:02}:{m:02}:{s:02}")
}

fn days_to_ymd(days: i64) -> (i64, u32, u32) {
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
    (year, m as u32, d as u32)
}

// ============================================================
// Tauri-команды
// ============================================================

#[tauri::command]
pub fn get_logs_path() -> Result<String, String> {
    Ok(logs_dir()?.to_string_lossy().to_string())
}

#[tauri::command]
pub fn read_logs(max_lines: Option<usize>) -> Result<String, String> {
    let path = current_log_path()?;
    if !path.exists() {
        return Ok(String::new());
    }
    let text = fs::read_to_string(&path)
        .map_err(|e| format!("Не удалось прочитать лог: {e}"))?;
    let limit = max_lines.unwrap_or(500);
    let lines: Vec<&str> = text.lines().collect();
    let start = if lines.len() > limit { lines.len() - limit } else { 0 };
    Ok(lines[start..].join("\n"))
}

#[tauri::command]
pub fn clear_logs() -> Result<(), String> {
    let dir = logs_dir()?;
    let entries = fs::read_dir(&dir).map_err(|e| format!("Не удалось прочитать папку логов: {e}"))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_file() && path.extension().map_or(false, |e| e == "log") {
            let _ = File::create(&path).map(|f| drop(f));
        }
    }
    log_info("Logger", "Логи очищены");
    Ok(())
}
