import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** GitHub Pages project sites live under /<repo>/; only apply in CI (not on Vercel/Netlify). */
function basePath(): string {
  if (process.env.VITE_BASE_PATH) {
    const b = process.env.VITE_BASE_PATH.trim()
    return b.endsWith('/') ? b : `${b}/`
  }
  if (process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_REPOSITORY) {
    const repo = process.env.GITHUB_REPOSITORY.split('/')[1]
    if (repo) return `/${repo}/`
  }
  return '/'
}

// https://vite.dev/config/
export default defineConfig({
  base: basePath(),
  plugins: [react(), tailwindcss()],
  server: {
    // Downloads / iCloud / some network folders do not emit reliable FS events; polling fixes HMR.
    watch: { usePolling: true, interval: 150 },
    // Avoid stale JS/CSS in embedded browsers and aggressive caches while developing.
    headers: { 'Cache-Control': 'no-store' },
  },
})
