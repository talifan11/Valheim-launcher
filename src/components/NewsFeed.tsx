// Скроллящаяся лента новостей: вертикальный список карточек с плавным появлением.
import { motion } from 'framer-motion';
import { news } from '../data/news';
import { NewsCard } from './NewsCard';

export function NewsFeed() {
  return (
    <div className="vr-scroll vr-news-feed">
      {news.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: index * 0.06, ease: 'easeOut' }}
        >
          <NewsCard item={item} />
        </motion.div>
      ))}
    </div>
  );
}
