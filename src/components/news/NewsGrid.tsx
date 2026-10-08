import { useState } from 'react';
import { Newspaper } from 'lucide-react';
import { news, type NewsItem } from '../../data/news';

const FALLBACKS = [
  'linear-gradient(135deg, #2a1a3e 0%, #0a0e14 100%)',
  'linear-gradient(135deg, #1a2540 0%, #0a0e14 100%)',
  'linear-gradient(135deg, #3a2418 0%, #0a0e14 100%)',
  'linear-gradient(135deg, #1a3025 0%, #0a0e14 100%)',
];

interface Props {
  onOpenNews: (item: NewsItem) => void;
}

function NewsCard({ item, onClick }: { item: NewsItem; onClick: () => void }) {
  const [error, setError] = useState(false);
  const fallback = FALLBACKS[Math.abs(item.id) % FALLBACKS.length];

  return (
    <article
      onClick={onClick}
      className="group relative glass rounded-[18px] overflow-hidden cursor-pointer hover:-translate-y-1 hover:border-gold/30 transition-all duration-300"
    >
      <div className="relative h-32 overflow-hidden">
        {!error ? (
          <img
            src={`/news/${item.image}.jpg`}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: fallback }}>
            <Newspaper size={32} className="text-slate-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141923] via-transparent to-transparent" />
      </div>
      <div className="p-4">
        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-1.5 font-mono">
          {item.date}
        </p>
        <h3 className="font-display text-base font-semibold leading-snug text-white line-clamp-2 group-hover:text-gold transition-colors">
          {item.title}
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-400 line-clamp-2">
          {item.description}
        </p>
      </div>
    </article>
  );
}

export function NewsGrid({ onOpenNews }: Props) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="font-display text-lg tracking-wide text-white">Новости сервера</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
          {news.length} обновлений
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {news.map((item, i) => (
          <div key={item.id} className="animate-fade-in-up" style={{ animationDelay: `${0.15 + i * 0.05}s` }}>
            <NewsCard item={item} onClick={() => onOpenNews(item)} />
          </div>
        ))}
      </div>
    </div>
  );
}
