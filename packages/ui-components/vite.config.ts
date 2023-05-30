import { Plugin, defineConfig } from 'vite'
import { parse } from 'path'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

import { dirname, resolve, join } from 'path'
import { fileURLToPath } from 'url'

import { OutputChunk } from 'rollup'

const __dirname = dirname(fileURLToPath(import.meta.url))

const extracted = new Map<string, string>()

const plugin = (): Plugin => ({
  name: 'my-plugin',

  async transform(code, id) {
    if (id.endsWith('.css')) {
      extracted.set(id, code)
      return
    }
  },

  generateBundle(_options, bundle) {
    const chunks = Object.values(bundle)
    .map(value => value.type === 'chunk' ? value : null)
    .filter(item => !!item) as OutputChunk[]

    chunks.forEach(chunk => {
      const getDependencies = (regexp: RegExp, currentChunk: OutputChunk): string[] => {
        return [
          ...Object.keys(currentChunk.modules).filter(id => id.match(regexp)),
            ...currentChunk.imports.map(id => {
            const nextChunk = chunks.find(c => c.fileName === id)
            if (!nextChunk) return ''

              return getDependencies(regexp, nextChunk)
          }).filter(item => !!item).flat()
        ]
      }

      const dependedCssIds = getDependencies(/\.css$/g, chunk)
      const css = dependedCssIds.reduce((acc, id) => acc + extracted.get(id), '')
      const assetFilename = chunk.fileName.replace(join(__dirname, 'src'), '')

      if (css) {
        this.emitFile({type: 'asset', fileName: `${assetFilename}.css`, source: css})
      }
    })
  }
})

export default defineConfig({
  build: {
    lib: {
      entry: {
        'components/Container.vue': resolve(__dirname, 'src/components/Container.vue'),
        'components/ContainerInner.vue': resolve(__dirname, 'src/components/ContainerInner.vue'),
      },
      name: 'MyLib',
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    minify: false,
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      }
    },
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  plugins: [
    vue({
      customElement: true,
    }),
    plugin(),
    dts()
  ],
})

