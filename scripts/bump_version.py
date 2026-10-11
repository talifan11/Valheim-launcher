#!/usr/bin/env python3
"""Бамп версии: package.json, tauri.conf.json, config.ts"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent

if len(sys.argv) < 2:
    print("Использование: python bump_version.py 1.0.19")
    sys.exit(1)

NEW = sys.argv[1].strip()

if not re.match(r"^\d+\.\d+\.\d+$", NEW):
    print(f"Ошибка: версия должна быть X.Y.Z, получено '{NEW}'")
    sys.exit(1)

# package.json
pkg_path = ROOT / "package.json"
pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
OLD = pkg["version"]
print(f"OLD: {OLD}")
print(f"NEW: {NEW}")

if OLD == NEW:
    print("SKIP: версия уже такая")
    sys.exit(0)

# 1. package.json
text = pkg_path.read_text(encoding="utf-8")
text2, n = re.subn(r'"version"\s*:\s*"[^"]+"', f'"version": "{NEW}"', text, count=1)
if n:
    pkg_path.write_text(text2, encoding="utf-8")
    print("OK: package.json")

# 2. tauri.conf.json
tauri_path = ROOT / "src-tauri" / "tauri.conf.json"
if tauri_path.exists():
    text = tauri_path.read_text(encoding="utf-8")
    text2, n = re.subn(r'"version"\s*:\s*"[^"]+"', f'"version": "{NEW}"', text, count=1)
    if n:
        tauri_path.write_text(text2, encoding="utf-8")
        print("OK: tauri.conf.json")

# 3. config.ts
cfg_path = ROOT / "src" / "config.ts"
if cfg_path.exists():
    text = cfg_path.read_text(encoding="utf-8")
    text2, n = re.subn(
        r"(LAUNCHER_VERSION\s*=\s*['\"])[^'\"]+(['\"])",
        rf"\g<1>{NEW}\g<2>",
        text,
        count=1,
    )
    if n:
        cfg_path.write_text(text2, encoding="utf-8")
        print("OK: config.ts")

print()
print(f"Готово: {OLD} -> {NEW}")
