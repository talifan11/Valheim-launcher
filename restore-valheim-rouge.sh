#!/usr/bin/env bash
# Valheim Rouge - скрипт восстановления проекта из исходников.
# Запуск: bash restore-valheim-rouge.sh (сначала cd в нужную папку!)
# package-lock.json намеренно НЕ включён: после восстановления запусти npm install.
# Иконки src-tauri/icons закоданы base64 внутри скрипта.
# Сам скрипт копирует себя в проект, поэтому его можно пересобирать без потерь.
set -e

mkdir -p src/components src/screens src/store src/lib src/data \
         src-tauri/src src-tauri/capabilities src-tauri/icons \
         public/backgrounds public/news
#!/usr/bin/env bash
# ============================================================
# Valheim Rouge — скрипт восстановления проекта из исходников.
# Запуск: bash restore-valheim-rouge.sh
# Создаёт все файлы в текущей директории (сначала cd в нужную папку!).
# package-lock.json намеренно НЕ включён: после восстановления запусти
#   npm install   — он сгенерирует лок сам по package.json.
# Иконки src-tauri/icons/*.png|ico закодированы base64 внутри heredoc.
# ============================================================
set -e

mkdir -p src/components src/screens src/store src/lib src/data \
         src-tauri/src src-tauri/capabilities src-tauri/icons \
         public/backgrounds public/news

echo '>>> .gitignore'
cat > '.gitignore' << 'VR_EOF'
# Сжатые архивы и локальные артефакты
*.tar.gz
*.b64
node_modules/
dist/
src-tauri/target/
.github_pr_body.md
valheim-rouge.bundle
tsconfig.tsbuildinfo
VR_EOF

echo '>>> README.md'
cat > 'README.md' << 'VR_EOF'
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

## 🚀 Публикация на GitHub

1. Создай **пустой** репозиторий на GitHub (без README и `.gitignore`).
2. Запусти скрипт `push-to-github.sh`, передав URL репозитория аргументом:

```bash
bash push-to-github.sh https://github.com/talifan11/valheim-rouge.git
# или по SSH:
bash push-to-github.sh git@github.com:talifan11/valheim-rouge.git
```

Скрипт сам сделает коммит, настроит `origin`, переименует ветку в `main` и выполнит `git push -u origin main`.

## Дальше (Фаза 2)

* Реальная авторизация по playit.gg-туннелю и генерация join-ссылки
* Live-карточка сервера: онлайн-игроки, имя мира (расширение `ping_server`)
* Система обновлений игры через лаунчер
VR_EOF

echo '>>> index.html'
cat > 'index.html' << 'VR_EOF'
<!doctype html>
<html lang="ru" data-tauri-drag-region>
  <head>
    <meta charset="UTF-8" />
    <!-- Отключаем стандартное выделение текста в UI лаунчера -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Valheim Rouge</title>
    <!-- Шрифты: Cinzel (заголовки), Inter (UI), JetBrains Mono (адрес сервера) -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
VR_EOF

echo '>>> package.json'
cat > 'package.json' << 'VR_EOF'
{
  "name": "valheim-rouge",
  "private": true,
  "version": "1.0.0",
  "description": "Valheim Rouge — стильный десктопный лаунчер для Valheim на Tauri v2",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "tauri": "tauri"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.1.0",
    "@tauri-apps/plugin-dialog": "^2.8.1",
    "framer-motion": "^11.11.0",
    "lucide-react": "^0.451.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.1.0",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.6.2",
    "vite": "^5.4.8"
  }
}
VR_EOF

echo '>>> postcss.config.js'
cat > 'postcss.config.js' << 'VR_EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
VR_EOF

echo '>>> public/backgrounds/README.txt'
cat > 'public/backgrounds/README.txt' << 'VR_EOF'
Положи сюда main.jpg (1920x1080) — атмосферный пейзаж Valheim.
VR_EOF

echo '>>> public/news/README.txt'
cat > 'public/news/README.txt' << 'VR_EOF'
Положи сюда server-launch.jpg, modpack.jpg, event.jpg, rules.jpg, welcome.jpg (600x400).
VR_EOF

echo '>>> push-to-github.sh'
cat > 'push-to-github.sh' << 'VR_EOF'
#!/usr/bin/env bash
# ============================================================
# Valheim Rouge — скрипт для отправки репозитория на GitHub
# ============================================================
# Использование:
#   1. Создай пустой репозиторий на GitHub (без README и .gitignore).
#   2. Замени REPO_URL ниже на адрес своего репозитория, например:
#        git@github.com:talifan11/valheim-rouge.git   (по SSH)
#        https://github.com/talifan11/valheim-rouge.git (по HTTPS)
#   3. Запусти:  bash push-to-github.sh
# ============================================================

set -e  # Остановка при любой ошибке

# --- Настройки -------------------------------------------------
REPO_URL="${1:-https://github.com/talifan11/valheim-rouge.git}"
BRANCH="main"
COMMIT_MSG="feat: Valheim Rouge v1.0.0 — Tauri лаунчер (React+TS+Tailwind+Framer Motion)"
# ---------------------------------------------------------------

cd "$(dirname "$0")"

echo "==> Проверяем Git..."
git --version

# Если это ещё не git-репозиторий — инициализируем
if [ ! -d .git ]; then
  echo "==> Инициализация git-репозитория..."
  git init -b "$BRANCH"
fi

echo "==> Добавляем все файлы в индекс..."
git add -A

# Коммитим только если есть незакоммиченные изменения
if ! git diff --cached --quiet; then
  echo "==> Создаём коммит..."
  git commit -m "$COMMIT_MSG"
else
  echo "==> Новых изменений нет, пропускаем коммит."
fi

echo "==> Устанавливаем ветку $BRANCH..."
git branch -M "$BRANCH"

# Настраиваем/обновляем remote origin
if git remote get-url origin >/dev/null 2>&1; then
  echo "==> Обновляем существующий remote 'origin'..."
  git remote set-url origin "$REPO_URL"
else
  echo "==> Добавляем remote 'origin': $REPO_URL"
  git remote add origin "$REPO_URL"
fi

echo "==> Отправляем на GitHub..."
git push -u origin "$BRANCH"

echo ""
echo "✅ Готово! Репозиторий отправлен: $REPO_URL"
echo "   Дальнейшие изменения: git add -A && git commit -m '...' && git push"
VR_EOF


echo '>>> src-tauri/Cargo.toml'
cat > 'src-tauri/Cargo.toml' << 'VR_EOF'
[package]
name = "valheim-rouge"
version = "1.0.0"
description = "Valheim Rouge — стильный лаунчер для Valheim на Tauri v2"
authors = ["Valheim Rouge Team"]
edition = "2021"

# Библиотека не используется (вся логика в main.rs), но Tauri CLI ожидает
# наличие lib; оставляем только bin-секцию для прозрачности сборки.
[lib]
name = "valheim_rouge_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[[bin]]
name = "valheim-rouge"
path = "src/main.rs"

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-dialog = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
VR_EOF

echo '>>> src-tauri/build.rs'
cat > 'src-tauri/build.rs' << 'VR_EOF'
fn main() {
    // Стандартный сборочный скрипт Tauri: генерирует иконки/компилирует ресурсы.
    tauri_build::build()
}
VR_EOF

echo '>>> src-tauri/capabilities/default.json'
cat > 'src-tauri/capabilities/default.json' << 'VR_EOF'
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Base launcher permissions: custom window controls and folder picker dialog",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-minimize",
    "core:window:allow-toggle-maximize",
    "core:window:allow-close",
    "core:window:allow-start-dragging",
    "dialog:allow-open"
  ]
}
VR_EOF

echo '>>> src-tauri/icons/128x128.png'
base64 -d > 'src-tauri/icons/128x128.png' << 'VR_EOF_B64'
iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAC4klEQVR42u3d7UfdYRzH8Z6kR/UvJJlEMknMJBlJkjFJEpmZRJJk9E9kpiQl02TJLKmOdCOnjnSjW91qZpakJCUpk9OjnqTWzbN+7/eDzx9wrs/Lcc7vd13fKyY2Lj7GcOMiCMBFEIARgBGAEYARgBGAEYARgBGAEYARgBGAEYARgBGAEYARQICS0BaNCgBc/nUEAC6fjABf/kBjIhoBvvzQ5yQ0Anz5Q1+S0Qjw5Q83vUAjwJc/0pyCRoAvf6wlFY0AX/54axoaAb78cFs6GgG+/In2l2gE+PIjHRloBPjyp75mohHgy5/uzEIjwJc/8+0VGgG+/Lmu12gE+PLnv2ejEeDLX+jOQSPAl7/Uk4tGgC9/5ccbNAJ8+as/89AI8OWv9eajEeDL3+grQCPAl7/VX4hGgC9/e7AIjQBf/q/QWzQCfPm/h96hEeDL/zNcjEaAL//vaAkaAb78nbFSNAJ8+bvjZWgE+PL3wuVoBPjy9ycr0Ajw5R9E3qMR4Ms/nPqARoAv/2j6IxoBvvzj2Uo0Anz5J3NVaAT48k/nq9EI8OWfLdagEeDLP1+uRSPAl3+xUodGgC//32o9GgG+/Mv1T2gE+PKjmw1oBH4D+A3gbwB/A/gvwH8BPgfwOYBPAn0S6LsA3wX4NtC3ge4HcD+AO4LcEeSeQPcEuivYXcGeC/BcgCeDPBnk2UDPBno62NPBzgdwPoATQpwQ4owgZwQ5JcwpYc4JdE6gk0KdFOqsYGcFOy3caeHeF+B9Ad4Y4o0h3hnknUHeGuatYd4bKABvDhWAdwcL4Bkh8PZwOAJq+YED8FQE1PIDCeApCKjlBxbAYxFQyw80gMcgoJYfeAAPRUAtHwHgIQio5WMA3IeAWj4KwP8QUMvHAbgLAbV8JIDbEFDLxwK4iYBaPhrATQTUNUADuEZA/vx4APS4CAJwEQRgBGAEYARgBGAEYARgBGAEYARgBGAEYARgBGAEYAKWK/RzEPlxTcqCAAAAAElFTkSuQmCC
VR_EOF_B64

echo '>>> src-tauri/icons/128x128@2x.png'
base64 -d > 'src-tauri/icons/128x128@2x.png' << 'VR_EOF_B64'
iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAGlElEQVR42u3dxQ6cZQCG0W4IK7gFXINrcA2uwaEQXINruAncixYrbnUoUHdvoUDRYsW9aFkRQrAuCc9ZPDfwZd6TycwvA1ZaeZUBkpo5BAkAkgAgCQCSACAJAJIAIAkAkgAgCQCSACAJAJIAIAkAkgAgCQCSACAJAJIAIAkAkgAgCQCSACAJAJIAIAkAkgAgCQCSACAJAJIAIAkAkgAgCQCSACAJAJIAIAHAIbRbddDy5c4BAIqO/7ecBwAUHT8EAKD4+CEAAMXHDwEAKD5+CABAofEPvWo1CABA1fEPu3p1CABA1fEPv2YNCABA1fGPuHZNCABA1fGPvG4tCABA1fGPun5tCABA1fGPvmEdCABA1fGPvmFdCABA1fE/e+N6EACAquN/7qb1IQAAVcc/5uYNIAAAVcf//C0bQgAAqo7/hVs3ggAAVB3/i7dtDAEAqDr+sYM2gQAAVB3/2EGbQgAAqo5/3O2bQQAAqo5//B2bQwAAqo5/wp1bQAAAqo5/4l1bQgAAqo5/0t1bQQAAqo5/8j1bQwAAqo5/yuBtIAAAVcc/ZfC2EACAquOfeu92EACAquOfdt/2EACAquOffv8OEACAquOf8cCOEACAquOf+eBOEACAquOfNWRnCABA1fHPGrILBACg6vhnP7QrBACg6vjnPLwbBACg6vjnPrI7BACg6vjnPboHBACg6vjnP7YnBACg6vgXPL4XBACg6vgXPrE3BACg6vgXPrEPBACg6vhfenJfCABA1fG//NR+EACAquNf9PT+EACAquN/5ZkDIAAAVcf/6tADIQAAVcf/2rCDIAAAVce/ePjBEACAquNfPPwQCABA1fG/PuJQCABA1fG/MfIwCABA1fG/OepwCABA1fG/NfoICABA1fG//eyREACAquN/57mjIAAAVce/ZMzREACAquNfMuYYCABA1fG/+/yxEACAquN/74XjIAAA46+O//0XB0IAAMZfHf8HY4+HAACMvzr+D8edAIEwAsYfH//S8SdCIIyA8cfHv3T8SRAII2D88fF/NOFkCIQRMP74+D+eeAoEwggYf3z8n0w6FQJhBIw/Pv5PJ58GgTACxh8f/2dTTodAGAHjj4//86lnQCCMgPHHx//FtDMhEEbA+OPj/2LaWRAII2D88fF/Of1sCIQRMP74+L+acQ4EwggYf3z8X888FwJhBIw/Pv5vZp0HgTACxh8f/7ezz4dAGAHjj4//uzkXQCCMgPHHx79s7oUQCCNg/PHxL5t7EQTCCBh/fPzfz7sYAmEEjD8+/h/mXwKBMALGHx//jwsuhUAYAeOPj/+nhZdBIIyA8cfH//NLl0MgjIDxx8f/y8tXQCCMgPHHx7980ZUQCCPgGwAEjN83AAj4DcD4/QYAAf8CGL9/ASDgOgDjdx0ABFwJaPyuBISAewGM370AEHA3oPG7GxACngdg/J4HAAFPBDJ+TwSCgGcCGr9nAkLAU4GNHwAQ8F4A4wcABLwZyPgBAAHvBjR+AEDA24GNHwAQ+O8iYPzN8f+vAYDAiiNg/M3x/+8BgMCKIWD8zfEnAIDAvyNg/M3xZwCAwD8jYPzN8acAgMDfI2D8zfHnAIDAXyNg/M3xJwGAwJ8RMP7m+LMAQOCPCBh/c/xpACDwOwLG3xx/HgAIDDT+8PgBAAHjj3/2AQAB4weAyggYPwAURsD4AaAwAsYPAIURMH4AKIyA8QNAYQSMHwAKI2D8AFAYAeMHgMIIGD8AFEbA+AGgMALGDwCFETB+ACiMgPEDQGEEjB8ACiNg/ABQGAHjB4DCCBg/ABRGwPgBoDACxg8AhREwfgAojIDxA0BhBIwfAAojYPwAUBgB4weAwggYPwAURsD4AaAwAsYPAIURMH4AKIyA8QNAYQSMHwAKI2D8AFAYAeMHgMIIGD8AFEbA+AGgMALGDwCFETB+ACiMgPEDQGEEjB8ACiNg/ABQGAHjB4DCCBg/ABRGwPgBoDACxg8AhREwfgAojIDxA0BhBIwfAAojYPwAUBgB4weAwggYPwAURsD4AaAwAsYPAIURMH4AKIyA8QNAYQSMHwAKI2D8AFAYAeMHgMIIGD8ABAHjB4DqCDgfACiKgHMBgKIIOA8AKIqAcwCAJABIAoAkAEgCgCQASAKAJABIAoAkAEgCgCQASAKAJABIAoAkAEgCgCQASAKAJABIAoAkAEgCgCQASAKAJABIAoAkAEgCgCQASAKAJABIAoAkAEgCgCQASABwCFK2XwF5/poXL94a1AAAAABJRU5ErkJggg==
VR_EOF_B64

echo '>>> src-tauri/icons/32x32.png'
base64 -d > 'src-tauri/icons/32x32.png' << 'VR_EOF_B64'
iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAApklEQVR42mNgZedlGEjMMOqAUQdQagDfnP//B8wBIMt3Tlb+T4kjKLb8wCwdihxBseXHF5pQ5AiKLT+3wpYiR1Bs+dX1bhQ5gmLL72zzo8gRFFv+eG84RY6g2PJXRxIocgTFln88nUGRIyi2/MelQoocQbHl/29WUeSIwRkCgyINDIpcMCjKgUFREg6KumBQ1IaDoj0wKFpEg6JNOChaxaMdk2HhAAA62RN6eXKmyQAAAABJRU5ErkJggg==
VR_EOF_B64

