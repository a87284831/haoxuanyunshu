import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: '/app/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        // 本地开发代理：/api 请求转发到本地后端（php artisan serve --port=8899）
        target: 'http://127.0.0.1:8899',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: '../public/app',
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
  },
})
