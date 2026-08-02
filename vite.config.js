import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', // Cambia si despliegas en subdirectorio
  server: {
    port: 3000
  }
})
