import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: '/endless/admin/',
  plugins: [vue()],
  server: {
    proxy: {
      '/endless/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    }
  }
})
