from pathlib import Path

ROOT = Path(__file__).parent
print("=" * 60)

# ============================================================
# 1. Хелпер в общий файл — lib/newsImage.ts
# ============================================================
(ROOT / 'src' / 'lib' / 'newsImage.ts').write_text('''// Утилита: новости приходят с VPS как /news/xxx.jpg.
// Старый формат — просто имя без .jpg — оставляем для fallback-массива.

export function resolveNewsImage(image: string): string {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  if (image.startsWith('/')) return `http://62.217.178.72${image}`;
  return `/news/${image}.jpg`;
}
''', encoding='utf-8')
print("OK: lib/newsImage.ts создан")

# ============================================================
# 2. HeroCard.tsx
# ============================================================
p = ROOT / 'src' / 'components' / 'HeroCard.tsx'
text = p.read_text(encoding='utf-8')

if 'resolveNewsImage' not in text:
    # Добавим импорт
    text = text.replace(
        "import type { NewsItem } from '../data/news';",
        "import type { NewsItem } from '../data/news';\nimport { resolveNewsImage } from '../lib/newsImage';",
    )
    # Заменим src
    text = text.replace(
        'src={`/news/${item.image}.jpg`}',
        'src={resolveNewsImage(item.image)}',
    )
    p.write_text(text, encoding='utf-8')
    print("OK: HeroCard.tsx — resolveNewsImage")
else:
    print("SKIP: HeroCard.tsx — уже есть")

# ============================================================
# 3. NewsDetailModal.tsx
# ============================================================
p = ROOT / 'src' / 'components' / 'news' / 'NewsDetailModal.tsx'
text = p.read_text(encoding='utf-8')

if 'resolveNewsImage' not in text:
    text = text.replace(
        "import type { NewsItem } from '../../data/news';",
        "import type { NewsItem } from '../../data/news';\nimport { resolveNewsImage } from '../../lib/newsImage';",
    )
    text = text.replace(
        'src={`/news/${item.image}.jpg`}',
        'src={resolveNewsImage(item.image)}',
    )
    p.write_text(text, encoding='utf-8')
    print("OK: NewsDetailModal.tsx — resolveNewsImage")
else:
    print("SKIP: NewsDetailModal.tsx — уже есть")

# ============================================================
# 4. NewsGrid.tsx — переключить на общий хелпер
# ============================================================
p = ROOT / 'src' / 'components' / 'news' / 'NewsGrid.tsx'
text = p.read_text(encoding='utf-8')

# Убираем локальный хелпер
if 'function resolveNewsImage' in text:
    import re
    # Удаляем блок функции
    text = re.sub(
        r'\n/\*\*\n \* Новости приходят с VPS[\s\S]*?\n\}\n',
        '\n',
        text,
        count=1,
    )
    # Добавляем импорт
    if 'resolveNewsImage' not in text.split('\n')[0:10][0]:
        text = text.replace(
            "import { useNewsStore } from '../../store/useNewsStore';",
            "import { useNewsStore } from '../../store/useNewsStore';\nimport { resolveNewsImage } from '../../lib/newsImage';",
        )
    p.write_text(text, encoding='utf-8')
    print("OK: NewsGrid.tsx — на общий хелпер")

print("=" * 60)
print("ГОТОВО")
