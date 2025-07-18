import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 5173, // Default Vite port
    strictPort: false, // Allow port change if 5173 is busy
    cors: true, // Enable CORS
    allowedHosts: [
      'crack-leading-feline.ngrok-free.app',
      'localhost',
      '127.0.0.1',
      '.ngrok.io',
      '.ngrok-free.app'
    ],
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
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
      '.ngrok-free.app'
    ]
  }
})
