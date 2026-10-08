import { useState } from 'react';
import { Settings, Copy, Check } from 'lucide-react';
import { useLauncherStore } from '../../store/useLauncherStore';
import { ShieldLogo } from '../ShieldLogo';

export type ConnectionState = 'checking' | 'online' | 'active' | 'offline';

interface Props {
  connection: ConnectionState;
}

const STATUS_LABEL: Record<ConnectionState, string> = {
  checking: 'ПРОВЕРКА',
  online: 'ONLINE',
  active: 'АКТИВЕН',
  offline: 'OFFLINE',
};

export function FloatingTopBar({ connection }: Props) {
  const config = useLauncherStore((s) => s.config);
  const setSettingsOpen = useLauncherStore((s) => s.setSettingsOpen);
  const [copied, setCopied] = useState(false);

  const dotClass =
    connection === 'online'
      ? 'bg-emerald shadow-[0_0_10px_#2fbf71]'
      : connection === 'active'
        ? 'bg-blizzard shadow-[0_0_10px_#0e9cff]'
        : connection === 'offline'
          ? 'bg-blood shadow-[0_0_10px_#ff5566]'
          : 'bg-slate-400 animate-pulse-dot';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(config.server_address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const initial = (config.username || 'И')[0].toUpperCase();

  return (
    <div className="float-topbar-wrap animate-fade-in-up" data-tauri-drag-region>
      <div className="float-topbar glass-strong flex items-center gap-3 h-14 px-4 rounded-[28px] overflow-hidden">
        <span className="text-gold shrink-0">
          <ShieldLogo size={22} />
        </span>
        <span className="w-px h-6 bg-white/10 shrink-0" />

        <div className="flex items-center gap-2 shrink-0">
          <span className={`w-2 h-2 rounded-full ${dotClass}`} />
          <span className="text-[11px] font-bold tracking-[0.12em] text-slate-300 uppercase whitespace-nowrap">
            {STATUS_LABEL[connection]}
          </span>
        </div>

        <span className="w-px h-6 bg-white/10 shrink-0" />

        <button
          type="button"
          onClick={() => void handleCopy()}
          className="flex items-center gap-2 font-mono text-[11px] text-slate-400 hover:text-gold transition-colors duration-200 min-w-0 flex-1"
          title="Скопировать адрес"
        >
          <span className="truncate">{config.server_address}</span>
          {copied ? (
            <Check size={12} className="text-emerald shrink-0" />
          ) : (
            <Copy size={12} className="shrink-0" />
          )}
        </button>

        <span className="w-px h-6 bg-white/10 shrink-0" />

        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="text-slate-400 hover:text-white transition-colors duration-200 shrink-0"
          title="Настройки"
        >
          <Settings size={15} />
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-[#b8941f] flex items-center justify-center text-xs font-bold text-abyss">
            {initial}
          </span>
          <span className="text-xs text-slate-300 truncate max-w-[100px]">
            {config.username || 'Игрок'}
          </span>
        </div>
      </div>
    </div>
  );
}
