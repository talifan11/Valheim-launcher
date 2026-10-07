// Большая карточка новости: фон-картинка, градиентная вуаль снизу, текст поверх.
// Если картинки нет — показываем градиентный плейсхолдер с иконкой газеты.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Newspaper } from 'lucide-react';
import type { NewsItem } from '../data/news';

interface HeroCardProps {
  item: NewsItem;
}

export function HeroCard({ item }: HeroCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="group relative h-[280px] overflow-hidden rounded-lg border border-edge/40"
    >
      {!imageFailed ? (
        <img
          src={`/news/${item.image}.jpg`}
          alt=""
          draggable={false}
          onError={() => setImageFailed(true)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="vr-news-placeholder absolute inset-0">
          <Newspaper size={48} strokeWidth={1.5} />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,13,0.95)_0%,rgba(5,7,13,0.55)_45%,transparent_100%)]" />

      <div className="absolute inset-x-0 bottom-0 p-6">
        <p className="vr-news-date mb-2">{item.date}</p>
        <h2 className="font-display text-[22px] font-semibold leading-snug text-blizzard">{item.title}</h2>
        <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-slate-400">{item.description}</p>
      </div>
    </motion.article>
  );
}
