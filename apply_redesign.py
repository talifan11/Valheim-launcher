from pathlib import Path
ROOT = Path(__file__).parent
p = ROOT / 'src-tauri' / 'src' / 'network.rs'
text = p.read_text(encoding='utf-8')

# Заменяем installed_path и downloads_dir — использовать %APPDATA%/ValheimRouge как в config.rs
old_installed = '''fn installed_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Не удалось получить папку данных: {e}"))?;
    Ok(dir.join("installed.json"))
}'''

new_installed = '''fn installed_path(_app: &AppHandle) -> Result<PathBuf, String> {
    Ok(base_data_dir()?.join("installed.json"))
}

/// Общая папка данных: %APPDATA%/ValheimRouge
/// app_data_dir() даёт %APPDATA%/<identifier>, а нам нужна папка без identifier.
fn base_data_dir() -> Result<PathBuf, String> {
    let base = dirs_next::config_dir()
        .ok_or_else(|| "Не удалось определить %APPDATA%".to_string())?;
    Ok(base.join("ValheimRouge"))
}'''

if old_installed in text:
    text = text.replace(old_installed, new_installed)
    print("OK: installed_path исправлен")
else:
    print("Проверь вручную — не нашёл старый installed_path")

# downloads_dir
old_downloads = '''fn downloads_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let base = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Не удалось получить папку данных: {e}"))?;
    let dir = base.join("downloads");
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Не удалось создать папку загрузок: {e}"))?;
    Ok(dir)
}'''

new_downloads = '''fn downloads_dir(_app: &AppHandle) -> Result<PathBuf, String> {
    let dir = base_data_dir()?.join("downloads");
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Не удалось создать папку загрузок: {e}"))?;
    Ok(dir)
}'''

if old_downloads in text:
    text = text.replace(old_downloads, new_downloads)
    print("OK: downloads_dir исправлен")
else:
    print("Проверь вручную — не нашёл старый downloads_dir")

p.write_text(text, encoding='utf-8')
print("")
print("Дальше:")
print("  1. cd src-tauri && cargo check && cd ..")
print("  2. npm run tauri build")
print("  3. Запусти новый .exe и войди — сразу на главный экран")