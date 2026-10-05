// ============================================================
// ServerStatus — индикатор «жив» ли наш выделенный сервер.
// Стучимся UDP-пакетом напрямую в порт Valheim (21589) из Rust-команды
// ping_server: если сервер слушает порт — он нам ответит. Никакого HTTP не нужно.
// ============================================================
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, RefreshCw, Server } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { copyToClipboard, isTauri } from '../lib/api';

type Status = 'checking' | 'online' | 'offline';

interface ServerStatusProps {
  /** Полный адрес вида host:port из config.json */
  address: string;
}

/** Период автообновления статуса — 15 секунд */
const REFRESH_MS = 15_000;

export function ServerStatus({ address }: ServerStatusProps) {
  const [status, setStatus] = useState<Status>('checking');
  const [copied, setCopied] = useState(false);
  // Храним таймер, чтобы корректно чистить интервал при размонтировании
  const timerRef = useRef<number | null>(null);

  const check = useCallback(async () => {
    if (!isTauri()) {
      // В браузерной дев-режиме Rust-бэкенда нет — считаем сервер online для красоты
      setStatus('online');
      return;
    }
    try {
      const alive = await invoke<boolean>('ping_server', { address });
      setStatus(alive ? 'online' : 'offline');
    } catch {
      setStatus('offline');
    }
  }, [address]);

  useEffect(() => {
    void check();
    timerRef.current = window.setInterval(() => void check(), REFRESH_MS);
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [check]);

  const handleCopy = async () => {
    try {
      await copyToClipboard(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Буфер обмена недоступен:', err);
    }
  };

  // Конфигурация внешнего вида по статусам
  const view = {
    checking: { dot: 'bg-slate-400 animate-pulse', label: 'ПРОВЕРКА…', text: 'text-slate-400' },
    online: { dot: 'bg-emerald shadow-[0_0_10px_#2fbf71]', label: 'ONLINE', text: 'text-emerald' },
    offline: { dot: 'bg-blood shadow-[0_0_10px_#ff5566]', label: 'OFFLINE', text: 'text-blood' },
  }[status];

  return (
    <div className="vr-glass flex items-center justify-between gap-4 px-5 py-4">
      {/* Левая часть: иконка сервера + статус */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-edge bg-steel">
          <Server size={18} className="text-blizzard" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${view.dot}`} />
            <span className={`text-xs font-bold tracking-widest ${view.text}`}>{view.label}</span>
            <button
              onClick={() => void check()}
              title="Проверить снова"
              className="ml-1 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw size={12} />
            </button>
          </div>
          {/* Правая часть: адрес + копирование в один клик (п. 3.3 ТЗ) */}
          <p className="vr-selectable truncate font-mono text-sm text-slate-300">{address}</p>
        </div>
      </div>

      <button
        onClick={() => void handleCopy()}
        title="Скопировать адрес сервера"
        className="relative shrink-0 rounded-lg border border-edge p-2.5 text-slate-400 transition-all hover:border-blizzard/60 hover:text-white cursor-pointer"
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.span key="ok" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
              <Check size={16} className="text-emerald" />
            </motion.span>
          ) : (
            <motion.span key="copy" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
              <Copy size={16} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
