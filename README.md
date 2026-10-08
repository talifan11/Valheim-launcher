# Valheim Rouge Launcher

Десктопный лаунчер для игрового сервера Valheim Rouge на Tauri v2 + React 18 + Rust.

## Возможности

- Автоматическая установка и обновление файлов игры
- Кеширование ZIP-архивов
- Трёхуровневая проверка статуса сервера
- Список друзей и онлайн игроков
- Встроенный чат: общий + личные сообщения
- Разделы событий, модов, профиля
- Автообновление лаунчера
- Логи с ротацией
- Интерактивное обучение для новых игроков
- Профиль с 8 аватарами

## Технологии

- Tauri v2, React 18, TypeScript, Vite, Tailwind CSS
- Zustand, Framer Motion, Lucide React
- Rust: reqwest, sha2, zip, opener, dirs-next

## Установка

Разработка:

    git clone https://github.com/talifan11/Valheim-launcher.git
    cd Valheim-launcher
    npm install
    npm run tauri dev

Сборка релиза:

    npm run tauri build

Готовый установщик: src-tauri/target/release/bundle/nsis/

## Инфраструктура

- Игровой сервер: 85.198.70.143:2456 (UDP через WireGuard)
- Раздача файлов: http://62.217.178.72

## Конфигурация

- Настройки: %APPDATA%/ValheimRouge/config.json
- Логи: %APPDATA%/ValheimRouge/logs/launcher.log

## Лицензия

MIT
