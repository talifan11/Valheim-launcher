// ============================================================
// MainScreen — главный экран лаунчера (п. 3.3–3.4 ТЗ):
// header с аватаром, гигантская кнопка «ИГРАТЬ», статус сервера, footer.
// ============================================================
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Play, Settings, UserRound } from 'lucide-react';
import { VRButton } from './ui';
import { ServerStatus } from './ServerStatus';
import { useLauncherStore } from '../store/useLauncherStore';

interface MainScreenProps {
  onOpenSettings: () => void;
}

export function MainScreen({ onOpenSettings }: MainScreenProps) {
  const config = useLauncherStore((s) => s.config);
  const isLaunching = useLauncherStore((s) => s.isLaunching);
  const play = useLauncherStore((s) => s.play);
  const logout = useLauncherStore((s) => s.logout);

  return (
    <motion.div
      // Плавное появление главного экрана после логина
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex h-full flex-col"
    >
      {/* ---------------- Header ---------------- */}
      <div className="flex items-center justify-between px-8 pt-6">
        <h1 className="font-display text-xl font-bold tracking-[0.35em] text-white">
          ЛАУНЧЕР
        </h1>
        <div className="flex items-center gap-3">
          {/* Аватар-заглушка + ник */}
          <div className="flex items-center gap-2 rounded-full border border-edge bg-steel py-1 pl-1 pr-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blizzard to-blizzard-dark">
              <UserRound size={16} className="text-white" />
            </span>
            <span className="max-w-[140px] truncate text-sm text-slate-200">
              {config.username || 'Гость Odin'}
            </span>
          </div>
          <VRButton variant="ghost" onClick={onOpenSettings} title="Настройки">
            <Settings size={16} />
          </VRButton>
          <VRButton variant="ghost" onClick={logout} title="Выйти">
            <LogOut size={16} />
          </VRButton>
        </div>
      </div>

      {/* ---------------- Центр ---------------- */}
      <div className="flex flex-1 flex-col items-center justify-center gap-10 px-8">
        {/* Большая золотая кнопка PLAY — главный акцент интерфейса */}
        <motion.button
          onClick={() => void play()}
          disabled={isLaunching}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          className="vr-btn-play flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-full !tracking-normal"
        >
          <Play size={40} strokeWidth={2.5} className="ml-1" fill="currentColor" />
          <AnimatePresence mode="wait">
            <motion.span
              key={isLaunching ? 'launching' : 'play'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-lg"
            >
              {isLaunching ? 'ЗАПУСК…' : 'ИГРАТЬ'}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        {/* Карточка статуса сервера с адресом и копированием в один клик */}
        <div className="w-full max-w-md">
          <ServerStatus address={config.server_address} />
        </div>
      </div>

      {/* ---------------- Footer ---------------- */}
      <footer className="flex items-center justify-between border-t border-white/5 px-8 py-3 text-xs text-slate-500">
        <span>Valheim Rouge · v1.0.0</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
          Обновлений нет
        </span>
      </footer>
    </motion.div>
  );
}
