import Container from './components/Container.vue'
import HelloWorld from './components/HelloWorld.vue'
import { defineCustomElement } from 'vue'
import { getCombinedCss, getCombinedCssPromise } from './CssCombinedPluginBrowser'
export { Container }

const css = getCombinedCss('./components/Container.vue')
const css2 = getCombinedCssPromise('./components/ContainerInner.vue').then(css => console.log(css))
console.log(css2)

const ce = defineCustomElement({...Container, styles: [css]} as any)
customElements.define('my-container', ce)

const ce2 = defineCustomElement(HelloWorld)
customElements.define('my-container2', ce2)
