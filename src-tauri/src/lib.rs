// ============================================================
// Valheim Rouge — Rust-бэкенд лаунчера (Tauri v2)
// Модули:
//   config   — чтение/запись %APPDATA%/ValheimRouge/config.json
//   commands — Tauri-команды для фронтенда (invoke)
//   network  — манифест, скачивание, распаковка и проверка файлов
//   logger   — логирование с ротацией
// Логика живёт в библиотеке, чтобы её можно было тестировать;
// main.rs лишь вызывает run().
// ============================================================

pub mod commands;
pub mod config;
pub mod logger;
pub mod network;

pub fn run() {
    // Путь к папке данных приложения.
    let app_data_dir = dirs_next::data_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("ValheimRouge");

    // Инициализация логгера. Ошибку не валим — если не получилось,
    // приложение продолжает работать без записи в файл.
    let _ = logger::init(app_data_dir.join("logs"));

    // tauri::Builder — стандартная точка входа.
    // generate_handler связывает JS invoke('имя') с #[tauri::command]-функциями.
    tauri::Builder::default()
        // Плагин диалогов: нужен для «Выбрать папку» в настройках.
        .plugin(tauri_plugin_dialog::init())
        // Плагин shell: открытие папки игры и логов через open().
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            // commands.rs
            commands::get_config,
            commands::set_config,
            commands::check_game_path,
            commands::launch_game,
            commands::ping_server,
            commands::open_folder,
            // network.rs
            network::fetch_manifest,
            network::check_files,
            network::download_file,
            network::download_batch,
            network::cancel_download,
            network::get_installed_version,
            network::set_installed_version,
            network::resolve_download_path,
            network::unpack_zip,
            network::check_cached_zip,
            network::check_launcher_update,
            network::register_user,
            network::login_user,
            network::download_and_install_update,
            // logger.rs
            logger::get_logs_path,
            logger::read_logs,
            logger::clear_logs,
        ])
        .run(tauri::generate_context!())
        // Стартовый bootstrap: если окно нельзя создать — дальше идти некуда,
        // поэтому ожидаемое поведение — падение с понятным сообщением.
        .expect("Ошибка запуска Valheim Rouge: не удалось создать окно приложения");
}
