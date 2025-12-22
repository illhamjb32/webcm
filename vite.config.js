import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/webcm/', // sesuai nama repo
  plugins: [react()],
  build: { outDir: "docs" },
})
