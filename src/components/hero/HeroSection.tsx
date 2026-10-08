import { useState } from 'react';
import { Star } from 'lucide-react';
import { ShieldLogo } from '../ShieldLogo';
import { news } from '../../data/news';
import { useFavoritesStore } from '../../store/useFavoritesStore';

export function HeroSection() {
  const [imgError, setImgError] = useState(false);
  const favIds = useFavoritesStore((s) => s.ids);
  const toggleFav = useFavoritesStore((s) => s.toggle);

  const featured = news[0];
  const isFav = featured ? favIds.includes(featured.id) : false;

  const handleFav = () => {
    if (!featured) return;
    toggleFav(featured.id);
  };

  return (
    <div className="relative w-full rounded-[24px] overflow-hidden border border-white/[0.06] shadow-[0_24px_64px_rgba(0,0,0,0.55)]">
      <div className="relative w-full" style={{ aspectRatio: '880 / 360' }}>
        {!imgError ? (
          <img
            src="/backgrounds/hero.jpg"
            alt="Valheim"
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 30% 40%, #2a3d5c 0%, #1a2540 40%, #0a0e14 100%)',
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e14]/20 via-[#0a0e14]/50 to-[#0a0e14]/90" />

        <div className="absolute inset-0 p-8 flex flex-col justify-end">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-gold drop-shadow-lg">
              <ShieldLogo size={44} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-gold mb-1">
                Nordic Survival
              </p>
              <h1 className="font-display font-black text-[42px] leading-none tracking-[0.05em] text-white drop-shadow-2xl">
                VALHEIM ROUGE
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-300 mb-5 max-w-lg leading-relaxed">
            Онлайн-сервер для выживания в суровых землях викингов.
            Исследуй фьорды, строй укрепления, сражайся с ётунами.
          </p>
          <div>
            <button
              type="button"
              onClick={handleFav}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-xs uppercase tracking-[0.15em] transition-all duration-300 ${
                isFav
                  ? 'bg-gold/15 border border-gold/40 text-gold'
                  : 'border border-white/15 text-white hover:bg-white/5 hover:border-white/25'
              }`}
            >
              <Star size={14} fill={isFav ? 'currentColor' : 'none'} />
              {isFav ? 'В избранном' : 'В избранное'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
