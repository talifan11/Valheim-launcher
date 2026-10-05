/** @type {import('tailwindcss').Config} */
export default {
  // Подключаем все tsx-файлы src и наш шрифтовой/цветовой CSS-кит из index.css
  content: ['./index.html', './src/**/*.{ts,tsx}', './src/index.css'],
  theme: {
    extend: {
      // Цветовая палитра в стиле Blizzard / Battle.net
      colors: {
        abyss: '#05070d',        // почти чёрный фон приложения
        panel: '#0b1018',        // панели чуть светлее фона
        steel: '#141b26',        // карточки / инпуты
        edge: '#232c3b',         // обводки / границы
        blizzard: {              // акцентный «битвовый» синий
          DEFAULT: '#0e9cff',
          dark: '#0a6fc2',
          glow: 'rgba(14, 156, 255, 0.45)',
        },
        gold: {                  // золотой акцент (как у legendary-предметов)
          DEFAULT: '#ffc24b',
          dark: '#c98f1e',
        },
        emerald: '#2fbf71',      // статус Online
        blood: '#ff5566',        // статус Offline / ошибки
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],       // заголовки — эпичный «фэнтезийный» шрифт
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 24px rgba(14, 156, 255, 0.35)',
        'glow-gold': '0 0 24px rgba(255, 194, 75, 0.35)',
      },
    },
  },
  plugins: [],
};
