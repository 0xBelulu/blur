import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// ======== 真机联调开关（临时） ========
// true  = 所有 npm run dev 都以 HTTPS + 局域网启动（手机陀螺仪调试需要 secure context）
// false = 恢复默认的 http + localhost
// 调试结束后把这里改回 false 即可
const LAN_DEBUG_DEFAULT = true

// 环境变量可临时覆盖：LAN=1 强制开启，LAN=0 强制关闭（优先于上面的默认值）
const envLan = process.env.LAN
const lanDebug = envLan === '0' ? false : envLan === '1' ? true : LAN_DEBUG_DEFAULT

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), ...(lanDebug ? [basicSsl()] : [])],
  server: {
    host: lanDebug,
    proxy: { '/api': 'http://127.0.0.1:18788' },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-framer';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-lucide';
          }
        },
      },
    },
  },
})
