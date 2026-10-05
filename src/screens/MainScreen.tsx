// Главный экран лаунчера: двухколоночный layout в стиле Battle.net.
// Слева — лента новостей, справа — панель сервера/персонажа и кнопка ИГРАТЬ.
// Выход из аккаунта перенесён в TitleBar (иконка LogOut).
import { motion } from 'framer-motion';
import { NewsFeed } from '../components/NewsFeed';
import { ServerPanel } from '../components/ServerPanel';

// Четыре состояния, синхронно с TitleBar и ServerPanel.
type ConnectionState = 'checking' | 'online' | 'active' | 'offline';

interface MainScreenProps {
  /** Поднять статус соединения в App, чтобы TitleBar показал индикатор */
  onConnectionChange: (status: ConnectionState) => void;
}

export function MainScreen({ onConnectionChange }: MainScreenProps) {
  return (
    <motion.div
      // Плавное появление главного экрана после логина
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex h-full flex-col"
    >
      {/* Две колонки: новости 65% / панель управления 35%, зазор 24px, поля 32px */}
      <div className="vr-main-grid">
        <NewsFeed />
        <ServerPanel onConnectionChange={onConnectionChange} />
      </div>

      {/* Нижняя строка: версия лаунчера слева, статус обновлений справа */}
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