//! ============================================================
//! Valheim Rouge — Rust-бэкенд лаунчера (Tauri v2)
//! Модули:
//!   config   — чтение/запись %APPDATA%/ValheimRouge/config.json
//!   commands — Tauri-команды для фронтенда (invoke)
//! Логика живёт в библиотеке, чтобы её можно было тестировать;
//! main.rs лишь вызывает run().
//! ============================================================

pub mod commands;
pub mod config;

pub fn run() {
    // tauri::Builder — стандартная точка входа.
    // generate_handler связывает JS invoke('имя') с #[tauri::command]-функциями.
    tauri::Builder::default()
        // Плагин диалогов: нужен для «Выбрать папку» в настройках
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_config,
            commands::set_config,
            commands::check_game_path,
            commands::launch_game,
            commands::ping_server,
        ])
        .run(tauri::generate_context!())
        // Это стартовый bootstrap: если окно нельзя создать — дальше идти некуда,
        // поэтому ожидаемое поведение — падение с понятным сообщением.
        .expect("Ошибка запуска Valheim Rouge: не удалось создать окно приложения");
}
