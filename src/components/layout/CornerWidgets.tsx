import { open } from '@tauri-apps/plugin-shell';
import { Globe, MessageCircle } from 'lucide-react';

export function CornerWidgets() {
  const openSite = () => {
    open('https://github.com/talifan11/Valheim-launcher').catch((err) => {
      console.error('Open site failed', err);
    });
  };

  const btnClass =
    'w-10 h-10 md:w-11 md:h-11 rounded-full glass flex items-center justify-center text-slate-400 hover:text-white hover:scale-110 transition-all duration-200 shadow-glass pointer-events-auto';

  return (
    <>
      <button
        type="button"
        onClick={openSite}
        className={`${btnClass} absolute bottom-6 left-3 md:left-4 animate-fade-in-up`}
        style={{ animationDelay: '0.3s' }}
        title="Сайт проекта"
      >
        <Globe size={18} />
      </button>
      <button
        type="button"
        className={`${btnClass} absolute bottom-6 right-3 md:right-4 animate-fade-in-up hidden sm:flex`}
        style={{ animationDelay: '0.35s' }}
        title="Чат скоро"
      >
        <MessageCircle size={18} />
      </button>
    </>
  );
}
