/** Production build and installable Progressive Web App configuration. */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // GitHub Pages hosts the site below the repository name, not at the domain root.
  base: '/reviewer-organizer/',
  plugins: [
    react(),
    VitePWA({
      // The manifest controls how the app looks when installed on a phone/desktop.
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
      // Workbox caches the compiled app shell so it can launch while offline.
      workbox: { globPatterns: ['**/*.{js,css,html,svg}'] },
    }),
  ],
})
