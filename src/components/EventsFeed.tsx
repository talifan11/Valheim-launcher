// Компактная лента событий: дата-бейдж слева, заголовок и описание справа.
import { motion } from 'framer-motion';
import type { NewsItem } from '../data/news';

interface EventsFeedProps {
  items: NewsItem[];
}

export function EventsFeed({ items }: EventsFeedProps) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <motion.article
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: index * 0.07 }}
          className="vr-glass flex items-start gap-4 p-4 transition-all duration-300 hover:-translate-y-0.5"
        >
          <div className="flex w-24 shrink-0 flex-col items-center rounded-md border border-edge/40 bg-black/25 px-2 py-2">
            <span className="font-display text-xl font-semibold leading-none text-gold">
              {item.date.split(' ')[0]}
            </span>
            <span className="mt-1 text-[10px] uppercase tracking-[0.12em] text-slate-500">
              {item.date.split(' ').slice(1).join(' ')}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold text-blizzard">{item.title}</h3>
            <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-slate-400">{item.description}</p>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
