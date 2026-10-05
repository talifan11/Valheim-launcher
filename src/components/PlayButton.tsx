// Прямоугольная кнопка запуска игры во всю ширину правой колонки.
import { AnimatePresence, motion } from 'framer-motion';
import { Play } from 'lucide-react';

interface PlayButtonProps {
  disabled?: boolean;
  /** Сервер недоступен: кнопка приглушена и заблокирована */
  serverOffline?: boolean;
  isLaunching: boolean;
  onPlay: () => void;
}

export function PlayButton({ disabled, serverOffline, isLaunching, onPlay }: PlayButtonProps) {
  // Приоритет подписи: запуск > недоступный сервер > игра
  const label = isLaunching ? 'ЗАПУСК…' : serverOffline ? 'СЕРВЕР НЕДОСТУПЕН' : 'ИГРАТЬ';
  const blocked = Boolean(disabled) || serverOffline || isLaunching;

  return (
    <motion.button
      type="button"
      onClick={onPlay}
      disabled={blocked}
      whileHover={blocked ? undefined : { y: -1 }}
      whileTap={{ y: 0 }}
      className={`vr-play-btn ${serverOffline ? 'vr-play-btn-offline' : ''}`}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="flex items-center gap-2.5"
        >
          <Play size={16} strokeWidth={2.5} fill="currentColor" />
          {label}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
