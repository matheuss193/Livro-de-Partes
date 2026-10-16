import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // O app atualiza sozinho quando há versão nova e abre offline depois da primeira visita.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo-cbmpa.png', 'logo-defesa-civil.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ttf}'],
        // O PDF (fontes embutidas) é pesado: precisa estar no cache para funcionar offline.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      manifest: {
        name: 'Livro de Partes Digital – CBMPA',
        short_name: 'Livro de Partes',
        description: 'Parte do Comandante do Socorro – 9º GBM / CBMPA',
        lang: 'pt-BR',
        theme_color: '#1b3f8f',
        background_color: '#f6f4f0',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
