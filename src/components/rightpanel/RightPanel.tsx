import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  Server,
  Gamepad2,
  Clock,
  UserPlus,
  Check,
  XCircle,
  Search,
} from 'lucide-react';
import { useRightPanelStore } from '../../store/useRightPanelStore';
import { useFriendsStore, type Friend } from '../../store/useFriendsStore';
import { useServerPlayersStore, type ServerPlayer } from '../../store/useServerPlayersStore';
import { useChatStore } from '../../store/useChatStore';
import { useLauncherStore } from '../../store/useLauncherStore';
import { toast } from '../../store/useToastStore';
import * as api from '../../lib/api';
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

  const handleAction = async (
    action: 'play' | 'chat' | 'add' | 'remove',
    kind: 'friend' | 'server',
    id: string
  ) => {
    const allFriends = useFriendsStore.getState().friends;
    const sendRequest = useFriendsStore.getState().sendRequest;
    const openDmWith = useChatStore.getState().openDmWith;

    const friend = allFriends.find((f) => f.id === id);
    const targetName =
      kind === 'friend'
        ? friend?.name
        : useServerPlayersStore.getState().players.find((p) => p.id === id)?.name;

    if (!targetName) {
      setContextMenu(null);
      return;
    }

    if (action === 'play') {
      toast.success('Приглашение отправлено ' + targetName);
    } else if (action === 'chat') {
      if (friend) {
        openDmWith(String(friend.userId), friend.name);
      }
    } else if (action === 'add') {
      const player = useServerPlayersStore.getState().players.find((p) => p.id === id);
      if (player) {
        try {
          const token = useLauncherStore.getState().authToken;
          if (!token) {
            toast.error('Нужно войти в аккаунт');
          } else {
            const results = await api.searchUsers(player.name, token);
            const found = results.find((r) => r.username === player.name);
            if (found) {
              await sendRequest(found.user_id);
              toast.success('Заявка отправлена ' + player.name);
            } else {
              toast.error('Игрок ' + player.name + ' не зарегистрирован');
            }
          }
        } catch (err) {
          toast.error('Не удалось отправить заявку');
          console.error(err);
        }
      }
    } else if (action === 'remove') {
      if (friend) {
        try {
          await removeFriend(friend.userId);
          toast.info(targetName + ' удалён из друзей');
        } catch (err) {
          toast.error('Не удалось удалить друга');
          console.error(err);
        }
      }
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
            <div className="flex items-center gap-1.5 px-3 py-3 border-b border-white/[0.06] shrink-0">
              <button
                type="button"
                onClick={() => setSection('friends')}
                className={
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ' +
                  (section === 'friends'
                    ? 'bg-emerald/20 text-emerald border border-emerald/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/5')
                }
              >
                <Users size={12} />
                Друзья
              </button>
              <button
                type="button"
                onClick={() => setSection('server')}
                className={
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ' +
                  (section === 'server'
                    ? 'bg-blizzard/20 text-blizzard border border-blizzard/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/5')
                }
              >
                <Server size={12} />
                Сервер
              </button>
              <button
                type="button"
                onClick={() => setSection('search')}
                className={
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ' +
                  (section === 'search'
                    ? 'bg-gold/20 text-gold border border-gold/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/5')
                }
              >
                <Search size={12} />
                Поиск
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors shrink-0"
                title="Закрыть"
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
              {section === 'search' && <SearchSection />}
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
  const incoming = useFriendsStore((s) => s.incoming);
  const acceptRequest = useFriendsStore((s) => s.acceptRequest);
  const rejectRequest = useFriendsStore((s) => s.rejectRequest);

  const handleAccept = async (userId: number, username: string) => {
    try {
      await acceptRequest(userId);
      toast.success(username + ' теперь ваш друг');
    } catch (err) {
      toast.error('Не удалось принять заявку');
      console.error(err);
    }
  };

  const handleReject = async (userId: number, username: string) => {
    try {
      await rejectRequest(userId);
      toast.info('Заявка от ' + username + ' отклонена');
    } catch (err) {
      toast.error('Не удалось отклонить заявку');
      console.error(err);
    }
  };

  return (
    <div className="space-y-3">
      {incoming.length > 0 && (
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.15em] text-gold font-bold mb-2 px-1 flex items-center gap-1.5">
            <UserPlus size={11} />
            Заявки в друзья ({incoming.length})
          </h3>
          <ul className="space-y-1">
            {incoming.map((request) => (
              <li key={request.id} className="glass rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full border-2 border-gold/50 flex items-center justify-center bg-abyss shrink-0">
                    <span className="text-xs font-bold text-slate-200">
                      {request.name[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-white font-semibold truncate">
                      {request.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Хочет добавить вас в друзья
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleAccept(request.userId, request.name)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald/15 border border-emerald/40 text-emerald text-[11px] font-bold uppercase tracking-wider hover:bg-emerald/25 transition-all"
                  >
                    <Check size={11} />
                    Принять
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReject(request.userId, request.name)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-blood/30 text-blood text-[11px] font-bold uppercase tracking-wider hover:bg-blood/10 transition-all"
                  >
                    <XCircle size={11} />
                    Отклонить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {friends.length === 0 && incoming.length === 0 && (
        <div className="text-center text-slate-500 text-xs py-8">
          Список пуст. Откройте вкладку Поиск.
        </div>
      )}

      {friends.length > 0 && (
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
      )}
    </div>
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
    return (
      <div className="text-center text-slate-500 text-xs py-8">
        Онлайн сервера появится позже
      </div>
    );
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
        <Avatar size={36} friendId={player.id} ringColor="emerald" online />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white font-semibold truncate">
              {player.name}
            </span>
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

function SearchSection() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<api.UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');

  const friends = useFriendsStore((s) => s.friends);
  const outgoing = useFriendsStore((s) => s.outgoing);
  const sendRequest = useFriendsStore((s) => s.sendRequest);
  const token = useLauncherStore((s) => s.authToken);

  useEffect(() => {
    if (!token) return;
    const q = query.trim();
    // Если пусто — показываем всех (запрос с символом "%" покажет всех)
    const searchQuery = q.length < 1 ? '%' : q;

    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api.searchUsers(searchQuery, token);
        setResults(data);
      } catch (err) {
        console.error('Ошибка поиска:', err);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, token]);

  const statusOf = (userId: number): 'friend' | 'outgoing' | 'none' => {
    if (friends.some((f) => f.userId === userId)) return 'friend';
    if (outgoing.some((f) => f.userId === userId)) return 'outgoing';
    return 'none';
  };

  const handleAdd = async (userId: number, username: string) => {
    try {
      await sendRequest(userId);
      toast.success('Заявка отправлена ' + username);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    }
  };

  const filtered = results.filter((u) => {
    if (filter === 'all') return true;
    if (filter === 'online') return u.online === true;
    if (filter === 'offline') return u.online !== true;
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по нику..."
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-abyss/60 border border-white/[0.08] text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-gold/50 transition-colors"
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
            ...
          </span>
        )}
      </div>

      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={
            'flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ' +
            (filter === 'all' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5')
          }
        >
          Все
        </button>
        <button
          type="button"
          onClick={() => setFilter('online')}
          className={
            'flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ' +
            (filter === 'online' ? 'bg-emerald/15 text-emerald border border-emerald/40' : 'text-slate-500 hover:text-white hover:bg-white/5')
          }
        >
          В сети
        </button>
        <button
          type="button"
          onClick={() => setFilter('offline')}
          className={
            'flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ' +
            (filter === 'offline' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5')
          }
        >
          Не в сети
        </button>
      </div>

      {!searching && filtered.length === 0 && (
        <div className="text-center text-slate-500 text-xs py-6">
          {query.trim().length > 0 ? 'Никого не найдено' : 'Пока никого нет'}
        </div>
      )}

      <ul className="space-y-1">
        {filtered.map((user) => {
          const status = statusOf(user.user_id);
          return (
            <li key={user.user_id}>
              <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-colors">
                <div className="relative shrink-0">
                  <div
                    className={
                      'w-9 h-9 rounded-full border-2 flex items-center justify-center bg-abyss ' +
                      (user.online ? 'border-emerald' : 'border-white/15')
                    }
                  >
                    <span className="text-sm font-bold text-slate-200">
                      {user.username[0]?.toUpperCase()}
                    </span>
                  </div>
                  {user.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#141923] bg-emerald shadow-[0_0_6px_#2fbf71]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-white font-semibold truncate">
                    {user.username}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {user.online ? 'В сети' : 'Не в сети'}
                  </div>
                </div>
                {status === 'friend' && (
                  <span className="px-2 py-1 rounded-lg bg-emerald/15 text-emerald text-[10px] font-bold uppercase inline-flex items-center gap-1">
                    <Check size={10} />
                    Друг
                  </span>
                )}
                {status === 'outgoing' && (
                  <span className="px-2 py-1 rounded-lg bg-white/5 text-slate-400 text-[10px] font-bold uppercase inline-flex items-center gap-1">
                    <Clock size={10} />
                    Ждём
                  </span>
                )}
                {status === 'none' && (
                  <button
                    type="button"
                    onClick={() => void handleAdd(user.user_id, user.username)}
                    className="px-3 py-1.5 rounded-lg bg-gold text-abyss text-[10px] font-bold uppercase tracking-wider hover:shadow-glow-gold transition-all"
                  >
                    Добавить
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function formatLastSeen(minutes?: number): string {
  if (minutes == null) return 'Не в сети';
  if (minutes < 60) return minutes + ' мин назад';
  const h = Math.floor(minutes / 60);
  if (h < 24) return h + ' ч назад';
  const d = Math.floor(h / 24);
  return d + ' д назад';
}

function formatSession(minutes: number): string {
  if (minutes < 60) return minutes + ' мин';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? h + ' ч' : h + ' ч ' + m + ' мин';
}
