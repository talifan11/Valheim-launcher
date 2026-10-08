import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Clock, Shield } from 'lucide-react';
import { useServerPlayersStore } from '../../store/useServerPlayersStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ServerPlayersModal({ open, onClose }: Props) {
  const players = useServerPlayersStore((s) => s.players);
  const maxSlots = useServerPlayersStore((s) => s.maxSlots);

  return (
    <AnimatePresence>
      {open && (
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
            className="relative w-[460px] max-w-full max-h-[80vh] glass-popover rounded-[24px] overflow-hidden flex flex-col"
            initial={{ scale: 0.95, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 16, opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Хедер */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-blizzard/15 border border-blizzard/30 flex items-center justify-center text-blizzard">
                  <Users size={20} />
                </span>
                <div>
                  <h3 className="font-display text-lg text-white tracking-wide">
                    Игроки на сервере
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {players.length} из {maxSlots} слотов занято
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Список */}
            <div className="flex-1 overflow-y-auto vr-scroll p-3">
              {players.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  Пока никого
                </div>
              ) : (
                <ul className="space-y-1">
                  {players.map((player) => (
                    <li
                      key={player.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-full border-2 border-emerald flex items-center justify-center bg-abyss shrink-0">
                        <span className="text-sm font-bold text-slate-200">
                          {player.name[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white truncate">
                            {player.name}
                          </span>
                          {player.clan && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/15 text-gold border border-gold/25 font-semibold tracking-wide">
                              {player.clan}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Shield size={11} />
                            Ур. {player.level}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {formatSession(player.sessionMinutes)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function formatSession(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}
