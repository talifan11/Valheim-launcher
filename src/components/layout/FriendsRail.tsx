import { Users, UserPlus } from 'lucide-react';
import { useFriendsStore, type Friend } from '../../store/useFriendsStore';
import { useServerPlayersStore } from '../../store/useServerPlayersStore';
import { useRightPanelStore } from '../../store/useRightPanelStore';
import { Avatar } from '../ui/Avatar';
import type { ContextMenuState } from '../friends/FriendContextMenu';

interface Props {
  onOpenProfile: (userId: number) => void;
  onOpenContextMenu: (state: ContextMenuState) => void;
  onOpenAddFriend: () => void;
}

const MAX_VISIBLE = 7;

function statusDot(status: Friend['status']) {
  if (status === 'in-game') return 'bg-gold shadow-[0_0_6px_#ffc24b]';
  if (status === 'online') return 'bg-emerald shadow-[0_0_6px_#2fbf71]';
  return 'bg-slate-500';
}

function statusLabel(status: Friend['status']) {
  if (status === 'in-game') return 'в игре';
  if (status === 'online') return 'в сети';
  return 'не в сети';
}

function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap">
      <div className="glass-strong px-3 py-1.5 rounded-xl text-[11px] font-semibold tracking-wide text-slate-200 shadow-lg">
        {children}
      </div>
    </div>
  );
}

export function FriendsRail({ onOpenProfile, onOpenContextMenu, onOpenAddFriend }: Props) {
  const friends = useFriendsStore((s) => s.friends);
  const incoming = useFriendsStore((s) => s.incoming);
  const openWith = useRightPanelStore((s) => s.openWith);
  const panelOpen = useRightPanelStore((s) => s.open);
  const serverCount = useServerPlayersStore((s) => s.players.length);
  const maxSlots = useServerPlayersStore((s) => s.maxSlots);

  const sorted = [
    ...friends.filter((f) => f.status !== 'offline'),
    ...friends.filter((f) => f.status === 'offline'),
  ];
  const onlineNum = friends.filter((f) => f.status !== 'offline').length;
  const visible = sorted.slice(0, MAX_VISIBLE);
  const hidden = Math.max(0, friends.length - MAX_VISIBLE);

  const handleContext = (e: React.MouseEvent, friend: Friend) => {
    e.preventDefault();
    onOpenContextMenu({
      friendId: friend.id,
      friendName: friend.name,
      x: e.clientX,
      y: e.clientY,
    });
  };

  return (
    <div
      className={`rail-right flex flex-col gap-3 transition-all duration-300 ${
        panelOpen
          ? 'opacity-0 pointer-events-none translate-x-4'
          : 'opacity-100 animate-fade-in-up'
      }`}
      style={{ animationDelay: '0.15s' }}
    >
      {/* ===== Друзья ===== */}
      <div className="glass w-16 rounded-[24px] flex flex-col items-center gap-2 py-3">

        {/* Header: открыть панель */}
        <div className="group relative">
          <button
            type="button"
            onClick={() => openWith('friends')}
            data-onboarding="friends-button"
            className="relative w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all"
          >
            <Users size={16} />
            {incoming.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-blood text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                {incoming.length}
              </span>
            )}
          </button>
          <Tooltip>
            <span className="text-emerald">●</span>
            <span className="ml-2 uppercase">Друзья</span>
            <span className="ml-2 font-mono text-gold">{onlineNum}/{friends.length}</span>
          </Tooltip>
        </div>

        <span className="w-8 h-px bg-white/10" />

        {/* Add friend */}
        <div className="group relative">
          <button
            type="button"
            onClick={onOpenAddFriend}
            className="w-9 h-9 rounded-full border-2 border-dashed border-gold/40 flex items-center justify-center text-gold/70 hover:text-gold hover:border-gold hover:bg-gold/10 transition-all"
          >
            <UserPlus size={14} />
          </button>
          <Tooltip>Добавить друга</Tooltip>
        </div>

        {/* Friends list */}
        {friends.length > 0 && <span className="w-8 h-px bg-white/10" />}

        <div className="flex flex-col items-center gap-1.5">
          {visible.map((friend) => (
            <div key={friend.id} className="group relative">
              <button
                type="button"
                onClick={() => onOpenProfile(friend.userId)}
                onContextMenu={(e) => handleContext(e, friend)}
                className={`block rounded-full transition-transform duration-200 hover:scale-110 ${
                  friend.status === 'offline' ? 'opacity-50' : ''
                }`}
              >
                <div className="relative">
                  <Avatar size={32} friendId={friend.id} ringColor="none" />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#141923] ${statusDot(friend.status)}`}
                  />
                </div>
              </button>
              <Tooltip>
                <span>{friend.name}</span>
                <span className="ml-2 text-slate-500">— {statusLabel(friend.status)}</span>
              </Tooltip>
            </div>
          ))}

          {friends.length === 0 && (
            <div className="w-9 h-9 rounded-full border-2 border-white/10 flex items-center justify-center text-slate-600">
              <Users size={14} />
            </div>
          )}
        </div>

        {hidden > 0 && (
          <>
            <span className="w-8 h-px bg-white/10" />
            <button
              type="button"
              onClick={() => openWith('friends')}
              className="text-[10px] font-mono text-slate-500 hover:text-gold transition-colors leading-none"
            >
              +{hidden}
            </button>
          </>
        )}
      </div>

      {/* ===== Сервер ===== */}
      <div className="group relative">
        <button
          type="button"
          onClick={() => openWith('server')}
          className="glass w-16 rounded-[24px] flex flex-col items-center gap-1 py-3 cursor-pointer hover:border-blizzard/40 transition-colors"
        >
          <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-0.5">
            Серв
          </span>
          <span className="text-sm font-bold text-blizzard leading-none font-mono">
            {serverCount}
          </span>
          <span className="text-[9px] text-slate-600 leading-none font-mono">
            /{maxSlots}
          </span>
        </button>
        <Tooltip>
          <span className="text-blizzard">●</span>
          <span className="ml-2 uppercase">На сервере</span>
          <span className="ml-2 font-mono text-gold">{serverCount}/{maxSlots}</span>
        </Tooltip>
      </div>
    </div>
  );
}
