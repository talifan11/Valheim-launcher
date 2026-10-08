import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Server, Gamepad2, Clock } from 'lucide-react';
import { useRightPanelStore } from '../../store/useRightPanelStore';
import { useFriendsStore, type Friend } from '../../store/useFriendsStore';
import { useServerPlayersStore, type ServerPlayer } from '../../store/useServerPlayersStore';
import { useChatStore } from '../../store/useChatStore';
import { toast } from '../../store/useToastStore';
import { PanelContextMenu, type PanelContextState } from './PanelContextMenu';
import { Avatar } from '../ui/Avatar';

interface Props {
  onOpenFriendProfile: (id: string) => void;
}

export function RightPanel({ onOpenFriendProfile }: Props) {
  const open = useRightPanelStore((s) => s.open);
  const section = useRightPanelStore((s) => s.section);
  const setSection = useRightPanelStore((s) => s.setSection);
  const setOpen = useRightPanelStore((s) => s.setOpen);

  const friends = useFriendsStore((s) => s.friends);
  const removeFriend = useFriendsStore((s) => s.removeFriend);
  const addFriend = useFriendsStore((s) => s.addFriend);

  const openDmWith = useChatStore((s) => s.openDmWith);
  const [contextMenu, setContextMenu] = useState<PanelContextState | null>(null);

  const handleContext = (
    e: React.MouseEvent,
    kind: 'friend' | 'server',
    id: string,
    name: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ kind, id, name, x: e.clientX, y: e.clientY });
  };

  const handleAction = (
    action: 'play' | 'chat' | 'add' | 'remove',
    kind: 'friend' | 'server',
    id: string
  ) => {
    const targetName =
      kind === 'friend'
        ? friends.find((f) => f.id === id)?.name
        : useServerPlayersStore.getState().players.find((p) => p.id === id)?.name;

    if (!targetName) {
      setContextMenu(null);
      return;
    }

    if (action === 'play') {
      toast.success(`Приглашение отправлено ${targetName}`);
    } else if (action === 'chat') {
      const friendMatch = friends.find((f) => f.id === id || f.name === targetName);
      const peerId = friendMatch?.id ?? id;
      openDmWith(peerId, targetName);
    } else if (action === 'add') {
      const player = useServerPlayersStore.getState().players.find((p) => p.id === id);
      if (player) {
        const newFriend: Friend = {
          id: player.id,
          name: player.name,
          status: 'in-game',
          activity: 'Valheim Rouge',
          level: player.level,
        };
        addFriend(newFriend);
        toast.success(`${player.name} добавлен в друзья`);
      }
    } else if (action === 'remove') {
      removeFriend(id);
      toast.info(`${targetName} удалён из друзей`);
    }

    setContextMenu(null);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.aside
            key="right-panel"
            className="glass-popover rounded-[24px] flex flex-col overflow-hidden fixed"
            initial={{ opacity: 0, x: 20, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 300 }}
            exit={{ opacity: 0, x: 20, width: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ top: 88, right: 16, bottom: 92, zIndex: 30 }}
          >
            <div className="flex items-center gap-2 px-3 py-3 border-b border-white/[0.06] shrink-0">
              <button
                type="button"
                onClick={() => setSection('friends')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  section === 'friends'
                    ? 'bg-emerald/20 text-emerald border border-emerald/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users size={12} />
                Друзья
              </button>
              <button
                type="button"
                onClick={() => setSection('server')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  section === 'server'
                    ? 'bg-blizzard/20 text-blizzard border border-blizzard/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Server size={12} />
                Сервер
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto vr-scroll p-3">
              {section === 'friends' && (
                <FriendsList
                  friends={friends}
                  onOpenProfile={onOpenFriendProfile}
                  onContext={handleContext}
                />
              )}
              {section === 'server' && (
                <ServerList onContext={handleContext} friends={friends} />
              )}
            </div>

            <div className="px-4 py-2 border-t border-white/[0.06] text-[10px] text-slate-600 font-mono text-center shrink-0">
              ПКМ на игроке — действия
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <PanelContextMenu
        state={contextMenu}
        onClose={() => setContextMenu(null)}
        onAction={handleAction}
      />
    </>
  );
}

interface FriendsListProps {
  friends: Friend[];
  onOpenProfile: (id: string) => void;
  onContext: (
    e: React.MouseEvent,
    kind: 'friend' | 'server',
    id: string,
    name: string
  ) => void;
}

function FriendsList({ friends, onOpenProfile, onContext }: FriendsListProps) {
  if (friends.length === 0) {
    return <div className="text-center text-slate-500 text-xs py-8">Список пуст</div>;
  }

  return (
    <ul className="space-y-1">
      {friends.map((friend) => (
        <li key={friend.id}>
          <div
            onClick={() => onOpenProfile(friend.id)}
            onContextMenu={(e) => onContext(e, 'friend', friend.id, friend.name)}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-colors text-left cursor-pointer"
          >
            <Avatar
              size={36}
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
            <div className="min-w-0 flex-1">
              <div className="text-sm text-white font-semibold truncate">
                {friend.name}
              </div>
              <StatusText friend={friend} />
            </div>
            {friend.status === 'in-game' && (
              <Gamepad2 size={14} className="text-gold shrink-0" />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function StatusText({
  friend,
}: {
  friend: { status: string; activity?: string; lastSeenMinutes?: number };
}) {
  if (friend.status === 'in-game') {
    return (
      <p className="text-[11px] text-gold truncate">
        Играет: {friend.activity ?? 'Valheim'}
      </p>
    );
  }
  if (friend.status === 'online') {
    return <p className="text-[11px] text-emerald">В сети</p>;
  }
  return (
    <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
      <Clock size={10} />
      {formatLastSeen(friend.lastSeenMinutes)}
    </p>
  );
}

interface ServerListProps {
  onContext: (
    e: React.MouseEvent,
    kind: 'friend' | 'server',
    id: string,
    name: string
  ) => void;
  friends: Friend[];
}

function ServerList({ onContext, friends }: ServerListProps) {
  const players = useServerPlayersStore((s) => s.players);
  const maxSlots = useServerPlayersStore((s) => s.maxSlots);

  if (players.length === 0) {
    return <div className="text-center text-slate-500 text-xs py-8">Пока никого</div>;
  }

  return (
    <div className="space-y-3">
      <div className="glass rounded-xl p-3 text-center">
        <div className="font-mono text-2xl text-blizzard font-bold">
          {players.length}
          <span className="text-slate-500 text-lg">/{maxSlots}</span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mt-1">
          игроков на сервере
        </div>
      </div>

      <ul className="space-y-1">
        {players.map((player) => (
          <ServerRow
            key={player.id}
            player={player}
            isFriend={friends.some((f) => f.name === player.name)}
            onContext={onContext}
          />
        ))}
      </ul>
    </div>
  );
}

function ServerRow({
  player,
  isFriend,
  onContext,
}: {
  player: ServerPlayer;
  isFriend: boolean;
  onContext: (
    e: React.MouseEvent,
    kind: 'friend' | 'server',
    id: string,
    name: string
  ) => void;
}) {
  return (
    <li>
      <div
        onContextMenu={(e) => onContext(e, 'server', player.id, player.name)}
        className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer"
      >
        <Avatar
          size={36}
          friendId={player.id}
          ringColor="emerald"
          online
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white font-semibold truncate">
              {player.name}
            </span>
            {player.clan && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-gold/15 text-gold border border-gold/25 font-semibold">
                {player.clan}
              </span>
            )}
            {isFriend && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald/15 text-emerald border border-emerald/25 font-semibold">
                друг
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <Clock size={10} />
            {formatSession(player.sessionMinutes)} · Ур. {player.level}
          </p>
        </div>
      </div>
    </li>
  );
}

function formatLastSeen(minutes?: number): string {
  if (minutes == null) return 'Не в сети';
  if (minutes < 60) return `${minutes} мин назад`;
  const h = Math.floor(minutes / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  return `${d} д назад`;
}

function formatSession(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} ч` : `${h} ч ${m} мин`;
}
