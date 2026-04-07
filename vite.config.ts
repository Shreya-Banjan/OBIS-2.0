import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Downloads / iCloud / some network folders do not emit reliable FS events; polling fixes HMR.
    watch: { usePolling: true, interval: 150 },
    // Avoid stale JS/CSS in embedded browsers and aggressive caches while developing.
    headers: { 'Cache-Control': 'no-store' },
  },
})
