import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

import dts from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    lib: {
      entry: [
        resolve(__dirname, 'src/components/HelloWorld.vue'),
        resolve(__dirname, 'src/components/HogeComponent.vue'),
      ],
      name: 'MyLib',
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.${format}.js`,
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      }
    },
    cssCodeSplit: true,
  },
  plugins: [vue(), dts()],
})

