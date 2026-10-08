import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, X, Sparkles, Check } from 'lucide-react';
import { useOnboardingStore } from '../../store/useOnboardingStore';

interface Step {
  /** CSS-селектор элемента для подсветки (data-атрибут) */
  target: string | null;
  title: string;
  description: string;
  /** Позиция карточки относительно выделенного элемента */
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Дополнительный отступ от края экрана */
  padding?: number;
}

const STEPS: Step[] = [
  {
    target: null,
    title: 'Добро пожаловать в Valheim Rouge',
    description:
      'Быстрый тур по лаунчеру. Займёт 30 секунд. Всё, что нужно для игры — на своих местах.',
    placement: 'center',
  },
  {
    target: '[data-onboarding="topbar"]',
    title: 'Верхняя панель',
    description:
      'Здесь статус сервера, его адрес (кликните чтобы скопировать), уведомления и ваш профиль.',
    placement: 'bottom',
  },
  {
    target: '[data-onboarding="icon-rail"]',
    title: 'Левое меню',
    description:
      'Переключение разделов: Новости, События, Моды, Профиль. Внизу — настройки.',
    placement: 'right',
  },
  {
    target: '[data-onboarding="players-rail"]',
    title: 'Справа — друзья и сервер',
    description:
      'Сверху ваши друзья. Ниже счётчик игроков онлайн. Клик на любом — открыть профиль. ПКМ — действия.',
    placement: 'left',
  },
  {
    target: '[data-onboarding="status-bar"]',
    title: 'Кнопка ИГРАТЬ',
    description:
      'Главная кнопка внизу. Меняется в зависимости от статуса: ИГРАТЬ, УСТАНОВИТЬ, ОБНОВИТЬ. Индикатор слева показывает текущее состояние.',
    placement: 'top',
  },
  {
    target: '[data-onboarding="chat-button"]',
    title: 'Чат и финиш',
    description:
      'Справа внизу — чат. Общий канал и личные сообщения с друзьями. ПКМ по каналу — очистить или удалить. Приятной игры!',
    placement: 'left',
  },
];

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function Onboarding() {
  const active = useOnboardingStore((s) => s.active);
  const step = useOnboardingStore((s) => s.step);
  const totalSteps = useOnboardingStore((s) => s.totalSteps);
  const next = useOnboardingStore((s) => s.next);
  const prev = useOnboardingStore((s) => s.prev);
  const skip = useOnboardingStore((s) => s.skip);

  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });

  const current = STEPS[step];

  // Позиционирование подсветки
  useEffect(() => {
    if (!active || !current) return;

    const update = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });

      if (!current.target) {
        setRect(null);
        return;
      }

      const el = document.querySelector(current.target);
      if (!el) {
        setRect(null);
        return;
      }

      const r = el.getBoundingClientRect();
      const pad = current.padding ?? 8;
      setRect({
        x: r.left - pad,
        y: r.top - pad,
        width: r.width + pad * 2,
        height: r.height + pad * 2,
      });
    };

    update();
    window.addEventListener('resize', update);
    const interval = window.setInterval(update, 200); // на случай анимаций

    return () => {
      window.removeEventListener('resize', update);
      window.clearInterval(interval);
    };
  }, [active, current]);

  // Клавиатура
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip();
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, next, prev, skip]);

  if (!active || !current) return null;

  const isCenter = current.placement === 'center' || !rect;
  const tooltipPos = computeTooltipPosition(rect, current.placement, viewport);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[500] pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Затемнение — с "дыркой" под целевой элемент */}
        {rect ? (
          <>
            {/* Верхняя полоса */}
            <div
              className="absolute left-0 right-0 top-0 bg-[#050810]/85 backdrop-blur-sm pointer-events-auto transition-all duration-300"
              style={{ height: Math.max(0, rect.y) }}
              onClick={skip}
            />
            {/* Нижняя полоса */}
            <div
              className="absolute left-0 right-0 bottom-0 bg-[#050810]/85 backdrop-blur-sm pointer-events-auto transition-all duration-300"
              style={{ top: rect.y + rect.height }}
              onClick={skip}
            />
            {/* Левая полоса */}
            <div
              className="absolute left-0 bg-[#050810]/85 backdrop-blur-sm pointer-events-auto transition-all duration-300"
              style={{
                top: rect.y,
                height: rect.height,
                width: Math.max(0, rect.x),
              }}
              onClick={skip}
            />
            {/* Правая полоса */}
            <div
              className="absolute right-0 bg-[#050810]/85 backdrop-blur-sm pointer-events-auto transition-all duration-300"
              style={{
                top: rect.y,
                height: rect.height,
                left: rect.x + rect.width,
              }}
              onClick={skip}
            />
            {/* Золотая рамка вокруг цели */}
            <div
              className="absolute rounded-xl border-2 border-gold pointer-events-none transition-all duration-300"
              style={{
                left: rect.x,
                top: rect.y,
                width: rect.width,
                height: rect.height,
                boxShadow: '0 0 32px rgba(255, 194, 75, 0.5)',
              }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0 bg-[#050810]/85 backdrop-blur-md pointer-events-auto"
            onClick={skip}
          />
        )}

        {/* Карточка-подсказка */}
        <motion.div
          key={step}
          className="absolute w-[380px] max-w-[calc(100vw-40px)] glass-popover rounded-[20px] p-6 pointer-events-auto shadow-2xl"
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.22 }}
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: isCenter ? 'translate(-50%, -50%)' : 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Хедер */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              {isCenter ? (
                <span className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold shrink-0">
                  <Sparkles size={16} />
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold border border-gold/30 bg-gold/10 rounded px-2 py-1 shrink-0">
                  Шаг {step + 1} / {totalSteps}
                </span>
              )}
              <h3 className="font-display text-lg text-white leading-tight">
                {current.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={skip}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors shrink-0 -mr-1 -mt-1"
              title="Пропустить"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed mb-5">
            {current.description}
          </p>

          {/* Прогресс */}
          <div className="flex gap-1 mb-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                  i <= step ? 'bg-gold' : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* Кнопки */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={skip}
              className="text-[11px] uppercase tracking-[0.15em] text-slate-500 hover:text-white transition-colors font-semibold"
            >
              Пропустить
            </button>

            <div className="flex gap-2">
              {step > 0 && (
                <button
                  type="button"
                  onClick={prev}
                  className="px-3.5 py-2 rounded-lg border border-white/10 text-slate-300 text-[11px] font-semibold uppercase tracking-wider hover:bg-white/5 transition-all inline-flex items-center gap-1.5"
                >
                  <ArrowLeft size={12} />
                  Назад
                </button>
              )}
              <button
                type="button"
                onClick={next}
                className="px-4 py-2 rounded-lg bg-gold text-abyss text-[11px] font-bold uppercase tracking-[0.15em] hover:shadow-glow-gold transition-all inline-flex items-center gap-1.5"
              >
                {step + 1 === totalSteps ? (
                  <>
                    <Check size={12} />
                    Готово
                  </>
                ) : (
                  <>
                    Далее
                    <ArrowRight size={12} />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Позиция карточки относительно целевого элемента
function computeTooltipPosition(
  rect: Rect | null,
  placement: string,
  viewport: { w: number; h: number }
): { x: number; y: number } {
  if (!rect || placement === 'center') {
    return { x: viewport.w / 2, y: viewport.h / 2 };
  }

  const tooltipW = 380;
  const tooltipH = 220;
  const gap = 16;

  switch (placement) {
    case 'top': {
      const x = clamp(
        rect.x + rect.width / 2 - tooltipW / 2,
        16,
        viewport.w - tooltipW - 16
      );
      const y = Math.max(16, rect.y - tooltipH - gap);
      return { x, y };
    }
    case 'bottom': {
      const x = clamp(
        rect.x + rect.width / 2 - tooltipW / 2,
        16,
        viewport.w - tooltipW - 16
      );
      const y = Math.min(viewport.h - tooltipH - 16, rect.y + rect.height + gap);
      return { x, y };
    }
    case 'left': {
      const x = Math.max(16, rect.x - tooltipW - gap);
      const y = clamp(
        rect.y + rect.height / 2 - tooltipH / 2,
        16,
        viewport.h - tooltipH - 16
      );
      return { x, y };
    }
    case 'right': {
      const x = Math.min(viewport.w - tooltipW - 16, rect.x + rect.width + gap);
      const y = clamp(
        rect.y + rect.height / 2 - tooltipH / 2,
        16,
        viewport.h - tooltipH - 16
      );
      return { x, y };
    }
    default:
      return { x: viewport.w / 2, y: viewport.h / 2 };
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}
