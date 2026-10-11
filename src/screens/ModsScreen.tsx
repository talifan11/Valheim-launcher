import { useEffect, useMemo, useState } from 'react';
import {
  Package, Loader2, Search, X, Crown, Power, PowerOff, Info,
  AlertCircle, RefreshCw,
} from 'lucide-react';
import { useModsStore } from '../store/useModsStore';

function extractVersion(name: string): string {
  const m = name.match(/v?(\d+\.\d+(\.\d+)?)/);
  return m ? `v${m[1]}` : '';
}

function prettyName(raw: string): string {
  return raw
    .replace(/^([A-Z])/, '$1')
    .replace(/[_-]/g, ' ')
    .trim();
}

export function ModsScreen() {
  const mods = useModsStore((s) => s.mods);
  const loading = useModsStore((s) => s.loading);
  const error = useModsStore((s) => s.error);
  const busyName = useModsStore((s) => s.busyName);
  const loadMods = useModsStore((s) => s.loadMods);
  const toggleMod = useModsStore((s) => s.toggleMod);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');

  useEffect(() => { void loadMods(); }, [loadMods]);

  const filtered = useMemo(() => {
    let list = mods.slice();
    if (filter === 'enabled') list = list.filter((m) => m.enabled);
    if (filter === 'disabled') list = list.filter((m) => !m.enabled);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (m) => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q),
      );
    }
    // Сортировка: обязательные сверху, потом по имени
    list.sort((a, b) => {
      if (a.mandatory !== b.mandatory) return a.mandatory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [mods, filter, query]);

  const counts = useMemo(() => ({
    all: mods.length,
    enabled: mods.filter((m) => m.enabled).length,
    disabled: mods.filter((m) => !m.enabled).length,
  }), [mods]);

  const FILTERS: { id: typeof filter; label: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'enabled', label: 'Включённые' },
    { id: 'disabled', label: 'Отключённые' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 pt-6 pb-4 shrink-0 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-3">
            <Package size={22} className="text-gold" />
            Моды
          </h1>
          <p className="text-[12px] text-slate-500 mt-1">
            Управление плагинами. Обязательные моды отключить нельзя
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadMods()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-[11px] uppercase tracking-[0.12em] font-bold disabled:opacity-40"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Обновить
        </button>
      </div>

      {/* Toolbar */}
      <div className="px-8 mb-4 shrink-0 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-0.5 border-b border-white/[0.06]">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`relative px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors ${
                filter === f.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-[10px] font-mono text-slate-600">{counts[f.id]}</span>
              {filter === f.id && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-gold rounded-t" />
              )}
            </button>
          ))}
        </div>

        <div className="ml-auto relative w-72">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск модов..."
            className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl pl-8 pr-8 py-2 text-[12px] text-slate-200 placeholder-slate-600 outline-none focus:border-gold/40 transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-8 mb-4 flex items-start gap-2 rounded-xl border border-blood/30 bg-blood/5 p-3 text-blood text-[12px] shrink-0">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-8 pb-8">
        {loading && mods.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl py-16 text-center">
            <Package size={28} className="mx-auto text-slate-700 mb-3" />
            <p className="text-[13px] text-slate-400 font-semibold">
              {query ? 'Ничего не найдено' : 'Модов пока нет'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-w-4xl">
            {filtered.map((mod) => {
              const isBusy = busyName === mod.name;
              const version = extractVersion(mod.name);

              return (
                <div
                  key={mod.filename}
                  className={`glass rounded-2xl p-4 transition-all ${
                    mod.mandatory
                      ? 'border-gold/20 bg-gold/[0.02]'
                      : mod.enabled
                        ? 'hover:border-white/[0.12]'
                        : 'opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`shrink-0 w-11 h-11 rounded-xl ring-1 ring-inset flex items-center justify-center ${
                        mod.mandatory
                          ? 'bg-gold/10 ring-gold/25 text-gold'
                          : mod.enabled
                            ? 'bg-emerald/10 ring-emerald/25 text-emerald'
                            : 'bg-white/[0.04] ring-white/[0.08] text-slate-500'
                      }`}
                    >
                      {mod.mandatory ? <Crown size={18} /> : mod.enabled ? <Power size={18} /> : <PowerOff size={18} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[14px] font-bold text-white truncate">
                          {prettyName(mod.name)}
                        </span>
                        {version && (
                          <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                            {version}
                          </span>
                        )}
                        {mod.mandatory && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gold/10 border border-gold/25 text-gold text-[9px] font-bold uppercase tracking-wider">
                            <Crown size={9} /> Обязательный
                          </span>
                        )}
                      </div>

                      {mod.description && (
                        <p className="text-[12px] text-slate-400 leading-relaxed mt-1 whitespace-pre-wrap break-words">
                          {mod.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-slate-600">
                        <Info size={10} />
                        <span>{mod.filename}</span>
                      </div>
                    </div>

                    {/* Toggle */}
                    <div className="shrink-0">
                      {mod.mandatory ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-slate-600 text-[11px] font-bold cursor-not-allowed">
                          <Crown size={12} />
                          Всегда включён
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void toggleMod(mod.name, !mod.enabled)}
                          disabled={isBusy}
                          className={`relative w-[52px] h-[28px] rounded-full transition-colors disabled:opacity-50 ${
                            mod.enabled ? 'bg-emerald' : 'bg-white/[0.08]'
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg transition-transform flex items-center justify-center ${
                              mod.enabled ? 'translate-x-[26px]' : 'translate-x-1'
                            }`}
                          >
                            {isBusy && <Loader2 size={10} className="animate-spin text-slate-800" />}
                          </span>
                        </button>
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
