import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    envPrefix: ['VITE_', 'GOOGLE_'],
    plugins: [react()],

    server: {
      host: true,           // expose on local network (for mobile testing)
      port: 5173,
      proxy: {
        // Proxies /api/* to your backend during development.
        // e.g. fetch('/api/students') → http://localhost:5000/api/students
        '/api': {
          target: env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:2424',
          changeOrigin: true,
          secure: false,
        }
      }
    },

    build: {
      outDir: 'dist',
      sourcemap: false,       // set true if you need production source maps
      chunkSizeWarningLimit: 600,
    }
  }
})
