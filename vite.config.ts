import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: './',
  plugins: [vue()],
  server: { port: 5173, open: false },
  build: { target: 'es2020', chunkSizeWarningLimit: 1500 },
});
