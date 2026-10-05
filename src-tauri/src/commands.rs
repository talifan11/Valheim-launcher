//! ============================================================
//! Tauri-команды — «мост» между React-фронтендом и системой.
//! Каждая функция возвращает Result<T, String>: строка ошибки
//! долетает до JS в виде отклонённого промиса (никаких unwrap!).
//! ============================================================

use crate::config::{self, Config};
use std::net::UdpSocket;
use std::path::Path;
use std::process::Command;
use std::time::Duration;
use tauri::Manager;

/// Имя исполняемого файла игры (п. 3.4 ТЗ)
const GAME_EXE: &str = "valheim.exe";

/// get_config() — прочитать config.json с диска
#[tauri::command]
pub fn get_config(app: tauri::AppHandle) -> Result<Config, String> {
    config::read_config(&app)
}

/// set_config(config) — сохранить весь конфиг на диск.
/// Имя аргумента в JS — `config` (Tauri конвертирует camelCase↔snake_case).
#[tauri::command]
pub fn set_config(app: tauri::AppHandle, config: Config) -> Result<(), String> {
    config::write_config(&app, &config)
}

/// check_game_path(gamePath) — лежит ли valheim.exe в указанной папке.
/// Собираем путь как <game_path>/valheim.exe (с учётом слэшей обеих ОС).
#[tauri::command]
pub fn check_game_path(game_path: String) -> Result<bool, String> {
    if game_path.trim().is_empty() {
        return Ok(false); // путь не настроен — считаем, что игры нет
    }
    let exe = Path::new(game_path.trim()).join(GAME_EXE);
    Ok(exe.is_file())
}

/// launch_game(gamePath) — запустить игру и свернуть окно лаунчера (п. 3.4 ТЗ).
/// Используем std::process::Command, spawn() — не ждём завершения процесса.
#[tauri::command]
pub fn launch_game(app: tauri::AppHandle, game_path: String) -> Result<String, String> {
    let exe = Path::new(game_path.trim()).join(GAME_EXE);
    if !exe.is_file() {
        return Err(format!("{} не найден — проверь путь в настройках", exe.display()));
    }

    // Запускаем из рабочей директории игры: некоторым пиратским сборкам
    // критично стартовать именно из своей папки (DLL рядом с exe).
    let child = Command::new(&exe)
        .current_dir(game_path.trim())
        // CREATE_NO_WINDOW не нужен — у игры своё окно; просто spawn'им.
        .spawn()
        .map_err(|e| format!("Не удалось запустить {}: {e}", exe.display()))?;

    // Сворачиваем окно лаунчера, чтобы не мозолить глаза во время игры
    if let Some(window) = app.get_webview_window("main") {
        // Ошибку сворачивания игнорируем: игра уже запускается, это косметика
        let _ = window.minimize();
    }

    let pid = child.id();
    Ok(format!("Игра запущена (PID {pid})"))
}

/// ping_server(address) — жив ли сервер: UDP-«пробова» в порт Valheim.
/// Выделенный сервер Valheim слушает UDP; если порт открыт, send() не
/// вернёт ошибку соединения. Ставим таймаут 1200 мс через set_read_timeout
/// и неблокирующий сокет, чтобы UI не зависал.
#[tauri::command]
pub fn ping_server(address: String) -> Result<bool, String> {
    // Разбираем host:port; кривой адрес в конфиге — это offline, а не паника
    let (host, port) = match address.rsplit_once(':') {
        Some((h, p)) => (h, p),
        None => return Ok(false),
    };
    let port: u16 = match port.trim().parse() {
        Ok(p) => p,
        Err(_) => return Ok(false),
    };
    if host.trim().is_empty() {
        return Ok(false);
    }

    // Минимальный валидный запрос ServerInfo от Valheim (протокол SRV~)
    const VALHEIM_SERVER_INFO_REQUEST: [u8; 5] = *b"SRV~\0";

    // bind на любой свободный локальный порт
    let socket = UdpSocket::bind("0.0.0.0:0")
        .map_err(|e| format!("Не удалось создать UDP-сокет: {e}"))?;
    // Таймауты: не ждём дольше секунды с небольшим
    socket
        .set_read_timeout(Some(Duration::from_millis(1200)))
        .map_err(|e| format!("Ошибка таймаута сокета: {e}"))?;
    socket
        .set_write_timeout(Some(Duration::from_millis(1200)))
        .map_err(|e| format!("Ошибка таймаута сокета: {e}"))?;

    // Отправляем запрос первому разрешённому адресу хоста
    let target = format!("{host}:{port}");
    let addrs: Vec<std::net::SocketAddr> = match target.to_socket_addrs() {
        Ok(iter) => iter.collect(),
        Err(_) => return Ok(false), // DNS не разрешился — сервер недоступен
    };
    let addr = match addrs.into_iter().next() {
        Some(a) => a,
        None => return Ok(false),
    };

    if socket.send_to(&VALHEIM_SERVER_INFO_REQUEST, addr).is_err() {
        return Ok(false);
    }

    // Ждём любой ответ — значит сервер жив
    let mut buf = [0u8; 2048];
    match socket.recv_from(&mut buf) {
        Ok((_len, _from)) => Ok(true),
        Err(_) => Ok(false), // таймаут или ICMP unreachable → offline
    }
}
