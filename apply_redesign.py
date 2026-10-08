from pathlib import Path
ROOT = Path(__file__).parent
p = ROOT / 'src' / 'store' / 'useUpdateStore.ts'
text = p.read_text(encoding='utf-8')

old = 'runCheck: async (force = false) => {'
new = 'runCheck: async (_force = false) => {'

if old in text:
    text = text.replace(old, new)
    p.write_text(text, encoding='utf-8')
    print("OK: force -> _force (не используется)")
else:
    print("Не нашёл. Проверь вручную grep runCheck")