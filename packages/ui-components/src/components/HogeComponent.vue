<template>
  <div class="hoge">
    <h1>{{ msg }}</h1>
    <p>
      <button type="button" @click="count++">count is {{ count }}</button>
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'HogeComponent',
  props: {
    msg: {
      type: String,
      required: true,
    },
  },
  setup() {
    const count = ref(0)
    return { count }
  },
})
</script>

<style scoped>
.hoge {
  color: #888;
}
</style>
