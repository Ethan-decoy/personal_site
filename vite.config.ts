import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { notesManifestPlugin } from './scripts/notes-manifest-plugin'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.BASE_URL || '/',
  plugins: [notesManifestPlugin(), react(), tailwindcss()],
})
