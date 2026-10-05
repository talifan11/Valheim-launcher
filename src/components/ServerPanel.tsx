// Правая колонка главного экрана: статус сервера, панель персонажа и кнопка запуска.
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, RefreshCw, Shield, Settings } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { copyToClipboard, isTauri } from '../lib/api';
import { useLauncherStore } from '../store/useLauncherStore';
import { PlayButton } from './PlayButton';

type Status = 'checking' | 'online' | 'offline';

/** Период автообновления статуса — 15 секунд */
const REFRESH_MS = 15_000;

export function ServerPanel() {
  const config = useLauncherStore((s) => s.config);
  const isLaunching = useLauncherStore((s) => s.isLaunching);
  const play = useLauncherStore((s) => s.play);
  const onOpenSettings = useLauncherStore((s) => s.setSettingsOpen);

  const [status, setStatus] = useState<Status>('checking');
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  // UDP-пинк port 21589 через Rust-команду ping_server (см. commands.rs)
  const check = useCallback(async () => {
    if (!isTauri()) {
      setStatus('online');
      return;
    }
    try {
      const alive = await invoke<boolean>('ping_server', { address: config.server_address });
      setStatus(alive ? 'online' : 'offline');
    } catch {
      setStatus('offline');
    }
  }, [config.server_address]);

  useEffect(() => {
    void check();
    timerRef.current = window.setInterval(() => void check(), REFRESH_MS);
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [check]);

  const handleCopy = async () => {
    try {
      await copyToClipboard(config.server_address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Буфер обмена недоступен:', err);
    }
  };

  const statusView = {
    checking: { dot: 'bg-slate-400 animate-pulse', label: 'ПРОВЕРКА…', text: 'text-slate-400' },
    online: { dot: 'bg-emerald shadow-[0_0_10px_#2fbf71]', label: 'ONLINE', text: 'text-emerald' },
    offline: { dot: 'bg-blood shadow-[0_0_10px_#ff5566]', label: 'OFFLINE', text: 'text-blood' },
  }[status];

  return (
    <aside className="vr-side">
      {/* Блок «Сервер»: пульсирующий индикатор, адрес в один клик, кнопка обновления */}
      <section className="vr-glass vr-side-block">
        <h2 className="vr-side-label">Сервер</h2>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`h-2 w-2 rounded-full ${statusView.dot}`} />
            <span className={`text-xs font-bold tracking-widest ${statusView.text}`}>
              {statusView.label}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void check()}
            title="Проверить снова"
            className="vr-icon-btn"
          >
            <RefreshCw size={13} />
          </button>
        </div>
        <div className="mt-3 flex items-start justify-between gap-2">
          <p className="vr-selectable break-all font-mono text-[13px] leading-snug text-slate-300">
            {config.server_address}
          </p>
          <button
            type="button"
            onClick={() => void handleCopy()}
            title="Скопировать адрес сервера"
            className="vr-icon-btn shrink-0"
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span
                  key="ok"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                >
                  <Check size={14} className="text-emerald" />
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                >
                  <Copy size={14} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </section>

      {/* Блок «Персонаж»: аватар-заглушка + ник из логина + счётчики (пока захардкожены) */}
      <section className="vr-glass vr-side-block">
        <h2 className="vr-side-label">Персонаж</h2>
        <div className="flex items-center gap-3">
          <span className="vr-avatar">
            <Shield size={20} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold text-white">
              {config.username || 'talifan11'}
            </p>
            <p className="text-xs text-slate-500">Викинг</p>
          </div>
        </div>
        <dl className="vr-stats">
          <div className="vr-stat-row">
            <dt>Уровень</dt>
            <dd>1</dd>
          </div>
          <div className="vr-stat-row">
            <dt>Навык</dt>
            <dd>0</dd>
          </div>
          <div className="vr-stat-row">
            <dt>Часов в игре</dt>
            <dd>0</dd>
          </div>
        </dl>
      </section>

      {/* Кнопки: ИГРАТЬ (золотая, во всю ширину) + Настройки (ghost, под ней) */}
      <div className="mt-auto space-y-3">
        <PlayButton
          serverOffline={status === 'offline'}
          isLaunching={isLaunching}
          onPlay={() => void play()}
        />
        <button type="button" onClick={() => onOpenSettings(true)} className="vr-btn-settings">
          <Settings size={15} />
          Настройки
        </button>
      </div>
    </aside>
  );
}
