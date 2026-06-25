import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/inconcert': {
        target: 'https://cls59-dal.i6.inconcert.cloud',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
