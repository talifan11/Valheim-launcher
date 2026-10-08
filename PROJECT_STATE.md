# Valheim Rouge — состояние проекта

## Что это
Лаунчер Valheim на Tauri v2 + React 18 + Rust.
- Игровой сервер: 85.198.70.143:2456
- Раздача: 62.217.178.72
- Репо: https://github.com/talifan11/Valheim-launcher

## Версии (должны совпадать)
- package.json: 1.0.0
- tauri.conf.json: 1.0.0
- config.ts LAUNCHER_VERSION: 1.0.0
- launcher-version.json на VPS: 1.0.0

## Критичные фиксы
- commands.rs: use std::net::ToSocketAddrs
- network.rs: use tauri::{AppHandle, Emitter, Manager}
- network.rs: use zip::ZipArchive; use crate::logger;
- network.rs: BASE_URL = "http://62.217.178.72"
- config.rs: default_server_address() = "85.198.70.143:2456"
- lib.rs: регистрация unpack_zip, resolve_download_path, check_cached_zip, check_launcher_update, open_folder, get_logs_path, read_logs, clear_logs
- vite.config.ts: watch.ignored = ['**/src-tauri/**']

## Пути
- Проект: Z:\ValheinRogue\Launcher
- Установщик: src-tauri/target/release/bundle/nsis/
- На VPS: /var/www/valheim/launcher/

## Теги git
- v1.0-prealpha-stable
- v1.1-floating
- backup-local-main

## Что осталось
- CI/CD (GitHub Actions)
- Фидбек от корешей
- Реальный API для друзей/чата
