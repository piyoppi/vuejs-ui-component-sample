import { Plugin, defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

import dts from 'vite-plugin-dts'

import { OutputChunk } from 'rollup'

//import styles from 'rollup-plugin-styles'

const __dirname = dirname(fileURLToPath(import.meta.url))

const extracted = new Map<string, string>()
let cnt = 0

const plugin = (): Plugin => ({
  name: 'my-plugin',

  async transform(code, id) {
    if (id.endsWith('.css')) {
      extracted.set(id, code)
    }
  },

  generateBundle(_options, bundle) {
    const chunks = Object.entries(bundle).map(([key, value]) => value.type === 'chunk' ? value : null).filter(item => !!item)

    chunks.forEach(chunk => {
      const findDepententCss = (currentChunk: OutputChunk) => {
        return [
          ...Object.keys(currentChunk.modules).filter((key) => key.endsWith('.css')),
          ...chunk.imports.map(id => findDepententCss())
        ]

        //return [...chunks.filter(c => c.imports.some(id => id.endsWith('.css'))), ...findDepententCss(currentChunk)].flat()
      }

      const dependedCssIds = [
        //...Object.keys(chunk.modules).filter((key) => key.endsWith('.css')),
        ...findDepententCss(chunk)
      ]
      console.log(dependedCssIds)

      const dependedCssList = dependedCssIds.map(id => extracted.get(id))
      dependedCssList.forEach(css => this.emitFile({type: 'asset', name: `styles${cnt++}.css`, source: css}))
    })
  }
})

export default defineConfig({
  build: {
    lib: {
      entry: [
        resolve(__dirname, 'src/components/Container.vue'),
        resolve(__dirname, 'src/components/ContainerInner.vue')
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
    cssCodeSplit: false,
  },
  plugins: [
    vue(),
    dts(),
    plugin(),
    //styles({
    //  mode: 'extract'
    //})
  ],
})

