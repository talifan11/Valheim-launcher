from pathlib import Path

ROOT = Path(".")

# 1. App.tsx — загрузка events при старте
p = ROOT / "src" / "App.tsx"
text = p.read_text(encoding="utf-8")

if "useEventsStore" not in text:
    text = text.replace(
        "import { useChangelogStore } from './store/useChangelogStore';",
        "import { useChangelogStore } from './store/useChangelogStore';\nimport { useEventsStore } from './store/useEventsStore';",
    )
    text = text.replace(
        "  const loadChangelog = useChangelogStore((s) => s.loadChangelog);",
        "  const loadChangelog = useChangelogStore((s) => s.loadChangelog);\n  const loadEvents = useEventsStore((s) => s.loadEvents);",
    )

    # Эффект старт
    old_eff = """    void loadNews();
    void loadChangelog();

    const onFocus = () => {"""
    new_eff = """    void loadNews();
    void loadChangelog();
    void loadEvents();

    const onFocus = () => {"""
    if old_eff in text:
        text = text.replace(old_eff, new_eff, 1)
        print("OK: App.tsx — loadEvents при старте")
    else:
        print("ПРОПУСК: не нашёл эффект старт")

    # onFocus
    old_focus = """      void loadNews(true);
      void loadChangelog(true);
    };"""
    new_focus = """      void loadNews(true);
      void loadChangelog(true);
      void loadEvents(true);
    };"""
    if old_focus in text:
        text = text.replace(old_focus, new_focus, 1)
        print("OK: App.tsx — loadEvents в onFocus")

    # deps
    text = text.replace(
        "  }, [loadNews, loadChangelog]);",
        "  }, [loadNews, loadChangelog, loadEvents]);",
    )

    p.write_text(text, encoding="utf-8")
else:
    print("SKIP: App.tsx уже есть")

# 2. IconRail — проверка
p = ROOT / "src" / "components" / "layout" / "IconRail.tsx"
text = p.read_text(encoding="utf-8")

print()
print("=== IconRail ===")
for i, line in enumerate(text.split("\n"), 1):
    if "TabId" in line or "id: 'news'" in line or "id: 'events'" in line or "id: 'mods'" in line or "id: 'changelog'" in line:
        print(f"  {i}: {line.strip()}")
