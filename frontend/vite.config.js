import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    /** Prefer 5174; if busy Vite uses the next port — always open the “Local:” URL from the terminal. */
    port: 5174,
    strictPort: false,
    host: true,
    /** Production builds write here — ignoring avoids bogus full reloads + confusing “reload dist/index.html” logs during dev. */
    watch: {
      ignored: ['**/dist/**'],
    },
  },
  /** Production preview (`npm run preview`) — different port so it’s not confused with dev. */
  preview: {
    port: 4173,
    host: true,
    strictPort: false,
  },
})
