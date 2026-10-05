// SettingsModal — экран настроек (п. 3.5 ТЗ):
// выбор папки с игрой через нативный диалог Tauri + ручной ввод пути.
// Всё сохраняется в config.json немедленно при закрытии.
import { useEffect, useState, type ReactNode } from 'react';
import { FolderOpen, Gamepad2 } from 'lucide-react';
import { VRButton, VRModal } from './ui';
import { pickFolder } from '../lib/api';
import { useLauncherStore } from '../store/useLauncherStore';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const config = useLauncherStore((s) => s.config);
  const updateConfig = useLauncherStore((s) => s.updateConfig);
  // Локальный черновик: редактируем его, а в стор пишем только при «Сохранить»
  const [gamePath, setGamePath] = useState(config.game_path);

  // Синхронизируем черновик, когда модалку открыли заново
  const handleAfterOpenChange = (next: boolean) => {
    if (next) setGamePath(config.game_path);
  };

  const handlePick = async () => {
    const selected = await pickFolder();
    if (selected) setGamePath(selected);
  };

  const handleSave = async () => {
    await updateConfig({ game_path: gamePath.trim() });
    onClose();
  };

  return (
    <VRModalWithSync open={open} onClose={onClose} onVisibility={handleAfterOpenChange}>
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Gamepad2 size={16} className="text-blizzard" />
          <span>Укажите папку, внутри которой лежит <b>valheim.exe</b></span>
        </div>

        {/* Поле пути + кнопка системного диалога выбора папки */}
        <div className="flex gap-2">
          <input
            value={gamePath}
            onChange={(e) => setGamePath(e.target.value)}
            placeholder="Z:\Games\Valheim"
            className="vr-input vr-selectable font-mono text-sm"
          />
          <VRButton variant="ghost" onClick={() => void handlePick()} title="Выбрать папку">
            <FolderOpen size={16} />
          </VRButton>
        </div>

        <p className="text-xs leading-relaxed text-slate-500">
          Настройки хранятся в файле{' '}
          <code className="vr-selectable rounded bg-black/40 px-1.5 py-0.5 text-gold/80">
            %APPDATA%/ValheimRouge/config.json
          </code>{' '}
          и загружаются при каждом запуске лаунчера.
        </p>

        <div className="flex justify-end gap-2 pt-1">
          <VRButton variant="ghost" onClick={onClose}>
            Отмена
          </VRButton>
          <VRButton onClick={() => void handleSave()}>Сохранить</VRButton>
        </div>
      </div>
    </VRModalWithSync>
  );
}

/* ---------- Внутренняя обёртка ----------
   Добавляет к VRModal заголовок «НАСТРОЙКИ» и сбрасывает черновик
   пути при каждом повторном открытии модалки (через useEffect). */

function VRModalWithSync(props: {
  open: boolean;
  onClose: () => void;
  onVisibility: (open: boolean) => void;
  children: ReactNode;
}) {
  // При каждом открытии сбрасываем черновик к актуальному конфигу
  useEffect(() => {
    props.onVisibility(props.open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open]);

  return (
    <VRModal open={props.open} title="НАСТРОЙКИ" onClose={props.onClose}>
      {props.children}
    </VRModal>
  );
}
