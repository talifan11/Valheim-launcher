import { getFriendAvatar, useProfileStore, type AvatarId } from '../../store/useProfileStore';
import { useFriendsStore } from '../../store/useFriendsStore';
import { resolveAvatarUrl } from '../../lib/api';

interface Props {
  /** Размер в пикселях */
  size?: number;
  /** id друга для детерминированного выбора аватара (только если не self) */
  friendId?: string;
  /** Явно заданный avatarId — ОВЕРРАЙД, рендерит SVG (используется в пикере) */
  avatarId?: AvatarId;
  /** Явный URL загруженной картинки (перебивает self/friend) */
  avatarUrl?: string | null;
  /** Это аватар текущего пользователя */
  self?: boolean;
  /** Показать зелёный индикатор онлайн */
  online?: boolean;
  /** Показать золотой индикатор "в игре" */
  inGame?: boolean;
  /** Обводка-цвет статуса (border) */
  ringColor?: 'emerald' | 'gold' | 'slate' | 'none';
  className?: string;
}

export function Avatar({
  size = 32,
  friendId,
  avatarId,
  avatarUrl,
  self = false,
  online = false,
  inGame = false,
  ringColor = 'none',
  className = '',
}: Props) {
  const selfAvatar = useProfileStore((s) => s.avatarId);
  const selfAvatarUrl = useProfileStore((s) => s.avatarUrl);
  const friend = useFriendsStore((s) =>
    friendId ? s.friends.find((f) => f.id === friendId) : undefined
  );

  // Приоритет источника:
  // 1. Явный avatarId → всегда SVG (пикер)
  // 2. Явный avatarUrl (prop) → картинка
  // 3. self → avatarUrl из profileStore
  // 4. friendId → avatarUrl друга из friendsStore
  const isExplicitSvg = avatarId !== undefined;

  let resolvedUrl: string | null = null;
  if (!isExplicitSvg) {
    if (avatarUrl !== undefined) resolvedUrl = avatarUrl;
    else if (self) resolvedUrl = selfAvatarUrl;
    else if (friend) resolvedUrl = friend.avatarUrl ?? null;
  }

  const fullUrl = resolveAvatarUrl(resolvedUrl);

  const resolvedId: AvatarId = avatarId
    ? avatarId
    : self
      ? selfAvatar
      : friendId
        ? getFriendAvatar(friendId)
        : 'avatar-1';

  const ringClass =
    ringColor === 'emerald'
      ? 'ring-2 ring-emerald'
      : ringColor === 'gold'
        ? 'ring-2 ring-gold'
        : ringColor === 'slate'
          ? 'ring-2 ring-white/15'
          : '';

  const dotSize = Math.max(8, Math.round(size * 0.28));

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      {fullUrl ? (
        <img
          src={fullUrl}
          alt=""
          className={`rounded-full bg-abyss object-cover ${ringClass}`}
          style={{ width: size, height: size }}
        />
      ) : (
        <img
          src={`/assets/svg/avatars/${resolvedId}.svg`}
          alt=""
          width={size}
          height={size}
          className={`rounded-full bg-abyss ${ringClass}`}
          style={{ width: size, height: size }}
        />
      )}
      {inGame && (
        <span
          className="absolute bottom-0 right-0 rounded-full bg-gold border-2 border-[#141923]"
          style={{
            width: dotSize,
            height: dotSize,
            boxShadow: '0 0 6px #ffc24b',
          }}
          title="В игре"
        />
      )}
      {online && !inGame && (
        <span
          className="absolute bottom-0 right-0 rounded-full bg-emerald border-2 border-[#141923]"
          style={{
            width: dotSize,
            height: dotSize,
            boxShadow: '0 0 6px #2fbf71',
          }}
          title="В сети"
        />
      )}
    </div>
  );
}
