// Главный экран лаунчера: сайдбар слева, навигация табов и контент справа,
// нижняя панель управления. Статус пинга сервера поднимается в App через проп.
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { TopNav, type MainTab } from '../components/TopNav';
import { HeroCard } from '../components/HeroCard';
import { EventsFeed } from '../components/EventsFeed';
import { BottomBar } from '../components/BottomBar';
import { ServerPanel } from '../components/ServerPanel';
import type { ConnectionState } from '../components/TitleBar';
import { news } from '../data/news';
import { useUpdateStore } from '../store/useUpdateStore';

interface MainScreenProps {
  /** Статус пинга сервера: поднимается из App (источник — ServerPanel) */
  connection: ConnectionState;
  /** Колбэк статуса от ServerPanel, прокидывается дальше без изменений */
  onConnectionChange: (status: ConnectionState) => void;
}

export function MainScreen({ connection, onConnectionChange }: MainScreenProps) {
  const [tab, setTab] = useState<MainTab>('news');
  const manifest = useUpdateStore((s) => s.manifest);

  // При смене таба скролл контента возвращается вверх
  useEffect(() => {
    document.getElementById('main-content')?.scrollTo({ top: 0 });
  }, [tab]);

  const heroes = news.slice(0, 2);
  const rest = news.slice(2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="grid h-full min-h-0 grid-cols-[200px_1fr] grid-rows-[1fr_auto]"
    >
      {/* Сайдбар тянется на обе строки сетки */}
      <div className="row-start-1 row-span-2 min-h-0">
        <Sidebar connection={connection} />
      </div>

      <div className="flex min-h-0 min-w-0 flex-col">
        <TopNav active={tab} onChange={setTab} />

        <div id="main-content" className="vr-scroll min-h-0 flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {tab === 'news' && (
                <div className="flex flex-col gap-4">
                  {heroes.map((item) => (
                    <HeroCard key={item.id} item={item} />
                  ))}
                  <EventsFeed items={rest} />
                </div>
              )}

              {tab === 'events' && <EventsFeed items={news} />}

              {tab === 'mods' && (
                <div className="flex flex-col gap-3">
                  {(manifest?.files ?? []).map((file) => (
                    <div key={file.path} className="vr-glass flex items-center gap-3 p-4">
                      <Package size={18} className="shrink-0 text-blizzard" />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-slate-200">{file.path}</p>
                        <p className="font-mono text-[11px] text-slate-500">
                          {file.size.toLocaleString('ru-RU')} байт · sha256 {file.sha256.slice(0, 12)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {!manifest && (
                    <p className="text-sm text-slate-500">Манифест ещё не загружен. Нажмите «Проверить клиент».</p>
                  )}
                </div>
              )}

              {tab === 'account' && (
                // Старая правая колонка полностью переиспользуется как профиль
                <ServerPanel onConnectionChange={onConnectionChange} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="col-span-2">
        <BottomBar />
      </div>
    </motion.div>
  );
}
