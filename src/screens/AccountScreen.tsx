import {
  Clock,
  Swords,
  Trophy,
  Flame,
  MapPin,
  TrendingUp,
  Target,
  Crown,
} from 'lucide-react';
import { useLauncherStore } from '../store/useLauncherStore';
import { useProfileStore } from '../store/useProfileStore';
import { Avatar } from '../components/ui/Avatar';

interface StatItem {
  label: string;
  value: string;
  icon: typeof Clock;
  color: string;
}

interface AchievementItem {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: typeof Trophy;
}

const STATS: StatItem[] = [
  { label: 'Часов в игре', value: '124 ч', icon: Clock, color: 'text-blizzard' },
  { label: 'Убито врагов', value: '2 847', icon: Swords, color: 'text-blood' },
  { label: 'Дней выжито', value: '48', icon: Flame, color: 'text-gold' },
  { label: 'Пройдено км', value: '312', icon: MapPin, color: 'text-emerald' },
];

const ACHIEVEMENTS: AchievementItem[] = [
  {
    id: 'a1',
    title: 'Убийца Ётунов',
    description: 'Победить 10 Ётунов',
    unlocked: true,
    icon: Crown,
  },
  {
    id: 'a2',
    title: 'Мастер-строитель',
    description: 'Построить 5 укреплений',
    unlocked: true,
    icon: Target,
  },
  {
    id: 'a3',
    title: 'Мореплаватель',
    description: 'Проплыть 100 км',
    unlocked: true,
    icon: MapPin,
  },
  {
    id: 'a4',
    title: 'Легенда сервера',
    description: 'Достичь 50 уровня',
    unlocked: false,
    icon: Trophy,
  },
  {
    id: 'a5',
    title: 'Первопроходец',
    description: 'Открыть все биомы',
    unlocked: true,
    icon: TrendingUp,
  },
  {
    id: 'a6',
    title: 'Мастер-кузнец',
    description: 'Создать 100 предметов',
    unlocked: false,
    icon: Flame,
  },
];

export function AccountScreen() {
  const config = useLauncherStore((s) => s.config);
  const avatarId = useProfileStore((s) => s.avatarId);

  const unlockedCount = ACHIEVEMENTS.filter((a) => a.unlocked).length;
  const totalAchievements = ACHIEVEMENTS.length;

  return (
    <div className="space-y-6">
      {/* Шапка профиля */}
      <div className="glass rounded-[24px] p-6 flex items-center gap-6">
        <Avatar size={96} avatarId={avatarId} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-3 mb-2">
            <h1 className="font-display text-3xl font-black text-white tracking-wide truncate">
              {config.username || 'Безымянный викинг'}
            </h1>
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-gold border border-gold/30 rounded-full px-2.5 py-1">
              Ур. 42
            </span>
          </div>
          <div className="text-sm text-slate-400 mb-3">
            Клан: <span className="text-gold font-semibold">Rouge</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-emerald border border-emerald/25 bg-emerald/10 rounded px-2 py-1 font-semibold">
              ● Online
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 border border-white/10 rounded px-2 py-1 font-semibold">
              С нами с 12.10.2026
            </span>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div>
        <div className="mb-3 px-1 flex items-center justify-between">
          <h2 className="font-display text-lg tracking-wide text-white">Статистика</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
            За всё время
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="glass rounded-[18px] p-4">
                <Icon size={20} className={`${stat.color} mb-3`} />
                <div className="font-display text-2xl font-black text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="text-[11px] uppercase tracking-[0.1em] text-slate-500 mt-1 font-semibold">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Достижения */}
      <div>
        <div className="mb-3 px-1 flex items-center justify-between">
          <h2 className="font-display text-lg tracking-wide text-white">Достижения</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
            {unlockedCount} / {totalAchievements}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ACHIEVEMENTS.map((ach) => {
            const Icon = ach.icon;
            return (
              <div
                key={ach.id}
                className={`glass rounded-[18px] p-4 flex items-center gap-4 transition-all ${
                  ach.unlocked
                    ? 'border-gold/20'
                    : 'opacity-50 grayscale'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    ach.unlocked
                      ? 'bg-gold/15 border border-gold/30 text-gold'
                      : 'bg-white/5 border border-white/10 text-slate-500'
                  }`}
                >
                  <Icon size={22} />
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-sm font-bold truncate ${
                      ach.unlocked ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {ach.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {ach.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
