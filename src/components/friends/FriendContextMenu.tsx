import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, MessageCircle, UserMinus } from 'lucide-react';

export interface ContextMenuState {
  friendId: string;
  friendName: string;
  x: number;
  y: number;
}

interface Props {
  state: ContextMenuState | null;
  onClose: () => void;
  onAction: (action: 'play' | 'chat' | 'remove', friendId: string) => void;
}

export function FriendContextMenu({ state, onClose, onAction }: Props) {
  useEffect(() => {
    if (!state) return;
    const close = () => onClose();
    window.addEventListener('click', close);
    window.addEventListener('contextmenu', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('contextmenu', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [state, onClose]);

  return (
    <AnimatePresence>
      {state && (
        <motion.div
          className="fixed z-[300] w-52 glass-popover rounded-2xl overflow-hidden"
          style={{ left: state.x, top: state.y }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-white/[0.06]">
            <span className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-bold">
              {state.friendName}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onAction('play', state.friendId)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/[0.05] transition-colors text-left"
          >
            <Gamepad2 size={15} className="text-gold" />
            Пригласить в игру
          </button>

          <button
            type="button"
            onClick={() => onAction('chat', state.friendId)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/[0.05] transition-colors text-left"
          >
            <MessageCircle size={15} className="text-blizzard" />
            Написать сообщение
          </button>

          <div className="h-px bg-white/[0.06]" />

          <button
            type="button"
            onClick={() => onAction('remove', state.friendId)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-blood hover:bg-blood/10 transition-colors text-left"
          >
            <UserMinus size={15} />
            Удалить из друзей
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
