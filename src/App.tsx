import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { WindowControls } from './components/layout/WindowControls';
import { LoginScreen } from './components/LoginScreen';
import { InstallScreen } from './screens/InstallScreen';
import { HomeScreen } from './screens/HomeScreen';
import { SettingsModal } from './components/SettingsModal';
import { VRButton, VRModal } from './components/ui';
import { useLauncherStore } from './store/useLauncherStore';
import { sendHeartbeat } from './lib/api';
import { useUpdateStore } from './store/useUpdateStore';
import { useAppSettingsStore } from './store/useAppSettingsStore';
import { useFriendsStore } from './store/useFriendsStore';
import { DEV_SKIP_UPDATE } from './config';
import type { ConnectionState } from './components/layout/FloatingTopBar';

export default function App() {
  const isAuthenticated = useLauncherStore((s) => s.isAuthenticated);
  const errorMessage = useLauncherStore((s) => s.errorMessage);
  const dismissError = useLauncherStore((s) => s.dismissError);
  const loadConfig = useLauncherStore((s) => s.loadConfig);
  const settingsOpen = useLauncherStore((s) => s.settingsOpen);
  const setSettingsOpen = useLauncherStore((s) => s.setSettingsOpen);
  const phase = useUpdateStore((s) => s.phase);
  const runCheck = useUpdateStore((s) => s.runCheck);

  const [connection, setConnection] = useState<ConnectionState>('checking');
  const startFriendsPolling = useFriendsStore((s) => s.startPolling);
  const authToken = useLauncherStore((s) => s.authToken);

  // Heartbeat: раз в 30 секунд сообщаем серверу что мы онлайн
  useEffect(() => {
    if (!isAuthenticated || !authToken) return;
    void sendHeartbeat(authToken);
    const interval = window.setInterval(() => {
      void sendHeartbeat(authToken);
    }, 30000);
    return () => window.clearInterval(interval);
  }, [isAuthenticated, authToken]);

  // Загрузка друзей при входе в аккаунт + поллинг каждые 30 секунд
  useEffect(() => {
    if (!isAuthenticated) return;
    const stop = startFriendsPolling();
    return stop;
  }, [isAuthenticated, startFriendsPolling]);


  // Применяем тему через data-theme на <html>
  const theme = useAppSettingsStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    // В dev-режиме проверку обновлений не запускаем.
    if (DEV_SKIP_UPDATE) return;
    if (isAuthenticated && phase === 'idle') {
      void runCheck();
    }
  }, [isAuthenticated, phase, runCheck]);

  const showInstall = !DEV_SKIP_UPDATE && isAuthenticated && phase !== 'ready';

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-abyss">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/backgrounds/main.jpg)' }}
      />
      <div className="absolute inset-0 bg-[#0a0e14]/85" />

      <div
        className="absolute inset-x-0 top-0 h-11 z-0"
        data-tauri-drag-region
      />

      <div className="relative z-10 h-full">
        {!isAuthenticated && <LoginScreen />}
        {showInstall && <InstallScreen />}
        {isAuthenticated && !showInstall && (
          <HomeScreen connection={connection} onConnectionChange={setConnection} />
        )}
      </div>

      <div
        className="absolute top-0 left-0 right-0 h-8 z-[90]"
        data-tauri-drag-region
      />
      <WindowControls />

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

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
