// ============================================================
// Tauri-команды — мост между React-фронтендом и системой.
// Каждая функция возвращает Result<T, String>: строка ошибки
// долетает до JS в виде отклонённого промиса (никаких unwrap).
// ============================================================

use crate::config::{self, Config};
use std::net::ToSocketAddrs;
use std::path::Path;
use std::process::Command;
use std::time::Duration;
use tauri::Manager;

// Имя исполняемого файла игры.
const GAME_EXE: &str = "valheim.exe";

// Имя исполняемого файла выделенного сервера.
const SERVER_EXE: &str = "valheim_server.exe";

// get_config() — прочитать config.json с диска.
#[tauri::command]
pub fn get_config(app: tauri::AppHandle) -> Result<Config, String> {
    config::read_config(&app)
}

// set_config(config) — сохранить весь конфиг на диск.
// Имя аргумента в JS — config (Tauri конвертирует camelCase и snake_case).
#[tauri::command]
pub fn set_config(app: tauri::AppHandle, config: Config) -> Result<(), String> {
    config::write_config(&app, &config)
}

// check_game_path(gamePath) — лежит ли valheim.exe в указанной папке.
// Собираем путь как <game_path>/valheim.exe.
#[tauri::command]
pub fn check_game_path(game_path: String) -> Result<bool, String> {
    if game_path.trim().is_empty() {
        return Ok(false);
    }
    let exe = Path::new(game_path.trim()).join(GAME_EXE);
    Ok(exe.is_file())
}

// launch_game(gamePath) — запустить игру и свернуть окно лаунчера.
// Используем std::process::Command, spawn() — не ждём завершения процесса.
#[tauri::command]
pub fn launch_game(app: tauri::AppHandle, game_path: String) -> Result<String, String> {
    let exe = Path::new(game_path.trim()).join(GAME_EXE);
    if !exe.is_file() {
        return Err(format!(
            "{} не найден — проверь путь в настройках",
            exe.display()
        ));
    }

    // Запускаем из рабочей директории игры: некоторым пиратским сборкам
    // критично стартовать именно из своей папки (DLL рядом с exe).
    let child = Command::new(&exe)
        .current_dir(game_path.trim())
        .spawn()
        .map_err(|e| format!("Не удалось запустить {}: {e}", exe.display()))?;

    // Сворачиваем окно лаунчера, чтобы не мешало во время игры.
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.minimize();
    }

    let pid = child.id();
    Ok(format!("Игра запущена (PID {pid})"))
}

// ping_server(address) — трёхуровневая проверка статуса сервера:
//   1. Если локально запущен valheim_server.exe — "online".
//   2. Иначе пробуем TCP-подключение к VPS на порт 22 — "active".
//   3. Иначе — "offline".
#[tauri::command]
pub fn ping_server(address: String) -> Result<String, String> {
    // Уровень 1: локальный процесс Valheim-сервера.
    if is_local_server_running() {
        return Ok("online".to_string());
    }

    // Уровень 2: доступен ли VPS. Парсим host из адреса (без порта),
    // проверяем TCP-порт 22 (SSH) — он всегда открыт на VPS.
    let host = match address.rsplit_once(':') {
        Some((h, _)) => h.trim(),
        None => address.trim(),
    };
    if !host.is_empty() && is_host_reachable(host, 22) {
        return Ok("active".to_string());
    }

    // Уровень 3: ничего не ответило.
    Ok("offline".to_string())
}

// Проверяет, запущен ли valheim_server.exe в системе (только Windows).
fn is_local_server_running() -> bool {
    #[cfg(windows)]
    {
        let filter = format!("IMAGENAME eq {}", SERVER_EXE);
        let output = Command::new("tasklist")
            .args(["/FI", &filter, "/NH"])
            .output();
        if let Ok(out) = output {
            let stdout = String::from_utf8_lossy(&out.stdout);
            return stdout.to_lowercase().contains(&SERVER_EXE.to_lowercase());
        }
        false
    }
    #[cfg(not(windows))]
    {
        false
    }
}

// Пробует TCP-подключение к host:port с таймаутом 1.5 секунды.
fn is_host_reachable(host: &str, port: u16) -> bool {
    let target = format!("{host}:{port}");
    let addrs = match target.to_socket_addrs() {
        Ok(iter) => iter.collect::<Vec<_>>(),
        Err(_) => return false,
    };
    for addr in addrs {
        if std::net::TcpStream::connect_timeout(&addr, Duration::from_millis(1500)).is_ok() {
            return true;
        }
    }
    false
}

// Открыть папку в системном файловом менеджере.
// Windows: explorer.exe. macOS: open. Linux: xdg-open.
#[tauri::command]
pub fn open_folder(path: String) -> Result<(), String> {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return Err("Путь не задан".to_string());
    }
    let p = Path::new(trimmed);
    if !p.exists() {
        return Err(format!("Папка не существует: {}", trimmed));
    }

    #[cfg(windows)]
    {
        Command::new("explorer")
            .arg(trimmed)
            .spawn()
            .map_err(|e| format!("Не удалось открыть проводник: {e}"))?;
    }
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(trimmed)
            .spawn()
            .map_err(|e| format!("Не удалось открыть Finder: {e}"))?;
    }
    #[cfg(all(unix, not(target_os = "macos")))]
    {
        Command::new("xdg-open")
            .arg(trimmed)
            .spawn()
            .map_err(|e| format!("Не удалось открыть файловый менеджер: {e}"))?;
    }

    Ok(())
}
