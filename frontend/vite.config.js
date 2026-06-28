import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Refricop Gestión',
        short_name: 'Refricop',
        description: 'Gestión de servicios y técnicos a domicilio',
        theme_color: '#0b0f19',
        background_color: '#0b0f19',
        display: 'standalone',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/1950/1950715.png', // Icono provisional
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
