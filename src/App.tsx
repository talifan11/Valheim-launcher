// App — корневой компонент: TitleBar + переключение экранов
// (Login / Install / Main) через AnimatePresence + глобальная модалка ошибок.
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { TitleBar } from './components/TitleBar';
import { LoginScreen } from './components/LoginScreen';
import { MainScreen } from './screens/MainScreen';
import { InstallScreen } from './screens/InstallScreen';
import { SettingsModal } from './components/SettingsModal';
import { VRButton, VRModal } from './components/ui';
import { useLauncherStore } from './store/useLauncherStore';
import { useUpdateStore } from './store/useUpdateStore';

// Статус соединения с сервером. Прокидывается из ServerPanel в TitleBar,
// чтобы индикатор в шапке окна отражал реальное состояние.
type ConnectionState = 'checking' | 'online' | 'active' | 'offline';

export default function App() {
  const isAuthenticated = useLauncherStore((s) => s.isAuthenticated);
  const errorMessage = useLauncherStore((s) => s.errorMessage);
  const dismissError = useLauncherStore((s) => s.dismissError);
  const loadConfig = useLauncherStore((s) => s.loadConfig);
  const settingsOpen = useLauncherStore((s) => s.settingsOpen);
  const setSettingsOpen = useLauncherStore((s) => s.setSettingsOpen);
  const logout = useLauncherStore((s) => s.logout);

  // Фаза установки: пока не 'ready' — показываем InstallScreen.
  const phase = useUpdateStore((s) => s.phase);
  const runCheck = useUpdateStore((s) => s.runCheck);

  // Статус соединения хранится в App, чтобы TitleBar мог его отображать.
  const [connection, setConnection] = useState<ConnectionState>('checking');

  // При старте читаем config.json из Rust-бэкенда.
  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  // После логина запускаем проверку файлов — какой экран показать.
  useEffect(() => {
    if (isAuthenticated && phase === 'idle') {
      void runCheck();
    }
  }, [isAuthenticated, phase, runCheck]);

  // Какой экран показать: login / install / main.
  const showInstall = isAuthenticated && phase !== 'ready';

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TitleBar
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={logout}
        connection={connection}
      />

      <main className="relative flex-1">
        <AnimatePresence mode="wait">
          {!isAuthenticated && (
            <motion.div
              key="login"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoginScreen />
            </motion.div>
          )}

          {showInstall && (
            <motion.div
              key="install"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <InstallScreen />
            </motion.div>
          )}

          {isAuthenticated && !showInstall && (
            <motion.div
              key="main"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MainScreen onConnectionChange={setConnection} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Глобальная модалка ошибки */}
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
                setSettingsOpen(true);
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