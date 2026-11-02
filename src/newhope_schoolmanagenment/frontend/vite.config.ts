import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

const apiTarget = process.env.VITE_DEV_API_TARGET ?? 'http://127.0.0.1:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    proxy: {
      '/auth': { target: apiTarget, changeOrigin: true },
      '/students': { target: apiTarget, changeOrigin: true },
      '/teacher': { target: apiTarget, changeOrigin: true },
      '/dos': { target: apiTarget, changeOrigin: true },
      '/public': { target: apiTarget, changeOrigin: true },
      '/health': { target: apiTarget, changeOrigin: true },
    },
  },
})
