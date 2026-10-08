import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Info, CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';
import { useNotificationsStore, type NotificationKind } from '../../store/useNotificationsStore';

const ICON: Record<NotificationKind, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const COLOR: Record<NotificationKind, string> = {
  info: 'text-blizzard',
  success: 'text-emerald',
  warning: 'text-gold',
  error: 'text-blood',
};

export function NotificationsMenu() {
  const items = useNotificationsStore((s) => s.items);
  const unread = useNotificationsStore((s) => s.unreadCount());
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const remove = useNotificationsStore((s) => s.remove);
  const clearAll = useNotificationsStore((s) => s.clearAll);

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) {
      // Отметим как прочитанные через секунду после открытия.
      window.setTimeout(() => markAllRead(), 1000);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="relative w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors shrink-0"
        title="Уведомления"
      >
        <Bell size={15} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-blood text-white text-[10px] font-bold flex items-center justify-center shadow-md">
            {unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-full mt-2 w-80 glass-popover rounded-[20px] overflow-hidden z-[260]"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <span className="text-sm font-semibold text-white">Уведомления</span>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[10px] uppercase tracking-wider text-slate-500 hover:text-white transition-colors"
                >
                  Очистить
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto vr-scroll">
              {items.length === 0 && (
                <div className="text-center text-slate-500 text-xs py-10">
                  Уведомлений нет
                </div>
              )}

              {items.map((item) => {
                const Icon = ICON[item.kind];
                return (
                  <div
                    key={item.id}
                    className={`group flex items-start gap-3 px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors relative ${
                      !item.read ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <Icon size={16} className={`${COLOR[item.kind]} mt-0.5 shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] text-slate-200 font-semibold leading-snug">
                        {item.title}
                      </div>
                      {item.message && (
                        <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          {item.message}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-600 mt-1 font-mono">
                        {formatTime(item.timestamp)}
                      </div>
                    </div>
                    {!item.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 shrink-0" />
                    )}
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-white w-5 h-5 rounded flex items-center justify-center shrink-0"
                      title="Удалить"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} д назад`;
}
