import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig({ plugins: [react(), tailwindcss(), VitePWA({ registerType: 'prompt', injectRegister: null, manifest: { name: 'Sortides', short_name: 'Sortides', description: 'Outings for Herb and Lynne', theme_color: '#1f4e79', background_color: '#ffffff', display: 'standalone', icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }, { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }] } })] })

