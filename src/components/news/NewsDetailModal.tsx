import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Calendar, Newspaper } from 'lucide-react';
import type { NewsItem } from '../../data/news';
import { useFavoritesStore } from '../../store/useFavoritesStore';

interface Props {
  item: NewsItem | null;
  onClose: () => void;
}

export function NewsDetailModal({ item, onClose }: Props) {
  const [imgError, setImgError] = useState(false);
  const favIds = useFavoritesStore((s) => s.ids);
  const toggleFav = useFavoritesStore((s) => s.toggle);

  if (!item) return null;
  const isFav = favIds.includes(item.id);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      >
        <div className="absolute inset-0 modal-backdrop" />

        <motion.div
          className="relative w-[640px] max-w-full max-h-[90vh] glass-popover rounded-[24px] overflow-hidden flex flex-col"
          initial={{ scale: 0.94, y: 16, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.94, y: 16, opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Хедер: картинка + close */}
          <div className="relative h-56 shrink-0">
            {!imgError ? (
              <img
                src={`/news/${item.image}.jpg`}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1a2540] to-[#0a0e14] flex items-center justify-center">
                <Newspaper size={48} className="text-slate-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1420] via-transparent to-transparent" />

            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-lg glass flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            <button
              type="button"
              onClick={() => toggleFav(item.id)}
              className={`absolute top-4 right-16 w-9 h-9 rounded-lg glass flex items-center justify-center transition-all ${
                isFav ? 'text-gold' : 'text-white/70 hover:text-white'
              }`}
              title={isFav ? 'Убрать из избранного' : 'В избранное'}
            >
              <Star size={16} fill={isFav ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Контент */}
          <div className="flex-1 overflow-y-auto vr-scroll p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-semibold flex items-center gap-1.5">
                <Calendar size={11} />
                {item.date}
              </span>
            </div>

            <h2 className="font-display text-2xl text-white leading-tight mb-4">
              {item.title}
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              {item.description}
            </p>

            <p className="text-sm text-slate-400 leading-relaxed mt-4">
              Полный текст новости появится после подключения к серверу.
              Сейчас это демонстрационный просмотр. Позже здесь будет полная
              статья с картинками, ссылками и вложениями.
            </p>
          </div>

          {/* Футер */}
          <div className="p-4 border-t border-white/[0.06] flex items-center justify-between">
            <button
              type="button"
              onClick={() => toggleFav(item.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                isFav
                  ? 'bg-gold/15 text-gold border border-gold/30'
                  : 'border border-white/[0.10] text-slate-300 hover:bg-white/5'
              }`}
            >
              <Star size={14} fill={isFav ? 'currentColor' : 'none'} />
              {isFav ? 'В избранном' : 'В избранное'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 text-xs font-semibold uppercase tracking-wider transition-all"
            >
              Закрыть
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
