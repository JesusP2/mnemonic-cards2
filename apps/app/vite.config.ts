import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/server': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/server/, ''),
        secure: false,
      },
    },
  },
});
