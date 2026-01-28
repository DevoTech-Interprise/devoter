import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/', // 👈 corresponde ao RewriteBase do .htaccess
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1000, // Aumentar limite para 1000kB
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar bibliotecas grandes em chunks distintos
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react', 'react-toastify'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'map-vendor': ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
})
