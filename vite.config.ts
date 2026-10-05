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
    // Windows: без этого Vite и Cargo одновременно лезут в src-tauri/target
    // и сборка падает с EBUSY: resource busy or locked
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
});
