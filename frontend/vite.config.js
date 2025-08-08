import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      // Proxy API requests to the backend server
      '/api': {
        target: 'http://localhost:5000', // Your backend server URL
        changeOrigin: true,
        secure: false,
      },
    },
  },
});