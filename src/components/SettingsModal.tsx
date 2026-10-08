import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FolderOpen,
  RefreshCw,
  Server,
  Download,
  Info,
  Check,
  Globe,
  MessageCircle,
} from 'lucide-react';
import { useLauncherStore } from '../store/useLauncherStore';
import { useUpdateStore } from '../store/useUpdateStore';
import { pickFolder, openInShell } from '../lib/api';
import { LAUNCHER_VERSION, COMMUNITY_LINKS } from '../config';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Section = 'game' | 'server' | 'updates' | 'about';

const SECTIONS: Array<{ id: Section; label: string; icon: typeof FolderOpen }> = [
  { id: 'game', label: 'Игровой клиент', icon: FolderOpen },
  { id: 'server', label: 'Сервер', icon: Server },
  { id: 'updates', label: 'Обновления', icon: Download },
  { id: 'about', label: 'О лаунчере', icon: Info },
];

export function SettingsModal({ open, onClose }: Props) {
  const config = useLauncherStore((s) => s.config);
  const updateConfig = useLauncherStore((s) => s.updateConfig);
  const runCheck = useUpdateStore((s) => s.runCheck);
  const phase = useUpdateStore((s) => s.phase);
  const manifest = useUpdateStore((s) => s.manifest);
  const installedVersion = useUpdateStore((s) => s.installedVersion);

  const [activeSection, setActiveSection] = useState<Section>('game');
  const [gamePathDraft, setGamePathDraft] = useState(config.game_path);
  const [savedFlash, setSavedFlash] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (open) {
      setGamePathDraft(config.game_path);
      setActiveSection('game');
    }
  }, [open, config.game_path]);

  const handlePickFolder = async () => {
    try {
      const folder = await pickFolder();
      if (folder) {
        setGamePathDraft(folder);
        await updateConfig({ game_path: folder });
        flashSaved();
      }
    } catch (err) {
      console.error('Pick folder failed', err);
    }
  };

  const handleSavePath = async () => {
    await updateConfig({ game_path: gamePathDraft.trim() });
    flashSaved();
  };

  const handleOpenFolder = async () => {
    const path = gamePathDraft.trim();
    if (!path) return;
    try {
      await openInShell(path);
    } catch (err) {
      console.error('Open folder failed', err);
    }
  };

  const handleCheckNow = async () => {
    setChecking(true);
    try {
      await runCheck(true);
    } finally {
      setChecking(false);
    }
  };

  const flashSaved = () => {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1600);
  };

  const openLink = async (url: string) => {
    try {
      await openInShell(url);
    } catch (err) {
      console.error('Open link failed', err);
    }
  };

  const pathChanged = gamePathDraft.trim() !== config.game_path;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-abyss/80 backdrop-blur-md" />

          <motion.div
            className="relative w-[820px] max-w-full h-[560px] max-h-[90vh] glass-strong rounded-[24px] overflow-hidden shadow-glass flex"
            initial={{ scale: 0.95, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 16, opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Левая колонка — список секций */}
            <div className="w-56 shrink-0 border-r border-white/[0.06] p-3 flex flex-col">
              <div className="px-3 pt-3 pb-5">
                <h2 className="font-display text-lg tracking-wide text-white">Настройки</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Valheim Rouge</p>
              </div>

              <div className="flex flex-col gap-1">
                {SECTIONS.map(({ id, label, icon: Icon }) => {
                  const isActive = activeSection === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveSection(id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 text-left ${
                        isActive
                          ? 'bg-white/[0.07] text-white'
                          : 'text-slate-400 hover:bg-white/[0.03] hover:text-white'
                      }`}
                    >
                      <Icon size={16} strokeWidth={1.6} />
                      <span className="font-medium">{label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-auto px-3 py-3 text-[10px] font-mono text-slate-600">
                v{LAUNCHER_VERSION}
              </div>
            </div>

            {/* Правая часть — контент активной секции */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Верхняя панель с кнопкой закрытия */}
              <div className="flex items-center justify-end px-5 pt-4 pb-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                  title="Закрыть"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Скроллируемый контент */}
              <div className="flex-1 overflow-y-auto vr-scroll px-6 pb-6">
                {activeSection === 'game' && (
                  <SectionGame
                    draft={gamePathDraft}
                    onChange={setGamePathDraft}
                    onPick={handlePickFolder}
                    onOpen={handleOpenFolder}
                    onSave={handleSavePath}
                    pathChanged={pathChanged}
                    savedFlash={savedFlash}
                  />
                )}
                {activeSection === 'server' && <SectionServer />}
                {activeSection === 'updates' && (
                  <SectionUpdates
                    phase={phase}
                    manifestVersion={manifest?.version ?? null}
                    installedVersion={installedVersion}
                    onCheckNow={handleCheckNow}
                    checking={checking}
                  />
                )}
                {activeSection === 'about' && (
                  <SectionAbout onOpenLink={openLink} />
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// Секция: Игровой клиент
// ============================================================

interface SectionGameProps {
  draft: string;
  onChange: (v: string) => void;
  onPick: () => void;
  onOpen: () => void;
  onSave: () => void;
  pathChanged: boolean;
  savedFlash: boolean;
}

function SectionGame({ draft, onChange, onPick, onOpen, onSave, pathChanged, savedFlash }: SectionGameProps) {
  return (
    <div className="space-y-6">
      <Header title="Игровой клиент" subtitle="Путь к папке с установленным Valheim" />

      <div className="space-y-3">
        <Label text="Папка с игрой" />
        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Z:\Games\Valheim"
            className="flex-1 px-4 py-3 rounded-xl bg-abyss/60 border border-white/[0.08] text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-blizzard/50 transition-colors"
          />
          <button
            type="button"
            onClick={onPick}
            className="px-4 py-3 rounded-xl border border-white/[0.08] text-sm text-slate-300 hover:bg-white/5 hover:border-white/20 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <FolderOpen size={15} />
            Выбрать
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={onOpen}
          disabled={!draft.trim()}
          className="px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm text-slate-300 hover:bg-white/5 hover:border-white/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <FolderOpen size={15} />
          Открыть папку
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!pathChanged}
          className={`px-4 py-2.5 rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 ${
            savedFlash
              ? 'bg-emerald text-abyss'
              : 'bg-gold text-abyss hover:shadow-glow-gold'
          }`}
        >
          {savedFlash ? <Check size={15} /> : null}
          {savedFlash ? 'Сохранено' : 'Сохранить путь'}
        </button>
      </div>

      <Hint>
        В папке должен лежать файл <code className="font-mono text-gold">valheim.exe</code>.
        Если игра ещё не установлена, пропустите этот шаг — путь можно задать после установки.
      </Hint>
    </div>
  );
}

// ============================================================
// Секция: Сервер
// ============================================================

function SectionServer() {
  const config = useLauncherStore((s) => s.config);
  const updateConfig = useLauncherStore((s) => s.updateConfig);
  const [draft, setDraft] = useState(config.server_address);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(config.server_address);
  }, [config.server_address]);

  const handleSave = async () => {
    await updateConfig({ server_address: draft.trim() });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  const changed = draft.trim() !== config.server_address;

  return (
    <div className="space-y-6">
      <Header title="Сервер" subtitle="Адрес игрового сервера для подключения" />

      <div className="space-y-3">
        <Label text="Адрес сервера" />
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="85.198.70.143:2456"
          className="w-full px-4 py-3 rounded-xl bg-abyss/60 border border-white/[0.08] text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-blizzard/50 transition-colors font-mono"
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!changed}
        className={`px-4 py-2.5 rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 ${
          saved ? 'bg-emerald text-abyss' : 'bg-gold text-abyss hover:shadow-glow-gold'
        }`}
      >
        {saved ? <Check size={15} /> : null}
        {saved ? 'Сохранено' : 'Сохранить адрес'}
      </button>

      <Hint>
        Статус подключения отображается в верхней панели.
        Проверка выполняется автоматически каждые 15 секунд.
      </Hint>
    </div>
  );
}

// ============================================================
// Секция: Обновления
// ============================================================

interface SectionUpdatesProps {
  phase: string;
  manifestVersion: string | null;
  installedVersion: string;
  onCheckNow: () => void;
  checking: boolean;
}

function SectionUpdates({ phase, manifestVersion, installedVersion, onCheckNow, checking }: SectionUpdatesProps) {
  const phaseText: Record<string, string> = {
    idle: 'Не проверялось',
    checking: 'Проверка...',
    'needs-install': 'Требуется установка',
    'needs-update': 'Доступно обновление',
    downloading: 'Загрузка файлов',
    unpacking: 'Распаковка',
    ready: 'Актуальная версия',
    error: 'Ошибка обновления',
  };

  const phaseColor: Record<string, string> = {
    idle: 'text-slate-400',
    checking: 'text-blizzard',
    'needs-install': 'text-blizzard',
    'needs-update': 'text-gold',
    downloading: 'text-blizzard',
    unpacking: 'text-gold',
    ready: 'text-emerald',
    error: 'text-blood',
  };

  return (
    <div className="space-y-6">
      <Header title="Обновления" subtitle="Проверка и установка файлов игры" />

      <div className="grid grid-cols-2 gap-3">
        <InfoCell label="Версия на сервере" value={manifestVersion ?? '—'} mono />
        <InfoCell label="Установленная версия" value={installedVersion || '—'} mono />
      </div>

      <div className="glass rounded-xl p-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-semibold mb-1">
            Текущий статус
          </div>
          <div className={`text-sm font-medium ${phaseColor[phase] ?? 'text-slate-300'}`}>
            {phaseText[phase] ?? phase}
          </div>
        </div>
        <button
          type="button"
          onClick={onCheckNow}
          disabled={checking || phase === 'downloading' || phase === 'unpacking'}
          className="px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm text-slate-300 hover:bg-white/5 hover:border-white/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <RefreshCw size={15} className={checking ? 'animate-spin' : ''} />
          {checking ? 'Проверка...' : 'Проверить сейчас'}
        </button>
      </div>

      <Hint>
        При запуске лаунчер автоматически проверяет версию на сервере.
        Если файлы устарели — появится кнопка «Обновить» в нижней панели.
      </Hint>
    </div>
  );
}

// ============================================================
// Секция: О лаунчере
// ============================================================

function SectionAbout({ onOpenLink }: { onOpenLink: (url: string) => void }) {
  return (
    <div className="space-y-6">
      <Header title="О лаунчере" subtitle="Информация и ссылки" />

      <div className="glass rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold to-[#b8941f] flex items-center justify-center font-display font-black text-abyss text-xl">
            VR
          </div>
          <div>
            <h3 className="font-display text-lg text-white tracking-wide">Valheim Rouge</h3>
            <p className="text-xs text-slate-500 font-mono">Версия {LAUNCHER_VERSION}</p>
          </div>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">
          Десктопный лаунчер для игрового сервера Valheim Rouge.
          Автоматическая установка, обновления и запуск игры.
        </p>
      </div>

      <div className="space-y-2">
        <Label text="Ссылки" />
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onOpenLink(COMMUNITY_LINKS.discord)}
            className="px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm text-slate-300 hover:bg-white/5 hover:border-white/20 transition-all flex items-center gap-2"
          >
            <MessageCircle size={15} />
            Discord
          </button>
          <button
            type="button"
            onClick={() => onOpenLink(COMMUNITY_LINKS.telegram)}
            className="px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm text-slate-300 hover:bg-white/5 hover:border-white/20 transition-all flex items-center gap-2"
          >
            <Globe size={15} />
            Telegram
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Мелкие переиспользуемые компоненты
// ============================================================

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="font-display text-xl text-white tracking-wide">{title}</h2>
      <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
    </div>
  );
}

function Label({ text }: { text: string }) {
  return (
    <div className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-semibold">
      {text}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs text-slate-500 leading-relaxed border-l-2 border-white/[0.06] pl-3">
      {children}
    </div>
  );
}

function InfoCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold mb-1.5">
        {label}
      </div>
      <div className={`text-sm text-slate-200 truncate ${mono ? 'font-mono' : ''}`} title={value}>
        {value}
      </div>
    </div>
  );
}