echo '>>> src-tauri/icons/icon.ico'
base64 -d > 'src-tauri/icons/icon.ico' << 'VR_EOF_B64'
AAABAAEAAAAAAAEAIADNBgAAFgAAAIlQTkcNChoKAAAADUlIRFIAAAEAAAABAAgGAAAAXHKoZgAABpRJREFUeNrt3cUOnGUAhtFuCCu4BVyDa3ANrsGhEFyDa7gJ3IsWK251KFB3b6FA0WLFvWhZEUKwLgnPWTw38GXek8nMLwNWWnmVAZKaOQQJAJIAIAkAkgAgCQCSACAJAJIAIAkAkgAgCQCSACAJAJIAIAkAkgAgCQCSACAJAJIAIAkAkgAgCQCSACAJAJIAIAkAkgAgCQCSACAJAJIAIAkAkgAgCQCSACABwCG0W3XQ8uXOAQCKjv+3nAcAFB0/BACg+PghAADFxw8BACg+fggAQKHxD71qNQgAQNXxD7t6dQgAQNXxD79mDQgAQNXxj7h2TQgAQNXxj7xuLQgAQNXxj7p+bQgAQNXxj75hHQgAQNXxj75hXQgAQNXxP3vjehAAgKrjf+6m9SEAAFXHP+bmDSAAAFXH//wtG0IAAKqO/4VbN4IAAFQd/4u3bQwBAKg6/rGDNoEAAFQd/9hBm0IAAKqOf9ztm0EAAKqOf/wdm0MAAKqOf8KdW0AAAKqOf+JdW0IAAKqOf9LdW0EAAKqOf/I9W0MAAKqOf8rgbSAAAFXHP2XwthAAgKrjn3rvdhAAgKrjn3bf9hAAgKrjn37/DhAAgKrjn/HAjhAAgKrjn/ngThAAgKrjnzVkZwgAQNXxzxqyCwQAoOr4Zz+0KwQAoOr45zy8GwQAoOr45z6yOwQAoOr45z26BwQAoOr45z+2JwQAoOr4Fzy+FwQAoOr4Fz6xNwQAoOr4Fz6xDwQAoOr4X3pyXwgAQNXxv/zUfhAAgKrjX/T0/hAAgKrjf+WZAyAAAFXH/+rQAyEAAFXH/9qwgyAAAFXHv3j4wRAAgKrjXzz8EAgAQNXxvz7iUAgAQNXxvzHyMAgAQNXxvznqcAgAQNXxvzX6CAgAQNXxv/3skRAAgKrjf+e5oyAAAFXHv2TM0RAAgKrjXzLmGAgAQNXxv/v8sRAAgKrjf++F4yAAAOOvjv/9FwdCAADGXx3/B2OPhwAAjL86/g/HnQCBMALGHx//0vEnQiCMgPHHx790/EkQCCNg/PHxfzThZAiEETD++Pg/nngKBMIIGH98/J9MOhUCYQSMPz7+TyefBoEwAsYfH/9nU06HQBgB44+P//OpZ0AgjIDxx8f/xbQzIRBGwPjj4/9i2lkQCCNg/PHxfzn9bAiEETD++Pi/mnEOBMIIGH98/F/PPBcCYQSMPz7+b2adB4EwAsYfH/+3s8+HQBgB44+P/7s5F0AgjIDxx8e/bO6FEAgjYPzx8S+bexEEwggYf3z838+7GAJhBIw/Pv4f5l8CgTACxh8f/48LLoVAGAHjj4//p4WXQSCMgPHHx//zS5dDIIyA8cfH/8vLV0AgjIDxx8e/fNGVEAgj4BsABIzfNwAI+A3A+P0GAAH/Ahi/fwEg4DoA43cdAARcCWj8rgSEgHsBjN+9ABBwN6DxuxsQAp4HYPyeBwABTwQyfk8EgoBnAhq/ZwJCwFOBjR8AEPBeAOMHAAS8Gcj4AQAB7wY0fgBAwNuBjR8AEPjvImD8zfH/rwGAwIojYPzN8f/vAYDAiiFg/M3xJwCAwL8jYPzN8WcAgMA/I2D8zfGnAIDA3yNg/M3x5wCAwF8jYPzN8ScBgMCfETD+5vizAEDgjwgYf3P8aQAg8DsCxt8cfx4ACAw0/vD4AQAB449/9gEAAeMHgMoIGD8AFEbA+AGgMALGDwCFETB+ACiMgPEDQGEEjB8ACiNg/ABQGAHjB4DCCBg/ABRGwPgBoDACxg8AhREwfgAojIDxA0BhBIwfAAojYPwAUBgB4weAwggYPwAURsD4AaAwAsYPAIURMH4AKIyA8QNAYQSMHwAKI2D8AFAYAeMHgMIIGD8AFEbA+AGgMALGDwCFETB+ACiMgPEDQGEEjB8ACiNg/ABQGAHjB4DCCBg/ABRGwPgBoDACxg8AhREwfgAojIDxA0BhBIwfAAojYPwAUBgB4weAwggYPwAURsD4AaAwAsYPAIURMH4AKIyA8QNAYQSMHwAKI2D8AFAYAeMHgMIIGD8AFEbA+AGgMALGDwCFETB+ACiMgPEDQGEEjB8ACiNg/ABQGAHjB4DCCBg/AAQB4weA6gg4HwAoioBzAYCiCDgPACiKgHMAgCQASAKAJABIAoAkAEgCgCQASAKAJABIAoAkAEgCgCQASAKAJABIAoAkAEgCgCQASAKAJABIAoAkAEgCgCQASAKAJABIAoAkAEgCgCQASAKAJABIAoAkAEgAcAhStl8Bef6aFy/eGtQAAAAASUVORK5CYII=
VR_EOF_B64

echo '>>> src-tauri/icons/icon.png'
base64 -d > 'src-tauri/icons/icon.png' << 'VR_EOF_B64'
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
VR_EOF_B64

echo '>>> src-tauri/src/commands.rs'
cat > 'src-tauri/src/commands.rs' << 'VR_EOF'
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
VR_EOF

echo '>>> src-tauri/src/config.rs'
cat > 'src-tauri/src/config.rs' << 'VR_EOF'
//! ============================================================
//! Работа с конфигурацией: %APPDATA%/ValheimRouge/config.json (п. 3.5 ТЗ)
//! Никаких unwrap() в путях и IO — всё через Result<String>, чтобы
//! фронтенд получал человекочитаемое сообщение об ошибке.
//! ============================================================

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// Структура конфига. Поля snake_case — синхронно с TS-интерфейсом
/// LauncherConfig во фронтенде (src/types.ts).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    /// Путь к папке с игрой
    #[serde(default)]
    pub game_path: String,
    /// Адрес выделенного сервера host:port
    #[serde(default = "default_server_address")]
    pub server_address: String,
    /// Имя пользователя (заглушка авторизации)
    #[serde(default)]
    pub username: String,
    /// Тема интерфейса ('dark')
    #[serde(default = "default_theme")]
    pub theme: String,
}

/// Значение сервера по умолчанию — наш playit.gg туннель
fn default_server_address() -> String {
    "pgsql-louisville.tun.ply.gg:21589".to_string()
}

fn default_theme() -> String {
    "dark".to_string()
}

impl Default for Config {
    fn default() -> Self {
        Self {
            game_path: String::new(),
            server_address: default_server_address(),
            username: String::new(),
            theme: default_theme(),
        }
    }
}

/// Каталог %APPDATA%/ValheimRouge (Windows) — ровно как требует п. 3.5 ТЗ.
/// В Tauri v2 app_data_dir() указывает на %APPDATA%\\<identifier>, поэтому
/// базовую %APPDATA% берём из config_dir(), а последним сегментом ставим имя
/// «ValheimRouge». На Linux/macOS получается ~/.config/ValheimRouge.
#[allow(dead_code)]
fn config_dir(_app: &tauri::AppHandle) -> Result<PathBuf, String> {
    use tauri::Manager;
    // path().config_dir() возвращает Result — корректно прокидываем ошибку вверх
    let base = _app
        .path()
        .config_dir()
        .map_err(|e| format!("Не удалось определить папку данных приложения: {e}"))?;
    // На Windows config_dir() == %APPDATA%\<identifier>; поднимаемся на уровень
    // %APPDATA% и собираем нужный нам каталог ValheimRouge.
    let roaming = base
        .parent()
        .map(|p| p.to_path_buf())
        .unwrap_or(base);
    Ok(roaming.join("ValheimRouge"))
}

/// Полный путь к config.json
fn config_file(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(config_dir(app)?.join("config.json"))
}

/// Прочитать конфиг с диска. Если файла нет или он повреждён —
/// отдаём дефолтный конфиг (лаунчер должен запускаться «из коробки»).
pub fn read_config(app: &tauri::AppHandle) -> Result<Config, String> {
    let path = config_file(app)?;
    if !path.exists() {
        return Ok(Config::default());
    }
    let raw = fs::read_to_string(&path)
        .map_err(|e| format!("Не удалось прочитать {}: {e}", path.display()))?;
    // Повреждённый JSON не должен ронять лаунчер — молча возвращаем дефолт,
    // но пишем предупреждение в логи сборки.
    match serde_json::from_str::<Config>(&raw) {
        Ok(cfg) => Ok(cfg),
        Err(e) => {
            eprintln!("config.json повреждён ({e}), использую значения по умолчанию");
            Ok(Config::default())
        }
    }
}

/// Сохранить конфиг на диск, при необходимости создав директорию.
/// Пишем pretty-JSON — чтобы человеку было удобно править файл руками.
pub fn write_config(app: &tauri::AppHandle, config: &Config) -> Result<(), String> {
    let dir = config_dir(app)?;
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Не удалось создать папку {}: {e}", dir.display()))?;
    let json = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Не удалось сериализовать конфиг: {e}"))?;
    let path = dir.join("config.json");
    fs::write(&path, json).map_err(|e| format!("Не удалось записать {}: {e}", path.display()))
}
VR_EOF

echo '>>> src-tauri/src/lib.rs'
cat > 'src-tauri/src/lib.rs' << 'VR_EOF'
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
VR_EOF

echo '>>> src-tauri/src/main.rs'
cat > 'src-tauri/src/main.rs' << 'VR_EOF'
// Запрет «окон-призраков» в release-сборке под Windows
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    valheim_rouge_lib::run();
}
VR_EOF

echo '>>> src-tauri/tauri.conf.json'
cat > 'src-tauri/tauri.conf.json' << 'VR_EOF'
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Valheim Rouge",
  "version": "1.0.0",
  "identifier": "com.valheimrouge.launcher",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "Valheim Rouge",
        "width": 1000,
        "height": 650,
        "minWidth": 800,
        "minHeight": 550,
        "resizable": true,
        "decorations": false,
        "center": true,
        "transparent": false,
        "backgroundColor": "#05070d"
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/icon.ico"
    ]
  }
}
VR_EOF

echo '>>> src/App.tsx'
cat > 'src/App.tsx' << 'VR_EOF'
// ============================================================
// App — корневой компонент: TitleBar + переключение экранов
// (Login ⇄ Main) через AnimatePresence + глобальная модалка ошибок.
// ============================================================
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { TitleBar } from './components/TitleBar';
import { LoginScreen } from './components/LoginScreen';
import { MainScreen } from './screens/MainScreen';
import { SettingsModal } from './components/SettingsModal';
import { VRButton, VRModal } from './components/ui';
import { useLauncherStore } from './store/useLauncherStore';

export default function App() {
  const isAuthenticated = useLauncherStore((s) => s.isAuthenticated);
  const errorMessage = useLauncherStore((s) => s.errorMessage);
  const dismissError = useLauncherStore((s) => s.dismissError);
  const loadConfig = useLauncherStore((s) => s.loadConfig);
  const settingsOpen = useLauncherStore((s) => s.settingsOpen);
  const setSettingsOpen = useLauncherStore((s) => s.setSettingsOpen);

  // При старте читаем config.json из Rust-бэкенда (п. 3.5 ТЗ).
  // Если пользователь уже сохранён — сразу пускаем внутрь без логина?
  // Нет: по ТЗ экран входа показывается всегда, но ник подтягиваем.
  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TitleBar onOpenSettings={() => setSettingsOpen(true)} />

      <main className="relative flex-1">
        {/* Переключение экранов с анимацией кросс-фейда */}
        <AnimatePresence mode="wait">
          {isAuthenticated ? (
            <motion.div key="main" className="absolute inset-0">
              <MainScreen />
            </motion.div>
          ) : (
            <motion.div key="login" className="absolute inset-0">
              <LoginScreen />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Модалка настроек (п. 3.5) */}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Глобальная модалка ошибки: при «valheim.exe не найден» предлагаем
          сразу открыть выбор папки (п. 3.4 ТЗ) */}
      <VRModal open={errorMessage !== null} title="ОШИБКА" onClose={dismissError}>
        <div className="space-y-5">
          <div className="flex items-start gap-3 text-sm text-slate-300">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-blood" />
            <p>{errorMessage}</p>
          </div>
          <div className="flex justify-end gap-2">
            <VRButton variant="ghost" onClick={dismissError}>
              Закрыть
            </VRButton>
            <VRButton
              onClick={() => {
                dismissError();
                setSettingsOpen(true); // ведём пользователя к выбору папки
              }}
            >
              Выбрать папку
            </VRButton>
          </div>
        </div>
      </VRModal>
    </div>
  );
}
VR_EOF

echo '>>> src/components/LoginScreen.tsx'
cat > 'src/components/LoginScreen.tsx' << 'VR_EOF'
// ============================================================
// LoginScreen — экран аутентификации (заглушка по п. 3.2 ТЗ):
// glassmorphism-карточка, анимированные поля, «битвовая» кнопка входа.
// Логика: оба поля непустые → главный экран; иначе → анимированная ошибка.
// ============================================================
import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Eye, EyeOff, Lock, Swords, User } from 'lucide-react';
import { VRButton, VRCard } from './ui';
import { useLauncherStore } from '../store/useLauncherStore';

export function LoginScreen() {
  const login = useLauncherStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Простейшая «аутентификация»: пустое поле = отказ, всё остальное = успех
    if (!username.trim() || !password.trim()) {
      setError('Заполните логин и пароль, воин.');
      return;
    }
    setError(null);
    await login(username.trim());
  };

  return (
    <div className="flex h-full items-center justify-center p-6">
      {/* Появление карточки: лёгкий «выезд» снизу + fade-in */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -24 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <VRCard className="w-[400px] p-8">
          {/* Эмблема */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <motion.div
              initial={{ rotate: -12, scale: 0.6, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 14 }}
              className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-gradient-to-b from-gold/20 to-transparent shadow-glow-gold"
            >
              <Swords className="text-gold" size={30} />
            </motion.div>
            <h1 className="font-display text-2xl font-bold tracking-[0.2em] text-white">
              VALHEIM <span className="text-blizzard">ROUGE</span>
            </h1>
            <p className="text-xs uppercase tracking-widest text-slate-500">
              Вход в Вальхаллу
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Поле логина с иконкой */}
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                Логин
              </span>
              <div className="relative">
                <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Имя викинга"
                  autoComplete="off"
                  className="vr-input pl-9"
                />
              </div>
            </label>

            {/* Поле пароля + переключатель видимости */}
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                Пароль
              </span>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="vr-input pl-9 pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {/* Анимированное сообщение об ошибке (AnimatePresence умеет уходить с анимацией) */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  className="flex items-center gap-2 overflow-hidden text-sm text-blood"
                >
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <VRButton type="submit" className="mt-2 w-full">
              Войти
            </VRButton>
          </form>
        </VRCard>
      </motion.div>
    </div>
  );
}
VR_EOF

echo '>>> src/components/NewsCard.tsx'
cat > 'src/components/NewsCard.tsx' << 'VR_EOF'
// Одна карточка новости: слева картинка (с fallback на градиент), справа текст.
import { useState } from 'react';
import type { NewsItem } from '../data/news';

interface NewsCardProps {
  item: NewsItem;
}

