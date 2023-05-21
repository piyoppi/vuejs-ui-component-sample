import { Plugin, defineConfig } from 'vite'
import { parse } from 'path'
import vue from '@vitejs/plugin-vue'

import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

import { OutputChunk } from 'rollup'
import { CssCombinedPlugin } from './src/CssCombinedPlugin'

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
      const assetFilename = parse(chunk.fileName).name.replace(/\..*/g, '')

      if (css) {
        this.emitFile({type: 'asset', fileName: `${assetFilename}.css`, source: css})
      }
    })
  }
})

export default defineConfig({
  build: {
    lib: {
      entry: [
        //resolve(__dirname, 'src/components/Container.vue'),
        //resolve(__dirname, 'src/components/ContainerInner.vue'),
        resolve(__dirname, 'src/main.ts')
      ],
      name: 'MyLib',
      formats: ['umd'],
      fileName: (format, entryName) => `${entryName}.${format}.js`,
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
      cssCodeSplit: false,
  },
  plugins: [
    vue({
      customElement: true,
    }),
    plugin(),
    CssCombinedPlugin()
  ],
})

