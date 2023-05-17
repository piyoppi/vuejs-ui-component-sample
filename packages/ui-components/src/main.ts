import Container from './components/Container.vue'
import { defineCustomElement } from 'vue'

export { Container }

import 'virtual-module'

const ce = defineCustomElement(Container)
console.log(Container)
customElements.define('my-container', ce)
