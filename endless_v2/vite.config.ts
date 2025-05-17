import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import type { UserConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/endless/static',
  plugins: [vue()],
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'assets': path.resolve(__dirname, 'src/assets')
    },
  },
  server: {
    proxy: {
      '/endless/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/endless/images': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
} as UserConfig) 