import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Sparkles, X, ExternalLink, Loader2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useLauncherUpdateStore } from '../../store/useLauncherUpdateStore';
import { LAUNCHER_VERSION } from '../../config';

export function LauncherUpdateModal() {
  const available = useLauncherUpdateStore((s) => s.available);
  const dismissed = useLauncherUpdateStore((s) => s.dismissed);
  const dismiss = useLauncherUpdateStore((s) => s.dismiss);

  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const show = available !== null && !dismissed;

  const handleInstall = async () => {
    if (!available) return;
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
    <AnimatePresence>
      {show && available && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 modal-backdrop" onClick={dismiss} />

          <motion.div
            className="relative w-[480px] max-w-full glass-popover rounded-[24px] overflow-hidden"
            initial={{ scale: 0.94, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 16, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="h-1 bg-gradient-to-r from-gold via-[#ffd479] to-gold" />

            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-2xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold shrink-0">
                    <Sparkles size={22} />
                  </span>
                  <div>
                    <h3 className="font-display text-xl text-white leading-tight">
                      Доступно обновление
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                      {LAUNCHER_VERSION} → {available.version}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={dismiss}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              {available.release_notes && (
                <div className="glass rounded-xl p-4 mb-5">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-bold mb-2">
                    Что нового
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {available.release_notes}
                  </p>
                </div>
              )}

              {error && (
                <div className="text-[11px] text-blood text-center mb-4 bg-blood/10 border border-blood/30 rounded-lg py-2 px-3">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleInstall}
                  disabled={installing}
                  className="flex-1 py-3 rounded-xl bg-gold text-abyss text-xs font-bold uppercase tracking-[0.15em] hover:shadow-glow-gold transition-all inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {installing ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Скачивание...
                    </>
                  ) : (
                    <>
                      <Download size={15} />
                      Обновить и установить
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  disabled={installing}
                  className="px-4 py-3 rounded-xl border border-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wider hover:bg-white/5 transition-all disabled:opacity-40"
                >
                  Позже
                </button>
              </div>

              <div className="mt-4 text-[10px] text-slate-600 text-center font-mono inline-flex items-center justify-center gap-1 w-full">
                <ExternalLink size={10} />
                Приложение закроется, установщик запустится автоматически
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
