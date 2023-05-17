import Container from './components/Container.vue'
import HelloWorld from './components/HelloWorld.vue'
import { defineCustomElement } from 'vue'

export { Container }

import 'virtual-module'

const ce = defineCustomElement(Container)
customElements.define('my-container', ce)

const ce2 = defineCustomElement(HelloWorld)
customElements.define('my-container2', ce2)
