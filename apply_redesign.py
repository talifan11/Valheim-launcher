from pathlib import Path
ROOT = Path(__file__).parent

for path, old, new in [
    (ROOT / 'package.json', '"version": "1.0.2"', '"version": "1.0.3"'),
    (ROOT / 'src-tauri' / 'tauri.conf.json', '"version": "1.0.2"', '"version": "1.0.3"'),
    (ROOT / 'src' / 'config.ts', "LAUNCHER_VERSION = '1.0.2'", "LAUNCHER_VERSION = '1.0.3'"),
]:
    text = path.read_text(encoding='utf-8')
    if old in text:
        text = text.replace(old, new, 1)
        path.write_text(text, encoding='utf-8')
        print(f"OK: {path.name} -> 1.0.3")
    else:
        print(f"SKIP: {path.name} уже не 1.0.2")