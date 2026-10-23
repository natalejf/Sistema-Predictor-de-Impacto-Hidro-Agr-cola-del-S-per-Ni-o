import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Rutas relativas para compatibilidad total con GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
