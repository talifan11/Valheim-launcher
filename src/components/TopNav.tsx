// Верхняя навигация контента главного экрана: четыре таба с золотым подчёркиванием.
import { motion } from 'framer-motion';

export type MainTab = 'news' | 'events' | 'mods' | 'account';

interface TabDef {
  id: MainTab;
  label: string;
}

const TABS: TabDef[] = [
  { id: 'news', label: 'Новости' },
  { id: 'events', label: 'События' },
  { id: 'mods', label: 'Моды' },
  { id: 'account', label: 'Аккаунт' },
];

interface TopNavProps {
  active: MainTab;
  onChange: (tab: MainTab) => void;
}

export function TopNav({ active, onChange }: TopNavProps) {
  return (
    <nav className="flex h-12 shrink-0 items-stretch border-b border-white/5 px-4">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative cursor-pointer px-4 text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-200 ${
            active === tab.id ? 'text-blizzard' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {tab.label}
          {active === tab.id && (
            <motion.span
              layoutId="topnav-underline"
              className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-gold"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          )}
        </button>
      ))}
    </nav>
  );
}
