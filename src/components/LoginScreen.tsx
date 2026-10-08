import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLauncherStore } from '../store/useLauncherStore';

const REMEMBER_KEY = 'valheim-rouge:remembered-email';

function loadRemembered(): string {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? '';
  } catch {
    return '';
  }
}

function saveRemembered(email: string): void {
  try {
    if (email) {
      localStorage.setItem(REMEMBER_KEY, email);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
  } catch {
    // тихо
  }
}

export function LoginScreen() {
  const login = useLauncherStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // При открытии подгружаем сохранённый email
  useEffect(() => {
    const saved = loadRemembered();
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const em = email.trim();
    if (!em) {
      setError('Введите email');
      return;
    }
    if (!em.includes('@') || !em.includes('.')) {
      setError('Некорректный email');
      return;
    }
    if (!password.trim()) {
      setError('Введите пароль');
      return;
    }

    setBusy(true);
    try {
      await login(em);
      // Запоминаем email, если галочка стоит
      if (remember) {
        saveRemembered(em);
      } else {
        saveRemembered('');
      }
    } catch (err) {
      setError('Не удалось войти');
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const handleForget = () => {
    saveRemembered('');
    setEmail('');
    setRemember(false);
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Фон */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{
          backgroundImage: 'url(/backgrounds/main.jpg)',
          filter: 'blur(3px) brightness(0.45)',
        }}
      />

      {/* Вордмарк */}
      <div className="absolute inset-x-0 top-[12%] flex flex-col items-center z-10">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center"
        >
          <h1 className="font-display text-[44px] leading-none tracking-[0.15em] text-white font-bold drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
            VALHEIM
          </h1>
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className="w-12 h-px bg-gold" />
            <span className="text-[12px] uppercase tracking-[0.5em] text-gold font-bold">
              Rouge
            </span>
            <span className="w-12 h-px bg-gold" />
          </div>
        </motion.div>
      </div>

      {/* Форма */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        className="absolute inset-x-0 bottom-[14%] flex justify-center z-10 px-6"
      >
        <form onSubmit={handleSubmit} className="w-[400px] max-w-full">
          {/* Email */}
          <div className="mb-7">
            <label className="block text-[10px] uppercase tracking-[0.35em] text-slate-300 font-bold mb-3">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              className="w-full bg-black/40 border border-white/25 rounded-lg px-4 py-3 text-base text-white placeholder:text-slate-400 outline-none focus:border-gold focus:bg-black/55 focus:shadow-[0_0_0_3px_rgba(255,194,75,0.15)] transition-all duration-300 font-light tracking-wide"
              placeholder="your@email.com"
            />
          </div>

          {/* Пароль */}
          <div className="mb-5">
            <label className="block text-[10px] uppercase tracking-[0.35em] text-slate-300 font-bold mb-3">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              className="w-full bg-black/40 border border-white/25 rounded-lg px-4 py-3 text-base text-white placeholder:text-slate-400 outline-none focus:border-gold focus:bg-black/55 focus:shadow-[0_0_0_3px_rgba(255,194,75,0.15)] transition-all duration-300 font-light tracking-widest"
              placeholder="••••••••"
            />
          </div>

          {/* Запомнить + Забыть */}
          <div className="flex items-center justify-between mb-7">
            <label className="flex items-center gap-2 cursor-pointer group">
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                  remember
                    ? 'bg-gold border-gold'
                    : 'border-white/30 group-hover:border-white/50'
                }`}
              >
                {remember && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M1 5L4 8L9 2"
                      stroke="#0a0e14"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="hidden"
              />
              <span className="text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors">
                Запомнить меня
              </span>
            </label>

            {email && (
              <button
                type="button"
                onClick={handleForget}
                className="text-[11px] text-slate-500 hover:text-blood transition-colors"
              >
                Забыть аккаунт
              </button>
            )}
          </div>

          {/* Ошибка */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] text-blood text-center mb-5 tracking-wide font-medium drop-shadow-[0_0_8px_rgba(255,85,102,0.6)]"
            >
              {error}
            </motion.div>
          )}

          {/* Кнопка */}
          <button
            type="submit"
            disabled={busy}
            className="group relative w-full h-[52px] rounded-lg overflow-hidden font-bold text-[12px] uppercase tracking-[0.35em] text-abyss disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_8px_32px_rgba(255,194,75,0.35)] hover:shadow-[0_12px_40px_rgba(255,194,75,0.55)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_4px_20px_rgba(255,194,75,0.4)] focus:outline-none focus:ring-2 focus:ring-gold/60 focus:ring-offset-2 focus:ring-offset-transparent"
            style={{
              background:
                'linear-gradient(180deg, #ffd479 0%, #ffc24b 40%, #e3a730 100%)',
            }}
          >
            <span
              className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0))',
              }}
            />
            <span
              className="absolute inset-x-0 bottom-0 h-[2px] pointer-events-none"
              style={{
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.25))',
              }}
            />
            <span
              className="absolute top-0 left-[-100%] w-full h-full pointer-events-none transition-[left] duration-700 ease-out group-hover:left-[100%]"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
              }}
            />
            <span className="relative z-10 flex items-center justify-center gap-2.5">
              {busy ? 'Вход...' : 'Войти'}
              {!busy && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </span>
          </button>

          <div className="mt-10 text-center text-[10px] tracking-[0.3em] text-slate-400 uppercase font-mono">
            v0.1.0
          </div>
        </form>
      </motion.div>

      <div className="absolute inset-x-0 top-0 h-11 z-0" data-tauri-drag-region />
    </div>
  );
}
