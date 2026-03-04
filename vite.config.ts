import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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