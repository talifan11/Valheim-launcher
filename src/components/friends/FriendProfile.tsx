import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, UserMinus, Gamepad2, Clock } from 'lucide-react';
import { useFriendsStore, type Friend } from '../../store/useFriendsStore';
import { useChatStore } from '../../store/useChatStore';
import { toast } from '../../store/useToastStore';
import { Avatar } from '../ui/Avatar';

interface Props {
  friendId: string | null;
  onClose: () => void;
}

export function FriendProfile({ friendId, onClose }: Props) {
  const friend = useFriendsStore((s) =>
    friendId ? s.friends.find((f) => f.id === friendId) : undefined
  );
  const removeFriend = useFriendsStore((s) => s.removeFriend);
  const openDmWith = useChatStore((s) => s.openDmWith);
  if (!friend) return null;

  const handlePlay = () => {
    toast.success(`Приглашение отправлено ${friend.name}`);
    onClose();
  };

  const handleChat = () => {
    openDmWith(friend.id, friend.name);
    onClose();
  };

  const handleRemove = () => {
    removeFriend(friend.id);
    toast.info(`${friend.name} удалён из друзей`);
    onClose();
  };

  return (
    <AnimatePresence>
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
          className="relative w-[380px] glass-popover rounded-[24px] overflow-hidden"
          initial={{ scale: 0.94, y: 12, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.94, y: 12, opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative p-6 pb-4">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-4">
              <Avatar
                size={64}
                friendId={friend.id}
                ringColor={
                  friend.status === 'in-game'
                    ? 'gold'
                    : friend.status === 'online'
                      ? 'emerald'
                      : 'slate'
                }
                inGame={friend.status === 'in-game'}
                online={friend.status === 'online'}
              />
              <div className="min-w-0">
                <h3 className="font-display text-xl font-bold text-white truncate">
                  {friend.name}
                </h3>
                <StatusLine friend={friend} />
              </div>
            </div>
          </div>

          {friend.level != null && (
            <div className="px-6 pb-4">
              <div className="glass rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Уровень
                </span>
                <span className="font-mono text-lg text-gold font-bold">
                  {friend.level}
                </span>
              </div>
            </div>
          )}

          <div className="p-4 pt-0 flex gap-2">
            <button
              type="button"
              onClick={handlePlay}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gold text-abyss font-bold text-xs uppercase tracking-[0.12em] hover:shadow-glow-gold transition-all"
            >
              <Gamepad2 size={15} />
              В игру
            </button>
            <button
              type="button"
              onClick={handleChat}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-white/[0.10] text-slate-200 font-semibold text-xs uppercase tracking-[0.12em] hover:bg-white/5 transition-all"
            >
              <MessageCircle size={15} />
              Написать
            </button>
          </div>

          <div className="px-4 pb-4">
            <button
              type="button"
              onClick={handleRemove}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] text-blood hover:bg-blood/10 transition-all uppercase tracking-[0.12em] font-semibold"
            >
              <UserMinus size={13} />
              Удалить из друзей
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function StatusLine({ friend }: { friend: Friend }) {
  if (friend.status === 'in-game') {
    return (
      <p className="text-xs text-gold mt-0.5 flex items-center gap-1.5">
        <Gamepad2 size={12} />
        Играет в {friend.activity ?? 'Valheim'}
      </p>
    );
  }
  if (friend.status === 'online') {
    return (
      <p className="text-xs text-emerald mt-0.5 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald" />
        В сети
      </p>
    );
  }
  return (
    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
      <Clock size={12} />
      {formatLastSeen(friend.lastSeenMinutes)}
    </p>
  );
}

function formatLastSeen(minutes?: number): string {
  if (minutes == null) return 'Не в сети';
  if (minutes < 60) return `Был(а) ${minutes} мин назад`;
  const h = Math.floor(minutes / 60);
  if (h < 24) return `Был(а) ${h} ч назад`;
  const d = Math.floor(h / 24);
  return `Был(а) ${d} д назад`;
}
