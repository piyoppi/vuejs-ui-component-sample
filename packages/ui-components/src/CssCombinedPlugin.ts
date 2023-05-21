import { ModuleInfo } from 'rollup'
import { Plugin } from 'vite'

import { join, dirname } from 'path'
import { simple } from 'acorn-walk'

type ExtractingInfo = {
  id: string,
  replacement: string,
}

type CssCombinedPromiseInfo = {
  id: string,
  argument: string,
}

export const CssCombinedPlugin = (): Plugin  => {
  const extractingIds: ExtractingInfo[] = []
  const cssCombinedDependencies = new Map<string, string[]>()
  const cssCombinedPromiseId = new Map<string, CssCombinedPromiseInfo>()
  let count = 0

  return {
    name: 'css-combined-plugin',

    resolveId(id) {
      if (id.match(/CssCombinedPluginPromise\d+/)) {
        return id
      }
    },

    load(id) {
      if (id.match(/CssCombinedPluginPromise\d+/)) {
        const item = cssCombinedPromiseId.get(id) 

        if (item) {
          const replacement = `'' /* CssCombinedPluginPlace -- ${count++} */`
          const code = `export default ${replacement};`

          const targetId = join(dirname(item.id), item.argument)
          extractingIds.push({
            id: targetId,
            replacement
          })

          return code
        }
      }
    },

    transform(code, id) {
      const hasCssFunction = code.match(/getCombinedCss\((.*)\)/)
      let transformedCode = code

      if (hasCssFunction) {
        const parsed = this.parse(code) as any

        const hasIncluded = parsed.body.some((item: any) => item.type === 'ImportDeclaration' && item.specifiers.find((item: any) => item.type === 'ImportSpecifier' && item.imported.name === 'getCombinedCss'))
        const hasIncludedPromise = parsed.body.some((item: any) => item.type === 'ImportDeclaration' && item.specifiers.find((item: any) => item.type === 'ImportSpecifier' && item.imported.name === 'getCombinedCssPromise'))

        if (!hasIncluded && !hasIncludedPromise) return null

        const nodes: any[] = []

        simple(parsed, {
          CallExpression(node: any) {
            if (hasIncluded && node.callee.name === 'getCombinedCss') {
              nodes.push(node)
            }

            if (hasIncludedPromise && node.callee.name === 'getCombinedCssPromise') {
              nodes.push(node)
            }
          }
        })

        nodes.sort((a: any, b: any) => b.start - a.start).forEach((node: any) => {
          const { start, end } = node

          if (node.callee.name === 'getCombinedCss') {
            const replacement = `'' /* CssCombinedPluginPlace -- ${count++} */`
            transformedCode = transformedCode.slice(0, start) + replacement + transformedCode.slice(end)

            const targetId = join(dirname(id), node.arguments[0].value)
            extractingIds.push({
              id: targetId,
              replacement
            })
          }

          if (node.callee.name === 'getCombinedCssPromise') {
            const importId = `CssCombinedPluginPromise${count++}`

            const importStatement = `import('${importId}')`
            transformedCode = transformedCode.slice(0, start) + importStatement + transformedCode.slice(end)

            cssCombinedPromiseId.set(importId, {id: id, argument: node.arguments[0].value as string})
          }
        })

        return transformedCode
      }
    },

    buildEnd() {
      const getDependencies = (currentModle: ModuleInfo): string[] => {
        return [
          ...currentModle.importedIds.filter(id => id.match(/\.css$/)),
            ...currentModle.importedIds.map(id => {
            const nextModule = this.getModuleInfo(id)
            if (!nextModule) return ''

              return getDependencies(nextModule)
          }).filter(item => !!item).flat()
        ]
      }

      const ids = this.getModuleIds()

      Array.from(ids).forEach(id => {
        const moduleInfo = this.getModuleInfo(id)
        if (!moduleInfo) return
          cssCombinedDependencies.set(id, getDependencies(moduleInfo))
      })
    },

    renderChunk(code, _chunk) {
      const css = extractingIds.reduce((acc, { id, replacement }) => {
        const dependencies = cssCombinedDependencies.get(id)
        if (!dependencies) return acc

          const css = dependencies.reduce((acc, id) => acc + this.getModuleInfo(id)?.code?.replace(/export default "(.*)"/, '$1'), '')
          return acc.replace(replacement, `"${css}"`)
      }, code)

      return css
    }
  }
}
