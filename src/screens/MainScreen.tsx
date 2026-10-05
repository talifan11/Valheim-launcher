// Главный экран лаунчера: двухколоночный layout в стиле Battle.net.
// Слева — лента новостей, справа — панель сервера/персонажа и кнопка ИГРАТЬ.
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { NewsFeed } from '../components/NewsFeed';
import { ServerPanel } from '../components/ServerPanel';
import { VRButton } from '../components/ui';
import { useLauncherStore } from '../store/useLauncherStore';

export function MainScreen() {
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
      {/* Тонкая полоса с выходом: основной выход из аккаунта — здесь,
          настройки переехали в правую колонку под кнопку ИГРАТЬ */}
      <div className="flex items-center justify-end px-8 pt-4">
        <VRButton variant="ghost" onClick={logout} title="Выйти">
          <LogOut size={15} />
          <span className="ml-2 text-xs">Выйти</span>
        </VRButton>
      </div>

      {/* Две колонки: новости 65% / панель управления 35%, зазор 24px, поля 32px */}
      <div className="vr-main-grid">
        <NewsFeed />
        <ServerPanel />
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
