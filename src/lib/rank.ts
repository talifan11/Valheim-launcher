// Стили и цвета для скандинавских рангов форума.
import type { ForumRank } from './api';

export function rankColor(tier: ForumRank['tier']): string {
  switch (tier) {
    case 'jarl': return 'text-gold border-gold/40 bg-gold/10';
    case 'legend': return 'text-blizzard border-blizzard/40 bg-blizzard/10';
    case 'viking': return 'text-blood border-blood/40 bg-blood/10';
    default: return 'text-slate-400 border-white/15 bg-white/5';
  }
}
