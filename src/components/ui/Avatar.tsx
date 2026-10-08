import { getFriendAvatar, useProfileStore, type AvatarId } from '../../store/useProfileStore';

interface Props {
  /** Размер в пикселях */
  size?: number;
  /** id друга для детерминированного выбора аватара (только если не self) */
  friendId?: string;
  /** Явно заданный avatarId */
  avatarId?: AvatarId;
  /** Это аватар текущего пользователя */
  self?: boolean;
  /** Показать зелёный индикатор онлайн */
  online?: boolean;
  /** Показать золотой индикатор "в игре" */
  inGame?: boolean;
  /** Обводка-цвет статуса (используется как border) */
  ringColor?: 'emerald' | 'gold' | 'slate' | 'none';
  className?: string;
}

export function Avatar({
  size = 32,
  friendId,
  avatarId,
  self = false,
  online = false,
  inGame = false,
  ringColor = 'none',
  className = '',
}: Props) {
  const selfAvatar = useProfileStore((s) => s.avatarId);

  const resolved: AvatarId = avatarId
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
      <img
        src={`/assets/svg/avatars/${resolved}.svg`}
        alt=""
        width={size}
        height={size}
        className={`rounded-full bg-abyss ${ringClass}`}
        style={{ width: size, height: size }}
      />
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
