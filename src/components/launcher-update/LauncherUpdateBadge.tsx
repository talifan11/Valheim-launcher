import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpCircle, Loader2, X } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useLauncherUpdateStore } from '../../store/useLauncherUpdateStore';

export function LauncherUpdateBadge() {
  const available = useLauncherUpdateStore((s) => s.available);
  const skippedVersion = useLauncherUpdateStore((s) => s.skippedVersion);
  const dismiss = useLauncherUpdateStore((s) => s.dismiss);

  const [open, setOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const show = available !== null && available.version !== skippedVersion;
  if (!show || !available) return null;

  const handleInstall = async () => {
    setInstalling(true);
    setError(null);
    try {
      await invoke('download_and_install_update', { url: available.download_url });
    } catch (err) {
      setError(String(err));
      setInstalling(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative w-8 h-8 rounded-lg flex items-center justify-center text-gold hover:bg-gold/10 transition-colors shrink-0"
        title={'Доступно обновление ' + available.version}
      >
        <ArrowUpCircle size={16} />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-gold animate-pulse" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-full mt-2 w-72 glass-popover rounded-2xl p-4 z-[260]"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-sm font-bold text-white">
                  Обновление {available.version}
                </div>
                {available.published_at && (
                  <div className="text-[10px] text-slate-500 font-mono">
                    {available.published_at}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-500 hover:text-white w-6 h-6 rounded flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>

            {available.release_notes && (
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                {available.release_notes}
              </p>
            )}

            {error && (
              <p className="text-[11px] text-blood mb-2 break-all">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleInstall()}
                disabled={installing}
                className="flex-1 py-2 rounded-lg bg-gold text-abyss text-[11px] font-bold uppercase tracking-wider hover:shadow-glow-gold transition-all disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
              >
                {installing ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Установка...
                  </>
                ) : (
                  <>
                    <ArrowUpCircle size={12} />
                    Обновить
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => { dismiss(); setOpen(false); }}
                disabled={installing}
                className="px-3 py-2 rounded-lg border border-white/10 text-slate-400 text-[11px] font-semibold uppercase tracking-wider hover:bg-white/5 transition-all disabled:opacity-40"
              >
                Позже
              </button>
            </div>

            {installing && (
              <p className="text-[10px] text-slate-500 mt-2 text-center leading-relaxed">
                Лаунчер закроется и перезапустится автоматически
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
