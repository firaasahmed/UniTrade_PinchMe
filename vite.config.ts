import path from "node:path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    // PORT lets a harness place the dev server somewhere free; the api keeps 3001 via API_PORT
    port: Number(process.env.PORT) || 5173,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
})
