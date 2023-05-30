import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { AutoStyleLoadPlugin } from './src/AutoStyleLoad'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), AutoStyleLoadPlugin()],
})
