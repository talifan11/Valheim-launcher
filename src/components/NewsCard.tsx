// Одна карточка новости: слева картинка (с fallback на градиент), справа текст.
import { useState } from 'react';
import type { NewsItem } from '../data/news';

interface NewsCardProps {
  item: NewsItem;
}

export function NewsCard({ item }: NewsCardProps) {
  // Если файл в public/news отсутствует — onError переключает на градиентный блок
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article className="vr-news-card">
      {/* Картинка: 40% ширины, скругление только со стороны контента */}
      <div className="vr-news-media">
        {imageFailed ? (
          <div className="vr-news-placeholder" aria-hidden="true" />
        ) : (
          <img
            src={`/news/${item.image}.jpg`}
            alt=""
            loading="lazy"
            draggable={false}
            onError={() => setImageFailed(true)}
          />
        )}
      </div>

      {/* Текстовый блок: дата, заголовок, описание, кнопка «Читать» */}
      <div className="vr-news-body">
        <span className="vr-news-date">{item.date}</span>
        <h3 className="vr-news-title">{item.title}</h3>
        <p className="vr-news-desc">{item.description}</p>
        <button type="button" className="vr-btn-ghost-sm">
          Читать
        </button>
      </div>
    </article>
  );
}
