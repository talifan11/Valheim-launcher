import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Hash, MessageCircle, Trash2, Eraser } from 'lucide-react';
import { useChatStore, type ChatChannel } from '../../store/useChatStore';

interface ChannelContextMenu {
  channelId: string;
  channelKind: 'general' | 'dm';
  channelTitle: string;
  x: number;
  y: number;
}

export function ChatPanel() {
  const open = useChatStore((s) => s.open);
  const channels = useChatStore((s) => s.channels);
  const activeChannelId = useChatStore((s) => s.activeChannelId);
  const setActiveChannel = useChatStore((s) => s.setActiveChannel);
  const messages = useChatStore((s) => s.messages);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const unread = useChatStore((s) => s.unread);
  const clearChannel = useChatStore((s) => s.clearChannel);
  const deleteChannel = useChatStore((s) => s.deleteChannel);

  const [draft, setDraft] = useState('');
  const [contextMenu, setContextMenu] = useState<ChannelContextMenu | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const channelMessages = messages[activeChannelId] ?? [];

  useEffect(() => {
    if (scrollRef.current && open) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [channelMessages.length, open, activeChannelId]);

  // Закрытие контекстного меню по клику мимо
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('contextmenu', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('contextmenu', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [contextMenu]);

  const handleSend = () => {
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChannelContext = (e: React.MouseEvent, channel: ChatChannel) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      channelId: channel.id,
      channelKind: channel.kind,
      channelTitle: channel.title,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleClear = () => {
    if (!contextMenu) return;
    clearChannel(contextMenu.channelId);
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (!contextMenu || contextMenu.channelKind === 'general') return;
    deleteChannel(contextMenu.channelId);
    setContextMenu(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed right-4 bottom-[76px] z-[150] w-[360px] h-[520px] flex flex-col glass-popover rounded-[24px] overflow-hidden"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {/* Хедер */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] shrink-0">
              <MessageCircle size={16} className="text-blizzard" />
              <span className="text-sm font-semibold text-white">Чат</span>
              <span className="ml-auto text-[10px] text-slate-600 font-mono">
                ПКМ по каналу — действия
              </span>
            </div>

            {/* Список каналов */}
            <div className="flex gap-1 px-3 py-2 border-b border-white/[0.06] overflow-x-auto scrollbar-hide shrink-0">
              {channels.map((channel) => {
                const isActive = channel.id === activeChannelId;
                const unreadCount = unread[channel.id] ?? 0;
                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => setActiveChannel(channel.id)}
                    onContextMenu={(e) => handleChannelContext(e, channel)}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-gold text-abyss'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {channel.kind === 'general' ? <Hash size={11} /> : null}
                    <span>{channel.title}</span>
                    {unreadCount > 0 && !isActive && (
                      <span className="ml-1 min-w-[16px] h-4 px-1 rounded-full bg-blood text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Сообщения */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto vr-scroll px-3 py-3 space-y-3">
              {channelMessages.length === 0 && (
                <div className="text-center text-slate-500 text-xs py-8">
                  {activeChannel?.kind === 'dm'
                    ? `Начните переписку с ${activeChannel.title}`
                    : 'Пока никого нет'}
                </div>
              )}

              {channelMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.own ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {!msg.own && (
                    <div className="w-7 h-7 rounded-full border border-white/15 bg-abyss flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-slate-200">
                        {msg.authorName[0]}
                      </span>
                    </div>
                  )}
                  <div className={`max-w-[78%] ${msg.own ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!msg.own && (
                      <span className="text-[10px] text-slate-500 mb-0.5 font-semibold">
                        {msg.authorName}
                      </span>
                    )}
                    <div
                      className={`px-3 py-2 rounded-2xl text-[13px] leading-snug break-words ${
                        msg.own
                          ? 'bg-gold text-abyss rounded-br-md'
                          : 'bg-white/[0.05] text-slate-200 rounded-bl-md border border-white/[0.05]'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-600 mt-0.5 font-mono">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Поле ввода */}
            <div className="p-3 border-t border-white/[0.06] shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    activeChannel?.kind === 'dm'
                      ? `Написать ${activeChannel.title}...`
                      : 'Сообщение в общий чат...'
                  }
                  rows={1}
                  className="flex-1 resize-none px-3 py-2 rounded-xl bg-abyss/60 border border-white/[0.08] text-[13px] text-slate-100 placeholder:text-slate-600 outline-none focus:border-blizzard/50 transition-colors max-h-[100px] vr-scroll"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!draft.trim()}
                  className="w-9 h-9 rounded-xl bg-gold text-abyss flex items-center justify-center hover:shadow-glow-gold transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  title="Отправить"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Контекстное меню канала */}
          <AnimatePresence>
            {contextMenu && (
              <motion.div
                className="fixed z-[300] w-52 glass-popover rounded-2xl overflow-hidden"
                style={{ left: contextMenu.x, top: contextMenu.y }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-2 border-b border-white/[0.06] flex items-center gap-2">
                  {contextMenu.channelKind === 'general' && (
                    <Hash size={11} className="text-slate-500" />
                  )}
                  <span className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-bold truncate">
                    {contextMenu.channelTitle}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleClear}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/[0.05] transition-colors text-left"
                >
                  <Eraser size={15} className="text-gold" />
                  Очистить историю
                </button>

                {contextMenu.channelKind === 'dm' && (
                  <>
                    <div className="h-px bg-white/[0.06]" />
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-blood hover:bg-blood/10 transition-colors text-left"
                    >
                      <Trash2 size={15} />
                      Удалить чат
                    </button>
                  </>
                )}

                {contextMenu.channelKind === 'general' && (
                  <div className="px-3 py-2 text-[10px] text-slate-600 border-t border-white/[0.06] font-mono">
                    Общий чат защищён от удаления
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
