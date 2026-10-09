from pathlib import Path
ROOT = Path(__file__).parent
p = ROOT / 'src' / 'store' / 'useLauncherStore.ts'
text = p.read_text(encoding='utf-8')

old = '''      // 1. Проверяем, что valheim.exe реально лежит по пути из настроек
      const exists = await api.checkGamePath(config.game_path);
      if (!exists) {
        throw new Error(
          'valheim.exe не найден по указанному пути. Откройте настройки и выберите папку с игрой.'
        );
      }'''

new = '''      // 1. Проверяем, что valheim.exe реально лежит по пути из настроек
      const exists = await api.checkGamePath(config.game_path);
      if (!exists) {
        // Файлов нет — запускаем полную проверку и переключаемся на InstallScreen
        set({
          isLaunching: false,
          errorMessage: 'Файлы игры повреждены или удалены. Запускаю проверку...',
        });
        const { useUpdateStore } = await import('./useUpdateStore');
        const runCheck = useUpdateStore.getState().runCheck;
        await runCheck(true);
        return;
      }'''

if old in text:
    text = text.replace(old, new)
    p.write_text(text, encoding='utf-8')
    print("OK: play теперь запускает проверку при отсутствии valheim.exe")
else:
    print("Не нашёл блок. Покажи первые 20 строк функции play")