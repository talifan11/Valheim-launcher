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
