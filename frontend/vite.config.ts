import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Caserito MVP',
        short_name: 'Caserito',
        theme_color: '#0d9488',
        background_color: '#ffffff',
        display: 'standalone',
        icons: []
      }
    })
  ],
  server: {
    port: 5173
  }
});
