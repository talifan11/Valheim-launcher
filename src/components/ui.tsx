// UI-кит: переиспользуемые примитивы в стиле Battle.net.
// В исходном репозитории это были компоненты ui/button, ui/card,
// ui/dialog — здесь их упрощённые, но типизированные аналоги.
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

/* ---------- Кнопка (аналог components/ui/button) ---------- */

type ButtonVariant = 'primary' | 'ghost' | 'play';

interface VRButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

/** Стилизация под варианты из CSS-кита (.vr-btn-*) + лёгкий ghost-вариант */
export const VRButton = forwardRef<HTMLButtonElement, VRButtonProps>(
  ({ variant = 'primary', className = '', children, ...rest }, ref) => {
    const style =
      variant === 'primary'
        ? 'vr-btn-primary'
        : variant === 'play'
          ? 'vr-btn-play'
          : // ghost — прозрачная кнопка с тонкой обводкой (иконки, второстепенные действия)
            'px-3 py-2 rounded-lg border border-edge text-slate-300 hover:text-white hover:border-blizzard/60 hover:bg-white/5 transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
    return (
      <button ref={ref} className={`${style} ${className}`} {...rest}>
        {children}
      </button>
    );
  }
);
VRButton.displayName = 'VRButton';

/* ---------- Glassmorphism-карточка (аналог components/ui/card) ---------- */

interface VRCardProps {
  children: ReactNode;
  className?: string;
}

export function VRCard({ children, className = '' }: VRCardProps) {
  return <div className={`vr-glass ${className}`}>{children}</div>;
}

/* ---------- Модальное окно (аналог components/ui/dialog) ---------- */

interface VRModalProps {
  /** Показывать ли модалку (управляет AnimatePresence) */
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export function VRModal({ open, title, children, onClose }: VRModalProps) {
  return (
    <AnimatePresence>
      {open && (
        // Затемнение всего окна + размытие — классический Blizzard-оверлей
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="vr-glass w-full max-w-md p-6"
            initial={{ scale: 0.92, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()} // клик внутри карточки не закрывает окно
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-gold tracking-wide">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Закрыть"
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
