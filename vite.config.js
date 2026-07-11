import { defineConfig } from 'vite';

export default defineConfig({
  // base relativo para que funcione tanto en localhost como subido a itch.io / un subpath.
  base: './',
  server: {
    open: true,
    port: 5173,
  },
});
