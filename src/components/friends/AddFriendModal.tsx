import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Search, Check, Clock } from 'lucide-react';
import { useFriendsStore } from '../../store/useFriendsStore';
import { useLauncherStore } from '../../store/useLauncherStore';
import { toast } from '../../store/useToastStore';
import * as api from '../../lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddFriendModal({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<api.UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const friends = useFriendsStore((s) => s.friends);
  const outgoing = useFriendsStore((s) => s.outgoing);
  const sendRequest = useFriendsStore((s) => s.sendRequest);
  const token = useLauncherStore((s) => s.authToken);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  // Поиск с debounce
  useEffect(() => {
    if (!open || !token) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api.searchUsers(q, token);
        setResults(data);
      } catch (err) {
        console.error('Ошибка поиска:', err);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, open, token]);

  const handleAdd = async (user: api.UserSearchResult) => {
    try {
      await sendRequest(user.user_id);
      toast.success(`Заявка отправлена игроку ${user.username}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    }
  };

  const statusOf = (userId: number): 'friend' | 'outgoing' | 'none' => {
    if (friends.some((f) => f.userId === userId)) return 'friend';
    if (outgoing.some((f) => f.userId === userId)) return 'outgoing';
    return 'none';
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
            className="relative w-[480px] max-w-full glass-popover rounded-[24px] overflow-hidden"
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
                    Введите ник игрока — минимум 2 символа
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
                  placeholder="Ник игрока..."
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-abyss/60 border border-white/[0.08] text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-gold/50 transition-colors"
                />
                {searching && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
                    поиск...
                  </span>
                )}
              </div>
            </div>

            <div className="max-h-[320px] overflow-y-auto vr-scroll p-3">
              {query.trim().length < 2 && (
                <div className="text-center text-slate-500 text-xs py-8">
                  Введите минимум 2 символа для поиска
                </div>
              )}

              {query.trim().length >= 2 && !searching && results.length === 0 && (
                <div className="text-center text-slate-500 text-xs py-8">
                  Никого не найдено
                </div>
              )}

              <ul className="space-y-1">
                {results.map((user) => {
                  const status = statusOf(user.user_id);
                  return (
                    <li key={user.user_id}>
                      <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-colors">
                        <div className="w-9 h-9 rounded-full border-2 border-white/15 flex items-center justify-center bg-abyss shrink-0">
                          <span className="text-sm font-bold text-slate-200">
                            {user.username[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-white font-semibold truncate">
                            {user.username}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            ID: {user.user_id}
                          </div>
                        </div>
                        {status === 'friend' && (
                          <span className="px-3 py-1.5 rounded-lg bg-emerald/15 text-emerald text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                            <Check size={11} />
                            Друг
                          </span>
                        )}
                        {status === 'outgoing' && (
                          <span className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                            <Clock size={11} />
                            Отправлено
                          </span>
                        )}
                        {status === 'none' && (
                          <button
                            type="button"
                            onClick={() => void handleAdd(user)}
                            className="px-3 py-1.5 rounded-lg bg-gold text-abyss text-[11px] font-bold uppercase tracking-wider hover:shadow-glow-gold transition-all"
                          >
                            Добавить
                          </button>
                        )}
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
