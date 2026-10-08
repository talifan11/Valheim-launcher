import { MessageCircle, X } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';

export function CornerWidgets() {
  const toggleChat = useChatStore((s) => s.toggle);
  const chatOpen = useChatStore((s) => s.open);
  const totalUnread = useChatStore((s) =>
    Object.values(s.unread).reduce((sum, n) => sum + n, 0)
  );

  return (
    <button
      type="button"
      onClick={() => toggleChat()}
      className={`absolute bottom-6 right-4 z-[160] w-11 h-11 rounded-full glass flex items-center justify-center shadow-glass pointer-events-auto transition-all duration-200 hover:scale-110 animate-fade-in-up ${
        chatOpen
          ? 'text-white border-blood/40 hover:border-blood/60'
          : 'text-slate-400 hover:text-white'
      }`}
      style={{ animationDelay: '0.35s' }}
      title={chatOpen ? 'Закрыть чат' : 'Открыть чат'}
      data-onboarding="chat-button"
    >
      {chatOpen ? <X size={18} /> : <MessageCircle size={18} />}

      {totalUnread > 0 && !chatOpen && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blood text-white text-[10px] font-bold flex items-center justify-center shadow-lg">
          {totalUnread}
        </span>
      )}
    </button>
  );
}