export function NewsCard({ item }: NewsCardProps) {
  // Если файл в public/news отсутствует — onError переключает на градиентный блок
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article className="vr-news-card">
      {/* Картинка: 40% ширины, скругление только со стороны контента */}
      <div className="vr-news-media">
        {imageFailed ? (
          <div className="vr-news-placeholder" aria-hidden="true" />
        ) : (
          <img
            src={`/news/${item.image}.jpg`}
            alt=""
            loading="lazy"
            draggable={false}
            onError={() => setImageFailed(true)}
          />
        )}
      </div>

      {/* Текстовый блок: дата, заголовок, описание, кнопка «Читать» */}
      <div className="vr-news-body">
        <span className="vr-news-date">{item.date}</span>
        <h3 className="vr-news-title">{item.title}</h3>
        <p className="vr-news-desc">{item.description}</p>
        <button type="button" className="vr-btn-ghost-sm">
          Читать
        </button>
      </div>
    </article>
  );
}
VR_EOF

echo '>>> src/components/NewsFeed.tsx'
cat > 'src/components/NewsFeed.tsx' << 'VR_EOF'
// Скроллящаяся лента новостей: вертикальный список карточек с плавным появлением.
import { motion } from 'framer-motion';
import { news } from '../data/news';
import { NewsCard } from './NewsCard';

export function NewsFeed() {
  return (
    <div className="vr-scroll vr-news-feed">
      {news.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: index * 0.06, ease: 'easeOut' }}
        >
          <NewsCard item={item} />
        </motion.div>
      ))}
    </div>
  );
}
VR_EOF

echo '>>> src/components/PlayButton.tsx'
cat > 'src/components/PlayButton.tsx' << 'VR_EOF'
// Прямоугольная кнопка запуска игры во всю ширину правой колонки.
import { AnimatePresence, motion } from 'framer-motion';
import { Play } from 'lucide-react';

interface PlayButtonProps {
  disabled?: boolean;
  /** Сервер недоступен: кнопка тускнеет и меняет подпись */
  serverOffline?: boolean;
  isLaunching: boolean;
  onPlay: () => void;
}

export function PlayButton({ disabled, serverOffline, isLaunching, onPlay }: PlayButtonProps) {
  // Приоритет подписи: запуск > недоступный сервер > игра
  const label = isLaunching ? 'ЗАПУСК…' : serverOffline ? 'СЕРВЕР НЕДОСТУПЕН' : 'ИГРАТЬ';

  return (
    <motion.button
      type="button"
      onClick={onPlay}
      disabled={disabled || isLaunching}
      whileHover={serverOffline ? undefined : { y: -2 }}
      whileTap={{ y: 0 }}
      className={`vr-play-btn ${serverOffline ? 'vr-play-btn-dim' : ''}`}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="flex items-center gap-3"
        >
          <Play size={20} strokeWidth={2.5} fill="currentColor" />
          {label}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
VR_EOF

echo '>>> src/components/ServerPanel.tsx'
cat > 'src/components/ServerPanel.tsx' << 'VR_EOF'
// Правая колонка главного экрана: статус сервера, панель персонажа и кнопка запуска.
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, RefreshCw, Shield, Settings } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { copyToClipboard, isTauri } from '../lib/api';
import { useLauncherStore } from '../store/useLauncherStore';
import { PlayButton } from './PlayButton';

type Status = 'checking' | 'online' | 'offline';

/** Период автообновления статуса — 15 секунд */
const REFRESH_MS = 15_000;

export function ServerPanel() {
  const config = useLauncherStore((s) => s.config);
  const isLaunching = useLauncherStore((s) => s.isLaunching);
  const play = useLauncherStore((s) => s.play);
  const onOpenSettings = useLauncherStore((s) => s.setSettingsOpen);

  const [status, setStatus] = useState<Status>('checking');
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  // UDP-пинк port 21589 через Rust-команду ping_server (см. commands.rs)
  const check = useCallback(async () => {
    if (!isTauri()) {
      setStatus('online');
      return;
    }
    try {
      const alive = await invoke<boolean>('ping_server', { address: config.server_address });
      setStatus(alive ? 'online' : 'offline');
    } catch {
      setStatus('offline');
    }
  }, [config.server_address]);

  useEffect(() => {
    void check();
    timerRef.current = window.setInterval(() => void check(), REFRESH_MS);
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [check]);

  const handleCopy = async () => {
    try {
      await copyToClipboard(config.server_address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Буфер обмена недоступен:', err);
    }
  };

  const statusView = {
    checking: { dot: 'bg-slate-400 animate-pulse', label: 'ПРОВЕРКА…', text: 'text-slate-400' },
    online: { dot: 'bg-emerald shadow-[0_0_10px_#2fbf71]', label: 'ONLINE', text: 'text-emerald' },
    offline: { dot: 'bg-blood shadow-[0_0_10px_#ff5566]', label: 'OFFLINE', text: 'text-blood' },
  }[status];

  return (
    <aside className="vr-side">
      {/* Блок «Сервер»: пульсирующий индикатор, адрес в один клик, кнопка обновления */}
      <section className="vr-glass vr-side-block">
        <h2 className="vr-side-label">Сервер</h2>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`h-2 w-2 rounded-full ${statusView.dot}`} />
            <span className={`text-xs font-bold tracking-widest ${statusView.text}`}>
              {statusView.label}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void check()}
            title="Проверить снова"
            className="vr-icon-btn"
          >
            <RefreshCw size={13} />
          </button>
        </div>
        <div className="mt-3 flex items-start justify-between gap-2">
          <p className="vr-selectable break-all font-mono text-[13px] leading-snug text-slate-300">
            {config.server_address}
          </p>
          <button
            type="button"
            onClick={() => void handleCopy()}
            title="Скопировать адрес сервера"
            className="vr-icon-btn shrink-0"
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span
                  key="ok"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                >
                  <Check size={14} className="text-emerald" />
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                >
                  <Copy size={14} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </section>

      {/* Блок «Персонаж»: аватар-заглушка + ник из логина + счётчики (пока захардкожены) */}
      <section className="vr-glass vr-side-block">
        <h2 className="vr-side-label">Персонаж</h2>
        <div className="flex items-center gap-3">
          <span className="vr-avatar">
            <Shield size={20} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold text-white">
              {config.username || 'talifan11'}
            </p>
            <p className="text-xs text-slate-500">Викинг</p>
          </div>
        </div>
        <dl className="vr-stats">
          <div className="vr-stat-row">
            <dt>Уровень</dt>
            <dd>1</dd>
          </div>
          <div className="vr-stat-row">
            <dt>Навык</dt>
            <dd>0</dd>
          </div>
          <div className="vr-stat-row">
            <dt>Часов в игре</dt>
            <dd>0</dd>
          </div>
        </dl>
      </section>

      {/* Кнопки: ИГРАТЬ (золотая, во всю ширину) + Настройки (ghost, под ней) */}
      <div className="mt-auto space-y-3">
        <PlayButton
          serverOffline={status === 'offline'}
          isLaunching={isLaunching}
          onPlay={() => void play()}
        />
        <button type="button" onClick={() => onOpenSettings(true)} className="vr-btn-settings">
          <Settings size={15} />
          Настройки
        </button>
      </div>
    </aside>
  );
}
VR_EOF

echo '>>> src/components/SettingsModal.tsx'
cat > 'src/components/SettingsModal.tsx' << 'VR_EOF'
// ============================================================
// SettingsModal — экран настроек (п. 3.5 ТЗ):
// выбор папки с игрой через нативный диалог Tauri + ручной ввод пути.
// Всё сохраняется в config.json немедленно при закрытии.
// ============================================================
import { useEffect, useState, type ReactNode } from 'react';
import { FolderOpen, Gamepad2 } from 'lucide-react';
import { VRButton, VRModal } from './ui';
import { pickFolder } from '../lib/api';
import { useLauncherStore } from '../store/useLauncherStore';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const config = useLauncherStore((s) => s.config);
  const updateConfig = useLauncherStore((s) => s.updateConfig);
  // Локальный черновик: редактируем его, а в стор пишем только при «Сохранить»
  const [gamePath, setGamePath] = useState(config.game_path);

  // Синхронизируем черновик, когда модалку открыли заново
  const handleAfterOpenChange = (next: boolean) => {
    if (next) setGamePath(config.game_path);
  };

  const handlePick = async () => {
    const selected = await pickFolder();
    if (selected) setGamePath(selected);
  };

  const handleSave = async () => {
    await updateConfig({ game_path: gamePath.trim() });
    onClose();
  };

  return (
    <VRModalWithSync open={open} onClose={onClose} onVisibility={handleAfterOpenChange}>
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Gamepad2 size={16} className="text-blizzard" />
          <span>Укажите папку, внутри которой лежит <b>valheim.exe</b></span>
        </div>

        {/* Поле пути + кнопка системного диалога выбора папки */}
        <div className="flex gap-2">
          <input
            value={gamePath}
            onChange={(e) => setGamePath(e.target.value)}
            placeholder="Z:\Games\Valheim"
            className="vr-input vr-selectable font-mono text-sm"
          />
          <VRButton variant="ghost" onClick={() => void handlePick()} title="Выбрать папку">
            <FolderOpen size={16} />
          </VRButton>
        </div>

        <p className="text-xs leading-relaxed text-slate-500">
          Настройки хранятся в файле{' '}
          <code className="vr-selectable rounded bg-black/40 px-1.5 py-0.5 text-gold/80">
            %APPDATA%/ValheimRouge/config.json
          </code>{' '}
          и загружаются при каждом запуске лаунчера.
        </p>

        <div className="flex justify-end gap-2 pt-1">
          <VRButton variant="ghost" onClick={onClose}>
            Отмена
          </VRButton>
          <VRButton onClick={() => void handleSave()}>Сохранить</VRButton>
        </div>
      </div>
    </VRModalWithSync>
  );
}

/* ---------- Внутренняя обёртка ----------
   Добавляет к VRModal заголовок «НАСТРОЙКИ» и сбрасывает черновик
   пути при каждом повторном открытии модалки (через useEffect). */

function VRModalWithSync(props: {
  open: boolean;
  onClose: () => void;
  onVisibility: (open: boolean) => void;
  children: ReactNode;
}) {
  // При каждом открытии сбрасываем черновик к актуальному конфигу
  useEffect(() => {
    props.onVisibility(props.open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open]);

  return (
    <VRModal open={props.open} title="НАСТРОЙКИ" onClose={props.onClose}>
      {props.children}
    </VRModal>
  );
}
VR_EOF

echo '>>> src/components/TitleBar.tsx'
cat > 'src/components/TitleBar.tsx' << 'VR_EOF'
// ============================================================
// TitleBar — кастомная шапка окна (дефолтная рамка Windows отключена
// через "decorations": false в tauri.conf.json).
// Перетаскивание — через data-tauri-drag-region, кнопки — через window API.
// ============================================================
import { Maximize2, Minus, Settings, X } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { isTauri } from '../lib/api';

interface TitleBarProps {
  /** Открыть экран настроек (колокольчик-шестерёнка справа) */
  onOpenSettings: () => void;
}

export function TitleBar({ onOpenSettings }: TitleBarProps) {
  const appWindow = getCurrentWindow();

  // В браузерной разработке кнопок управления окном нет — не падаем с ошибкой
  const safeRun = (fn: () => Promise<unknown>) => () => {
    if (isTauri()) void fn().catch(console.error);
  };

  return (
    <header
      // data-tauri-drag-region позволяет тянуть окно за любую область шапки (п. 3.1 ТЗ)
      data-tauri-drag-region
      className="relative z-40 flex h-12 shrink-0 items-center justify-between border-b bg-panel/70 backdrop-blur-md px-3 vr-titlebar-line"
    >
      {/* Логотип слева */}
      <div className="flex items-center gap-2 pl-2 select-none">
        <span className="font-display text-sm font-bold tracking-[0.25em] text-gold">
          VALHEIM
        </span>
        <span className="font-display text-sm italic tracking-[0.25em] text-blizzard">
          ROUGE
        </span>
      </div>

      {/* Кнопки справа: настройки + управление окном */}
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenSettings}
          title="Настройки"
          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
        >
          <Settings size={16} />
        </button>
        <button
          onClick={safeRun(() => appWindow.minimize())}
          title="Свернуть"
          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={safeRun(() => appWindow.toggleMaximize())}
          title="Развернуть"
          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
        >
          <Maximize2 size={15} />
        </button>
        <button
          onClick={safeRun(() => appWindow.close())}
          title="Закрыть"
          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-blood/80 hover:text-white cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>
    </header>
  );
}
VR_EOF

echo '>>> src/components/ui.tsx'
cat > 'src/components/ui.tsx' << 'VR_EOF'
// ============================================================
// UI-кит: переиспользуемые примитивы в стиле Battle.net.
// В исходном репозитории это были компоненты ui/button, ui/card,
// ui/dialog — здесь их упрощённые, но типизированные аналоги.
// ============================================================
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

/* ---------- Кнопка (аналог components/ui/button) ---------- */

type ButtonVariant = 'primary' | 'ghost' | 'play';

interface VRButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

/** Стилизация под варианты из CSS-кита (.vr-btn-*) + лёгкий ghost-вариант */
export const VRButton = forwardRef<HTMLButtonElement, VRButtonProps>(
  ({ variant = 'primary', className = '', children, ...rest }, ref) => {
    const style =
      variant === 'primary'
        ? 'vr-btn-primary'
        : variant === 'play'
          ? 'vr-btn-play'
          : // ghost — прозрачная кнопка с тонкой обводкой (иконки, второстепенные действия)
            'px-3 py-2 rounded-lg border border-edge text-slate-300 hover:text-white hover:border-blizzard/60 hover:bg-white/5 transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
    return (
      <button ref={ref} className={`${style} ${className}`} {...rest}>
        {children}
      </button>
    );
  }
);
VRButton.displayName = 'VRButton';

/* ---------- Glassmorphism-карточка (аналог components/ui/card) ---------- */

interface VRCardProps {
  children: ReactNode;
  className?: string;
}

export function VRCard({ children, className = '' }: VRCardProps) {
  return <div className={`vr-glass ${className}`}>{children}</div>;
}

/* ---------- Модальное окно (аналог components/ui/dialog) ---------- */

