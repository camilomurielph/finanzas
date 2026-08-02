// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/finanzas/', // ← cambia por el nombre exacto de tu repositorio
  server: { port: 3000 }
})
