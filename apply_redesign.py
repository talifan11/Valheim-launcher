from pathlib import Path
ROOT = Path(__file__).parent
p = ROOT / 'src' / 'App.tsx'
text = p.read_text(encoding='utf-8')

if "import { sendHeartbeat } from './lib/api';" not in text:
    text = text.replace(
        "import { useLauncherStore } from './store/useLauncherStore';",
        "import { useLauncherStore } from './store/useLauncherStore';\nimport { sendHeartbeat } from './lib/api';"
    )
    p.write_text(text, encoding='utf-8')
    print("OK: sendHeartbeat добавлен")
else:
    print("SKIP: уже есть")