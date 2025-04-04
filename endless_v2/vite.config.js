import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
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
})
