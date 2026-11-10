import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'icon-180.png', 'icon-64.png'],
      manifest: {
        name: 'PediaCalc EC — Calculadora Pediátrica',
        short_name: 'PediaCalc',
        description: 'Dosis, líquidos, deshidratación, curvas OMS y nutrición parenteral. Funciona sin internet.',
        lang: 'es-EC',
        theme_color: '#1f5f86',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'] }
    })
  ]
});
