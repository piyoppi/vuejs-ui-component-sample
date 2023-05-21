<script setup lang="ts">
import { defineProps } from 'vue'

defineProps<{ msg: string }>()
</script>

<template>
  <div class="container-inner">
    {{ msg }} 
  </div>
</template>

<style scoped>
.container-inner {
  width: 100%;
  height: 100%;
  color: blue;
}
</style>
