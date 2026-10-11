import type { ForumRank } from '../../lib/api';
import { rankColor } from '../../lib/rank';

interface Props {
  rank: ForumRank;
  size?: 'sm' | 'md';
}

export function RankBadge({ rank, size = 'sm' }: Props) {
  const cls = rankColor(rank.tier);
  const padding = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border font-bold uppercase tracking-wider ${padding} ${cls}`}
    >
      <span className="font-mono leading-none" style={{ fontSize: size === 'sm' ? 11 : 12 }}>
        {rank.rune}
      </span>
      {rank.name}
    </span>
  );
}
