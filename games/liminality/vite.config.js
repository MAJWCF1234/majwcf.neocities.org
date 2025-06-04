import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 3000
  },
  assetsInclude: ['**/*.jpg', '**/*.png', '**/*.mp3'],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        pools: resolve(__dirname, 'pools/index.html'),
        deepPools: resolve(__dirname, 'deep-pools/index.html'),
        habitableZone: resolve(__dirname, 'habitable-zone/index.html')
      }
    }
  },
  publicDir: 'public'
});