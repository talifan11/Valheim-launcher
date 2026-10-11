import { useEffect, useState } from 'react';
import {
  Loader2, Send, Trash2, MessageSquare, AlertCircle,
} from 'lucide-react';
import * as api from '../../lib/api';
import { useLauncherStore } from '../../store/useLauncherStore';
import { Avatar } from '../ui/Avatar';
import { formatRelativeTime } from '../../lib/time';
import { toast } from '../../store/useToastStore';

interface Props {
  entryId: number;
  onCountChange?: (count: number) => void;
}

export function ChangelogComments({ entryId, onCountChange }: Props) {
  const token = useLauncherStore((s) => s.authToken);
  const myUserId = useLauncherStore((s) => s.userId);

  const [comments, setComments] = useState<api.ChangelogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.getChangelogComments(token, entryId);
      setComments(data);
      onCountChange?.(data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId, token]);

  const handleSubmit = async () => {
    if (!token) return;
    const body = text.trim();
    if (!body) return;
    if (body.length > 1000) {
      setError('Максимум 1000 символов');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.createChangelogComment(token, entryId, body);
      setText('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm('Удалить комментарий?')) return;
    try {
      await api.deleteChangelogComment(token, id);
      await load();
      toast.info('Комментарий удалён');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-white/[0.04]">
      {loading ? (
        <div className="flex items-center justify-center py-4 text-slate-500">
          <Loader2 size={14} className="animate-spin" />
        </div>
      ) : (
        <>
          {/* Список комментов */}
          {comments.length > 0 ? (
            <div className="space-y-2.5 mb-3">
              {comments.map((c) => {
                const isOwn = c.author.user_id === myUserId;
                return (
                  <div key={c.id} className="group flex items-start gap-2.5">
                    <Avatar
                      size={26}
                      avatarUrl={c.author.avatar_url}
                      friendId={`u-${c.author.user_id}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[12px] font-bold ${isOwn ? 'text-gold' : 'text-slate-300'}`}>
                          {c.author.username}
                        </span>
                        <span className="text-[10px] text-slate-600">
                          {formatRelativeTime(c.created_at)}
                        </span>
                        {isOwn && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-gold/60 bg-gold/5 px-1.5 py-0.5 rounded">
                            вы
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-slate-300 leading-relaxed mt-0.5 whitespace-pre-wrap break-words">
                        {c.body}
                      </p>
                    </div>
                    {isOwn && (
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-blood hover:bg-blood/10 opacity-0 group-hover:opacity-100 transition-all"
                        title="Удалить"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-slate-600 mb-3 pl-1">
              <MessageSquare size={11} />
              Пока никто не комментировал — будь первым
            </div>
          )}

          {/* Форма ввода */}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={busy}
                rows={1}
                maxLength={1000}
                placeholder="Написать комментарий... (Ctrl+Enter)"
                className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-3 py-2 text-[12px] text-slate-200 placeholder-slate-600 outline-none focus:border-gold/40 transition-colors resize-none min-h-[38px] max-h-32"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 128) + 'px';
                }}
              />
              {text.length > 0 && (
                <span className="absolute bottom-1 right-2 text-[9px] font-mono text-slate-700">
                  {text.length}/1000
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={busy || !text.trim()}
              className="shrink-0 w-9 h-9 rounded-xl bg-gold text-abyss flex items-center justify-center hover:shadow-glow-gold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="Отправить (Ctrl+Enter)"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-[11px] text-blood mt-2">
          <AlertCircle size={11} />
          {error}
        </div>
      )}
    </div>
  );
}
