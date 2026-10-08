import { useCallback, useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FloatingTopBar, type ConnectionState } from '../components/layout/FloatingTopBar';
import { IconRail, type TabId } from '../components/layout/IconRail';
import { PlayersRail } from '../components/layout/PlayersRail';
import { CornerWidgets } from '../components/layout/CornerWidgets';
import { FloatingStatusBar } from '../components/layout/FloatingStatusBar';
import { HeroSection } from '../components/hero/HeroSection';
import { NewsGrid } from '../components/news/NewsGrid';
import { useLauncherStore } from '../store/useLauncherStore';

interface Props {
  connection: ConnectionState;
  onConnectionChange: (status: ConnectionState) => void;
}

const REFRESH_MS = 15000;

export function HomeScreen({ connection, onConnectionChange }: Props) {
  const config = useLauncherStore((s) => s.config);
  const [activeTab, setActiveTab] = useState<TabId>('news');
  const timerRef = useRef<number | null>(null);

  const check = useCallback(async () => {
    try {
      const result = await invoke<string>('ping_server', { address: config.server_address });
      if (result === 'online' || result === 'active' || result === 'offline') {
        onConnectionChange(result);
      } else {
        onConnectionChange('offline');
      }
    } catch {
      onConnectionChange('offline');
    }
  }, [config.server_address, onConnectionChange]);

  useEffect(() => {
    void check();
    timerRef.current = window.setInterval(() => void check(), REFRESH_MS);
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [check]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: 'url(/assets/svg/pattern-noise.svg)',
          backgroundSize: '200px 200px',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'url(/assets/svg/pattern-grid.svg)',
          backgroundSize: '40px 40px',
        }}
      />

      <FloatingTopBar connection={connection} />
      <IconRail activeTab={activeTab} onChange={setActiveTab} />
      <PlayersRail />
      <CornerWidgets />

      <div className="relative z-10 h-full overflow-y-auto vr-scroll">
        <div className="float-center pt-28 pb-32 flex flex-col gap-6">
          {activeTab === 'news' && (
            <>
              <HeroSection />
              <NewsGrid />
            </>
          )}
          {activeTab === 'events' && (
            <div className="glass rounded-2xl p-10 text-center text-slate-400">
              Раздел событий в разработке
            </div>
          )}
          {activeTab === 'mods' && (
            <div className="glass rounded-2xl p-10 text-center text-slate-400">
              Список модов появится позже
            </div>
          )}
          {activeTab === 'account' && (
            <div className="glass rounded-2xl p-10 text-center text-slate-400">
              Профиль в разработке
            </div>
          )}
        </div>
      </div>

      <FloatingStatusBar />
    </div>
  );
}
