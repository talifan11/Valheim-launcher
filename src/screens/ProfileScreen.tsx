import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  MessageCircle,
  Gamepad2,
  UserMinus,
  Clock,
  Sword,
  Flame,
  Compass,
  Trophy,
  Target,
  Crown,
  TrendingUp,
  Users,
  Settings,
  LogOut,
  Activity,
  Lock,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import type { Friend } from '../store/useFriendsStore';
import { useFriendsStore } from '../store/useFriendsStore';
import { useProfileStore } from '../store/useProfileStore';
import { AvatarUploadModal } from '../components/profile/AvatarUploadModal';
import { BannerUploadModal } from '../components/profile/BannerUploadModal';
import { useLauncherStore } from '../store/useLauncherStore';
import { useChatStore } from '../store/useChatStore';
import { toast } from '../store/useToastStore';
import { Avatar } from '../components/ui/Avatar';
import { resolveAvatarUrl } from '../lib/api';

type Tab = 'overview' | 'stats' | 'achievements';

interface Props {
  userId: number | null;
  onClose?: () => void;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: typeof Trophy;
}

interface StatDef {
  key: string;
  label: string;
  short: string;
  value: number;
  unit: string;
  icon: typeof Clock;
  tone: 'blizzard' | 'blood' | 'gold' | 'emerald';
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', title: 'Убийца Ётунов', description: 'Победить 10 Ётунов', icon: Crown },
  { id: 'a2', title: 'Мастер-строитель', description: 'Построить 5 укреплений', icon: Target },
  { id: 'a3', title: 'Мореплаватель', description: 'Проплыть 100 км', icon: Compass },
  { id: 'a4', title: 'Легенда сервера', description: 'Достичь 50 уровня', icon: Trophy },
  { id: 'a5', title: 'Первопроходец', description: 'Открыть все биомы', icon: TrendingUp },
  { id: 'a6', title: 'Мастер-кузнец', description: 'Создать 100 предметов', icon: Flame },
  { id: 'a7', title: 'Верный друг', description: 'Добавить 5 друзей', icon: Users },
  { id: 'a8', title: 'Полководец', description: 'Убить 1000 врагов', icon: Sword },
  { id: 'a9', title: 'Долгожитель', description: 'Прожить 100 дней', icon: Clock },
];

const STATS: StatDef[] = [
  { key: 'hours', label: 'Часов в игре', short: 'Часов', value: 0, unit: 'ч', icon: Clock, tone: 'blizzard' },
  { key: 'kills', label: 'Убито врагов', short: 'Убийств', value: 0, unit: '', icon: Sword, tone: 'blood' },
  { key: 'days', label: 'Дней выжито', short: 'Дней', value: 0, unit: '', icon: Flame, tone: 'gold' },
  { key: 'km', label: 'Пройдено км', short: 'Км', value: 0, unit: 'км', icon: Compass, tone: 'emerald' },
];

const TONE_BG: Record<StatDef['tone'], string> = {
  blizzard: 'bg-blizzard/10 text-blizzard',
  blood: 'bg-blood/10 text-blood',
  gold: 'bg-gold/10 text-gold',
  emerald: 'bg-emerald/10 text-emerald',
};

