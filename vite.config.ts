import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

export default defineConfig({
  plugins: [svelte()],
  root: 'src/renderer',
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, './src/renderer/lib'),
      $components: path.resolve(__dirname, './src/renderer/components'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
})
