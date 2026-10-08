import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  LogOut,
  BarChart3,
  Palette,
  Check,
} from 'lucide-react';
import { useProfileStore, AVATARS } from '../../store/useProfileStore';
import { useLauncherStore } from '../../store/useLauncherStore';
import { Avatar } from '../ui/Avatar';

export function ProfileMenu() {
  const config = useLauncherStore((s) => s.config);
  const logout = useLauncherStore((s) => s.logout);
  const setSettingsOpen = useLauncherStore((s) => s.setSettingsOpen);

  const avatarId = useProfileStore((s) => s.avatarId);
  const setAvatar = useProfileStore((s) => s.setAvatar);

  const [open, setOpen] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Закрытие по клику мимо
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowAvatarPicker(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpenSettings = () => {
    setSettingsOpen(true);
    setOpen(false);
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-white/5 transition-colors"
        title="Профиль"
      >
        <Avatar size={32} self />
        <span className="text-xs text-slate-300 truncate max-w-[100px] hidden md:inline">
          {config.username || 'Игрок'}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-full mt-2 w-64 glass-popover rounded-[20px] overflow-hidden z-[250]"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
          >
            {/* Шапка профиля */}
            <div className="p-4 border-b border-white/[0.06] flex items-center gap-3">
              <Avatar size={48} self />
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">
                  {config.username || 'Игрок'}
                </div>
                <div className="text-[11px] text-slate-500">Викинг</div>
              </div>
            </div>

            {/* Действия */}
            {!showAvatarPicker && (
              <>
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(true)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/[0.05] transition-colors text-left"
                >
                  <Palette size={15} className="text-blizzard" />
                  Сменить аватар
                </button>

                <button
                  type="button"
                  onClick={handleOpenSettings}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/[0.05] transition-colors text-left"
                >
                  <Settings size={15} className="text-slate-400" />
                  Настройки
                </button>

                <button
                  type="button"
                  disabled
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed text-left"
                  title="Скоро"
                >
                  <BarChart3 size={15} />
                  Статистика
                  <span className="ml-auto text-[9px] uppercase tracking-wider text-slate-600 border border-white/10 rounded px-1.5 py-0.5">
                    скоро
                  </span>
                </button>

                <div className="h-px bg-white/[0.06]" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-blood hover:bg-blood/10 transition-colors text-left"
                >
                  <LogOut size={15} />
                  Выйти
                </button>
              </>
            )}

            {/* Выбор аватара */}
            {showAvatarPicker && (
              <>
                <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-bold">
                    Выбор аватара
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(false)}
                    className="text-[10px] uppercase tracking-wider text-slate-500 hover:text-white"
                  >
                    Назад
                  </button>
                </div>

                <div className="p-3 grid grid-cols-4 gap-2">
                  {AVATARS.map((id) => {
                    const active = id === avatarId;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setAvatar(id)}
                        className={`relative rounded-full p-0.5 transition-all ${
                          active
                            ? 'bg-gold shadow-glow-gold'
                            : 'hover:bg-white/5'
                        }`}
                        title={id}
                      >
                        <Avatar size={44} avatarId={id} />
                        {active && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold flex items-center justify-center shadow-md">
                            <Check size={10} className="text-abyss" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
