import { useEffect, useMemo, useState } from 'react';
import {
  Calendar, Loader2, Plus, RefreshCw, Search, X, AlertCircle,
  Swords, MessageCircle, Trophy, Hammer, Sparkles, Clock, MapPin, Users,
  Check, LogOut, Trash2,
} from 'lucide-react';
import { useEventsStore } from '../store/useEventsStore';
import { useLauncherStore } from '../store/useLauncherStore';
import { Avatar } from '../components/ui/Avatar';
import { EventCreateModal } from '../components/events/EventCreateModal';
import { toast } from '../store/useToastStore';

const CATEGORY_META: Record<string, { label: string; icon: typeof Swords; cls: string }> = {
  raid:       { label: 'Рейд',            icon: Swords,        cls: 'text-blood bg-blood/10 border-blood/25' },
  meeting:    { label: 'Встреча',         icon: MessageCircle, cls: 'text-blizzard bg-blizzard/10 border-blizzard/25' },
  tournament: { label: 'Турнир',          icon: Trophy,        cls: 'text-gold bg-gold/10 border-gold/25' },
  build:      { label: 'Строительство',   icon: Hammer,        cls: 'text-emerald bg-emerald/10 border-emerald/25' },
  other:      { label: 'Другое',          icon: Sparkles,      cls: 'text-slate-400 bg-white/5 border-white/10' },
};

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function isPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

