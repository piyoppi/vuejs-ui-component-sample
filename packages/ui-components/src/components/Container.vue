<script setup lang="ts">
import ContainerInner from './ContainerInner.vue'
</script>

<template>
<div class="container-outer">
  <p>outer</p>
  <container-inner>inner</container-inner>  
</div>
</template>

<style scoped>
.container-outer {
  background-color: gainsboro;
}
</style>
