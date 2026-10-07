//! ============================================================
//! Valheim Rouge — Rust-бэкенд лаунчера (Tauri v2)
//! Модули:
//!   config   — чтение/запись %APPDATA%/ValheimRouge/config.json
//!   commands — Tauri-команды для фронтенда (invoke)
//!   network  — манифест, скачивание и проверка целостности файлов
//! Логика живёт в библиотеке, чтобы её можно было тестировать;
//! main.rs лишь вызывает run().
//! ============================================================

pub mod commands;
pub mod config;
pub mod network;

pub fn run() {
    // tauri::Builder — стандартная точка входа.
    // generate_handler связывает JS invoke('имя') с #[tauri::command]-функциями.
    tauri::Builder::default()
        // Плагин диалогов: нужен для «Выбрать папку» в настройках
        .plugin(tauri_plugin_dialog::init())
        // Плагин shell: открытие папки игры и логов через open()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_config,
            commands::set_config,
            commands::check_game_path,
            commands::launch_game,
            commands::ping_server,
            network::fetch_manifest,
            network::check_files,
            network::download_file,
            network::download_batch,
            network::cancel_download,
            network::get_installed_version,
            network::set_installed_version,
        ])
        .run(tauri::generate_context!())
        // Это стартовый bootstrap: если окно нельзя создать — дальше идти некуда,
        // поэтому ожидаемое поведение — падение с понятным сообщением.
        .expect("Ошибка запуска Valheim Rouge: не удалось создать окно приложения");
}
