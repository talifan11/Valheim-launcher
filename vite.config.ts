import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Конфигурация Vite для фронтенда лаунчера Valheim Rouge.
// settings.build.target = esnext — важно для Tauri (современный WebView).
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
});