function formatLastSeen(minutes?: number): string {
  if (minutes == null) return 'Не в сети';
  if (minutes < 1) return 'Только что';
  if (minutes < 60) return `${minutes} мин назад`;
  const h = Math.floor(minutes / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  return `${d} дн назад`;
}

export function ProfileScreen({ userId, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const isSelf = userId === null;
  const isOverlay = !!onClose;

  const friend = useFriendsStore((s) =>
    userId !== null ? s.friends.find((f) => f.userId === userId) : undefined
  );
  const allFriends = useFriendsStore((s) => s.friends);
  const removeFriend = useFriendsStore((s) => s.removeFriend);
  const openDmWith = useChatStore((s) => s.openDmWith);
  const selfAvatarUrl = useProfileStore((s) => s.avatarUrl);
  const selfBannerUrl = useProfileStore((s) => s.bannerUrl);
  const config = useLauncherStore((s) => s.config);
  const logout = useLauncherStore((s) => s.logout);
  const setSettingsOpen = useLauncherStore((s) => s.setSettingsOpen);

  const onlineFriends = useMemo(
    () => allFriends.filter((f) => f.status !== 'offline'),
    [allFriends]
  );
  const achievementsUnlocked = 0;

  if (!isSelf && !friend) return null;

  const displayName = isSelf ? (config.username || 'Игрок') : (friend?.name ?? '');
  const status = isSelf ? 'online' : (friend?.status ?? 'offline');
  const avatarUrl = isSelf ? selfAvatarUrl : (friend?.avatarUrl ?? null);
  const fullAvatarUrl = resolveAvatarUrl(avatarUrl);
  const fullBannerUrl = isSelf ? resolveAvatarUrl(selfBannerUrl) : null;
  const lastSeen = isSelf ? 0 : friend?.lastSeenMinutes;

  const statusLabel =
    status === 'in-game' ? 'В игре' :
    status === 'online' ? 'В сети' :
    'Не в сети';

  const statusColor =
    status === 'in-game' ? 'text-gold' :
    status === 'online' ? 'text-emerald' :
    'text-slate-500';

  const handleChat = () => {
    if (!friend) return;
    openDmWith(friend.userId, friend.name);
    onClose?.();
  };

  const handleInvite = () => {
    if (!friend) return;
    toast.success(`Приглашение отправлено ${friend.name}`);
    onClose?.();
  };

  const handleRemove = async () => {
    if (!friend) return;
    await removeFriend(friend.userId);
    toast.info(`${friend.name} удалён из друзей`);
    onClose?.();
  };

  const handleSettings = () => {
    setSettingsOpen(true);
    onClose?.();
  };

  const handleLogout = () => {
    logout();
    onClose?.();
  };

  const containerClass = isOverlay
    ? 'fixed inset-0 z-[45] bg-abyss overflow-y-auto no-scrollbar animate-fade-in-up'
    : 'h-full w-full overflow-y-auto no-scrollbar';

  return (
    <div className={containerClass}>
      {/* ===== HERO ===== */}
      <div className="relative h-[260px] overflow-hidden">
        {fullBannerUrl ? (
          <img
            src={fullBannerUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : fullAvatarUrl ? (
          <img
            src={fullAvatarUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-[1.6] blur-2xl opacity-70"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blizzard/30 via-abyss to-abyss" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-abyss via-abyss/60 to-abyss/20" />

        {/* Кнопки редактирования — только для своего профиля */}
        {isSelf && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAvatarModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass-strong text-[11px] uppercase tracking-[0.12em] font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Сменить аватарку"
            >
              <Camera size={13} />
              <span className="hidden sm:inline">Ава</span>
            </button>
            <button
              type="button"
              onClick={() => setBannerModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass-strong text-[11px] uppercase tracking-[0.12em] font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Сменить шапку"
            >
              <ImageIcon size={13} />
              <span className="hidden sm:inline">Шапка</span>
            </button>
          </div>
        )}

        {/* Watermark уровня */}
        <span className="absolute -right-6 top-1/2 -translate-y-1/2 font-display text-[220px] leading-none font-black text-white/[0.03] pointer-events-none select-none">
          0
        </span>

        {isOverlay && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 px-3 py-2 rounded-xl glass-strong text-[11px] uppercase tracking-[0.12em] font-bold text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            Назад
          </button>
        )}

        <div className="absolute bottom-0 left-0 right-0 px-8 pb-6 flex items-end gap-6">
          <Avatar
            size={112}
            self={isSelf}
            avatarUrl={avatarUrl}
            ringColor={status === 'in-game' ? 'gold' : status === 'online' ? 'emerald' : 'slate'}
            inGame={status === 'in-game'}
            online={status === 'online'}
          />
          <div className="min-w-0 pb-1.5">
            <h1 className="font-display text-[32px] leading-tight font-bold text-white truncate">
              {displayName}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-[13px] font-semibold ${statusColor}`}>{statusLabel}</span>
              <span className="w-px h-3 bg-white/10" />
              <span className="text-[12px] text-slate-500 font-mono">
                {isSelf ? 'Вы' : 'Игрок сервера'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== ТАБЫ ===== */}
      <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-abyss/85 backdrop-blur-md px-8">
        <div className="flex gap-1">
          {([
            { id: 'overview' as const, label: 'Обзор', badge: null },
            { id: 'stats' as const, label: 'Статистика', badge: null },
            { id: 'achievements' as const, label: 'Достижения', badge: `${achievementsUnlocked}/${ACHIEVEMENTS.length}` },
          ]).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative inline-flex items-center gap-2 px-4 py-3.5 text-[11px] uppercase tracking-[0.14em] font-bold transition-colors ${
                tab === t.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.label}
              {t.badge && (
                <span className="text-[10px] font-mono text-slate-600 normal-case tracking-normal">
                  {t.badge}
                </span>
              )}
              {tab === t.id && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-gold" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ===== 2-КОЛОНОЧНАЯ СЕТКА ===== */}
      <div className="px-8 py-6 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* ЛЕВАЯ КОЛОНКА */}
        <div className="space-y-8 min-w-0">
          {tab === 'overview' && <OverviewTab isSelf={isSelf} onlineFriends={onlineFriends} />}
          {tab === 'stats' && <StatsTab />}
          {tab === 'achievements' && <AchievementsTab />}
        </div>

        {/* ПРАВАЯ КОЛОНКА */}
        <aside className="space-y-4">
          <ActionCard
            isSelf={isSelf}
            onSettings={handleSettings}
            onLogout={handleLogout}
            onChat={handleChat}
            onInvite={handleInvite}
            onRemove={handleRemove}
          />
          <RecentCard isSelf={isSelf} lastSeen={lastSeen} status={status} />
          <MemberCard isSelf={isSelf} />
        </aside>
      </div>

      {/* Модалки редактирования профиля */}
      <AvatarUploadModal
        open={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
      />
      <BannerUploadModal
        open={bannerModalOpen}
        onClose={() => setBannerModalOpen(false)}
      />
    </div>
  );
}

/* ============================================================
   Секции
   ============================================================ */

function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-display text-[11px] uppercase tracking-[0.16em] font-bold text-slate-500">
        {children}
      </h2>
      {right}
    </div>
  );
}

function OverviewTab({
  isSelf,
  onlineFriends,
}: {
  isSelf: boolean;
  onlineFriends: Friend[];
}) {
  const visible = onlineFriends.slice(0, 8);
  const hidden = Math.max(0, onlineFriends.length - visible.length);

  return (
    <div className="space-y-8">
      {/* Друзья онлайн */}
      <section>
        <SectionTitle
          right={
            <span className="text-[10px] font-mono text-slate-600">
              {onlineFriends.length} онлайн
            </span>
          }
        >
          {isSelf ? 'Друзья онлайн' : 'Общие друзья'}
        </SectionTitle>
        {onlineFriends.length === 0 ? (
          <div className="glass rounded-2xl px-5 py-6 text-center">
            <Users size={22} className="mx-auto text-slate-700 mb-2" />
            <p className="text-xs text-slate-500">Пока никого нет онлайн</p>
          </div>
        ) : (
          <div className="glass rounded-2xl p-4 flex items-center gap-2">
            {visible.map((f) => (
              <div
                key={f.id}
                title={`${f.name} — ${f.status === 'in-game' ? 'в игре' : 'в сети'}`}
                className="shrink-0"
              >
                <Avatar
                  size={40}
                  friendId={f.id}
                  ringColor={f.status === 'in-game' ? 'gold' : 'emerald'}
                  inGame={f.status === 'in-game'}
                  online={f.status === 'online'}
                />
              </div>
            ))}
            {hidden > 0 && (
              <div className="shrink-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-mono font-bold text-slate-400">
                +{hidden}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Статистика */}
      <section>
        <SectionTitle>Статистика</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map((s) => (
            <StatTile key={s.key} stat={s} />
          ))}
        </div>
      </section>

      {/* Достижения — превью */}
      <section>
        <SectionTitle
          right={
            <span className="text-[10px] font-mono text-slate-600">
              0 / {ACHIEVEMENTS.length}
            </span>
          }
        >
          Недавние достижения
        </SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ACHIEVEMENTS.slice(0, 3).map((a) => (
            <AchievementCard key={a.id} achievement={a} unlocked={false} compact />
          ))}
        </div>
      </section>
    </div>
  );
}

function StatsTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STATS.map((s) => (
          <div key={s.key} className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ring-1 ring-inset ring-current/25 ${TONE_BG[s.tone]}`}>
                <s.icon size={20} strokeWidth={2.2} />
              </div>
              <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-500">
                {s.label}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-white">{s.value}</span>
              {s.unit && <span className="text-sm text-slate-500 font-mono">{s.unit}</span>}
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-[11px] uppercase tracking-[0.14em] text-slate-600 pt-2">
        Скоро: графики активности и тренды
      </p>
    </div>
  );
}

function AchievementsTab() {
  return (
    <div className="space-y-4">
      <SectionTitle
        right={
          <span className="text-[10px] font-mono text-slate-600">
            0 / {ACHIEVEMENTS.length}
          </span>
        }
      >
        Все достижения
      </SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {ACHIEVEMENTS.map((a) => (
          <AchievementCard key={a.id} achievement={a} unlocked={false} />
        ))}
      </div>
    </div>
  );
}

function StatTile({ stat }: { stat: StatDef }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 ring-1 ring-inset ring-current/25 ${TONE_BG[stat.tone]}`}
      >
        <stat.icon size={20} strokeWidth={2.2} />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-xl font-bold text-white leading-none">{stat.value}</span>
        {stat.unit && <span className="text-[11px] text-slate-500 font-mono">{stat.unit}</span>}
      </div>
      <div className="text-[10px] uppercase tracking-[0.12em] font-semibold text-slate-500 mt-2">
        {stat.short}
      </div>
    </div>
  );
}

function AchievementCard({
  achievement,
  unlocked,
  compact = false,
}: {
  achievement: Achievement;
  unlocked: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`glass rounded-2xl ${compact ? 'p-3.5' : 'p-4'} ${
        unlocked ? '' : 'opacity-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 rounded-xl flex items-center justify-center ${
            compact ? 'w-10 h-10' : 'w-12 h-12'
          } ${
            unlocked
              ? 'bg-gold/15 text-gold ring-1 ring-gold/40'
              : 'bg-white/5 text-slate-600'
          }`}
        >
          <achievement.icon size={compact ? 18 : 22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <div className="text-xs font-bold text-slate-300 truncate">
              {achievement.title}
            </div>
            {!unlocked && <Lock size={10} className="text-slate-700 shrink-0" />}
          </div>
          <div className="text-[10px] text-slate-600 leading-snug mt-1">
            {achievement.description}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Правая колонка
   ============================================================ */

function ActionCard({
  isSelf,
  onSettings,
  onLogout,
  onChat,
  onInvite,
  onRemove,
}: {
  isSelf: boolean;
  onSettings: () => void;
  onLogout: () => void;
  onChat: () => void;
  onInvite: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="glass rounded-2xl p-4 space-y-2">
      <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-slate-600 px-1 mb-1">
        Действия
      </div>
      {isSelf ? (
        <>
          <SideButton icon={Settings} label="Настройки" onClick={onSettings} />
          <SideButton icon={LogOut} label="Выйти" onClick={onLogout} tone="blood" />
        </>
      ) : (
        <>
          <SideButton icon={Gamepad2} label="Пригласить в игру" onClick={onInvite} tone="gold" />
          <SideButton icon={MessageCircle} label="Написать" onClick={onChat} />
          <SideButton icon={UserMinus} label="Удалить из друзей" onClick={onRemove} tone="blood" />
        </>
      )}
    </div>
  );
}

function SideButton({
  icon: Icon,
  label,
  onClick,
  tone = 'default',
}: {
  icon: typeof Settings;
  label: string;
  onClick: () => void;
  tone?: 'default' | 'gold' | 'blood';
}) {
  const styles =
    tone === 'gold'
      ? 'bg-gold text-abyss hover:shadow-glow-gold font-bold'
      : tone === 'blood'
        ? 'text-blood hover:bg-blood/10'
        : 'text-slate-200 hover:bg-white/[0.05]';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full inline-flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[12px] font-semibold transition-all text-left ${styles}`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function RecentCard({
  isSelf,
  lastSeen,
  status,
}: {
  isSelf: boolean;
  lastSeen?: number;
  status: string;
}) {
  const label = isSelf
    ? status === 'in-game'
      ? 'В игре'
      : 'В лаунчере'
    : status === 'in-game'
      ? 'В игре'
      : status === 'online'
        ? 'В сети'
        : formatLastSeen(lastSeen);

  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-slate-600 mb-3">
        Активность
      </div>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
          <Activity size={16} />
        </div>
        <div className="min-w-0">
          <div className="text-[12px] font-semibold text-slate-200 truncate">{label}</div>
          <div className="text-[10px] text-slate-600 mt-0.5">Valheim Rouge</div>
        </div>
      </div>
    </div>
  );
}

function MemberCard({ isSelf }: { isSelf: boolean }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-slate-600 mb-3">
        Профиль
      </div>
      <dl className="space-y-2 text-[11px]">
        <div className="flex items-center justify-between">
          <dt className="text-slate-500">Статус</dt>
          <dd className="text-slate-300 font-mono">{isSelf ? 'Свой' : 'Друг'}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-slate-500">Уровень</dt>
          <dd className="text-slate-300 font-mono">0</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-slate-500">Ачивок</dt>
          <dd className="text-slate-300 font-mono">0 / {ACHIEVEMENTS.length}</dd>
        </div>
      </dl>
    </div>

  );
}
