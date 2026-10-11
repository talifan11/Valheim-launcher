import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, Upload, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import * as api from '../../lib/api';
import { useProfileStore } from '../../store/useProfileStore';
import { useLauncherStore } from '../../store/useLauncherStore';
import { toast } from '../../store/useToastStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export function BannerUploadModal({ open, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bannerUrl = useProfileStore((s) => s.bannerUrl);
  const setBannerUrl = useProfileStore((s) => s.setBannerUrl);
  const token = useLauncherStore((s) => s.authToken);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    setError(null);
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!ALLOWED.includes(f.type)) {
      setError('Только PNG, JPG или WEBP');
      return;
    }
    if (f.size > MAX_SIZE) {
      setError('Файл больше 5 MB');
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  };

  const handleSave = async () => {
    if (!file || !token) return;
    setBusy(true);
    setError(null);
    try {
      const url = await api.uploadBanner(file, token);
      setBannerUrl(url);
      toast.success('Шапка обновлена');
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await api.deleteBanner(token);
      setBannerUrl(null);
      toast.info('Шапка удалена');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  const currentBanner = api.resolveAvatarUrl(bannerUrl);

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <div className="absolute inset-0 modal-backdrop" />
          <motion.div
            className="relative w-[560px] max-w-full glass-popover rounded-[24px] overflow-hidden"
            initial={{ scale: 0.94, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 12, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-white">Шапка профиля</h3>
              <button
                type="button"
                onClick={handleClose}
                disabled={busy}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center gap-4">
              {/* Превью */}
              <div className="w-full h-32 rounded-2xl overflow-hidden bg-abyss ring-1 ring-white/10">
                {preview ? (
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                ) : currentBanner ? (
                  <img src={currentBanner} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blizzard/10 via-abyss to-abyss">
                    <ImageIcon size={24} className="text-slate-700" />
                  </div>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handlePick}
              />

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.10] text-slate-200 hover:bg-white/5 transition-colors text-sm disabled:opacity-50"
              >
                <ImageIcon size={15} />
                Выбрать файл
              </button>

              <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                PNG, JPG или WEBP · до 5 MB<br />
                Картинка обрежется до 1200×400
              </p>

              {error && (
                <p className="text-xs text-blood text-center">{error}</p>
              )}
            </div>

            <div className="p-4 border-t border-white/[0.06] flex gap-2 items-center">
              {bannerUrl && !preview && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-blood hover:bg-blood/10 transition-colors text-xs uppercase tracking-wider font-semibold disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Удалить
                </button>
              )}
              <div className="flex-1" />
              <button
                type="button"
                onClick={handleSave}
                disabled={!file || busy}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-abyss font-bold text-xs uppercase tracking-[0.12em] hover:shadow-glow-gold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Сохранить
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
