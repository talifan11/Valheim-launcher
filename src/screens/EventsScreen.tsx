import {
  Swords,
  Trophy,
  Users,
  Map,
  Clock,
  Check,
  UserPlus,
  Flame,
} from 'lucide-react';
import { useEventsStore, type ServerEvent, type EventKind } from '../store/useEventsStore';
import { toast } from '../store/useToastStore';

const KIND_ICON: Record<EventKind, typeof Swords> = {
  raid: Swords,
  tournament: Trophy,
  meetup: Users,
  quest: Map,
};

const KIND_COLOR: Record<EventKind, string> = {
  raid: 'text-blood border-blood/30 bg-blood/10',
  tournament: 'text-gold border-gold/30 bg-gold/10',
  meetup: 'text-blizzard border-blizzard/30 bg-blizzard/10',
  quest: 'text-emerald border-emerald/30 bg-emerald/10',
};

const KIND_LABEL: Record<EventKind, string> = {
  raid: 'Рейд',
  tournament: 'Турнир',
  meetup: 'Сбор',
  quest: 'Квест',
};

export function EventsScreen() {
  const events = useEventsStore((s) => s.events);
  const join = useEventsStore((s) => s.join);
  const leave = useEventsStore((s) => s.leave);
  const now = Date.now();
  const upcoming = events
    .filter((e) => e.startsAt + e.durationMinutes * 60_000 > now)
    .sort((a, b) => a.startsAt - b.startsAt);
  const past = events
    .filter((e) => e.startsAt + e.durationMinutes * 60_000 <= now)
    .sort((a, b) => b.startsAt - a.startsAt);

  const handleJoin = (e: ServerEvent) => {
    if (e.joined) {
      leave(e.id);
      toast.info(`Вы вышли из «${e.title}»`);
    } else {
      join(e.id);
      toast.success(`Вы записаны на «${e.title}»`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <h1 className="font-display text-2xl tracking-wide text-white">События сервера</h1>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
          {upcoming.length} активных · {past.length} прошло
        </span>
      </div>

      {/* Активные события */}
      <div className="space-y-3">
        {upcoming.map((event) => (
          <EventCard key={event.id} event={event} onToggle={() => handleJoin(event)} />
        ))}
      </div>

      {/* История */}
      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-base tracking-wide text-slate-500 uppercase mt-6 px-1">
            Прошедшие
          </h2>
          {past.map((event) => (
            <EventCard key={event.id} event={event} onToggle={() => handleJoin(event)} isPast />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({
  event,
  onToggle,
  isPast = false,
}: {
  event: ServerEvent;
  onToggle: () => void;
  isPast?: boolean;
}) {
  const Icon = KIND_ICON[event.kind];
  const kindClass = KIND_COLOR[event.kind];

  const now = Date.now();
  const isLive =
    now >= event.startsAt && now < event.startsAt + event.durationMinutes * 60_000;

  const startDate = new Date(event.startsAt);
  const dateText = formatEventDate(startDate, now);
  const endTime = new Date(event.startsAt + event.durationMinutes * 60_000);

  const full = event.maxParticipants > 0 && event.participants >= event.maxParticipants;

  return (
    <div
      className={`glass rounded-[20px] p-5 flex gap-5 items-start transition-all hover:border-white/15 ${
        isPast ? 'opacity-70' : ''
      }`}
    >
      {/* Иконка типа */}
      <div
        className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${kindClass}`}
      >
        <Icon size={24} />
      </div>

      {/* Контент */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <span
            className={`text-[10px] font-bold uppercase tracking-[0.15em] border rounded px-2 py-0.5 ${kindClass}`}
          >
            {KIND_LABEL[event.kind]}
          </span>
          {isLive && (
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-blood border border-blood/40 bg-blood/15 rounded px-2 py-0.5 inline-flex items-center gap-1">
              <Flame size={10} />
              Идёт сейчас
            </span>
          )}
          {isPast && (
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 border border-white/10 rounded px-2 py-0.5">
              Прошло
            </span>
          )}
        </div>

        <h3 className="font-display text-lg font-semibold text-white leading-snug">
          {event.title}
        </h3>
        <p className="text-sm text-slate-400 mt-1 leading-relaxed">
          {event.description}
        </p>

        <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-500 flex-wrap">
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            {dateText}
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={12} />
            {event.participants}
            {event.maxParticipants > 0 ? ` / ${event.maxParticipants}` : ''}
          </span>
          <span className="flex items-center gap-1.5">
            Длительность: {formatDuration(event.durationMinutes)}
          </span>
        </div>

        {event.reward && (
          <div className="mt-3 text-[11px] text-gold bg-gold/5 border border-gold/20 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5">
            <Trophy size={11} />
            {event.reward}
          </div>
        )}

        <div className="text-[10px] text-slate-600 mt-2 font-mono">
          Окончание: {endTime.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>

      {/* Кнопка */}
      {!isPast && (
        <button
          type="button"
          onClick={onToggle}
          disabled={full && !event.joined}
          className={`shrink-0 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-[0.12em] transition-all inline-flex items-center gap-2 ${
            event.joined
              ? 'bg-emerald/15 border border-emerald/40 text-emerald hover:bg-emerald/25'
              : full
                ? 'bg-white/5 border border-white/10 text-slate-600 cursor-not-allowed'
                : 'bg-gold text-abyss hover:shadow-glow-gold'
          }`}
        >
          {event.joined ? (
            <>
              <Check size={14} />
              Вы записаны
            </>
          ) : full ? (
            'Мест нет'
          ) : (
            <>
              <UserPlus size={14} />
              Участвовать
            </>
          )}
        </button>
      )}
    </div>
  );
}

function formatEventDate(date: Date, now: number): string {
  const diff = date.getTime() - now;
  const hours = Math.floor(diff / 3600_000);
  const days = Math.floor(hours / 24);

  const timeStr = date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (diff < 0) return `Начало: ${timeStr}`;
  if (hours < 1) return `Через ${Math.floor(diff / 60_000)} мин · ${timeStr}`;
  if (hours < 24) return `Через ${hours} ч · ${timeStr}`;
  return `Через ${days} д · ${timeStr}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  if (h < 24) return `${h} ч`;
  const d = Math.floor(h / 24);
  return `${d} д`;
}
