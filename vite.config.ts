import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Relative asset URLs so the build works at a domain root (Vercel, Netlify)
  // and from a GitHub Pages project subpath such as /Envguard/.
  base: './',
  plugins: [react(), tailwindcss()],
});