interface VRModalProps {
  /** Показывать ли модалку (управляет AnimatePresence) */
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export function VRModal({ open, title, children, onClose }: VRModalProps) {
  return (
    <AnimatePresence>
      {open && (
        // Затемнение всего окна + размытие — классический Blizzard-оверлей
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="vr-glass w-full max-w-md p-6"
            initial={{ scale: 0.92, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()} // клик внутри карточки не закрывает окно
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-gold tracking-wide">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Закрыть"
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
VR_EOF

echo '>>> src/data/news.ts'
cat > 'src/data/news.ts' << 'VR_EOF'
// Mock-данные ленты новостей главного экрана.
// Картинки лежат в public/news/*.jpg; если файла нет, NewsCard покажет градиент.

export interface NewsItem {
  id: number;
  date: string;
  title: string;
  description: string;
  /** Имя файла картинки в public/news без расширения */
  image: string;
}

export const news: NewsItem[] = [
  {
    id: 1,
    date: '12 октября 2026',
    title: 'Запуск сервера Valheim Rouge',
    description:
      'Наш выделенный сервер официально открыт. Подключайтесь по адресу справа и начинайте своё приключение в землях викингов.',
    image: 'server-launch',
  },
  {
    id: 2,
    date: '8 октября 2026',
    title: 'Обновление модпака 1.1',
    description:
      'Добавлены новые моды: улучшенный интерфейс, расширенный крафт, поддержка серверных персонажей. Полный список — в дискорде.',
    image: 'modpack',
  },
  {
    id: 3,
    date: '3 октября 2026',
    title: 'Ивент: Битва с Ётуном',
    description:
      'В эту субботу в 20:00 МСК собираемся на совместный рейд. Нужны все — от новичков до опытных воинов. Экипировка обязательна.',
    image: 'event',
  },
  {
    id: 4,
    date: '28 сентября 2026',
    title: 'Правила сервера',
    description:
      'Ознакомьтесь с правилами перед началом игры. Читеры, грифферы и токсичные игроки будут забанены без предупреждения.',
    image: 'rules',
  },
  {
    id: 5,
    date: '20 сентября 2026',
    title: 'Добро пожаловать в Вальхейм',
    description:
      'Первый запуск проекта. Спасибо всем, кто помогает с тестированием. Ваши отзывы — в дискорде.',
    image: 'welcome',
  },
];
VR_EOF

echo '>>> src/index.css'
cat > 'src/index.css' << 'VR_EOF'
/* ============================================================
   Valheim Rouge — базовый CSS-кит (шрифты, палитра, утилиты)
   Стилистика: Battle.net / Blizzard — тёмная тема + glassmorphism
   ============================================================ */

@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Эпический «фэнтезийный» шрифт для заголовков и «чистый» Inter для UI.
   В offline-сборке Tauri можно заменить на локальные woff2-файлы из assets. */
:root {
  /* Палитра продублирована в tailwind.config.js — здесь она нужна
     для градиентов и теней внутри @layer-компонентов */
  --clr-bg: #05070d;
  --clr-accent: #0e9cff;
  --clr-gold: #ffc24b;
}

html,
body,
#root {
  height: 100%;
}

body {
  @apply bg-abyss text-slate-200 font-body antialiased;
  /* Фоновая «картина»: атмосферный пейзаж из public/backgrounds, если пользователь
     его положил. Если файла нет — браузер тихо игнорирует слой и остаются градиенты */
  background-image:
    linear-gradient(135deg, rgba(10, 14, 20, 0.85) 0%, rgba(10, 14, 20, 0.95) 100%),
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(14, 156, 255, 0.12), transparent),
    radial-gradient(ellipse 60% 40% at 80% 110%, rgba(255, 194, 75, 0.06), transparent),
    radial-gradient(ellipse 50% 60% at 10% 100%, rgba(47, 191, 113, 0.05), transparent),
    radial-gradient(ellipse at top left, #1a2333 0%, #0a0e14 60%);
  background-size: cover, auto, auto, auto, auto;
  background-position: center, center, center, center, center;
  background-repeat: no-repeat;
  overflow: hidden;
  user-select: none; /* интерфейс лаунчера не должен «текстовыделяться» */
}

/* Подключаем реальную картинку фона отдельным слоем: если /backgrounds/main.jpg
   отсутствует, правило просто не сработает и останется CSS-градиент выше */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  background-image: url('/backgrounds/main.jpg');
  background-size: cover;
  background-position: center;
  opacity: 0.35;
  pointer-events: none;
}

@layer components {
  /* ---- Glassmorphism-карточка: полупрозрачность + размытие backdrop ---- */
  .vr-glass {
    @apply bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
  }

  /* ---- Кнопка в стиле Blizzard: градиент + свечение при наведении ---- */
  .vr-btn-primary {
    @apply relative px-6 py-3 rounded-lg font-semibold tracking-wide text-white
           transition-all duration-300 cursor-pointer select-none;
    background: linear-gradient(180deg, #1aa7ff 0%, #0a6fc2 100%);
    border: 1px solid rgba(120, 200, 255, 0.35);
  }
  .vr-btn-primary:hover:not(:disabled) {
    box-shadow: 0 0 24px rgba(14, 156, 255, 0.55);
    filter: brightness(1.12);
  }
  .vr-btn-primary:disabled {
    @apply opacity-40 cursor-not-allowed;
  }

  /* ---- Золотая «легендарная» кнопка ИГРАТЬ (круглая, из старой версии —
         больше не используется на главном экране, оставлена для модалок) ---- */
  .vr-btn-play {
    @apply relative font-display font-bold uppercase tracking-[0.3em] text-black
           rounded-lg transition-all duration-300 cursor-pointer;
    background: linear-gradient(180deg, #ffd97a 0%, #f2a93b 55%, #c98f1e 100%);
    border: 1px solid rgba(255, 225, 150, 0.6);
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.35);
  }
  .vr-btn-play:hover:not(:disabled) {
    box-shadow: 0 0 36px rgba(255, 194, 75, 0.6);
  }
  .vr-btn-play:disabled {
    @apply opacity-40 cursor-not-allowed;
  }

  /* ============ РЕДИЗАЙН: двухколоночный главный экран ============ */

  /* Сетка layout: новости 65% / панель 35%, зазор 24px, поля 32px */
  .vr-main-grid {
    @apply grid flex-1 min-h-0 px-8 py-4;
    grid-template-columns: 65fr 35fr;
    gap: 24px;
  }

  /* Разделитель под title bar — тонкая синяя линия */
  .vr-titlebar-line {
    border-color: rgba(74, 158, 255, 0.15);
  }

  /* Лента новостей: скроллящийся столбец карточек с зазором 16px */
  .vr-news-feed {
    @apply flex flex-col gap-4 overflow-y-auto pr-2 pb-2;
  }

  /* Карточка новости: glass-фон, картинка слева, контент справа */
  .vr-news-card {
    @apply flex h-[200px] shrink-0 overflow-hidden rounded-xl border border-white/5;
    background: rgba(20, 25, 35, 0.6);
    backdrop-filter: blur(16px);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .vr-news-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  }

  /* Картинка новости: 40% ширины, скругление только правых углов */
  .vr-news-media {
    @apply relative w-[40%] shrink-0 overflow-hidden rounded-r-xl;
  }
  .vr-news-media img {
    @apply h-full w-full object-cover transition-transform duration-[400ms];
  }
  .vr-news-card:hover .vr-news-media img {
    transform: scale(1.05);
  }
  /* Fallback, если jpg отсутствует — градиентный плейсхолдер */
  .vr-news-placeholder {
    @apply h-full w-full;
    background: linear-gradient(135deg, #1a2333, #0a0e14);
  }

  /* Текстовый блок карточки */
  .vr-news-body {
    @apply flex min-w-0 flex-1 flex-col justify-center gap-2 p-6;
  }
  .vr-news-date {
    @apply text-[11px] uppercase tracking-[0.1em] text-slate-400;
  }
  .vr-news-title {
    @apply font-display text-[22px] font-semibold leading-snug text-[#e8eef5];
  }
  .vr-news-desc {
    @apply text-sm leading-[1.6] text-[#a5b0c0];
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Маленькая ghost-кнопка «Читать» */
  .vr-btn-ghost-sm {
    @apply mt-1 self-start rounded-md border border-blizzard px-3 py-1.5 text-xs
           font-medium text-blizzard transition-colors duration-200 cursor-pointer;
  }
  .vr-btn-ghost-sm:hover {
    @apply bg-blizzard text-black;
  }

  /* Правая колонка: три блока + кнопки внизу */
  .vr-side {
    @apply flex min-h-0 flex-col gap-4 overflow-y-auto;
  }
  .vr-side-block {
    @apply shrink-0 p-5;
  }
  .vr-side-label {
    @apply mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#8a95a5];
  }

  /* Прямоугольная кнопка ИГРАТЬ: золото во всю ширину колонки */
  .vr-play-btn {
    @apply flex h-16 w-full items-center justify-center rounded-lg font-display
           text-[22px] font-bold uppercase tracking-[0.15em] text-[#0a0e14]
           transition-all duration-300 cursor-pointer;
    background: linear-gradient(180deg, #e3c055 0%, #d4af37 55%, #b8941f 100%);
    box-shadow: 0 4px 24px rgba(212, 175, 55, 0.3);
  }
  .vr-play-btn:hover:not(:disabled) {
    box-shadow: 0 6px 32px rgba(212, 175, 55, 0.5);
    filter: brightness(1.05);
  }
  .vr-play-btn:disabled {
    @apply cursor-not-allowed;
  }
  /* Сервер недоступен: кнопка тускнеет, но остаётся кликабельной */
  .vr-play-btn-dim {
    @apply opacity-60;
  }

  /* Ghost-кнопка «Настройки» под ИГРАТЬ */
  .vr-btn-settings {
    @apply flex h-10 w-full items-center justify-center gap-2 rounded-lg border
           border-edge text-sm text-slate-300 transition-colors duration-200 cursor-pointer;
  }
  .vr-btn-settings:hover {
    @apply border-blizzard/60 text-white;
  }

  /* Аватар персонажа: круг с золотым градиентом */
  .vr-avatar {
    @apply flex h-12 w-12 shrink-0 items-center justify-center rounded-full
           text-[#0a0e14];
    background: linear-gradient(135deg, #e3c055, #b8941f);
  }

  /* Таблица статов персонажа */
  .vr-stats {
    @apply mt-4 space-y-1.5;
  }
  .vr-stat-row {
    @apply flex items-center justify-between text-sm;
  }
  .vr-stat-row dt {
    @apply text-slate-500;
  }
  .vr-stat-row dd {
    @apply font-mono text-slate-200;
  }

  /* Маленькая иконочная кнопка (обновить статус / копировать адрес) */
  .vr-icon-btn {
    @apply rounded-md border border-edge p-2 text-slate-400 transition-colors
           hover:border-blizzard/60 hover:text-white cursor-pointer;
  }

  /* ---- Поле ввода с плавной анимацией фокуса ---- */
  .vr-input {
    @apply w-full px-4 py-3 rounded-lg bg-steel/80 border border-edge text-slate-100
           placeholder:text-slate-500 outline-none transition-all duration-300;
  }
  .vr-input:focus {
    @apply border-blizzard shadow-glow-blue bg-steel;
  }

  /* ---- Тонкая прокрутка в ленте новостей и модалках: тёмно-синий thumb ---- */
  .vr-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .vr-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .vr-scroll::-webkit-scrollbar-thumb {
    background: rgba(74, 158, 255, 0.25);
    border-radius: 9999px;
  }
  .vr-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(74, 158, 255, 0.45);
  }
}

/* Разрешаем выделение только там, где это нужно (адрес сервера) */
.vr-selectable {
  user-select: text;
}
VR_EOF

echo '>>> src/lib/api.ts'
cat > 'src/lib/api.ts' << 'VR_EOF'
// ============================================================
// API-слой: тонкая обёртка над Tauri invoke().
// Все вызовы Rust-команд идут только отсюда — компонентам удобнее
// работать с типизированными функциями, чем с «сырым» invoke.
// ============================================================
import { invoke } from '@tauri-apps/api/core';
import type { LauncherConfig } from '../types';

/** Прочитать конфигурацию лаунчера (Rust-команда get_config) */
export function getConfig(): Promise<LauncherConfig> {
  return invoke<LauncherConfig>('get_config');
}

/** Сохранить конфигурацию целиком (Rust-команда set_config) */
export function setConfig(config: LauncherConfig): Promise<void> {
  return invoke('set_config', { config });
}

/** Проверить, существует ли valheim.exe по указанному пути (Rust-команда check_game_path) */
export function checkGamePath(gamePath: string): Promise<boolean> {
  return invoke<boolean>('check_game_path', { gamePath });
}

/** Запустить игру; бэкенд сам сворачивает окно лаунчера (Rust-команда launch_game) */
export function launchGame(gamePath: string): Promise<string> {
  return invoke<string>('launch_game', { gamePath });
}

/** Открыть системный диалог выбора папки с игрой (plugin: dialog) */
export async function pickFolder(): Promise<string | null> {
  // Диалог доступен только внутри Tauri; в браузерной разработке его нет.
  if (!isTauri()) return null;
  const { open } = await import('@tauri-apps/plugin-dialog');
  const selected = await open({
    directory: true,
    multiple: false,
    title: 'Выберите папку с Valheim',
  });
  return typeof selected === 'string' ? selected : null;
}

/** Копирование в буфер обмена: через Clipboard API браузера/WebView */
export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

/** Мини-хелпер: определяем, запущено ли приложение внутри Tauri */
export function isTauri(): boolean {
  return '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
}
VR_EOF

echo '>>> src/main.tsx'
cat > 'src/main.tsx' << 'VR_EOF'
// Точка входа React-приложения
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
VR_EOF

echo '>>> src/screens/MainScreen.tsx'
cat > 'src/screens/MainScreen.tsx' << 'VR_EOF'
// Главный экран лаунчера: двухколоночный layout в стиле Battle.net.
// Слева — лента новостей, справа — панель сервера/персонажа и кнопка ИГРАТЬ.
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { NewsFeed } from '../components/NewsFeed';
import { ServerPanel } from '../components/ServerPanel';
import { VRButton } from '../components/ui';
import { useLauncherStore } from '../store/useLauncherStore';

export function MainScreen() {
  const logout = useLauncherStore((s) => s.logout);

  return (
    <motion.div
      // Плавное появление главного экрана после логина
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex h-full flex-col"
    >
      {/* Тонкая полоса с выходом: основной выход из аккаунта — здесь,
          настройки переехали в правую колонку под кнопку ИГРАТЬ */}
      <div className="flex items-center justify-end px-8 pt-4">
        <VRButton variant="ghost" onClick={logout} title="Выйти">
          <LogOut size={15} />
          <span className="ml-2 text-xs">Выйти</span>
        </VRButton>
      </div>

      {/* Две колонки: новости 65% / панель управления 35%, зазор 24px, поля 32px */}
      <div className="vr-main-grid">
        <NewsFeed />
        <ServerPanel />
      </div>

      {/* Нижняя строка: версия лаунчера слева, статус обновлений справа */}
      <footer className="flex items-center justify-between border-t border-white/5 px-8 py-3 text-xs text-slate-500">
        <span>Valheim Rouge · v1.0.0</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
          Обновлений нет
        </span>
      </footer>
    </motion.div>
  );
}
VR_EOF

echo '>>> src/store/useLauncherStore.ts'
cat > 'src/store/useLauncherStore.ts' << 'VR_EOF'
// ============================================================
// Глобальное состояние лаунчера на Zustand (по ТЗ — легче Context API).
// Храним: конфиг, факт авторизации и статус запуска игры.
// ============================================================
import { create } from 'zustand';
import type { LauncherConfig } from '../types';
import { DEFAULT_CONFIG } from '../types';
import * as api from '../lib/api';

interface LauncherState {
  /** Текущая конфигурация из config.json */
  config: LauncherConfig;
  /** Авторизован ли пользователь (заглушка: просто флаг экрана) */
  isAuthenticated: boolean;
  /** Идёт ли сейчас запуск игры (блокирует кнопку PLAY) */
  isLaunching: boolean;
  /** Текст ошибки для модалки (null — ошибок нет) */
  errorMessage: string | null;
  /** Открыт ли экран настроек (управляется из стора, чтобы кнопка в правой колонке работала без пропсов) */
  settingsOpen: boolean;

  /** Загрузить конфиг из Rust-бэкенда при старте приложения */
  loadConfig: () => Promise<void>;
  /** Открыть / закрыть модалку настроек */
  setSettingsOpen: (open: boolean) => void;
  /** Логин-заглушка: непустые поля → главный экран + сохранение username */
  login: (username: string) => Promise<void>;
  /** Выход: возврат к экрану входа */
  logout: () => void;
  /** Изменить кусок конфига и сразу сохранить на диск */
  updateConfig: (patch: Partial<LauncherConfig>) => Promise<void>;
  /** Нажатие «ИГРАТЬ»: проверка пути → запуск → сворачивание окна */
  play: () => Promise<void>;
  /** Закрыть модалку ошибки */
  dismissError: () => void;
}

export const useLauncherStore = create<LauncherState>((set, get) => ({
  config: DEFAULT_CONFIG,
  isAuthenticated: false,
  isLaunching: false,
  errorMessage: null,
  settingsOpen: false,

  setSettingsOpen: (open: boolean) => set({ settingsOpen: open }),

  loadConfig: async () => {
    try {
      // В режиме браузерной разработки (npm run dev без Tauri) invoke недоступен —
      // тихо оставляем дефолтный конфиг, чтобы UI можно было смотреть в Chrome.
      if (!api.isTauri()) return;
      const config = await api.getConfig();
      set({ config });
    } catch (err) {
      console.error('Не удалось прочитать конфиг:', err);
    }
  },

  login: async (username: string) => {
    set({ isAuthenticated: true });
    // Сохраняем имя пользователя в config.json (пункт 3.5 ТЗ)
    await get().updateConfig({ username });
  },

  logout: () => set({ isAuthenticated: false }),

  updateConfig: async (patch: Partial<LauncherConfig>) => {
    const next: LauncherConfig = { ...get().config, ...patch };
    set({ config: next });
    if (api.isTauri()) {
      try {
        await api.setConfig(next);
      } catch (err) {
        set({ errorMessage: `Не удалось сохранить настройки: ${String(err)}` });
      }
    }
  },

  play: async () => {
    const { config } = get();
    set({ isLaunching: true, errorMessage: null });
    try {
      if (!api.isTauri()) {
        throw new Error('Запуск игры доступен только в собранном приложении (Tauri).');
      }
      // 1. Проверяем, что valheim.exe реально лежит по пути из настроек
      const exists = await api.checkGamePath(config.game_path);
      if (!exists) {
        throw new Error(
          'valheim.exe не найден по указанному пути. Откройте настройки и выберите папку с игрой.'
        );
      }
      // 2. Запускаем процесс; Rust-сторона сворачивает окно лаунчера
      await api.launchGame(config.game_path);
    } catch (err) {
      set({ errorMessage: err instanceof Error ? err.message : String(err) });
    } finally {
      set({ isLaunching: false });
    }
  },

  dismissError: () => set({ errorMessage: null }),
}));
VR_EOF

echo '>>> src/types.ts'
cat > 'src/types.ts' << 'VR_EOF'
// Типы конфигурации лаунчера — зеркалят структуру Rust-структуры Config (src-tauri/src/config.rs).
// Держим их синхронно, чтобы serde корректно сериализовал JSON между бэкендом и фронтендом.

export interface LauncherConfig {
  /** Путь к папке с игрой (в ней ищем valheim.exe) */
  game_path: string;
  /** Адрес выделенного сервера, например pgsql-louisville.tun.ply.gg:21589 */
  server_address: string;
  /** Имя пользователя (заглушка авторизации) */
  username: string;
  /** Тема интерфейса: пока поддерживается только 'dark' */
  theme: 'dark';
}

/** Конфиг по умолчанию — используется, если config.json отсутствует или повреждён */
export const DEFAULT_CONFIG: LauncherConfig = {
  game_path: '',
  server_address: 'pgsql-louisville.tun.ply.gg:21589',
  username: '',
  theme: 'dark',
};
VR_EOF

echo '>>> src/vite-env.d.ts'
cat > 'src/vite-env.d.ts' << 'VR_EOF'
/// <reference types="vite/client" />
VR_EOF

echo '>>> tailwind.config.js'
cat > 'tailwind.config.js' << 'VR_EOF'
/** @type {import('tailwindcss').Config} */
export default {
  // Подключаем все tsx-файлы src и наш шрифтовой/цветовой CSS-кит из index.css
  content: ['./index.html', './src/**/*.{ts,tsx}', './src/index.css'],
  theme: {
    extend: {
      // Цветовая палитра в стиле Blizzard / Battle.net
      colors: {
        abyss: '#05070d',        // почти чёрный фон приложения
        panel: '#0b1018',        // панели чуть светлее фона
        steel: '#141b26',        // карточки / инпуты
        edge: '#232c3b',         // обводки / границы
        blizzard: {              // акцентный «битвовый» синий
          DEFAULT: '#0e9cff',
          dark: '#0a6fc2',
          glow: 'rgba(14, 156, 255, 0.45)',
        },
        gold: {                  // золотой акцент (как у legendary-предметов)
          DEFAULT: '#ffc24b',
          dark: '#c98f1e',
        },
        emerald: '#2fbf71',      // статус Online
        blood: '#ff5566',        // статус Offline / ошибки
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],       // заголовки — эпичный «фэнтезийный» шрифт
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'], // адрес сервера, стат-цифры
      },
      boxShadow: {
        'glow-blue': '0 0 24px rgba(14, 156, 255, 0.35)',
        'glow-gold': '0 0 24px rgba(255, 194, 75, 0.35)',
      },
    },
  },
  plugins: [],
};
VR_EOF

echo '>>> tsconfig.json'
cat > 'tsconfig.json' << 'VR_EOF'
{
  "compilerOptions": {
    "target": "ES2021",
    "useDefineForClassFields": true,
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode (Vite) */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Строгая типизация — по ТЗ все пропсы типизированы */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
VR_EOF

echo '>>> vite.config.ts'
cat > 'vite.config.ts' << 'VR_EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Конфигурация Vite для фронтенда лаунчера Valheim Rouge.
// settings.build.target = esnext — важно для Tauri (современный WebView).
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    // Windows: без этого Vite и Cargo одновременно лезут в src-tauri/target
    // и сборка падает с EBUSY: resource busy or locked
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
});
VR_EOF



echo '>>> restore-valheim-rouge.sh'
cat > 'restore-valheim-rouge.sh' << \VR_SELF_EOF
#!/usr/bin/env bash
# Valheim Rouge - скрипт восстановления проекта из исходников.
# Запуск: bash restore-valheim-rouge.sh (сначала cd в нужную папку!)
# package-lock.json намеренно НЕ включён: после восстановления запусти npm install.
# Иконки src-tauri/icons закоданы base64 внутри скрипта.
# Сам скрипт копирует себя в проект, поэтому его можно пересобирать без потерь.
set -e

mkdir -p src/components src/screens src/store src/lib src/data \\
         src-tauri/src src-tauri/capabilities src-tauri/icons \\
         public/backgrounds public/news
#!/usr/bin/env bash
# ============================================================
# Valheim Rouge — скрипт восстановления проекта из исходников.
# Запуск: bash restore-valheim-rouge.sh
# Создаёт все файлы в текущей директории (сначала cd в нужную папку!).
# package-lock.json намеренно НЕ включён: после восстановления запусти
#   npm install   — он сгенерирует лок сам по package.json.
# Иконки src-tauri/icons/*.png|ico закодированы base64 внутри heredoc.
# ============================================================
set -e

mkdir -p src/components src/screens src/store src/lib src/data \\
         src-tauri/src src-tauri/capabilities src-tauri/icons \\
         public/backgrounds public/news

echo '>>> .gitignore'
cat > '.gitignore' << 'VR_EOF'
# Сжатые архивы и локальные артефакты
*.tar.gz
*.b64
node_modules/
dist/
src-tauri/target/
.github_pr_body.md
valheim-rouge.bundle
tsconfig.tsbuildinfo
VR_EOF

echo '>>> README.md'
cat > 'README.md' << 'VR_EOF'
# ⚔️ Valheim Rouge

Стильный десктопный лаунчер для пиратской сборки Valheim в духе **Battle.net**:
тёмная тема, glassmorphism, золотая кнопка «ИГРАТЬ» и живой статус нашего сервера
\`pgsql-louisville.tun.ply.gg:21589\`.

## Стек (по ТЗ v2.0)

| Слой | Технология |
|---|---|
| Оболочка | **Tauri v2** (легче Electron в разы — системный WebView) |
| Бэкенд | **Rust** (\`src-tauri/\`) |
| Фронтенд | **React 18 + TypeScript + Vite** |
| Стиль | **Tailwind CSS** (палитра Blizzard в \`tailwind.config.js\` / \`src/index.css\`) |
| Анимации | **Framer Motion** |
| Иконки | **Lucide React** |
| Состояние | **Zustand** (\`src/store/useLauncherStore.ts\`) |

## Структура

\`\`\`
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
\`\`\`

## Команды

\`\`\`bash
npm install            # зависимости фронтенда
npm run dev            # UI в браузере (без Rust-вызовов, для вёрстки)
npm run tauri dev      # запуск лаунчера «как есть» (нужен Rust toolchain)
npm run tauri build    # сборка .exe (bundle → src-tauri/target/release/bundle/)
\`\`\`

> Для \`tauri\`-команд нужны: [Rust](https://rustup.rs) и системные зависимости
> (Windows: WebView2 + MSVC; Linux: \`libwebkit2gtk-4.1-dev\` и т.п. — см. docs).

## Как это работает

* **Окно без рамки** — \`"decorations": false\`, шапка с \`data-tauri-drag-region\`,
  свои кнопки свернуть/развернуть/закрыть (\`TitleBar.tsx\`).
* **Логин-заглушка** — оба поля непустые → внутрь; иначе анимированная ошибка.
* **PLAY** — Rust проверяет \`<game_path>\\valheim.exe\`, запускает через
  \`std::process::Command\` и сворачивает окно лаунчера. Если файла нет — модалка
  с кнопкой «Выбрать папку» (нативный диалог).
* **Статус сервера** — честный UDP-пинг протокола Valheim (\`SRV~\`) из команды
  \`ping_server\`, автообновление каждые 15 секунд.
* **Конфиг** — \`%APPDATA%/ValheimRouge/config.json\`:

\`\`\`json
{
  "game_path": "Z:\\\\Путь\\\\К\\\\Игре",
  "server_address": "pgsql-louisville.tun.ply.gg:21589",
  "username": "",
  "theme": "dark"
}
\`\`\`

## 🚀 Публикация на GitHub

1. Создай **пустой** репозиторий на GitHub (без README и \`.gitignore\`).
2. Запусти скрипт \`push-to-github.sh\`, передав URL репозитория аргументом:

\`\`\`bash
bash push-to-github.sh https://github.com/talifan11/valheim-rouge.git
# или по SSH:
bash push-to-github.sh git@github.com:talifan11/valheim-rouge.git
\`\`\`

Скрипт сам сделает коммит, настроит \`origin\`, переименует ветку в \`main\` и выполнит \`git push -u origin main\`.

## Дальше (Фаза 2)

* Реальная авторизация по playit.gg-туннелю и генерация join-ссылки
* Live-карточка сервера: онлайн-игроки, имя мира (расширение \`ping_server\`)
* Система обновлений игры через лаунчер
VR_EOF

echo '>>> index.html'
cat > 'index.html' << 'VR_EOF'
<!doctype html>
<html lang="ru" data-tauri-drag-region>
  <head>
    <meta charset="UTF-8" />
    <!-- Отключаем стандартное выделение текста в UI лаунчера -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Valheim Rouge</title>
    <!-- Шрифты: Cinzel (заголовки), Inter (UI), JetBrains Mono (адрес сервера) -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
VR_EOF

echo '>>> package.json'
cat > 'package.json' << 'VR_EOF'
{
  "name": "valheim-rouge",
  "private": true,
  "version": "1.0.0",
  "description": "Valheim Rouge — стильный десктопный лаунчер для Valheim на Tauri v2",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "tauri": "tauri"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.1.0",
    "@tauri-apps/plugin-dialog": "^2.8.1",
    "framer-motion": "^11.11.0",
    "lucide-react": "^0.451.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.1.0",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.6.2",
    "vite": "^5.4.8"
  }
}
VR_EOF

echo '>>> postcss.config.js'
cat > 'postcss.config.js' << 'VR_EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
VR_EOF

echo '>>> public/backgrounds/README.txt'
cat > 'public/backgrounds/README.txt' << 'VR_EOF'
Положи сюда main.jpg (1920x1080) — атмосферный пейзаж Valheim.
VR_EOF

echo '>>> public/news/README.txt'
cat > 'public/news/README.txt' << 'VR_EOF'
Положи сюда server-launch.jpg, modpack.jpg, event.jpg, rules.jpg, welcome.jpg (600x400).
VR_EOF

echo '>>> push-to-github.sh'
cat > 'push-to-github.sh' << 'VR_EOF'
#!/usr/bin/env bash
# ============================================================
# Valheim Rouge — скрипт для отправки репозитория на GitHub
# ============================================================
# Использование:
#   1. Создай пустой репозиторий на GitHub (без README и .gitignore).
#   2. Замени REPO_URL ниже на адрес своего репозитория, например:
#        git@github.com:talifan11/valheim-rouge.git   (по SSH)
#        https://github.com/talifan11/valheim-rouge.git (по HTTPS)
#   3. Запусти:  bash push-to-github.sh
# ============================================================

set -e  # Остановка при любой ошибке

# --- Настройки -------------------------------------------------
REPO_URL="\${1:-https://github.com/talifan11/valheim-rouge.git}"
BRANCH="main"
COMMIT_MSG="feat: Valheim Rouge v1.0.0 — Tauri лаунчер (React+TS+Tailwind+Framer Motion)"
# ---------------------------------------------------------------

cd "\$(dirname "\$0")"

echo "==> Проверяем Git..."
git --version

# Если это ещё не git-репозиторий — инициализируем
if [ ! -d .git ]; then
  echo "==> Инициализация git-репозитория..."
  git init -b "\$BRANCH"
fi

echo "==> Добавляем все файлы в индекс..."
git add -A

# Коммитим только если есть незакоммиченные изменения
if ! git diff --cached --quiet; then
  echo "==> Создаём коммит..."
  git commit -m "\$COMMIT_MSG"
else
  echo "==> Новых изменений нет, пропускаем коммит."
fi

echo "==> Устанавливаем ветку \$BRANCH..."
git branch -M "\$BRANCH"

# Настраиваем/обновляем remote origin
if git remote get-url origin >/dev/null 2>&1; then
  echo "==> Обновляем существующий remote 'origin'..."
  git remote set-url origin "\$REPO_URL"
else
  echo "==> Добавляем remote 'origin': \$REPO_URL"
  git remote add origin "\$REPO_URL"
fi

echo "==> Отправляем на GitHub..."
git push -u origin "\$BRANCH"

echo ""
echo "✅ Готово! Репозиторий отправлен: \$REPO_URL"
echo "   Дальнейшие изменения: git add -A && git commit -m '...' && git push"
VR_EOF


echo '>>> src-tauri/Cargo.toml'
cat > 'src-tauri/Cargo.toml' << 'VR_EOF'
[package]
name = "valheim-rouge"
version = "1.0.0"
description = "Valheim Rouge — стильный лаунчер для Valheim на Tauri v2"
authors = ["Valheim Rouge Team"]
edition = "2021"

# Библиотека не используется (вся логика в main.rs), но Tauri CLI ожидает
# наличие lib; оставляем только bin-секцию для прозрачности сборки.
[lib]
name = "valheim_rouge_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[[bin]]
name = "valheim-rouge"
path = "src/main.rs"

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-dialog = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
VR_EOF

echo '>>> src-tauri/build.rs'
cat > 'src-tauri/build.rs' << 'VR_EOF'
fn main() {
    // Стандартный сборочный скрипт Tauri: генерирует иконки/компилирует ресурсы.
    tauri_build::build()
}
VR_EOF

echo '>>> src-tauri/capabilities/default.json'
cat > 'src-tauri/capabilities/default.json' << 'VR_EOF'
{
  "\$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Base launcher permissions: custom window controls and folder picker dialog",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-minimize",
    "core:window:allow-toggle-maximize",
    "core:window:allow-close",
    "core:window:allow-start-dragging",
    "dialog:allow-open"
  ]
}
VR_EOF

echo '>>> src-tauri/icons/128x128.png'
base64 -d > 'src-tauri/icons/128x128.png' << 'VR_EOF_B64'
iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAC4klEQVR42u3d7UfdYRzH8Z6kR/UvJJlEMknMJBlJkjFJEpmZRJJk9E9kpiQl02TJLKmOdCOnjnSjW91qZpakJCUpk9OjnqTWzbN+7/eDzx9wrs/Lcc7vd13fKyY2Lj7GcOMiCMBFEIARgBGAEYARgBGAEYARgBGAEYARgBGAEYARgBGAEYARQICS0BaNCgBc/nUEAC6fjABf/kBjIhoBvvzQ5yQ0Anz5Q1+S0Qjw5Q83vUAjwJc/0pyCRoAvf6wlFY0AX/54axoaAb78cFs6GgG+/In2l2gE+PIjHRloBPjyp75mohHgy5/uzEIjwJc/8+0VGgG+/Lmu12gE+PLnv2ejEeDLX+jOQSPAl7/Uk4tGgC9/5ccbNAJ8+as/89AI8OWv9eajEeDL3+grQCPAl7/VX4hGgC9/e7AIjQBf/q/QWzQCfPm/h96hEeDL/zNcjEaAL//vaAkaAb78nbFSNAJ8+bvjZWgE+PL3wuVoBPjy9ycr0Ajw5R9E3qMR4Ms/nPqARoAv/2j6IxoBvvzj2Uo0Anz5J3NVaAT48k/nq9EI8OWfLdagEeDLP1+uRSPAl3+xUodGgC//32o9GgG+/Mv1T2gE+PKjmw1oBH4D+A3gbwB/A/gvwH8BPgfwOYBPAn0S6LsA3wX4NtC3ge4HcD+AO4LcEeSeQPcEuivYXcGeC/BcgCeDPBnk2UDPBno62NPBzgdwPoATQpwQ4owgZwQ5JcwpYc4JdE6gk0KdFOqsYGcFOy3caeHeF+B9Ad4Y4o0h3hnknUHeGuatYd4bKABvDhWAdwcL4Bkh8PZwOAJq+YED8FQE1PIDCeApCKjlBxbAYxFQyw80gMcgoJYfeAAPRUAtHwHgIQio5WMA3IeAWj4KwP8QUMvHAbgLAbV8JIDbEFDLxwK4iYBaPhrATQTUNUADuEZA/vx4APS4CAJwEQRgBGAEYARgBGAEYARgBGAEYARgBGAEYARgBGAEYAKWK/RzEPlxTcqCAAAAAElFTkSuQmCC
VR_EOF_B64

echo '>>> src-tauri/icons/128x128@2x.png'
base64 -d > 'src-tauri/icons/128x128@2x.png' << 'VR_EOF_B64'
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
VR_EOF_B64

echo '>>> src-tauri/icons/32x32.png'
base64 -d > 'src-tauri/icons/32x32.png' << 'VR_EOF_B64'
iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAApklEQVR42mNgZedlGEjMMOqAUQdQagDfnP//B8wBIMt3Tlb+T4kjKLb8wCwdihxBseXHF5pQ5AiKLT+3wpYiR1Bs+dX1bhQ5gmLL72zzo8gRFFv+eG84RY6g2PJXRxIocgTFln88nUGRIyi2/MelQoocQbHl/29WUeSIwRkCgyINDIpcMCjKgUFREg6KumBQ1IaDoj0wKFpEg6JNOChaxaMdk2HhAAA62RN6eXKmyQAAAABJRU5ErkJggg==
VR_EOF_B64

echo '>>> src-tauri/icons/icon.ico'
base64 -d > 'src-tauri/icons/icon.ico' << 'VR_EOF_B64'
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
VR_EOF_B64

echo '>>> src-tauri/icons/icon.png'
base64 -d > 'src-tauri/icons/icon.png' << 'VR_EOF_B64'
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
VR_EOF_B64

echo '>>> src-tauri/src/commands.rs'
cat > 'src-tauri/src/commands.rs' << 'VR_EOF'
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
/// Имя аргумента в JS — \`config\` (Tauri конвертирует camelCase↔snake_case).
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
    const VALHEIM_SERVER_INFO_REQUEST: [u8; 5] = *b"SRV~\\0";

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
VR_EOF

echo '>>> src-tauri/src/config.rs'
cat > 'src-tauri/src/config.rs' << 'VR_EOF'
//! ============================================================
//! Работа с конфигурацией: %APPDATA%/ValheimRouge/config.json (п. 3.5 ТЗ)
//! Никаких unwrap() в путях и IO — всё через Result<String>, чтобы
//! фронтенд получал человекочитаемое сообщение об ошибке.
//! ============================================================

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// Структура конфига. Поля snake_case — синхронно с TS-интерфейсом
/// LauncherConfig во фронтенде (src/types.ts).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    /// Путь к папке с игрой
    #[serde(default)]
    pub game_path: String,
    /// Адрес выделенного сервера host:port
    #[serde(default = "default_server_address")]
    pub server_address: String,
    /// Имя пользователя (заглушка авторизации)
    #[serde(default)]
    pub username: String,
    /// Тема интерфейса ('dark')
    #[serde(default = "default_theme")]
    pub theme: String,
}

/// Значение сервера по умолчанию — наш playit.gg туннель
fn default_server_address() -> String {
    "pgsql-louisville.tun.ply.gg:21589".to_string()
}

fn default_theme() -> String {
    "dark".to_string()
}

impl Default for Config {
    fn default() -> Self {
        Self {
            game_path: String::new(),
            server_address: default_server_address(),
            username: String::new(),
            theme: default_theme(),
        }
    }
}

/// Каталог %APPDATA%/ValheimRouge (Windows) — ровно как требует п. 3.5 ТЗ.
/// В Tauri v2 app_data_dir() указывает на %APPDATA%\\\\<identifier>, поэтому
/// базовую %APPDATA% берём из config_dir(), а последним сегментом ставим имя
/// «ValheimRouge». На Linux/macOS получается ~/.config/ValheimRouge.
#[allow(dead_code)]
fn config_dir(_app: &tauri::AppHandle) -> Result<PathBuf, String> {
    use tauri::Manager;
    // path().config_dir() возвращает Result — корректно прокидываем ошибку вверх
    let base = _app
        .path()
        .config_dir()
        .map_err(|e| format!("Не удалось определить папку данных приложения: {e}"))?;
    // На Windows config_dir() == %APPDATA%\\<identifier>; поднимаемся на уровень
    // %APPDATA% и собираем нужный нам каталог ValheimRouge.
    let roaming = base
        .parent()
        .map(|p| p.to_path_buf())
        .unwrap_or(base);
    Ok(roaming.join("ValheimRouge"))
}

/// Полный путь к config.json
fn config_file(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(config_dir(app)?.join("config.json"))
}

/// Прочитать конфиг с диска. Если файла нет или он повреждён —
/// отдаём дефолтный конфиг (лаунчер должен запускаться «из коробки»).
pub fn read_config(app: &tauri::AppHandle) -> Result<Config, String> {
    let path = config_file(app)?;
    if !path.exists() {
        return Ok(Config::default());
    }
    let raw = fs::read_to_string(&path)
        .map_err(|e| format!("Не удалось прочитать {}: {e}", path.display()))?;
    // Повреждённый JSON не должен ронять лаунчер — молча возвращаем дефолт,
    // но пишем предупреждение в логи сборки.
    match serde_json::from_str::<Config>(&raw) {
        Ok(cfg) => Ok(cfg),
        Err(e) => {
            eprintln!("config.json повреждён ({e}), использую значения по умолчанию");
            Ok(Config::default())
        }
    }
}

/// Сохранить конфиг на диск, при необходимости создав директорию.
/// Пишем pretty-JSON — чтобы человеку было удобно править файл руками.
pub fn write_config(app: &tauri::AppHandle, config: &Config) -> Result<(), String> {
    let dir = config_dir(app)?;
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Не удалось создать папку {}: {e}", dir.display()))?;
    let json = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Не удалось сериализовать конфиг: {e}"))?;
    let path = dir.join("config.json");
    fs::write(&path, json).map_err(|e| format!("Не удалось записать {}: {e}", path.display()))
}
VR_EOF

echo '>>> src-tauri/src/lib.rs'
cat > 'src-tauri/src/lib.rs' << 'VR_EOF'
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
VR_EOF

echo '>>> src-tauri/src/main.rs'
cat > 'src-tauri/src/main.rs' << 'VR_EOF'
// Запрет «окон-призраков» в release-сборке под Windows
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    valheim_rouge_lib::run();
}
VR_EOF

echo '>>> src-tauri/tauri.conf.json'
cat > 'src-tauri/tauri.conf.json' << 'VR_EOF'
{
  "\$schema": "https://schema.tauri.app/config/2",
  "productName": "Valheim Rouge",
  "version": "1.0.0",
  "identifier": "com.valheimrouge.launcher",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "Valheim Rouge",
        "width": 1000,
        "height": 650,
        "minWidth": 800,
        "minHeight": 550,
        "resizable": true,
        "decorations": false,
        "center": true,
        "transparent": false,
        "backgroundColor": "#05070d"
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/icon.ico"
    ]
  }
}
VR_EOF

echo '>>> src/App.tsx'
cat > 'src/App.tsx' << 'VR_EOF'
// ============================================================
// App — корневой компонент: TitleBar + переключение экранов
// (Login ⇄ Main) через AnimatePresence + глобальная модалка ошибок.
// ============================================================
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { TitleBar } from './components/TitleBar';
import { LoginScreen } from './components/LoginScreen';
import { MainScreen } from './screens/MainScreen';
import { SettingsModal } from './components/SettingsModal';
import { VRButton, VRModal } from './components/ui';
import { useLauncherStore } from './store/useLauncherStore';

export default function App() {
  const isAuthenticated = useLauncherStore((s) => s.isAuthenticated);
  const errorMessage = useLauncherStore((s) => s.errorMessage);
  const dismissError = useLauncherStore((s) => s.dismissError);
  const loadConfig = useLauncherStore((s) => s.loadConfig);
  const settingsOpen = useLauncherStore((s) => s.settingsOpen);
  const setSettingsOpen = useLauncherStore((s) => s.setSettingsOpen);

  // При старте читаем config.json из Rust-бэкенда (п. 3.5 ТЗ).
  // Если пользователь уже сохранён — сразу пускаем внутрь без логина?
  // Нет: по ТЗ экран входа показывается всегда, но ник подтягиваем.
  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TitleBar onOpenSettings={() => setSettingsOpen(true)} />

      <main className="relative flex-1">
        {/* Переключение экранов с анимацией кросс-фейда */}
        <AnimatePresence mode="wait">
          {isAuthenticated ? (
            <motion.div key="main" className="absolute inset-0">
              <MainScreen />
            </motion.div>
          ) : (
            <motion.div key="login" className="absolute inset-0">
              <LoginScreen />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Модалка настроек (п. 3.5) */}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Глобальная модалка ошибки: при «valheim.exe не найден» предлагаем
          сразу открыть выбор папки (п. 3.4 ТЗ) */}
      <VRModal open={errorMessage !== null} title="ОШИБКА" onClose={dismissError}>
        <div className="space-y-5">
          <div className="flex items-start gap-3 text-sm text-slate-300">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-blood" />
            <p>{errorMessage}</p>
          </div>
          <div className="flex justify-end gap-2">
            <VRButton variant="ghost" onClick={dismissError}>
              Закрыть
            </VRButton>
            <VRButton
              onClick={() => {
                dismissError();
                setSettingsOpen(true); // ведём пользователя к выбору папки
              }}
            >
              Выбрать папку
            </VRButton>
          </div>
        </div>
      </VRModal>
    </div>
  );
}
VR_EOF

echo '>>> src/components/LoginScreen.tsx'
cat > 'src/components/LoginScreen.tsx' << 'VR_EOF'
// ============================================================
// LoginScreen — экран аутентификации (заглушка по п. 3.2 ТЗ):
// glassmorphism-карточка, анимированные поля, «битвовая» кнопка входа.
// Логика: оба поля непустые → главный экран; иначе → анимированная ошибка.
// ============================================================
import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Eye, EyeOff, Lock, Swords, User } from 'lucide-react';
import { VRButton, VRCard } from './ui';
import { useLauncherStore } from '../store/useLauncherStore';

export function LoginScreen() {
  const login = useLauncherStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Простейшая «аутентификация»: пустое поле = отказ, всё остальное = успех
    if (!username.trim() || !password.trim()) {
      setError('Заполните логин и пароль, воин.');
      return;
    }
    setError(null);
    await login(username.trim());
  };

  return (
    <div className="flex h-full items-center justify-center p-6">
      {/* Появление карточки: лёгкий «выезд» снизу + fade-in */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -24 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <VRCard className="w-[400px] p-8">
          {/* Эмблема */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <motion.div
              initial={{ rotate: -12, scale: 0.6, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 14 }}
              className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-gradient-to-b from-gold/20 to-transparent shadow-glow-gold"
            >
              <Swords className="text-gold" size={30} />
            </motion.div>
            <h1 className="font-display text-2xl font-bold tracking-[0.2em] text-white">
              VALHEIM <span className="text-blizzard">ROUGE</span>
            </h1>
            <p className="text-xs uppercase tracking-widest text-slate-500">
              Вход в Вальхаллу
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Поле логина с иконкой */}
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                Логин
              </span>
              <div className="relative">
                <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Имя викинга"
                  autoComplete="off"
                  className="vr-input pl-9"
                />
              </div>
            </label>

            {/* Поле пароля + переключатель видимости */}
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                Пароль
              </span>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="vr-input pl-9 pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {/* Анимированное сообщение об ошибке (AnimatePresence умеет уходить с анимацией) */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  className="flex items-center gap-2 overflow-hidden text-sm text-blood"
                >
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <VRButton type="submit" className="mt-2 w-full">
              Войти
            </VRButton>
          </form>
        </VRCard>
      </motion.div>
    </div>
  );
}
VR_EOF

echo '>>> src/components/NewsCard.tsx'
cat > 'src/components/NewsCard.tsx' << 'VR_EOF'
// Одна карточка новости: слева картинка (с fallback на градиент), справа текст.
import { useState } from 'react';
import type { NewsItem } from '../data/news';

interface NewsCardProps {
  item: NewsItem;
}

export function NewsCard({ item }: NewsCardProps) {
  // Если файл в public/news отсутствует — onError переключает на градиентный блок
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article className="vr-news-card">
      {/* Картинка: 40% ширины, скругление только со стороны контента */}
      <div className="vr-news-media">
        {imageFailed ? (
          <div className="vr-news-placeholder" aria-hidden="true" />
        ) : (
          <img
            src={\`/news/\${item.image}.jpg\`}
            alt=""
            loading="lazy"
            draggable={false}
            onError={() => setImageFailed(true)}
          />
        )}
      </div>

      {/* Текстовый блок: дата, заголовок, описание, кнопка «Читать» */}
      <div className="vr-news-body">
        <span className="vr-news-date">{item.date}</span>
        <h3 className="vr-news-title">{item.title}</h3>
        <p className="vr-news-desc">{item.description}</p>
        <button type="button" className="vr-btn-ghost-sm">
          Читать
        </button>
      </div>
    </article>
  );
}
VR_EOF

echo '>>> src/components/NewsFeed.tsx'
cat > 'src/components/NewsFeed.tsx' << 'VR_EOF'
// Скроллящаяся лента новостей: вертикальный список карточек с плавным появлением.
import { motion } from 'framer-motion';
import { news } from '../data/news';
import { NewsCard } from './NewsCard';

export function NewsFeed() {
  return (
    <div className="vr-scroll vr-news-feed">
      {news.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: index * 0.06, ease: 'easeOut' }}
        >
          <NewsCard item={item} />
        </motion.div>
      ))}
    </div>
  );
}
VR_EOF

echo '>>> src/components/PlayButton.tsx'
cat > 'src/components/PlayButton.tsx' << 'VR_EOF'
// Прямоугольная кнопка запуска игры во всю ширину правой колонки.
import { AnimatePresence, motion } from 'framer-motion';
import { Play } from 'lucide-react';

interface PlayButtonProps {
  disabled?: boolean;
  /** Сервер недоступен: кнопка тускнеет и меняет подпись */
  serverOffline?: boolean;
  isLaunching: boolean;
  onPlay: () => void;
}

export function PlayButton({ disabled, serverOffline, isLaunching, onPlay }: PlayButtonProps) {
  // Приоритет подписи: запуск > недоступный сервер > игра
  const label = isLaunching ? 'ЗАПУСК…' : serverOffline ? 'СЕРВЕР НЕДОСТУПЕН' : 'ИГРАТЬ';

  return (
    <motion.button
      type="button"
      onClick={onPlay}
      disabled={disabled || isLaunching}
      whileHover={serverOffline ? undefined : { y: -2 }}
      whileTap={{ y: 0 }}
      className={\`vr-play-btn \${serverOffline ? 'vr-play-btn-dim' : ''}\`}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="flex items-center gap-3"
        >
          <Play size={20} strokeWidth={2.5} fill="currentColor" />
          {label}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
VR_EOF

echo '>>> src/components/ServerPanel.tsx'
cat > 'src/components/ServerPanel.tsx' << 'VR_EOF'
// Правая колонка главного экрана: статус сервера, панель персонажа и кнопка запуска.
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, RefreshCw, Shield, Settings } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { copyToClipboard, isTauri } from '../lib/api';
import { useLauncherStore } from '../store/useLauncherStore';
import { PlayButton } from './PlayButton';

type Status = 'checking' | 'online' | 'offline';

/** Период автообновления статуса — 15 секунд */
const REFRESH_MS = 15_000;

export function ServerPanel() {
  const config = useLauncherStore((s) => s.config);
  const isLaunching = useLauncherStore((s) => s.isLaunching);
  const play = useLauncherStore((s) => s.play);
  const onOpenSettings = useLauncherStore((s) => s.setSettingsOpen);

  const [status, setStatus] = useState<Status>('checking');
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  // UDP-пинк port 21589 через Rust-команду ping_server (см. commands.rs)
  const check = useCallback(async () => {
    if (!isTauri()) {
      setStatus('online');
      return;
    }
    try {
      const alive = await invoke<boolean>('ping_server', { address: config.server_address });
      setStatus(alive ? 'online' : 'offline');
    } catch {
      setStatus('offline');
    }
  }, [config.server_address]);

  useEffect(() => {
    void check();
    timerRef.current = window.setInterval(() => void check(), REFRESH_MS);
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [check]);

  const handleCopy = async () => {
    try {
      await copyToClipboard(config.server_address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Буфер обмена недоступен:', err);
    }
  };

  const statusView = {
    checking: { dot: 'bg-slate-400 animate-pulse', label: 'ПРОВЕРКА…', text: 'text-slate-400' },
    online: { dot: 'bg-emerald shadow-[0_0_10px_#2fbf71]', label: 'ONLINE', text: 'text-emerald' },
    offline: { dot: 'bg-blood shadow-[0_0_10px_#ff5566]', label: 'OFFLINE', text: 'text-blood' },
  }[status];

  return (
    <aside className="vr-side">
      {/* Блок «Сервер»: пульсирующий индикатор, адрес в один клик, кнопка обновления */}
      <section className="vr-glass vr-side-block">
        <h2 className="vr-side-label">Сервер</h2>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={\`h-2 w-2 rounded-full \${statusView.dot}\`} />
            <span className={\`text-xs font-bold tracking-widest \${statusView.text}\`}>
              {statusView.label}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void check()}
            title="Проверить снова"
            className="vr-icon-btn"
          >
            <RefreshCw size={13} />
          </button>
        </div>
        <div className="mt-3 flex items-start justify-between gap-2">
          <p className="vr-selectable break-all font-mono text-[13px] leading-snug text-slate-300">
            {config.server_address}
          </p>
          <button
            type="button"
            onClick={() => void handleCopy()}
            title="Скопировать адрес сервера"
            className="vr-icon-btn shrink-0"
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span
                  key="ok"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                >
                  <Check size={14} className="text-emerald" />
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                >
                  <Copy size={14} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </section>

      {/* Блок «Персонаж»: аватар-заглушка + ник из логина + счётчики (пока захардкожены) */}
      <section className="vr-glass vr-side-block">
        <h2 className="vr-side-label">Персонаж</h2>
        <div className="flex items-center gap-3">
          <span className="vr-avatar">
            <Shield size={20} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold text-white">
              {config.username || 'talifan11'}
            </p>
            <p className="text-xs text-slate-500">Викинг</p>
          </div>
        </div>
        <dl className="vr-stats">
          <div className="vr-stat-row">
            <dt>Уровень</dt>
            <dd>1</dd>
          </div>
          <div className="vr-stat-row">
            <dt>Навык</dt>
            <dd>0</dd>
          </div>
          <div className="vr-stat-row">
            <dt>Часов в игре</dt>
            <dd>0</dd>
          </div>
        </dl>
      </section>

      {/* Кнопки: ИГРАТЬ (золотая, во всю ширину) + Настройки (ghost, под ней) */}
      <div className="mt-auto space-y-3">
        <PlayButton
          serverOffline={status === 'offline'}
          isLaunching={isLaunching}
          onPlay={() => void play()}
        />
        <button type="button" onClick={() => onOpenSettings(true)} className="vr-btn-settings">
          <Settings size={15} />
          Настройки
        </button>
      </div>
    </aside>
  );
}
VR_EOF

echo '>>> src/components/SettingsModal.tsx'
cat > 'src/components/SettingsModal.tsx' << 'VR_EOF'
// ============================================================
// SettingsModal — экран настроек (п. 3.5 ТЗ):
// выбор папки с игрой через нативный диалог Tauri + ручной ввод пути.
// Всё сохраняется в config.json немедленно при закрытии.
// ============================================================
import { useEffect, useState, type ReactNode } from 'react';
import { FolderOpen, Gamepad2 } from 'lucide-react';
import { VRButton, VRModal } from './ui';
import { pickFolder } from '../lib/api';
import { useLauncherStore } from '../store/useLauncherStore';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const config = useLauncherStore((s) => s.config);
  const updateConfig = useLauncherStore((s) => s.updateConfig);
  // Локальный черновик: редактируем его, а в стор пишем только при «Сохранить»
  const [gamePath, setGamePath] = useState(config.game_path);

  // Синхронизируем черновик, когда модалку открыли заново
  const handleAfterOpenChange = (next: boolean) => {
    if (next) setGamePath(config.game_path);
  };

  const handlePick = async () => {
    const selected = await pickFolder();
    if (selected) setGamePath(selected);
  };

  const handleSave = async () => {
    await updateConfig({ game_path: gamePath.trim() });
    onClose();
  };

  return (
    <VRModalWithSync open={open} onClose={onClose} onVisibility={handleAfterOpenChange}>
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Gamepad2 size={16} className="text-blizzard" />
          <span>Укажите папку, внутри которой лежит <b>valheim.exe</b></span>
        </div>

        {/* Поле пути + кнопка системного диалога выбора папки */}
        <div className="flex gap-2">
          <input
            value={gamePath}
            onChange={(e) => setGamePath(e.target.value)}
            placeholder="Z:\\Games\\Valheim"
            className="vr-input vr-selectable font-mono text-sm"
          />
          <VRButton variant="ghost" onClick={() => void handlePick()} title="Выбрать папку">
            <FolderOpen size={16} />
          </VRButton>
        </div>

        <p className="text-xs leading-relaxed text-slate-500">
          Настройки хранятся в файле{' '}
          <code className="vr-selectable rounded bg-black/40 px-1.5 py-0.5 text-gold/80">
            %APPDATA%/ValheimRouge/config.json
          </code>{' '}
          и загружаются при каждом запуске лаунчера.
        </p>

        <div className="flex justify-end gap-2 pt-1">
          <VRButton variant="ghost" onClick={onClose}>
            Отмена
          </VRButton>
          <VRButton onClick={() => void handleSave()}>Сохранить</VRButton>
        </div>
      </div>
    </VRModalWithSync>
  );
}

/* ---------- Внутренняя обёртка ----------
   Добавляет к VRModal заголовок «НАСТРОЙКИ» и сбрасывает черновик
   пути при каждом повторном открытии модалки (через useEffect). */

function VRModalWithSync(props: {
  open: boolean;
  onClose: () => void;
  onVisibility: (open: boolean) => void;
  children: ReactNode;
}) {
  // При каждом открытии сбрасываем черновик к актуальному конфигу
  useEffect(() => {
    props.onVisibility(props.open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open]);

  return (
    <VRModal open={props.open} title="НАСТРОЙКИ" onClose={props.onClose}>
      {props.children}
    </VRModal>
  );
}
VR_EOF

echo '>>> src/components/TitleBar.tsx'
cat > 'src/components/TitleBar.tsx' << 'VR_EOF'
// ============================================================
// TitleBar — кастомная шапка окна (дефолтная рамка Windows отключена
// через "decorations": false в tauri.conf.json).
// Перетаскивание — через data-tauri-drag-region, кнопки — через window API.
// ============================================================
import { Maximize2, Minus, Settings, X } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { isTauri } from '../lib/api';

interface TitleBarProps {
  /** Открыть экран настроек (колокольчик-шестерёнка справа) */
  onOpenSettings: () => void;
}

export function TitleBar({ onOpenSettings }: TitleBarProps) {
  const appWindow = getCurrentWindow();

  // В браузерной разработке кнопок управления окном нет — не падаем с ошибкой
  const safeRun = (fn: () => Promise<unknown>) => () => {
    if (isTauri()) void fn().catch(console.error);
  };

  return (
    <header
      // data-tauri-drag-region позволяет тянуть окно за любую область шапки (п. 3.1 ТЗ)
      data-tauri-drag-region
      className="relative z-40 flex h-12 shrink-0 items-center justify-between border-b bg-panel/70 backdrop-blur-md px-3 vr-titlebar-line"
    >
      {/* Логотип слева */}
      <div className="flex items-center gap-2 pl-2 select-none">
        <span className="font-display text-sm font-bold tracking-[0.25em] text-gold">
          VALHEIM
        </span>
        <span className="font-display text-sm italic tracking-[0.25em] text-blizzard">
          ROUGE
        </span>
      </div>

      {/* Кнопки справа: настройки + управление окном */}
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenSettings}
          title="Настройки"
          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
        >
          <Settings size={16} />
        </button>
        <button
          onClick={safeRun(() => appWindow.minimize())}
          title="Свернуть"
          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={safeRun(() => appWindow.toggleMaximize())}
          title="Развернуть"
          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
        >
          <Maximize2 size={15} />
        </button>
        <button
          onClick={safeRun(() => appWindow.close())}
          title="Закрыть"
          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-blood/80 hover:text-white cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>
    </header>
  );
}
VR_EOF

echo '>>> src/components/ui.tsx'
cat > 'src/components/ui.tsx' << 'VR_EOF'
// ============================================================
// UI-кит: переиспользуемые примитивы в стиле Battle.net.
// В исходном репозитории это были компоненты ui/button, ui/card,
// ui/dialog — здесь их упрощённые, но типизированные аналоги.
// ============================================================
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

/* ---------- Кнопка (аналог components/ui/button) ---------- */

type ButtonVariant = 'primary' | 'ghost' | 'play';

interface VRButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

/** Стилизация под варианты из CSS-кита (.vr-btn-*) + лёгкий ghost-вариант */
export const VRButton = forwardRef<HTMLButtonElement, VRButtonProps>(
  ({ variant = 'primary', className = '', children, ...rest }, ref) => {
    const style =
      variant === 'primary'
        ? 'vr-btn-primary'
        : variant === 'play'
          ? 'vr-btn-play'
          : // ghost — прозрачная кнопка с тонкой обводкой (иконки, второстепенные действия)
            'px-3 py-2 rounded-lg border border-edge text-slate-300 hover:text-white hover:border-blizzard/60 hover:bg-white/5 transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
    return (
      <button ref={ref} className={\`\${style} \${className}\`} {...rest}>
        {children}
      </button>
    );
  }
);
VRButton.displayName = 'VRButton';

/* ---------- Glassmorphism-карточка (аналог components/ui/card) ---------- */

interface VRCardProps {
  children: ReactNode;
  className?: string;
}

export function VRCard({ children, className = '' }: VRCardProps) {
  return <div className={\`vr-glass \${className}\`}>{children}</div>;
}

/* ---------- Модальное окно (аналог components/ui/dialog) ---------- */

interface VRModalProps {
  /** Показывать ли модалку (управляет AnimatePresence) */
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export function VRModal({ open, title, children, onClose }: VRModalProps) {
  return (
    <AnimatePresence>
      {open && (
        // Затемнение всего окна + размытие — классический Blizzard-оверлей
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="vr-glass w-full max-w-md p-6"
            initial={{ scale: 0.92, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()} // клик внутри карточки не закрывает окно
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-gold tracking-wide">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Закрыть"
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
VR_EOF

echo '>>> src/data/news.ts'
cat > 'src/data/news.ts' << 'VR_EOF'
// Mock-данные ленты новостей главного экрана.
// Картинки лежат в public/news/*.jpg; если файла нет, NewsCard покажет градиент.

export interface NewsItem {
  id: number;
  date: string;
  title: string;
  description: string;
  /** Имя файла картинки в public/news без расширения */
  image: string;
}

export const news: NewsItem[] = [
  {
    id: 1,
    date: '12 октября 2026',
    title: 'Запуск сервера Valheim Rouge',
    description:
      'Наш выделенный сервер официально открыт. Подключайтесь по адресу справа и начинайте своё приключение в землях викингов.',
    image: 'server-launch',
  },
  {
    id: 2,
    date: '8 октября 2026',
    title: 'Обновление модпака 1.1',
    description:
      'Добавлены новые моды: улучшенный интерфейс, расширенный крафт, поддержка серверных персонажей. Полный список — в дискорде.',
    image: 'modpack',
  },
  {
    id: 3,
    date: '3 октября 2026',
    title: 'Ивент: Битва с Ётуном',
    description:
      'В эту субботу в 20:00 МСК собираемся на совместный рейд. Нужны все — от новичков до опытных воинов. Экипировка обязательна.',
    image: 'event',
  },
  {
    id: 4,
    date: '28 сентября 2026',
    title: 'Правила сервера',
    description:
      'Ознакомьтесь с правилами перед началом игры. Читеры, грифферы и токсичные игроки будут забанены без предупреждения.',
    image: 'rules',
  },
  {
    id: 5,
    date: '20 сентября 2026',
    title: 'Добро пожаловать в Вальхейм',
    description:
      'Первый запуск проекта. Спасибо всем, кто помогает с тестированием. Ваши отзывы — в дискорде.',
    image: 'welcome',
  },
];
VR_EOF

echo '>>> src/index.css'
cat > 'src/index.css' << 'VR_EOF'
/* ============================================================
   Valheim Rouge — базовый CSS-кит (шрифты, палитра, утилиты)
   Стилистика: Battle.net / Blizzard — тёмная тема + glassmorphism
   ============================================================ */

@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Эпический «фэнтезийный» шрифт для заголовков и «чистый» Inter для UI.
   В offline-сборке Tauri можно заменить на локальные woff2-файлы из assets. */
:root {
  /* Палитра продублирована в tailwind.config.js — здесь она нужна
     для градиентов и теней внутри @layer-компонентов */
  --clr-bg: #05070d;
  --clr-accent: #0e9cff;
  --clr-gold: #ffc24b;
}

html,
body,
#root {
  height: 100%;
}

body {
  @apply bg-abyss text-slate-200 font-body antialiased;
  /* Фоновая «картина»: атмосферный пейзаж из public/backgrounds, если пользователь
     его положил. Если файла нет — браузер тихо игнорирует слой и остаются градиенты */
  background-image:
    linear-gradient(135deg, rgba(10, 14, 20, 0.85) 0%, rgba(10, 14, 20, 0.95) 100%),
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(14, 156, 255, 0.12), transparent),
    radial-gradient(ellipse 60% 40% at 80% 110%, rgba(255, 194, 75, 0.06), transparent),
    radial-gradient(ellipse 50% 60% at 10% 100%, rgba(47, 191, 113, 0.05), transparent),
    radial-gradient(ellipse at top left, #1a2333 0%, #0a0e14 60%);
  background-size: cover, auto, auto, auto, auto;
  background-position: center, center, center, center, center;
  background-repeat: no-repeat;
  overflow: hidden;
  user-select: none; /* интерфейс лаунчера не должен «текстовыделяться» */
}

/* Подключаем реальную картинку фона отдельным слоем: если /backgrounds/main.jpg
   отсутствует, правило просто не сработает и останется CSS-градиент выше */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  background-image: url('/backgrounds/main.jpg');
  background-size: cover;
  background-position: center;
  opacity: 0.35;
  pointer-events: none;
}

@layer components {
  /* ---- Glassmorphism-карточка: полупрозрачность + размытие backdrop ---- */
  .vr-glass {
    @apply bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
  }

  /* ---- Кнопка в стиле Blizzard: градиент + свечение при наведении ---- */
  .vr-btn-primary {
    @apply relative px-6 py-3 rounded-lg font-semibold tracking-wide text-white
           transition-all duration-300 cursor-pointer select-none;
    background: linear-gradient(180deg, #1aa7ff 0%, #0a6fc2 100%);
    border: 1px solid rgba(120, 200, 255, 0.35);
  }
  .vr-btn-primary:hover:not(:disabled) {
    box-shadow: 0 0 24px rgba(14, 156, 255, 0.55);
    filter: brightness(1.12);
  }
  .vr-btn-primary:disabled {
    @apply opacity-40 cursor-not-allowed;
  }

  /* ---- Золотая «легендарная» кнопка ИГРАТЬ (круглая, из старой версии —
         больше не используется на главном экране, оставлена для модалок) ---- */
  .vr-btn-play {
    @apply relative font-display font-bold uppercase tracking-[0.3em] text-black
           rounded-lg transition-all duration-300 cursor-pointer;
    background: linear-gradient(180deg, #ffd97a 0%, #f2a93b 55%, #c98f1e 100%);
    border: 1px solid rgba(255, 225, 150, 0.6);
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.35);
  }
  .vr-btn-play:hover:not(:disabled) {
    box-shadow: 0 0 36px rgba(255, 194, 75, 0.6);
  }
  .vr-btn-play:disabled {
    @apply opacity-40 cursor-not-allowed;
  }

  /* ============ РЕДИЗАЙН: двухколоночный главный экран ============ */

  /* Сетка layout: новости 65% / панель 35%, зазор 24px, поля 32px */
  .vr-main-grid {
    @apply grid flex-1 min-h-0 px-8 py-4;
    grid-template-columns: 65fr 35fr;
    gap: 24px;
  }

  /* Разделитель под title bar — тонкая синяя линия */
  .vr-titlebar-line {
    border-color: rgba(74, 158, 255, 0.15);
  }

  /* Лента новостей: скроллящийся столбец карточек с зазором 16px */
  .vr-news-feed {
    @apply flex flex-col gap-4 overflow-y-auto pr-2 pb-2;
  }

  /* Карточка новости: glass-фон, картинка слева, контент справа */
  .vr-news-card {
    @apply flex h-[200px] shrink-0 overflow-hidden rounded-xl border border-white/5;
    background: rgba(20, 25, 35, 0.6);
    backdrop-filter: blur(16px);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .vr-news-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  }

  /* Картинка новости: 40% ширины, скругление только правых углов */
  .vr-news-media {
    @apply relative w-[40%] shrink-0 overflow-hidden rounded-r-xl;
  }
  .vr-news-media img {
    @apply h-full w-full object-cover transition-transform duration-[400ms];
  }
  .vr-news-card:hover .vr-news-media img {
    transform: scale(1.05);
  }
  /* Fallback, если jpg отсутствует — градиентный плейсхолдер */
  .vr-news-placeholder {
    @apply h-full w-full;
    background: linear-gradient(135deg, #1a2333, #0a0e14);
  }

  /* Текстовый блок карточки */
  .vr-news-body {
    @apply flex min-w-0 flex-1 flex-col justify-center gap-2 p-6;
  }
  .vr-news-date {
    @apply text-[11px] uppercase tracking-[0.1em] text-slate-400;
  }
  .vr-news-title {
    @apply font-display text-[22px] font-semibold leading-snug text-[#e8eef5];
  }
  .vr-news-desc {
    @apply text-sm leading-[1.6] text-[#a5b0c0];
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Маленькая ghost-кнопка «Читать» */
  .vr-btn-ghost-sm {
    @apply mt-1 self-start rounded-md border border-blizzard px-3 py-1.5 text-xs
           font-medium text-blizzard transition-colors duration-200 cursor-pointer;
  }
  .vr-btn-ghost-sm:hover {
    @apply bg-blizzard text-black;
  }

  /* Правая колонка: три блока + кнопки внизу */
  .vr-side {
    @apply flex min-h-0 flex-col gap-4 overflow-y-auto;
  }
  .vr-side-block {
    @apply shrink-0 p-5;
  }
  .vr-side-label {
    @apply mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#8a95a5];
  }

  /* Прямоугольная кнопка ИГРАТЬ: золото во всю ширину колонки */
  .vr-play-btn {
    @apply flex h-16 w-full items-center justify-center rounded-lg font-display
           text-[22px] font-bold uppercase tracking-[0.15em] text-[#0a0e14]
           transition-all duration-300 cursor-pointer;
    background: linear-gradient(180deg, #e3c055 0%, #d4af37 55%, #b8941f 100%);
    box-shadow: 0 4px 24px rgba(212, 175, 55, 0.3);
  }
  .vr-play-btn:hover:not(:disabled) {
    box-shadow: 0 6px 32px rgba(212, 175, 55, 0.5);
    filter: brightness(1.05);
  }
  .vr-play-btn:disabled {
    @apply cursor-not-allowed;
  }
  /* Сервер недоступен: кнопка тускнеет, но остаётся кликабельной */
  .vr-play-btn-dim {
    @apply opacity-60;
  }

  /* Ghost-кнопка «Настройки» под ИГРАТЬ */
  .vr-btn-settings {
    @apply flex h-10 w-full items-center justify-center gap-2 rounded-lg border
           border-edge text-sm text-slate-300 transition-colors duration-200 cursor-pointer;
  }
  .vr-btn-settings:hover {
    @apply border-blizzard/60 text-white;
  }

  /* Аватар персонажа: круг с золотым градиентом */
  .vr-avatar {
    @apply flex h-12 w-12 shrink-0 items-center justify-center rounded-full
           text-[#0a0e14];
    background: linear-gradient(135deg, #e3c055, #b8941f);
  }

  /* Таблица статов персонажа */
  .vr-stats {
    @apply mt-4 space-y-1.5;
  }
  .vr-stat-row {
    @apply flex items-center justify-between text-sm;
  }
  .vr-stat-row dt {
    @apply text-slate-500;
  }
  .vr-stat-row dd {
    @apply font-mono text-slate-200;
  }

  /* Маленькая иконочная кнопка (обновить статус / копировать адрес) */
  .vr-icon-btn {
    @apply rounded-md border border-edge p-2 text-slate-400 transition-colors
           hover:border-blizzard/60 hover:text-white cursor-pointer;
  }

  /* ---- Поле ввода с плавной анимацией фокуса ---- */
  .vr-input {
    @apply w-full px-4 py-3 rounded-lg bg-steel/80 border border-edge text-slate-100
           placeholder:text-slate-500 outline-none transition-all duration-300;
  }
  .vr-input:focus {
    @apply border-blizzard shadow-glow-blue bg-steel;
  }

  /* ---- Тонкая прокрутка в ленте новостей и модалках: тёмно-синий thumb ---- */
  .vr-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .vr-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .vr-scroll::-webkit-scrollbar-thumb {
    background: rgba(74, 158, 255, 0.25);
    border-radius: 9999px;
  }
  .vr-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(74, 158, 255, 0.45);
  }
}

/* Разрешаем выделение только там, где это нужно (адрес сервера) */
.vr-selectable {
  user-select: text;
}
VR_EOF

echo '>>> src/lib/api.ts'
cat > 'src/lib/api.ts' << 'VR_EOF'
// ============================================================
// API-слой: тонкая обёртка над Tauri invoke().
// Все вызовы Rust-команд идут только отсюда — компонентам удобнее
// работать с типизированными функциями, чем с «сырым» invoke.
// ============================================================
import { invoke } from '@tauri-apps/api/core';
import type { LauncherConfig } from '../types';

/** Прочитать конфигурацию лаунчера (Rust-команда get_config) */
export function getConfig(): Promise<LauncherConfig> {
  return invoke<LauncherConfig>('get_config');
}

/** Сохранить конфигурацию целиком (Rust-команда set_config) */
export function setConfig(config: LauncherConfig): Promise<void> {
  return invoke('set_config', { config });
}

/** Проверить, существует ли valheim.exe по указанному пути (Rust-команда check_game_path) */
export function checkGamePath(gamePath: string): Promise<boolean> {
  return invoke<boolean>('check_game_path', { gamePath });
}

/** Запустить игру; бэкенд сам сворачивает окно лаунчера (Rust-команда launch_game) */
export function launchGame(gamePath: string): Promise<string> {
  return invoke<string>('launch_game', { gamePath });
}

/** Открыть системный диалог выбора папки с игрой (plugin: dialog) */
export async function pickFolder(): Promise<string | null> {
  // Диалог доступен только внутри Tauri; в браузерной разработке его нет.
  if (!isTauri()) return null;
  const { open } = await import('@tauri-apps/plugin-dialog');
  const selected = await open({
    directory: true,
    multiple: false,
    title: 'Выберите папку с Valheim',
  });
  return typeof selected === 'string' ? selected : null;
}

/** Копирование в буфер обмена: через Clipboard API браузера/WebView */
export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

/** Мини-хелпер: определяем, запущено ли приложение внутри Tauri */
export function isTauri(): boolean {
  return '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
}
VR_EOF

echo '>>> src/main.tsx'
cat > 'src/main.tsx' << 'VR_EOF'
// Точка входа React-приложения
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
VR_EOF

echo '>>> src/screens/MainScreen.tsx'
cat > 'src/screens/MainScreen.tsx' << 'VR_EOF'
// Главный экран лаунчера: двухколоночный layout в стиле Battle.net.
// Слева — лента новостей, справа — панель сервера/персонажа и кнопка ИГРАТЬ.
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { NewsFeed } from '../components/NewsFeed';
import { ServerPanel } from '../components/ServerPanel';
import { VRButton } from '../components/ui';
import { useLauncherStore } from '../store/useLauncherStore';

export function MainScreen() {
  const logout = useLauncherStore((s) => s.logout);

  return (
    <motion.div
      // Плавное появление главного экрана после логина
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex h-full flex-col"
    >
      {/* Тонкая полоса с выходом: основной выход из аккаунта — здесь,
          настройки переехали в правую колонку под кнопку ИГРАТЬ */}
      <div className="flex items-center justify-end px-8 pt-4">
        <VRButton variant="ghost" onClick={logout} title="Выйти">
          <LogOut size={15} />
          <span className="ml-2 text-xs">Выйти</span>
        </VRButton>
      </div>

      {/* Две колонки: новости 65% / панель управления 35%, зазор 24px, поля 32px */}
      <div className="vr-main-grid">
        <NewsFeed />
        <ServerPanel />
      </div>

      {/* Нижняя строка: версия лаунчера слева, статус обновлений справа */}
      <footer className="flex items-center justify-between border-t border-white/5 px-8 py-3 text-xs text-slate-500">
        <span>Valheim Rouge · v1.0.0</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
          Обновлений нет
        </span>
      </footer>
    </motion.div>
  );
}
VR_EOF

echo '>>> src/store/useLauncherStore.ts'
cat > 'src/store/useLauncherStore.ts' << 'VR_EOF'
// ============================================================
// Глобальное состояние лаунчера на Zustand (по ТЗ — легче Context API).
// Храним: конфиг, факт авторизации и статус запуска игры.
// ============================================================
import { create } from 'zustand';
import type { LauncherConfig } from '../types';
import { DEFAULT_CONFIG } from '../types';
import * as api from '../lib/api';

interface LauncherState {
  /** Текущая конфигурация из config.json */
  config: LauncherConfig;
  /** Авторизован ли пользователь (заглушка: просто флаг экрана) */
  isAuthenticated: boolean;
  /** Идёт ли сейчас запуск игры (блокирует кнопку PLAY) */
  isLaunching: boolean;
  /** Текст ошибки для модалки (null — ошибок нет) */
  errorMessage: string | null;
  /** Открыт ли экран настроек (управляется из стора, чтобы кнопка в правой колонке работала без пропсов) */
  settingsOpen: boolean;

  /** Загрузить конфиг из Rust-бэкенда при старте приложения */
  loadConfig: () => Promise<void>;
  /** Открыть / закрыть модалку настроек */
  setSettingsOpen: (open: boolean) => void;
  /** Логин-заглушка: непустые поля → главный экран + сохранение username */
  login: (username: string) => Promise<void>;
  /** Выход: возврат к экрану входа */
  logout: () => void;
  /** Изменить кусок конфига и сразу сохранить на диск */
  updateConfig: (patch: Partial<LauncherConfig>) => Promise<void>;
  /** Нажатие «ИГРАТЬ»: проверка пути → запуск → сворачивание окна */
  play: () => Promise<void>;
  /** Закрыть модалку ошибки */
  dismissError: () => void;
}

export const useLauncherStore = create<LauncherState>((set, get) => ({
  config: DEFAULT_CONFIG,
  isAuthenticated: false,
  isLaunching: false,
  errorMessage: null,
  settingsOpen: false,

  setSettingsOpen: (open: boolean) => set({ settingsOpen: open }),

  loadConfig: async () => {
    try {
      // В режиме браузерной разработки (npm run dev без Tauri) invoke недоступен —
      // тихо оставляем дефолтный конфиг, чтобы UI можно было смотреть в Chrome.
      if (!api.isTauri()) return;
      const config = await api.getConfig();
      set({ config });
    } catch (err) {
      console.error('Не удалось прочитать конфиг:', err);
    }
  },

  login: async (username: string) => {
    set({ isAuthenticated: true });
    // Сохраняем имя пользователя в config.json (пункт 3.5 ТЗ)
    await get().updateConfig({ username });
  },

  logout: () => set({ isAuthenticated: false }),

  updateConfig: async (patch: Partial<LauncherConfig>) => {
    const next: LauncherConfig = { ...get().config, ...patch };
    set({ config: next });
    if (api.isTauri()) {
      try {
        await api.setConfig(next);
      } catch (err) {
        set({ errorMessage: \`Не удалось сохранить настройки: \${String(err)}\` });
      }
    }
  },

  play: async () => {
    const { config } = get();
    set({ isLaunching: true, errorMessage: null });
    try {
      if (!api.isTauri()) {
        throw new Error('Запуск игры доступен только в собранном приложении (Tauri).');
      }
      // 1. Проверяем, что valheim.exe реально лежит по пути из настроек
      const exists = await api.checkGamePath(config.game_path);
      if (!exists) {
        throw new Error(
          'valheim.exe не найден по указанному пути. Откройте настройки и выберите папку с игрой.'
        );
      }
      // 2. Запускаем процесс; Rust-сторона сворачивает окно лаунчера
      await api.launchGame(config.game_path);
    } catch (err) {
      set({ errorMessage: err instanceof Error ? err.message : String(err) });
    } finally {
      set({ isLaunching: false });
    }
  },

  dismissError: () => set({ errorMessage: null }),
}));
VR_EOF

echo '>>> src/types.ts'
cat > 'src/types.ts' << 'VR_EOF'
// Типы конфигурации лаунчера — зеркалят структуру Rust-структуры Config (src-tauri/src/config.rs).
// Держим их синхронно, чтобы serde корректно сериализовал JSON между бэкендом и фронтендом.

export interface LauncherConfig {
  /** Путь к папке с игрой (в ней ищем valheim.exe) */
  game_path: string;
  /** Адрес выделенного сервера, например pgsql-louisville.tun.ply.gg:21589 */
  server_address: string;
  /** Имя пользователя (заглушка авторизации) */
  username: string;
  /** Тема интерфейса: пока поддерживается только 'dark' */
  theme: 'dark';
}

/** Конфиг по умолчанию — используется, если config.json отсутствует или повреждён */
export const DEFAULT_CONFIG: LauncherConfig = {
  game_path: '',
  server_address: 'pgsql-louisville.tun.ply.gg:21589',
  username: '',
  theme: 'dark',
};
VR_EOF

echo '>>> src/vite-env.d.ts'
cat > 'src/vite-env.d.ts' << 'VR_EOF'
/// <reference types="vite/client" />
VR_EOF

echo '>>> tailwind.config.js'
cat > 'tailwind.config.js' << 'VR_EOF'
/** @type {import('tailwindcss').Config} */
export default {
  // Подключаем все tsx-файлы src и наш шрифтовой/цветовой CSS-кит из index.css
  content: ['./index.html', './src/**/*.{ts,tsx}', './src/index.css'],
  theme: {
    extend: {
      // Цветовая палитра в стиле Blizzard / Battle.net
      colors: {
        abyss: '#05070d',        // почти чёрный фон приложения
        panel: '#0b1018',        // панели чуть светлее фона
        steel: '#141b26',        // карточки / инпуты
        edge: '#232c3b',         // обводки / границы
        blizzard: {              // акцентный «битвовый» синий
          DEFAULT: '#0e9cff',
          dark: '#0a6fc2',
          glow: 'rgba(14, 156, 255, 0.45)',
        },
        gold: {                  // золотой акцент (как у legendary-предметов)
          DEFAULT: '#ffc24b',
          dark: '#c98f1e',
        },
        emerald: '#2fbf71',      // статус Online
        blood: '#ff5566',        // статус Offline / ошибки
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],       // заголовки — эпичный «фэнтезийный» шрифт
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'], // адрес сервера, стат-цифры
      },
      boxShadow: {
        'glow-blue': '0 0 24px rgba(14, 156, 255, 0.35)',
        'glow-gold': '0 0 24px rgba(255, 194, 75, 0.35)',
      },
    },
  },
  plugins: [],
};
VR_EOF

echo '>>> tsconfig.json'
cat > 'tsconfig.json' << 'VR_EOF'
{
  "compilerOptions": {
    "target": "ES2021",
    "useDefineForClassFields": true,
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode (Vite) */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Строгая типизация — по ТЗ все пропсы типизированы */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
VR_EOF

echo '>>> vite.config.ts'
cat > 'vite.config.ts' << 'VR_EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Конфигурация Vite для фронтенда лаунчера Valheim Rouge.
// settings.build.target = esnext — важно для Tauri (современный WebView).
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    // Windows: без этого Vite и Cargo одновременно лезут в src-tauri/target
    // и сборка падает с EBUSY: resource busy or locked
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
});
VR_EOF



echo 'Готово. Дальше: npm install && npm run tauri dev'
VR_SELF_EOF
chmod +x restore-valheim-rouge.sh

echo 'Готово. Дальше: npm install && npm run tauri dev'
