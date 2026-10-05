// Компонент раздачи toast-уведомлений. Читает список из useToastStore,
// сам ничего не решает — только рисует и даёт закрыть по клику.
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useToastStore, type ToastKind } from '../store/useToastStore';

const ICONS: Record<ToastKind, typeof Info> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const COLORS: Record<ToastKind, string> = {
  success: 'text-emerald',
  error: 'text-blood',
  info: 'text-blizzard',
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-14 right-4 z-[60] flex w-80 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((item) => {
          const Icon = ICONS[item.kind];
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="vr-glass pointer-events-auto flex items-start gap-3 rounded-lg p-3"
            >
              <Icon size={16} className={`mt-0.5 shrink-0 ${COLORS[item.kind]}`} />
              <p className="min-w-0 flex-1 text-sm leading-snug text-slate-200">{item.message}</p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Закрыть уведомление"
                className="shrink-0 text-slate-500 transition-colors hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
