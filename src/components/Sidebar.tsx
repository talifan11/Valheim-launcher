// Боковая панель главного экрана: статус сервера, адрес, онлайн-игроки, настройки.
// Данные берутся из useLauncherStore; статус пинга приходит пропом из MainScreen.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Settings, Users } from 'lucide-react';
import { ShieldLogo } from './ShieldLogo';
import type { ConnectionState } from './TitleBar';
import { useLauncherStore } from '../store/useLauncherStore';

interface SidebarProps {
  /** Текущий статус пинга игрового сервера */
  connection: ConnectionState;
}

const CONNECTION_LABEL: Record<ConnectionState, string> = {
  checking: 'Проверка…',
  online: 'Сервер доступен',
  offline: 'Недоступен',
};

const CONNECTION_DOT: Record<ConnectionState, string> = {
  checking: 'bg-steel animate-pulse',
  online: 'bg-emerald',
  offline: 'bg-blood',
};

// Заглушка списка игроков: реальный список появится с RCON-интеграцией.
const ONLINE_PLAYERS = ['talifan11', 'Борис', 'Хальвдан'];

export function Sidebar({ connection }: SidebarProps) {
  const config = useLauncherStore((s) => s.config);
  const setSettingsOpen = useLauncherStore((s) => s.setSettingsOpen);
  const [copied, setCopied] = useState(false);

  const address = config.server_address;

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API может быть недоступен в WebView — молча пропускаем
    }
  }

  return (
    <aside className="flex w-[200px] shrink-0 flex-col border-r border-white/5 bg-panel/60">
      <div className="flex items-center gap-2 px-4 py-4">
        <ShieldLogo size={26} />
        <span className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-blizzard">
          Rouge
        </span>
      </div>

      <div className="vr-glass mx-3 mb-3 p-3">
        <p className="vr-side-label mb-2">Статус</p>
        <div className="flex items-center gap-2">
          <motion.span
            layout
            className={`h-2 w-2 rounded-full ${CONNECTION_DOT[connection]} ${
              connection === 'online' ? 'animate-pulse' : ''
            }`}
            transition={{ duration: 0.3 }}
          />
          <span className="text-xs text-slate-300">{CONNECTION_LABEL[connection]}</span>
        </div>
        <button
          onClick={copyAddress}
          title="Скопировать адрес"
          className="mt-2 flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-edge/60 bg-black/20 px-2 py-1.5 transition-colors duration-200 hover:border-blizzard-dark/60"
        >
          <span className="vr-selectable truncate font-mono text-[11px] text-slate-400">{address}</span>
          {copied ? (
            <Check size={13} className="shrink-0 text-emerald" />
          ) : (
            <Copy size={13} className="shrink-0 text-slate-500" />
          )}
        </button>
      </div>

      <div className="vr-glass mx-3 p-3">
        <p className="vr-side-label mb-2 flex items-center gap-1.5">
          <Users size={12} /> Игроки онлайн
        </p>
        <ul className="space-y-1.5">
          {ONLINE_PLAYERS.map((name, index) => (
            <li key={name} className="flex items-center gap-2">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 * index, duration: 0.3 }}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-[#8a6d1f] text-[9px] font-bold text-abyss"
              >
                {name.charAt(0)}
              </motion.span>
              <span className="truncate text-xs text-slate-300">{name}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto border-t border-white/5 p-3">
        <button onClick={() => setSettingsOpen(true)} className="vr-btn-ghost-sm w-full">
          <Settings size={14} /> Настройки
        </button>
      </div>
    </aside>
  );
}
