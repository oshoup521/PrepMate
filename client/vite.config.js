import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.svg', 'pwa-192.svg', 'pwa-512.svg'],
      manifest: {
        name: 'PrepMate - AI Interview Coach',
        short_name: 'PrepMate',
        description: 'Practice job interviews with an AI-powered coach. Get instant feedback and improve your skills.',
        theme_color: '#537D5D',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/dashboard',
        icons: [
          {
            src: 'pwa-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'pwa-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'pwa-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
        categories: ['education', 'productivity'],
        lang: 'en',
      },
      workbox: {
        // Pre-cache all built JS, CSS, HTML and static assets
        globPatterns: ['**/*.{js,css,html,svg,ico,woff,woff2}'],
        // Skip waiting so the new SW activates immediately on update
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // API responses: network-first (fresh data when online, fallback to cache offline)
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/interview') ||
              url.pathname.startsWith('/auth') ||
              url.pathname.startsWith('/users'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts (if ever used)
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      // Dev options — enable SW in development for testing
      devOptions: {
        enabled: false, // Set to true to test SW locally
        type: 'module',
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    cors: true,
    allowedHosts: [
      'crack-leading-feline.ngrok-free.app',
      'localhost',
      '127.0.0.1',
      '.ngrok.io',
      '.ngrok-free.app',
    ],
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
    cors: true,
    allowedHosts: [
      'crack-leading-feline.ngrok-free.app',
      'localhost',
      '127.0.0.1',
      '.ngrok.io',
      '.ngrok-free.app',
    ],
  },
})
