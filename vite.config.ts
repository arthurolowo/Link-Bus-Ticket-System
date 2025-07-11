import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import sharedConfig from './vite.shared';

// https://vitejs.dev/config/
export default defineConfig({
  ...sharedConfig,
  plugins: [react()],
  root: 'client',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
    },
  },
  css: {
    postcss: {
      config: path.resolve(__dirname, 'postcss.config.js'),
    },
  },
  build: {
    outDir: '../dist/server/public',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
