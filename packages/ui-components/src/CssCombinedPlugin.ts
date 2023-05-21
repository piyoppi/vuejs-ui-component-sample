import { ModuleInfo } from 'rollup'
import { Plugin } from 'vite'

import { join, dirname } from 'path'
import { simple } from 'acorn-walk'

type ReplaceMarker = {
  extractingComponentId: string,
  marker: string,
}

type CssImportStatementInfo = {
  id: string,
  argument: string,
}

const FUNC_NAME = 'getCombinedCss'
const FUNC_NAME_PROMISE = 'getCombinedCssPromise'
const CSS_ID_PREFIX = 'CssCombinedPluginPromise'

export const CssCombinedPlugin = (): Plugin  => {
  const replaceMarkers: ReplaceMarker[] = []
  const cssDependencies = new Map<string, string[]>()
  const cssImports = new Map<string, CssImportStatementInfo>()
  let count = 0

  const isReplacedCssImport = (id: string) => cssImports.has(id)
  const createCssImportId = () => `${CSS_ID_PREFIX}${count++}`

  return {
    name: 'css-combined-plugin',

    resolveId(id) {
      if (isReplacedCssImport(id)) {
        return id
      }

      return null
    },

    load(id) {
      if (isReplacedCssImport(id)) {
        const item = cssImports.get(id) 

        if (!item) return

        const marker = `'' /* CssCombinedPluginPlace(Promise) -- ${count++} */`

        replaceMarkers.push({
          extractingComponentId: join(dirname(item.id), item.argument),
          marker
        })

        return `export default ${marker};`
      }
    },

    transform(code, id) {
      const hasCssFunction = code.match(new RegExp(`${FUNC_NAME}\((.*)\)`)) || code.match(new RegExp(`${FUNC_NAME_PROMISE}\((.*)\)`))

      // 置換対象の関数の文字列がない場合は何もしない
      if (!hasCssFunction) return null

      let transformedCode = code
      const parsed = this.parse(code) as any

      const hasIncluded = parsed.body.some((item: any) => item.type === 'ImportDeclaration' && item.specifiers.find((item: any) => item.type === 'ImportSpecifier' && item.imported.name === FUNC_NAME))
      const hasIncludedPromise = parsed.body.some((item: any) => item.type === 'ImportDeclaration' && item.specifiers.find((item: any) => item.type === 'ImportSpecifier' && item.imported.name === FUNC_NAME_PROMISE))

      // 置換対象の関数をインポートしていない場合は何もしない
      if (!hasIncluded && !hasIncludedPromise) return null

      const nodes: any[] = []

      simple(parsed, {
        CallExpression(node: any) {
          if (node.callee.name === FUNC_NAME && hasIncluded) {
            nodes.push(node)
          }

          if (node.callee.name === FUNC_NAME_PROMISE && hasIncludedPromise) {
            nodes.push(node)
          }
        }
      })

      // ソースコードを置換する（マーカーを置く）
      // ソースコードを後ろから置換することで、置換箇所のインデックスがずれないようにする
      nodes.sort((a: any, b: any) => b.start - a.start).forEach((node: any) => {
        const { start, end } = node

        if (node.callee.name === FUNC_NAME) {
          const marker = `'' /* CssCombinedPluginPlace -- ${count++} */`
          transformedCode = transformedCode.slice(0, start) + marker + transformedCode.slice(end)

          replaceMarkers.push({
            extractingComponentId: join(dirname(id), node.arguments[0].value),
            marker
          })
        }

        if (node.callee.name === FUNC_NAME_PROMISE) {
          const importId = createCssImportId()

          // 動的インポートに置換する
          // load で動的インポートしたファイルを置換する
          const importStatement = `import('${importId}')`
          transformedCode = transformedCode.slice(0, start) + importStatement + transformedCode.slice(end)

          cssImports.set(importId, {id: id, argument: node.arguments[0].value as string})
        }
      })

      return transformedCode
    },

    buildEnd() {
      // 指定したモジュールに依存する CSS ファイルを取得する
      const getCssDependencies = (currentModle: ModuleInfo): string[] => {
        return [
          ...currentModle.importedIds.filter(id => id.match(/\.css$/)),
            ...currentModle.importedIds.map(id => {
            const nextModule = this.getModuleInfo(id)
            if (!nextModule) return ''

              return getCssDependencies(nextModule)
          }).filter(item => !!item).flat()
        ]
      }

      Array.from(this.getModuleIds()).forEach(id => {
        const moduleInfo = this.getModuleInfo(id)
        if (!moduleInfo) return
        cssDependencies.set(id, getCssDependencies(moduleInfo))
      })
    },

    renderChunk(code, _chunk) {
      // 設置されたマーカーを置換する
      return replaceMarkers.reduce((acc, { extractingComponentId, marker }) => {
        if (!code.includes(marker)) return acc

        const css = cssDependencies.get(extractingComponentId)?.reduce((acc, id) => acc + this.getModuleInfo(id)?.code?.replace(/export default "(.*)"/, '$1'), '') || '""'
        return acc.replace(marker, `"${css}"`)
      }, code)
    }
  }
}
