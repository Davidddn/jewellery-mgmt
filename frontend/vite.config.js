import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: true,
    hmr: {
      port: 3003,
      host: 'localhost'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/]
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('@tanstack/react-query')) {
              return 'query';
            }
            if (id.includes('@mui')) {
              return 'mui';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            return 'vendor';
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  optimizeDeps: {
    include: ['@tanstack/react-query']
  }
});