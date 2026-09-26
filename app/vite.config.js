// Vite is our build tool. In development (`npm run dev`) it serves the app
// and instantly reloads the page when you save a file. For production
// (`npm run build`) it bundles everything into small files in dist/, which
// is what Vercel hosts.
//
// The react() plugin teaches Vite how to understand JSX.
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
