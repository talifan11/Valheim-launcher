import { User } from 'lucide-react';

interface Slot {
  id: number;
  online: boolean;
  name: string;
}

const SLOTS: Slot[] = [
  { id: 0, online: true,  name: 'Эрик' },
  { id: 1, online: true,  name: 'Астрид' },
  { id: 2, online: false, name: '' },
  { id: 3, online: true,  name: 'Бьорн' },
  { id: 4, online: false, name: '' },
  { id: 5, online: true,  name: 'Сигрид' },
  { id: 6, online: false, name: '' },
  { id: 7, online: false, name: '' },
];

const ONLINE_COUNT = SLOTS.filter((s) => s.online).length;
const TOTAL_COUNT = SLOTS.length;

export function PlayersRail() {
  return (
    <div className="rail-right animate-fade-in-up group" style={{ animationDelay: '0.15s' }}>
      {/* Tooltip слева от рейла */}
      <div
        className="pointer-events-none absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap"
      >
        <div className="glass-strong px-3 py-2 rounded-xl text-[11px] font-semibold tracking-wide text-slate-200">
          <span className="text-emerald">●</span>
          <span className="ml-2 uppercase">Игроки онлайн</span>
          <span className="ml-2 font-mono text-gold">{ONLINE_COUNT}/{TOTAL_COUNT}</span>
        </div>
      </div>

      <div className="glass w-12 rounded-[22px] flex flex-col items-center gap-1.5 py-4">
        {SLOTS.map((slot) => (
          <div
            key={slot.id}
            className="relative cursor-pointer transition-transform duration-200 hover:scale-110"
            title={slot.name || 'Свободный слот'}
          >
            <div
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-abyss ${
                slot.online ? 'border-emerald' : 'border-white/15'
              }`}
            >
              {slot.name ? (
                <span className="text-xs font-bold text-slate-200">
                  {slot.name[0]}
                </span>
              ) : (
                <User size={14} className="text-slate-600" />
              )}
            </div>
            {slot.online && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#141923] bg-emerald shadow-[0_0_6px_#2fbf71]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
