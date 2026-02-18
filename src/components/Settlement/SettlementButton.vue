<template>
  <button 
    class="settlement-button"
    @click="$emit('click')"
  >
    <span class="button-text">結算</span>
  </button>
</template>

<script setup lang="ts">
defineEmits<{
  click: []
}>()
</script>

<style scoped>
.settlement-button {
  @apply fixed bottom-0 left-0 right-0;
  @apply h-16 bg-blue-600 text-white;
  @apply flex items-center justify-center;
  @apply font-semibold text-lg;
  @apply hover:bg-blue-700 active:bg-blue-800;
  @apply transition-colors shadow-lg;
  @apply z-40;
}

.button-text {
  @apply text-white;
}
</style>
