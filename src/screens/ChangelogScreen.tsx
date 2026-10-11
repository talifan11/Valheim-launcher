import { useEffect } from 'react';
import { Sparkles, Loader2, Server, Rocket, Package, PartyPopper, RefreshCw } from 'lucide-react';
import { useChangelogStore } from '../store/useChangelogStore';
import { Avatar } from '../components/ui/Avatar';
import { formatRelativeTime, formatFullDate } from '../lib/time';

const CATEGORY_META: Record<string, { label: string; icon: typeof Server; cls: string }> = {
  server:   { label: 'Сервер',  icon: Server,      cls: 'text-gold bg-gold/10 border-gold/25' },
  launcher: { label: 'Лаунчер', icon: Rocket,      cls: 'text-blizzard bg-blizzard/10 border-blizzard/25' },
  client:   { label: 'Клиент',  icon: Package,     cls: 'text-emerald bg-emerald/10 border-emerald/25' },
  event:    { label: 'Событие', icon: PartyPopper, cls: 'text-blood bg-blood/10 border-blood/25' },
};

export function ChangelogScreen() {
  const items = useChangelogStore((s) => s.items);
  const loading = useChangelogStore((s) => s.loading);
  const error = useChangelogStore((s) => s.error);
  const loadChangelog = useChangelogStore((s) => s.loadChangelog);

  useEffect(() => { void loadChangelog(); }, [loadChangelog]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 pt-6 pb-4 shrink-0 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-3">
            <Sparkles size={22} className="text-gold" />
            Обновления
          </h1>
          <p className="text-[12px] text-slate-500 mt-1">Что нового на сервере и в лаунчере</p>
        </div>
        <button
          type="button"
          onClick={() => void loadChangelog(true)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-[11px] uppercase tracking-[0.12em] font-bold disabled:opacity-40"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Обновить
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-8 pb-8">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : error && items.length === 0 ? (
          <div className="glass rounded-2xl p-6 border border-blood/30 text-blood text-sm">{error}</div>
        ) : items.length === 0 ? (
          <div className="glass rounded-2xl py-16 text-center">
            <Sparkles size={28} className="mx-auto text-slate-700 mb-3" />
            <p className="text-[13px] text-slate-400 font-semibold">Пока пусто</p>
            <p className="text-[11px] text-slate-600 mt-1">Обновления появятся здесь</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl">
            {items.map((item) => {
              const meta = CATEGORY_META[item.category] ?? CATEGORY_META.server;
              const Icon = meta.icon;
              return (
                <div key={item.id} className="glass rounded-2xl p-5 hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`shrink-0 w-11 h-11 rounded-xl ring-1 ring-inset flex items-center justify-center ${meta.cls}`}>
                      <Icon size={18} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${meta.cls}`}>
                          {meta.label}
                        </span>
                        {item.version && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono font-bold text-slate-400">
                            v{item.version}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-600">{formatRelativeTime(item.created_at)}</span>
                      </div>
                      <h3 className="font-display text-[16px] font-bold text-white leading-snug">{item.title}</h3>
                      <p className="text-[13px] text-slate-300 leading-relaxed mt-2 whitespace-pre-wrap break-words">{item.body}</p>
                      {item.author && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                          <Avatar size={22} avatarUrl={item.author.avatar_url} friendId={`u-${item.author.username}`} />
                          <span className="text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-400">{item.author.username}</span>
                            <span className="mx-1.5">·</span>
                            {formatFullDate(item.created_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
