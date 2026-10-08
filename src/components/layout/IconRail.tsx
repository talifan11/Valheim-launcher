import {
  Newspaper,
  Calendar,
  Package,
  User,
  Settings,
} from 'lucide-react';
import { useLauncherStore } from '../../store/useLauncherStore';
import { useNotificationsStore } from '../../store/useNotificationsStore';

export type TabId = 'news' | 'events' | 'mods' | 'account';

interface Props {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}

interface NavItem {
  id: TabId;
  icon: typeof Newspaper;
  label: string;
}

const MAIN_NAV: NavItem[] = [
  { id: 'news', icon: Newspaper, label: 'Новости' },
  { id: 'events', icon: Calendar, label: 'События' },
  { id: 'mods', icon: Package, label: 'Моды' },
];

const BOTTOM_NAV: NavItem[] = [
  { id: 'account', icon: User, label: 'Профиль' },
];

export function IconRail({ activeTab, onChange }: Props) {
  const setSettingsOpen = useLauncherStore((s) => s.setSettingsOpen);
  const unreadNotifs = useNotificationsStore((s) =>
    s.items.filter((i) => !i.read).length
  );

  return (
    <div className="rail-left animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      <div className="glass w-14 rounded-[24px] flex flex-col items-center py-3 gap-1"
        data-onboarding="icon-rail">
        {MAIN_NAV.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={activeTab === item.id}
            onClick={() => onChange(item.id)}
          />
        ))}

        <div className="w-6 h-px bg-white/[0.08] my-1.5" />

        {BOTTOM_NAV.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={activeTab === item.id}
            onClick={() => onChange(item.id)}
          />
        ))}

        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="relative group w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-200"
        >
          <Settings size={19} strokeWidth={1.6} />
          {unreadNotifs > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-blood text-white text-[10px] font-bold flex items-center justify-center shadow-md">
              {unreadNotifs}
            </span>
          )}
          <Tooltip text="Настройки" />
        </button>
      </div>
    </div>
  );
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative group w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${
        active
          ? 'bg-gold text-abyss shadow-[0_0_20px_rgba(255,194,75,0.5)]'
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      {active && (
        <span
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gold shadow-[0_0_12px_#ffc24b]"
          aria-hidden="true"
        />
      )}

      <Icon size={19} strokeWidth={1.6} />

      <Tooltip text={item.label} />
    </button>
  );
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap">
      <span className="glass-popover px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide text-slate-200 uppercase">
        {text}
      </span>
    </span>
  );
}
