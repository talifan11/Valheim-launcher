from pathlib import Path
ROOT = Path(__file__).parent
p = ROOT / 'src' / 'App.tsx'
text = p.read_text(encoding='utf-8')

# Добавляем импорт startDragging
if 'getCurrentWindow' not in text:
    text = text.replace(
        "import { useAppSettingsStore } from './store/useAppSettingsStore';",
        "import { useAppSettingsStore } from './store/useAppSettingsStore';\nimport { getCurrentWindow } from '@tauri-apps/api/window';"
    )

# Добавляем обработчик и глобальную зону перетаскивания
if 'handleDragStart' not in text:
    # Ищем функцию App, добавляем хук
    old_hook = '  const [connection, setConnection] = useState<ConnectionState>(\'checking\');'
    new_hook = '''  const [connection, setConnection] = useState<ConnectionState>('checking');

  // Перетаскивание окна за любую область
  const handleDragStart = (e: React.MouseEvent) => {
    // Игнорируем клики по кнопкам, ссылкам, инпутам и элементам с data-no-drag
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('[data-no-drag]')
    ) {
      return;
    }
    void getCurrentWindow().startDragging();
  };'''
    if old_hook in text:
        text = text.replace(old_hook, new_hook)
        print("OK: handleDragStart добавлен")

# Навешиваем onMouseDown на корневой div
if 'onMouseDown={handleDragStart}' not in text:
    old_div = '<div className="relative h-screen w-screen overflow-hidden theme-bg">'
    new_div = '<div className="relative h-screen w-screen overflow-hidden theme-bg" onMouseDown={handleDragStart}>'
    if old_div in text:
        text = text.replace(old_div, new_div)
        print("OK: onMouseDown навешен")
    else:
        print("Не нашёл корневой div. Скинь grep 'h-screen w-screen' src/App.tsx")

p.write_text(text, encoding='utf-8')
print("Готово")