export function EventsScreen() {
  const events = useEventsStore((s) => s.events);
  const loading = useEventsStore((s) => s.loading);
  const error = useEventsStore((s) => s.error);
  const busyId = useEventsStore((s) => s.busyId);
  const loadEvents = useEventsStore((s) => s.loadEvents);
  const joinEvent = useEventsStore((s) => s.joinEvent);
  const leaveEvent = useEventsStore((s) => s.leaveEvent);
  const deleteEvent = useEventsStore((s) => s.deleteEvent);
  const myUserId = useLauncherStore((s) => s.userId);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'active' | 'past' | 'all'>('active');
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => { void loadEvents(); }, [loadEvents]);

  const filtered = useMemo(() => {
    let list = events.slice();
    if (filter === 'active') list = list.filter((e) => !isPast(e.starts_at));
    if (filter === 'past') list = list.filter((e) => isPast(e.starts_at));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q),
      );
    }
    return list;
  }, [events, filter, query]);

  const counts = useMemo(() => ({
    active: events.filter((e) => !isPast(e.starts_at)).length,
    past: events.filter((e) => isPast(e.starts_at)).length,
    all: events.length,
  }), [events]);

  const handleJoin = async (id: number) => {
    await joinEvent(id);
    toast.success('Вы записаны на событие');
  };

  const handleLeave = async (id: number) => {
    await leaveEvent(id);
    toast.info('Вы отменили участие');
  };

  const handleDelete = async (ev: { id: number; title: string }) => {
    if (!confirm(`Удалить событие?\n\n${ev.title}`)) return;
    await deleteEvent(ev.id);
    toast.info('Событие удалено');
  };

  const FILTERS: { id: typeof filter; label: string }[] = [
    { id: 'active', label: 'Активные' },
    { id: 'past', label: 'Прошедшие' },
    { id: 'all', label: 'Все' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 pt-6 pb-4 shrink-0 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-3">
            <Calendar size={22} className="text-gold" />
            События
          </h1>
          <p className="text-[12px] text-slate-500 mt-1">
            Рейды, встречи, турниры — создавай и участвуй
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadEvents(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-[11px] uppercase tracking-[0.12em] font-bold disabled:opacity-40"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold text-abyss font-bold text-[11px] uppercase tracking-[0.14em] hover:shadow-glow-gold transition-all"
          >
            <Plus size={14} />
            Создать событие
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-8 mb-4 shrink-0 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-0.5 border-b border-white/[0.06]">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`relative px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors ${
                filter === f.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-[10px] font-mono text-slate-600">{counts[f.id]}</span>
              {filter === f.id && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-gold rounded-t" />
              )}
            </button>
          ))}
        </div>

        <div className="ml-auto relative w-72">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск событий..."
            className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl pl-8 pr-8 py-2 text-[12px] text-slate-200 placeholder-slate-600 outline-none focus:border-gold/40 transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-8 mb-4 flex items-start gap-2 rounded-xl border border-blood/30 bg-blood/5 p-3 text-blood text-[12px] shrink-0">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-8 pb-8">
        {loading && events.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl py-16 text-center max-w-4xl">
            <Calendar size={28} className="mx-auto text-slate-700 mb-3" />
            <p className="text-[13px] text-slate-400 font-semibold">
              {query ? 'Ничего не найдено' : 'Событий пока нет'}
            </p>
            <p className="text-[11px] text-slate-600 mt-1">
              {query ? 'Попробуй другой запрос' : 'Стань первым — создай своё событие'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl">
            {filtered.map((ev) => {
              const meta = CATEGORY_META[ev.category] ?? CATEGORY_META.other;
              const Icon = meta.icon;
              const past = isPast(ev.starts_at);
              const isFull = ev.max_slots !== null && ev.participants_count >= ev.max_slots;
              const isAuthor = ev.author_id === myUserId;

              return (
                <div
                  key={ev.id}
                  className={`glass rounded-2xl p-5 transition-all ${
                    past ? 'opacity-60' : 'hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`shrink-0 w-12 h-12 rounded-xl ring-1 ring-inset flex items-center justify-center ${meta.cls}`}>
                      <Icon size={20} strokeWidth={2.2} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${meta.cls}`}>
                          {meta.label}
                        </span>
                        {past && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                            Прошло
                          </span>
                        )}
                        {isFull && !past && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blood bg-blood/10 border border-blood/25 px-2 py-0.5 rounded">
                            Мест нет
                          </span>
                        )}
                      </div>

                      <h3 className="font-display text-[17px] font-bold text-white leading-snug">
                        {ev.title}
                      </h3>
                      <p className="text-[13px] text-slate-300 leading-relaxed mt-2 whitespace-pre-wrap break-words">
                        {ev.description}
                      </p>

                      <div className="flex items-center gap-4 mt-3 flex-wrap text-[11px] text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Clock size={11} />
                          {fmtDate(ev.starts_at)}
                        </span>
                        {ev.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={11} />
                            {ev.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Users size={11} />
                          {ev.participants_count}
                          {ev.max_slots ? ` / ${ev.max_slots}` : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/[0.04]">
                        <Avatar
                          size={22}
                          avatarUrl={ev.author.avatar_url}
                          friendId={`u-${ev.author.user_id}`}
                        />
                        <span className="text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-400">{ev.author.username}</span>
                        </span>

                        {ev.participants.length > 1 && (
                          <div className="flex items-center -space-x-1.5 ml-2">
                            {ev.participants.slice(0, 6).map((p) => (
                              <div key={p.user_id} className="ring-2 ring-[#0a0e14] rounded-full">
                                <Avatar size={22} avatarUrl={p.avatar_url} friendId={`u-${p.user_id}`} />
                              </div>
                            ))}
                            {ev.participants.length > 6 && (
                              <span className="ml-2 text-[10px] text-slate-600 font-mono">
                                +{ev.participants.length - 6}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="ml-auto flex items-center gap-2">
                          {isAuthor && (
                            <button
                              type="button"
                              onClick={() => handleDelete(ev)}
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-blood hover:bg-blood/10 transition-colors"
                              title="Удалить событие"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}

                          {!past && (
                            ev.joined ? (
                              <button
                                type="button"
                                onClick={() => handleLeave(ev.id)}
                                disabled={busyId === ev.id}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald/30 text-emerald hover:bg-emerald/10 transition-colors text-[11px] font-bold uppercase tracking-wider disabled:opacity-40"
                              >
                                {busyId === ev.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                Вы записаны
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleJoin(ev.id)}
                                disabled={busyId === ev.id || isFull}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold text-abyss font-bold text-[11px] uppercase tracking-wider hover:shadow-glow-gold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {busyId === ev.id ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                                {isFull ? 'Мест нет' : 'Присоединиться'}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <EventCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
