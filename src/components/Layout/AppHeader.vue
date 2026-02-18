<template>
  <header class="app-header">
    <div class="header-left">
      <span class="person-emoji">{{ currentPerson?.emoji || '👤' }}</span>
      <span class="person-name">{{ currentPerson?.name || '未選擇' }}</span>
    </div>
    <button 
      class="header-icon-btn"
      @click="$emit('open-grid')"
      aria-label="開啟人員網格"
    >
      <svg class="grid-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3H10V10H3V3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 3H21V10H14V3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 14H21V21H14V14Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 14H10V21H3V14Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </header>
</template>

<script setup lang="ts">
import type { Person } from '@/types'

defineProps<{
  currentPerson: Person | null
}>()

defineEmits<{
  'open-grid': []
}>()
</script>

<style scoped>
.app-header {
  @apply fixed top-0 left-0 right-0 h-14 bg-white shadow-sm z-50;
  @apply flex items-center justify-between px-4;
}

.header-left {
  @apply flex items-center gap-2;
}

.person-emoji {
  @apply text-2xl;
}

.person-name {
  @apply text-lg font-semibold text-gray-900;
}

.header-icon-btn {
  @apply w-11 h-11 flex items-center justify-center;
  @apply rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}

.grid-icon {
  @apply w-6 h-6 text-gray-600;
}
</style>
