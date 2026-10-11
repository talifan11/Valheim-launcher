// Утилита: новости приходят с VPS как /news/xxx.jpg.
// Старый формат — просто имя без .jpg — оставляем для fallback-массива.

export function resolveNewsImage(image: string): string {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  if (image.startsWith('/')) return `http://62.217.178.72${image}`;
  return `/news/${image}.jpg`;
}
