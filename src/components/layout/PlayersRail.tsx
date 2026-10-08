import { Users, UserPlus } from 'lucide-react';
import { useFriendsStore, type Friend } from '../../store/useFriendsStore';
import { useServerPlayersStore } from '../../store/useServerPlayersStore';
import { useRightPanelStore } from '../../store/useRightPanelStore';
import { Avatar } from '../ui/Avatar';
import type { ContextMenuState } from '../friends/FriendContextMenu';

interface Props {
  onOpenProfile: (id: string) => void;
  onOpenContextMenu: (state: ContextMenuState) => void;
  onOpenAddFriend: () => void;
}

export function PlayersRail({ onOpenProfile, onOpenContextMenu, onOpenAddFriend }: Props) {
  const friends = useFriendsStore((s) => s.friends);
  const friendsOnline = useFriendsStore((s) => s.onlineCount());
  const serverCount = useServerPlayersStore((s) => s.count());
  const maxSlots = useServerPlayersStore((s) => s.maxSlots);
  const openWith = useRightPanelStore((s) => s.openWith);

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
    <div className="rail-right flex flex-col gap-3 animate-fade-in-up" data-onboarding="players-rail" style={{ animationDelay: '0.15s' }}>
      <div className="group relative">
        <div className="pointer-events-none absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap">
          <div className="glass-strong px-3 py-2 rounded-xl text-[11px] font-semibold tracking-wide text-slate-200">
            <span className="text-emerald">●</span>
            <span className="ml-2 uppercase">Друзья</span>
            <span className="ml-2 font-mono text-gold">
              {friendsOnline}/{friends.length}
            </span>
          </div>
        </div>

        <div className="glass w-12 rounded-[22px] flex flex-col items-center gap-1.5 py-3">
          <button
            type="button"
            onClick={onOpenAddFriend}
            className="w-8 h-8 rounded-full border-2 border-dashed border-gold/40 flex items-center justify-center text-gold/70 hover:text-gold hover:border-gold hover:bg-gold/10 transition-all mb-0.5"
            title="Добавить друга"
          >
            <UserPlus size={14} />
          </button>

          {friends.slice(0, 5).map((friend) => (
            <div
              key={friend.id}
              onClick={() => onOpenProfile(friend.id)}
              onContextMenu={(e) => handleContext(e, friend)}
              className="cursor-pointer transition-transform duration-200 hover:scale-110"
              title={`${friend.name} (ПКМ — действия)`}
            >
              <Avatar
                size={30}
                friendId={friend.id}
                ringColor={
                  friend.status === 'in-game'
                    ? 'gold'
                    : friend.status === 'online'
                      ? 'emerald'
                      : 'slate'
                }
                inGame={friend.status === 'in-game'}
                online={friend.status === 'online'}
              />
            </div>
          ))}

          {friends.length === 0 && (
            <div className="w-8 h-8 rounded-full border-2 border-white/10 flex items-center justify-center text-slate-600">
              <Users size={14} />
            </div>
          )}
        </div>
      </div>

      <div className="group relative">
        <div className="pointer-events-none absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap">
          <div className="glass-strong px-3 py-2 rounded-xl text-[11px] font-semibold tracking-wide text-slate-200">
            <span className="text-blizzard">●</span>
            <span className="ml-2 uppercase">На сервере</span>
            <span className="ml-2 font-mono text-gold">
              {serverCount}/{maxSlots}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openWith('server')}
          className="glass w-12 rounded-[22px] flex flex-col items-center gap-1 py-3 cursor-pointer hover:border-blizzard/40 transition-colors"
          title="Открыть панель сервера"
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
      </div>
    </div>
  );
}
