import {
  Sword,
  Shield,
  Pickaxe,
  Wand,
  Hammer,
  Crosshair,
  Download,
  Trash2,
  RefreshCw,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useModsStore, type ModItem } from '../store/useModsStore';
import { toast } from '../store/useToastStore';

const ICON_MAP = {
  sword: Sword,
  shield: Shield,
  pickaxe: Pickaxe,
  wand: Wand,
  hammer: Hammer,
  crosshair: Crosshair,
};

export function ModsScreen() {
  const mods = useModsStore((s) => s.mods);
  const toggle = useModsStore((s) => s.toggle);
  const install = useModsStore((s) => s.install);
  const uninstall = useModsStore((s) => s.uninstall);
  const enabled = mods.filter((m) => m.enabled).length;
  const updates = mods.filter((m) => m.status === 'update-available').length;

  const handleToggle = (mod: ModItem) => {
    toggle(mod.id);
    toast.info(mod.enabled ? `${mod.name} выключен` : `${mod.name} включён`);
  };

  const handleInstall = (mod: ModItem) => {
    install(mod.id);
    toast.success(`${mod.name} установлен`);
  };

  const handleUninstall = (mod: ModItem) => {
    uninstall(mod.id);
    toast.info(`${mod.name} удалён`);
  };

  return (
    <div className="space-y-6">
      {/* Заголовок + сводка */}
      <div className="flex items-center justify-between px-1">
        <h1 className="font-display text-2xl tracking-wide text-white">Модификации</h1>
        <div className="flex gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald border border-emerald/30 bg-emerald/10 rounded px-2.5 py-1">
            {enabled} активно
          </span>
          {updates > 0 && (
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gold border border-gold/30 bg-gold/10 rounded px-2.5 py-1">
              {updates} обновление
            </span>
          )}
        </div>
      </div>

      {/* Список модов */}
      <div className="space-y-3">
        {mods.map((mod) => (
          <ModCard
            key={mod.id}
            mod={mod}
            onToggle={() => handleToggle(mod)}
            onInstall={() => handleInstall(mod)}
            onUninstall={() => handleUninstall(mod)}
          />
        ))}
      </div>
    </div>
  );
}

function ModCard({
  mod,
  onToggle,
  onInstall,
  onUninstall,
}: {
  mod: ModItem;
  onToggle: () => void;
  onInstall: () => void;
  onUninstall: () => void;
}) {
  const Icon = ICON_MAP[mod.iconKind];
  const isInstalled = mod.status !== 'not-installed';
  const hasUpdate = mod.status === 'update-available';

  return (
    <div
      className={`glass rounded-[20px] p-5 flex gap-5 items-start transition-all ${
        mod.enabled ? 'border-emerald/20' : 'border-white/[0.06]'
      }`}
    >
      {/* Иконка */}
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
          mod.enabled
            ? 'bg-emerald/10 border border-emerald/25 text-emerald'
            : isInstalled
              ? 'bg-white/5 border border-white/10 text-slate-400'
              : 'bg-white/[0.03] border border-white/10 text-slate-600'
        }`}
      >
        <Icon size={24} />
      </div>

      {/* Контент */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className="font-display text-lg font-semibold text-white">
            {mod.name}
          </h3>
          <span className="text-[10px] font-mono text-slate-500">
            v{mod.version !== '—' ? mod.version : mod.latestVersion}
          </span>
          {hasUpdate && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold border border-gold/30 bg-gold/10 rounded px-1.5 py-0.5 inline-flex items-center gap-1">
              <AlertCircle size={9} />
              Обновление
            </span>
          )}
        </div>

        <div className="text-[11px] text-slate-500 mb-2">
          Автор: <span className="text-slate-400 font-semibold">{mod.author}</span>
        </div>

        <p className="text-sm text-slate-400 leading-relaxed">{mod.description}</p>

        <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-500">
          <span className="font-mono">{formatSize(mod.sizeKb)}</span>
          <span className="flex items-center gap-1.5">
            {isInstalled ? (
              <>
                <Check size={11} className="text-emerald" />
                Установлен
              </>
            ) : (
              'Не установлен'
            )}
          </span>
        </div>
      </div>

      {/* Действия */}
      <div className="shrink-0 flex flex-col gap-2 items-end">
        {isInstalled && (
          <button
            type="button"
            onClick={onToggle}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
              mod.enabled ? 'bg-emerald' : 'bg-white/10'
            }`}
            title={mod.enabled ? 'Выключить' : 'Включить'}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${
                mod.enabled ? 'left-6' : 'left-0.5'
              }`}
            />
          </button>
        )}

        {hasUpdate && (
          <button
            type="button"
            onClick={onInstall}
            className="px-3 py-1.5 rounded-lg bg-gold text-abyss text-[10px] font-bold uppercase tracking-wider hover:shadow-glow-gold transition-all inline-flex items-center gap-1.5"
          >
            <RefreshCw size={11} />
            Обновить
          </button>
        )}

        {!isInstalled && (
          <button
            type="button"
            onClick={onInstall}
            className="px-3 py-1.5 rounded-lg bg-gold text-abyss text-[10px] font-bold uppercase tracking-wider hover:shadow-glow-gold transition-all inline-flex items-center gap-1.5"
          >
            <Download size={11} />
            Установить
          </button>
        )}

        {isInstalled && !hasUpdate && (
          <button
            type="button"
            onClick={onUninstall}
            className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-slate-500 hover:text-blood hover:border-blood/40 hover:bg-blood/5 transition-all"
            title="Удалить мод"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

function formatSize(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} МБ`;
  return `${kb} КБ`;
}
