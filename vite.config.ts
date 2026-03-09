import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import pkg from './package.json'

const deployment = (pkg as { deployment?: { branch?: string; commitHash?: string } }).deployment

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __DEPLOYMENT_BRANCH__: JSON.stringify(deployment?.branch ?? ''),
    __DEPLOYMENT_COMMIT_HASH__: JSON.stringify(deployment?.commitHash ?? ''),
  },
  server: {
    proxy: {
      // Avoid CORS: browser calls same origin, Vite forwards to PeakD
      '/api/peakd': {
        target: 'https://peakd.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/peakd/, '/api/public/snaps'),
      },
    },
  },
})