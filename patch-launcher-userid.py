from pathlib import Path

p = Path("src/store/useLauncherStore.ts")
text = p.read_text(encoding="utf-8")

# 1. В интерфейс — добавить userId
if "userId: number | null" not in text:
    old = "  userEmail: string | null;"
    new = "  userEmail: string | null;\n  /** ID авторизованного пользователя */\n  userId: number | null;"
    if old in text:
        text = text.replace(old, new, 1)
        print("OK: интерфейс + userId")

# 2. В state — начальное значение
if "userId: null," not in text:
    old = "  userEmail: null,"
    new = "  userEmail: null,\n  userId: null,"
    if old in text:
        text = text.replace(old, new, 1)
        print("OK: state userId: null")

# 3. logout — сбросить userId
old_logout = "    set({ isAuthenticated: false, authToken: null, userEmail: null });"
new_logout = "    set({ isAuthenticated: false, authToken: null, userEmail: null, userId: null });"
if old_logout in text:
    text = text.replace(old_logout, new_logout, 1)
    print("OK: logout сбрасывает userId")

# 4. loginWithApi и registerWithApi — сохранять userId
# Ищем блоки где устанавливаются authToken и userEmail
count = text.count("      authToken: result.token,\n      userEmail: result.email,")
if count > 0:
    text = text.replace(
        "      authToken: result.token,\n      userEmail: result.email,",
        "      authToken: result.token,\n      userEmail: result.email,\n      userId: result.user_id,",
    )
    print(f"OK: userId сохраняется в {count} местах (login + register)")

p.write_text(text, encoding="utf-8")
print("Готово")
