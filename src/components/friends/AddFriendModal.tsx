import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Search, Check } from 'lucide-react';
import { useFriendsStore, type Friend } from '../../store/useFriendsStore';
import { toast } from '../../store/useToastStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

// Мок-поиск по имени — имитация серверного API.
const MOCK_AVAILABLE: Friend[] = [
  { id: 'f-search-1', name: 'Рагнар', status: 'online', level: 35 },
  { id: 'f-search-2', name: 'Хельга', status: 'in-game', activity: 'Valheim Rouge', level: 48 },
  { id: 'f-search-3', name: 'Торстейн', status: 'offline', lastSeenMinutes: 120, level: 22 },
  { id: 'f-search-4', name: 'Аслауг', status: 'online', level: 41 },
];

export function AddFriendModal({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [sent, setSent] = useState<string[]>([]);

  const friends = useFriendsStore((s) => s.friends);
  const addFriend = useFriendsStore((s) => s.addFriend);
  useEffect(() => {
    if (open) {
      setQuery('');
      setSent([]);
    }
  }, [open]);

  const filtered = query.trim()
    ? MOCK_AVAILABLE.filter((f) =>
        f.name.toLowerCase().includes(query.trim().toLowerCase())
      )
    : MOCK_AVAILABLE;

  const handleAdd = (candidate: Friend) => {
    if (friends.some((f) => f.name === candidate.name)) {
      toast.info(`${candidate.name} уже в друзьях`);
      return;
    }
    addFriend(candidate);
    setSent((prev) => [...prev, candidate.id]);
    toast.success(`${candidate.name} добавлен в друзья`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      // Отправить «заявку» — пока просто toast.
      toast.success(`Заявка отправлена игроку ${query.trim()}`);
      setQuery('');
    }
  };

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
            className="relative w-[460px] max-w-full glass-popover rounded-[24px] overflow-hidden"
            initial={{ scale: 0.94, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 12, opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
                  <UserPlus size={20} />
                </span>
                <div>
                  <h3 className="font-display text-lg text-white tracking-wide">
                    Добавить друга
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Введите ник или выберите из списка
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

            <div className="p-4 border-b border-white/[0.06]">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ник викинга..."
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-abyss/60 border border-white/[0.08] text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-gold/50 transition-colors"
                />
              </div>
              <div className="text-[10px] text-slate-600 mt-2 font-mono">
                Enter — отправить заявку по нику
              </div>
            </div>

            <div className="max-h-[280px] overflow-y-auto vr-scroll p-3">
              {filtered.length === 0 && (
                <div className="text-center text-slate-500 text-xs py-8">
                  Никого не найдено
                </div>
              )}

              <ul className="space-y-1">
                {filtered.map((candidate) => {
                  const alreadyFriend = friends.some((f) => f.name === candidate.name);
                  const wasSent = sent.includes(candidate.id);

                  return (
                    <li key={candidate.id}>
                      <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-colors">
                        <div
                          className={`w-9 h-9 rounded-full border-2 flex items-center justify-center bg-abyss shrink-0 ${
                            candidate.status === 'in-game'
                              ? 'border-gold'
                              : candidate.status === 'online'
                                ? 'border-emerald'
                                : 'border-white/15'
                          }`}
                        >
                          <span className="text-sm font-bold text-slate-200">
                            {candidate.name[0]}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-white font-semibold truncate">
                            {candidate.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {candidate.status === 'in-game'
                              ? `Играет: ${candidate.activity ?? 'Valheim'}`
                              : candidate.status === 'online'
                                ? 'В сети'
                                : 'Не в сети'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAdd(candidate)}
                          disabled={alreadyFriend || wasSent}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                            alreadyFriend || wasSent
                              ? 'bg-emerald/15 text-emerald cursor-default'
                              : 'bg-gold text-abyss hover:shadow-glow-gold'
                          }`}
                        >
                          {alreadyFriend || wasSent ? (
                            <span className="inline-flex items-center gap-1">
                              <Check size={11} />
                              {alreadyFriend ? 'Друг' : 'Добавлен'}
                            </span>
                          ) : (
                            'Добавить'
                          )}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
