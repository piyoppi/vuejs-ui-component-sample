import { ModuleInfo } from 'rollup'
import { Plugin } from 'vite'

import { join, dirname } from 'path'
import { simple } from 'acorn-walk'

type ExtractingInfo = {
  id: string,
  replacement: string,
}

export const CssCombinedPlugin = (): Plugin  => {
  const extractingIds: ExtractingInfo[] = []
  const cssCombinedDependencies = new Map<string, string[]>()
  let count = 0

  return {
    name: 'css-combined-plugin',

    transform(code, id) {
      const hasCssFunction = code.match(/getCombinedCss\((.*)\)/)
      let transformedCode = code

      if (hasCssFunction) {
        const parsed = this.parse(code) as any
        const hasIncluded = parsed.body.some((item: any) => item.type === 'ImportDeclaration' && item.specifiers.find((item: any) => item.type === 'ImportSpecifier' && item.imported.name === 'getCombinedCss'))

        if (hasIncluded) {
          simple(parsed, {
            CallExpression(node: any) {
              if (node.callee.name === 'getCombinedCss') {
                const { start, end } = node
                const replacement = `'' /* CssCombinedPlugin -- ${count++} */`
                transformedCode = code.slice(0, start) + replacement + code.slice(end)

                const targetId = join(dirname(id), node.arguments[0].value)
                extractingIds.push({
                  id: targetId,
                  replacement
                })
              }
            }
          })
        }
      }

      return transformedCode
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
