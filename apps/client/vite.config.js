import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      /**
       * For convenience, forward "/colyseus" requests to the local Colyseus server.
       */
      '/colyseus': {
        target: 'http://localhost:2567',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/colyseus/, ''),
      },
      '/discord_token': {
        target: 'http://localhost:2567',
        changeOrigin: true,
      },
    },

    allowedHosts: [
      'localhost',
      '.trycloudflare.com',
      '.ngrok-free.app',
    ],
  },
})
