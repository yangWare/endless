import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: '/endless/admin/',
  plugins: [vue()],
  server: {
    port: 5174,
    proxy: {
      '/endless/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    }
  }
})
