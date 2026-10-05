# ⚔️ Valheim Rouge

Стильный десктопный лаунчер для пиратской сборки Valheim в духе **Battle.net**:
тёмная тема, glassmorphism, золотая кнопка «ИГРАТЬ» и живой статус нашего сервера
`pgsql-louisville.tun.ply.gg:21589`.

## Стек (по ТЗ v2.0)

| Слой | Технология |
|---|---|
| Оболочка | **Tauri v2** (легче Electron в разы — системный WebView) |
| Бэкенд | **Rust** (`src-tauri/`) |
| Фронтенд | **React 18 + TypeScript + Vite** |
| Стиль | **Tailwind CSS** (палитра Blizzard в `tailwind.config.js` / `src/index.css`) |
| Анимации | **Framer Motion** |
| Иконки | **Lucide React** |
| Состояние | **Zustand** (`src/store/useLauncherStore.ts`) |

## Структура

```
├── src/                    # React-фронтенд
│   ├── components/         # TitleBar, LoginScreen, MainScreen, ServerStatus, SettingsModal, ui-кит
│   ├── store/              # Zustand-стор (конфиг, логин, запуск игры)
│   ├── lib/api.ts          # типизированная обёртка над Tauri invoke()
│   └── index.css           # CSS-кит: шрифты, палитра, .vr-glass/.vr-btn-* утилиты
└── src-tauri/              # Rust-бэкенд
    ├── src/lib.rs          # сборка приложения, регистрация команд
    ├── src/commands.rs     # get_config / set_config / check_game_path / launch_game / ping_server
    ├── src/config.rs       # %APPDATA%/ValheimRouge/config.json
    └── capabilities/       # права webview (окно + диалоги)
```

## Команды

```bash
npm install            # зависимости фронтенда
npm run dev            # UI в браузере (без Rust-вызовов, для вёрстки)
npm run tauri dev      # запуск лаунчера «как есть» (нужен Rust toolchain)
npm run tauri build    # сборка .exe (bundle → src-tauri/target/release/bundle/)
```

> Для `tauri`-команд нужны: [Rust](https://rustup.rs) и системные зависимости
> (Windows: WebView2 + MSVC; Linux: `libwebkit2gtk-4.1-dev` и т.п. — см. docs).

## Как это работает

* **Окно без рамки** — `"decorations": false`, шапка с `data-tauri-drag-region`,
  свои кнопки свернуть/развернуть/закрыть (`TitleBar.tsx`).
* **Логин-заглушка** — оба поля непустые → внутрь; иначе анимированная ошибка.
* **PLAY** — Rust проверяет `<game_path>\valheim.exe`, запускает через
  `std::process::Command` и сворачивает окно лаунчера. Если файла нет — модалка
  с кнопкой «Выбрать папку» (нативный диалог).
* **Статус сервера** — честный UDP-пинг протокола Valheim (`SRV~`) из команды
  `ping_server`, автообновление каждые 15 секунд.
* **Конфиг** — `%APPDATA%/ValheimRouge/config.json`:

```json
{
  "game_path": "Z:\\Путь\\К\\Игре",
  "server_address": "pgsql-louisville.tun.ply.gg:21589",
  "username": "",
  "theme": "dark"
}
```

## Дальше (Фаза 2)

* Реальная авторизация по playit.gg-туннелю и генерация join-ссылки
* Live-карточка сервера: онлайн-игроки, имя мира (расширение `ping_server`)
* Система обновлений игры через лаунчер
