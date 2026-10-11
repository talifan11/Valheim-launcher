from pathlib import Path

ROOT = Path(".")

# ═══════════════════════════════════════════════════════════════
# 1. useModsStore — add reset() + fix get
# ═══════════════════════════════════════════════════════════════
p = ROOT / "src" / "store" / "useModsStore.ts"
text = p.read_text(encoding="utf-8")

# Убираем get из параметров (не используется)
text = text.replace(
    "export const useModsStore = create<ModsState>((set, get) => ({",
    "export const useModsStore = create<ModsState>((set) => ({",
)

# Добавляем reset в интерфейс
if "reset: () => void;" not in text:
    text = text.replace(
        "  toggleMod: (name: string, enabled: boolean) => Promise<void>;",
        "  toggleMod: (name: string, enabled: boolean) => Promise<void>;\n  reset: () => void;",
    )

# Добавляем метод reset
if "reset: () =>" not in text:
    text = text.replace(
        """  toggleMod: async (name, enabled) => {
    const token = useLauncherStore.getState().authToken;
    if (!token) return;
    set({ busyName: name });
    try {
      await api.toggleUserMod(token, name, enabled);
      // Оптимистичное обновление
      set((s) => ({
        mods: s.mods.map((m) => (m.name === name ? { ...m, enabled } : m)),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Ошибка' });
    } finally {
      set({ busyName: null });
    }
  },
}));""",
        """  toggleMod: async (name, enabled) => {
    const token = useLauncherStore.getState().authToken;
    if (!token) return;
    set({ busyName: name });
    try {
      await api.toggleUserMod(token, name, enabled);
      set((s) => ({
        mods: s.mods.map((m) => (m.name === name ? { ...m, enabled } : m)),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Ошибка' });
    } finally {
      set({ busyName: null });
    }
  },

  reset: () => set({ mods: [], loading: false, error: null, busyName: null }),
}));""",
    )

p.write_text(text, encoding="utf-8")
print("OK: useModsStore — reset + get fix")

# ═══════════════════════════════════════════════════════════════
# 2. useEventsStore — add reset()
# ═══════════════════════════════════════════════════════════════
p = ROOT / "src" / "store" / "useEventsStore.ts"
text = p.read_text(encoding="utf-8")

if "reset: () => void;" not in text:
    text = text.replace(
        "  deleteEvent: (id: number) => Promise<void>;",
        "  deleteEvent: (id: number) => Promise<void>;\n  reset: () => void;",
    )

if "reset: () => set({" not in text:
    # Добавим в конец перед закрывающей
    text = text.rstrip()
    if text.endswith("}));"):
        text = text[:-4] + """
  reset: () => set({ events: [], loading: false, error: null, busyId: null, lastFetched: 0 }),
}));"""

p.write_text(text, encoding="utf-8")
print("OK: useEventsStore — reset")

# ═══════════════════════════════════════════════════════════════
# 3. Версия — откат 1.0.193 → 1.0.20
# ═══════════════════════════════════════════════════════════════
import json, re
NEW_VER = "1.0.20"

pkg = ROOT / "package.json"
data = json.loads(pkg.read_text(encoding="utf-8"))
old_ver = data["version"]
if old_ver != NEW_VER:
    for f in [pkg, ROOT / "src-tauri" / "tauri.conf.json"]:
        if not f.exists(): continue
        t = f.read_text(encoding="utf-8")
        t2, n = re.subn(r'"version"\s*:\s*"[^"]+"', f'"version": "{NEW_VER}"', t, count=1)
        if n:
            f.write_text(t2, encoding="utf-8")
    cfg = ROOT / "src" / "config.ts"
    t = cfg.read_text(encoding="utf-8")
    t2, n = re.subn(r"(LAUNCHER_VERSION\s*=\s*['\"])[^'\"]+(['\"])", rf"\g<1>{NEW_VER}\g<2>", t, count=1)
    if n:
        cfg.write_text(t2, encoding="utf-8")
    print(f"OK: версия {old_ver} -> {NEW_VER}")

print()
print("=== ГОТОВО ===")
