// Прямоугольная кнопка запуска игры во всю ширину правой колонки.
import { AnimatePresence, motion } from 'framer-motion';
import { Play } from 'lucide-react';

interface PlayButtonProps {
  disabled?: boolean;
  /** Сервер недоступен: кнопка тускнеет и меняет подпись */
  serverOffline?: boolean;
  isLaunching: boolean;
  onPlay: () => void;
}

export function PlayButton({ disabled, serverOffline, isLaunching, onPlay }: PlayButtonProps) {
  // Приоритет подписи: запуск > недоступный сервер > игра
  const label = isLaunching ? 'ЗАПУСК…' : serverOffline ? 'СЕРВЕР НЕДОСТУПЕН' : 'ИГРАТЬ';

  return (
    <motion.button
      type="button"
      onClick={onPlay}
      disabled={disabled || isLaunching}
      whileHover={serverOffline ? undefined : { y: -2 }}
      whileTap={{ y: 0 }}
      className={`vr-play-btn ${serverOffline ? 'vr-play-btn-dim' : ''}`}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="flex items-center gap-3"
        >
          <Play size={20} strokeWidth={2.5} fill="currentColor" />
          {label}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
