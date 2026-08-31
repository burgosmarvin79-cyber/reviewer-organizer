import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/reviewer-organizer/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'reviewer-logo.jpg'],
      manifest: {
        name: 'Reviewer Organizer',
        short_name: 'Reviewer',
        description: 'Organize subjects, reviewers, notes, and mastery-based practice tests.',
        theme_color: '#10233f',
        background_color: '#f7f4ec',
        display: 'standalone',
        start_url: '/reviewer-organizer/',
        scope: '/reviewer-organizer/',
        icons: [{ src: '/reviewer-organizer/reviewer-logo.jpg', sizes: '2048x2048', type: 'image/jpeg', purpose: 'any maskable' }],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg}'] },
    }),
  ],
})
