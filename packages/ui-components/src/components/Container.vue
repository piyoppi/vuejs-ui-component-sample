<script setup lang="ts">
import ContainerInner from './ContainerInner.vue'
</script>

<template>
<div class="container-outer">
  <container-inner msg="hogefuga"></container-inner>  
</div>
</template>

<style scoped>
.container-outer {
  width: 100%;
  height: 100%;
  background-color: #fff;
}
</style>
