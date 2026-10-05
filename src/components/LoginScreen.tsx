// ============================================================
// LoginScreen — экран аутентификации (заглушка по п. 3.2 ТЗ):
// glassmorphism-карточка, анимированные поля, «битвовая» кнопка входа.
// Логика: оба поля непустые -> главный экран; иначе -> анимированная ошибка.
// ============================================================
import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Eye, EyeOff, Lock, Swords, User } from 'lucide-react';
import { VRButton, VRCard } from './ui';
import { useLauncherStore } from '../store/useLauncherStore';

export function LoginScreen() {
  const login = useLauncherStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Простейшая «аутентификация»: пустое поле = отказ, всё остальное = успех
    if (!username.trim() || !password.trim()) {
      setError('Заполните логин и пароль, воин.');
      return;
    }
    setError(null);
    await login(username.trim());
  };

  return (
    <div className="flex h-full items-center justify-center p-6">
      {/* Появление карточки: лёгкий «выезд» снизу + fade-in */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -24 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <VRCard className="w-[400px] p-8">
          {/* Эмблема */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <motion.div
              initial={{ rotate: -12, scale: 0.6, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 14 }}
              className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-gradient-to-b from-gold/20 to-transparent shadow-glow-gold"
            >
              <Swords className="text-gold" size={30} />
            </motion.div>
            <h1 className="font-display text-2xl font-bold tracking-[0.2em] text-white">
              VALHEIM <span className="text-blizzard">ROUGE</span>
            </h1>
            <p className="text-xs uppercase tracking-widest text-slate-500">
              Вход в Вальхаллу
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Поле логина с иконкой */}
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                Логин
              </span>
              <div className="relative">
                <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Имя викинга"
                  autoComplete="off"
                  className="vr-input pl-9"
                />
              </div>
            </label>

            {/* Поле пароля + переключатель видимости */}
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                Пароль
              </span>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="vr-input pl-9 pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {/* Анимированное сообщение об ошибке (AnimatePresence умеет уходить с анимацией) */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  className="flex items-center gap-2 overflow-hidden text-sm text-blood"
                >
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <VRButton type="submit" className="mt-2 w-full">
              Войти
            </VRButton>
          </form>
        </VRCard>
      </motion.div>
    </div>
  );
}
