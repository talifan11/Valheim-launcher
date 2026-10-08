import { Newspaper, Calendar, Package, User } from 'lucide-react';

export type TabId = 'news' | 'events' | 'mods' | 'account';

interface Props {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}

const TABS: Array<{ id: TabId; icon: typeof Newspaper; label: string }> = [
  { id: 'news', icon: Newspaper, label: 'Новости' },
  { id: 'events', icon: Calendar, label: 'События' },
  { id: 'mods', icon: Package, label: 'Моды' },
  { id: 'account', icon: User, label: 'Аккаунт' },
];

export function IconRail({ activeTab, onChange }: Props) {
  return (
    <div className="rail-left animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      <div className="glass w-12 rounded-[22px] flex flex-col items-center gap-1.5 py-3">
        {TABS.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              title={label}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-gold text-abyss shadow-[0_0_16px_rgba(255,194,75,0.45)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={18} strokeWidth={1.6} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
