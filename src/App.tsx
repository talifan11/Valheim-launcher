// ============================================================
// App — корневой компонент: TitleBar + переключение экранов
// (Login/Main) через AnimatePresence + глобальная модалка ошибок.
// ============================================================
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { TitleBar } from './components/TitleBar';
import { LoginScreen } from './components/LoginScreen';
import { MainScreen } from './screens/MainScreen';
import { SettingsModal } from './components/SettingsModal';
import { VRButton, VRModal } from './components/ui';
import { useLauncherStore } from './store/useLauncherStore';

export default function App() {
  const isAuthenticated = useLauncherStore((s) => s.isAuthenticated);
  const errorMessage = useLauncherStore((s) => s.errorMessage);
  const dismissError = useLauncherStore((s) => s.dismissError);
  const loadConfig = useLauncherStore((s) => s.loadConfig);
  const settingsOpen = useLauncherStore((s) => s.settingsOpen);
  const setSettingsOpen = useLauncherStore((s) => s.setSettingsOpen);
  const logout = useLauncherStore((s) => s.logout);

  // При старте читаем config.json из Rust-бэкенда (п. 3.5 ТЗ).
  // Если пользователь уже сохранён — сразу пускаем внутрь без логина?
  // Нет: по ТЗ экран входа показывается всегда, но ник подтягиваем.
  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TitleBar onOpenSettings={() => setSettingsOpen(true)} onLogout={logout} />

      <main className="relative flex-1">
        {/* Переключение экранов с анимацией кросс-фейда */}
        <AnimatePresence mode="wait">
          {isAuthenticated ? (
            <motion.div key="main" className="absolute inset-0">
              <MainScreen />
            </motion.div>
          ) : (
            <motion.div key="login" className="absolute inset-0">
              <LoginScreen />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Модалка настроек (п. 3.5) */}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Глобальная модалка ошибки: при «valheim.exe не найден» предлагаем
          сразу открыть выбор папки (п. 3.4 ТЗ) */}
      <VRModal open={errorMessage !== null} title="ОШИБКА" onClose={dismissError}>
        <div className="space-y-5">
          <div className="flex items-start gap-3 text-sm text-slate-300">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-blood" />
            <p>{errorMessage}</p>
          </div>
          <div className="flex justify-end gap-2">
            <VRButton variant="ghost" onClick={dismissError}>
              Закрыть
            </VRButton>
            <VRButton
              onClick={() => {
                dismissError();
                setSettingsOpen(true); // ведём пользователя к выбору папки
              }}
            >
              Выбрать папку
            </VRButton>
          </div>
        </div>
      </VRModal>
    </div>
  );
}
