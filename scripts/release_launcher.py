#!/usr/bin/env python3
"""
Полный релиз лаунчера:
  1. Бамп версии
  2. Очистка кэша
  3. npm run tauri build
  4. scp exe на VPS
  5. Обновление launcher-version.json

Использование: python release_launcher.py 1.0.19 "Release notes"
"""
import json
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).parent.parent

if len(sys.argv) < 2:
    print("Использование: python release_launcher.py 1.0.19 \"Что нового\"")
    sys.exit(1)

NEW_VERSION = sys.argv[1].strip()
RELEASE_NOTES = (sys.argv[2] if len(sys.argv) > 2 else "Обновление").strip()

if not re.match(r"^\d+\.\d+\.\d+$", NEW_VERSION):
    print(f"Ошибка: версия должна быть X.Y.Z, получено '{NEW_VERSION}'")
    sys.exit(1)

VPS = "root@62.217.178.72"
VPS_LAUNCHER_DIR = "/var/www/valheim/launcher"
VPS_JSON = "/var/www/valheim/launcher-version.json"

def run(cmd, cwd=None, capture=False, check=True, timeout=1800):
    """Запуск команды с выводом в реальном времени."""
    print(f"\n$ {cmd}")
    result = subprocess.run(
        cmd, shell=True, cwd=cwd,
        capture_output=capture, text=True,
        encoding="utf-8", errors="replace",
        timeout=timeout,
    )
    if capture and result.stdout:
        print(result.stdout)
    if capture and result.stderr:
        print(result.stderr)
    if check and result.returncode != 0:
        print(f"\n[ERR] Команда упала с кодом {result.returncode}")
        sys.exit(1)
    return result

# ===============================================================
# 1. Бамп версии
# ===============================================================
print("=" * 60)
print(f"  ВЫПУСК ЛАУНЧЕРА v{NEW_VERSION}")
print("=" * 60)
print("\n[1/5] Бамп версии...")

bump_script = ROOT / "scripts" / "bump_version.py"
if not bump_script.exists():
    print(f"[ERR] Не найден {bump_script}")
    sys.exit(1)

run(f'python "{bump_script}" {NEW_VERSION}', check=True)

# ===============================================================
# 2. Очистка кэша
# ===============================================================
print("\n[2/5] Очистка кэша Vite...")
import shutil
for p in [ROOT / "dist", ROOT / "node_modules" / ".vite"]:
    if p.exists():
        shutil.rmtree(p, ignore_errors=True)
        print(f"  [+] Удалено: {p.name}")
print("  [+] Кэш очищен")

# ===============================================================
# 3. Tauri build
# ===============================================================
print("\n[3/5] Сборка Tauri (5-10 минут)...")
t0 = time.time()
run("npm run tauri build", cwd=str(ROOT), check=True, timeout=1800)
elapsed = int(time.time() - t0)
print(f"\n  [+] Сборка завершена за {elapsed // 60} мин {elapsed % 60} сек")

# ===============================================================
# 4. Проверка exe + scp
# ===============================================================
exe_dir = ROOT / "src-tauri" / "target" / "release" / "bundle" / "nsis"
exe_old = exe_dir / f"Valheim Rouge_{NEW_VERSION}_x64-setup.exe"
exe_new = exe_dir / f"ValheimRouge_{NEW_VERSION}_x64-setup.exe"

if not exe_old.exists():
    print(f"[ERR] Не найден exe: {exe_old}")
    sys.exit(1)

# Переименовываем без пробелов (чтобы bat работал)
if exe_new.exists():
    exe_new.unlink()
exe_old.rename(exe_new)
size_mb = exe_new.stat().st_size / 1024 / 1024
print(f"\n[4/5] Заливка exe на VPS ({size_mb:.1f} MB)...")
run(f'scp -o BatchMode=yes "{exe_new}" {VPS}:{VPS_LAUNCHER_DIR}/', check=True)

# ===============================================================
# 5. Обновление launcher-version.json
# ===============================================================
print("\n[5/5] Обновление launcher-version.json...")

from datetime import datetime
json_data = {
    "version": NEW_VERSION,
    "download_url": f"http://62.217.178.72/launcher/ValheimRouge_{NEW_VERSION}_x64-setup.exe",
    "release_notes": RELEASE_NOTES,
    "published_at": datetime.now().strftime("%Y-%m-%d"),
}
json_str = json.dumps(json_data, indent=2, ensure_ascii=False)

# Пишем на VPS через base64 (надёжно, без проблем с экранированием)
import base64
json_b64 = base64.b64encode(json_str.encode("utf-8")).decode("ascii")
cmd = f'echo "{json_b64}" | base64 -d > {VPS_JSON} && echo OK'
run(f'ssh -o BatchMode=yes {VPS} "{cmd}"', check=True)

# Проверим что записалось
print()
run(f'ssh -o BatchMode=yes {VPS} "cat {VPS_JSON}"', check=True)

print("\n" + "=" * 60)
print(f"  [OK] ЛАУНЧЕР v{NEW_VERSION} ВЫПУЩЕН!")
print("=" * 60)
print(f"  Размер: {size_mb:.1f} MB")
print(f"  URL: http://62.217.178.72/launcher/ValheimRouge_{NEW_VERSION}_x64-setup.exe")
print(f"  Заметки: {RELEASE_NOTES}")
print("=" * 60)
