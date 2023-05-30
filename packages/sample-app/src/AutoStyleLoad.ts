import { Plugin } from 'vite'

export const AutoStyleLoadPlugin = (): Plugin => ({
  name: 'my-plugin',

  async transform(code, id) {
    if (!id.endsWith('.ts')) return

    const parsed = this.parse(code) as any
    let transformedCode = code

    parsed.body
      .filter((item: any) => item.type === 'ImportDeclaration' && item.source?.value.includes('@piyoppi/ui-components/') && item.specifiers.find((item: any) => ['ImportSpecifier', 'ImportDefaultSpecifier'].includes(item.type)))
      .sort((a: any, b: any) => b.start - a.start)
      .forEach((node: any) => {
        const { start, end } = node
        const css = 'import "' + node.source.value.replace('@piyoppi/ui-components/', '@piyoppi/ui-components/dist/').replace('.vue', '.vue.js.css') + '"'
        transformedCode = transformedCode.slice(0, start) + css + transformedCode.slice(end)
      })

    return transformedCode
  }
})

