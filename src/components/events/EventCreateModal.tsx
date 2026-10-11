import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Swords, MessageCircle, Trophy, Hammer, Sparkles } from 'lucide-react';
import { useEventsStore } from '../../store/useEventsStore';
import { toast } from '../../store/useToastStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'raid',       label: 'Рейд',          icon: Swords,        cls: 'text-blood' },
  { id: 'meeting',    label: 'Встреча',       icon: MessageCircle, cls: 'text-blizzard' },
  { id: 'tournament', label: 'Турнир',        icon: Trophy,        cls: 'text-gold' },
  { id: 'build',      label: 'Стройка',       icon: Hammer,        cls: 'text-emerald' },
  { id: 'other',      label: 'Другое',        icon: Sparkles,      cls: 'text-slate-400' },
];

function toLocalIso(dateStr: string, timeStr: string): string {
  // dateStr: YYYY-MM-DD, timeStr: HH:MM
  const d = new Date(`${dateStr}T${timeStr}:00`);
  return d.toISOString();
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function nextHourTime(): string {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d.toTimeString().slice(0, 5);
}

export function EventCreateModal({ open, onClose }: Props) {
  const createEvent = useEventsStore((s) => s.createEvent);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayDate());
  const [time, setTime] = useState(nextHourTime());
  const [category, setCategory] = useState('raid');
  const [location, setLocation] = useState('');
  const [maxSlots, setMaxSlots] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle('');
    setDescription('');
    setDate(todayDate());
    setTime(nextHourTime());
    setCategory('raid');
    setLocation('');
    setMaxSlots('');
    setError(null);
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    const t = title.trim();
    const d = description.trim();
    if (t.length < 3) { setError('Заголовок минимум 3 символа'); return; }
    if (d.length < 5) { setError('Описание минимум 5 символов'); return; }

    const startsAt = toLocalIso(date, time);
    if (new Date(startsAt).getTime() < Date.now() - 60_000) {
      setError('Дата должна быть в будущем');
      return;
    }

    const slots = maxSlots.trim() ? parseInt(maxSlots.trim(), 10) : undefined;
    if (maxSlots.trim() && (isNaN(slots!) || slots! < 2)) {
      setError('Лимит мест — минимум 2 (или оставь пустым)');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await createEvent({
        title: t,
        description: d,
        starts_at: startsAt,
        category,
        location: location.trim() || undefined,
        max_slots: slots,
      });
      toast.success('Событие создано!');
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  const modal = (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6" onClick={handleClose}>
      <div className="absolute inset-0 modal-backdrop" />
      <div
        className="relative w-[600px] max-h-[90vh] glass-popover rounded-[24px] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
          <h3 className="font-display text-lg font-bold text-white">Новое событие</h3>
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Категория */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.14em] font-bold text-slate-500 mb-2">
              Тип события
            </label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                const active = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                      active
                        ? `${c.cls} border-current/40 bg-white/[0.04]`
                        : 'border-white/[0.06] text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Заголовок */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.14em] font-bold text-slate-500 mb-2">
              Заголовок
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={busy}
              maxLength={120}
              autoFocus
              placeholder="Например: Рейд на Бонмаса в 20:00"
              className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-gold transition-colors disabled:opacity-50"
            />
          </div>

          {/* Описание */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.14em] font-bold text-slate-500 mb-2">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={busy}
              rows={4}
              maxLength={2000}
              placeholder="Что делать, что взять с собой, требования к уровню..."
              className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-gold transition-colors resize-none disabled:opacity-50"
            />
            <div className="text-[10px] font-mono text-slate-600 mt-1 text-right">
              {description.length} / 2000
            </div>
          </div>

          {/* Дата и время */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.14em] font-bold text-slate-500 mb-2">
                Дата
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={busy}
                min={todayDate()}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold transition-colors disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.14em] font-bold text-slate-500 mb-2">
                Время
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={busy}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Локация и места */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.14em] font-bold text-slate-500 mb-2">
                Локация <span className="text-slate-600 normal-case tracking-normal">(опционально)</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={busy}
                maxLength={80}
                placeholder="Болото, Каменный круг..."
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-gold transition-colors disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.14em] font-bold text-slate-500 mb-2">
                Макс. участников <span className="text-slate-600 normal-case tracking-normal">(опц.)</span>
              </label>
              <input
                type="number"
                value={maxSlots}
                onChange={(e) => setMaxSlots(e.target.value)}
                disabled={busy}
                min={2}
                max={100}
                placeholder="Без лимита"
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-gold transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {error && <p className="text-[12px] text-blood text-center">{error}</p>}
        </div>

        <div className="p-4 border-t border-white/[0.06] flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 transition-colors text-[11px] uppercase tracking-[0.12em] font-semibold disabled:opacity-40"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-abyss font-bold text-[11px] uppercase tracking-[0.12em] hover:shadow-glow-gold transition-all disabled:opacity-40"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : null}
            Создать
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
