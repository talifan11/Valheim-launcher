import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
import { useForumStore } from '../../store/useForumStore';
import { toast } from '../../store/useToastStore';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (threadId: number) => void;
}

export function CreateThreadModal({ open, onClose, onCreated }: Props) {
  const categories = useForumStore((s) => s.categories);
  const createThread = useForumStore((s) => s.createThread);

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setCategoryId(null);
    setTitle('');
    setBody('');
    setError(null);
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!categoryId) {
      setError('Выбери категорию');
      return;
    }
    if (title.trim().length < 3) {
      setError('Заголовок минимум 3 символа');
      return;
    }
    if (body.trim().length < 5) {
      setError('Сообщение минимум 5 символов');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const id = await createThread(categoryId, title.trim(), body.trim());
      toast.success('Тред создан');
      reset();
      onCreated?.(id);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка создания';
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
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
            className="relative w-[560px] glass-popover rounded-[24px] overflow-hidden"
            initial={{ scale: 0.94, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 12, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-white">Новый тред</h3>
              <button
                type="button"
                onClick={handleClose}
                disabled={busy}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.16em] font-bold text-slate-500 block mb-2">
                  Категория
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                        categoryId === c.id
                          ? 'bg-gold text-abyss'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {c.title}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.16em] font-bold text-slate-500 block mb-2">
                  Заголовок
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  disabled={busy}
                  placeholder="О чём тред?"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-gold/40 transition-colors disabled:opacity-50"
                />
                <div className="text-[10px] text-slate-600 mt-1 text-right font-mono">
                  {title.length} / 120
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.16em] font-bold text-slate-500 block mb-2">
                  Сообщение
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={5000}
                  disabled={busy}
                  rows={6}
                  placeholder="Расскажи подробнее..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-gold/40 transition-colors resize-none disabled:opacity-50"
                />
                <div className="text-[10px] text-slate-600 mt-1 text-right font-mono">
                  {body.length} / 5000
                </div>
              </div>

              {error && <p className="text-xs text-blood text-center">{error}</p>}
            </div>

            <div className="p-4 border-t border-white/[0.06] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 transition-colors text-[11px] uppercase tracking-[0.12em] font-semibold disabled:opacity-40"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={busy}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-abyss font-bold text-[11px] uppercase tracking-[0.12em] hover:shadow-glow-gold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Опубликовать
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
