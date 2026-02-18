<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="person-grid-overlay" @click.self="$emit('close')">
        <div class="person-grid-modal">
          <!-- 标题栏 -->
          <div class="modal-header">
            <h2 class="modal-title">選擇人員</h2>
            <button 
              class="close-btn"
              @click="$emit('close')"
              aria-label="關閉"
            >
              <svg class="close-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <!-- 网格区域 -->
          <div class="grid-container">
            <!-- 人员卡片 -->
            <div
              v-for="person in people"
              :key="person.id"
              class="person-card"
              :class="{ 'current-person': person.id === currentPersonId }"
              @click="handleSelectPerson(person.id)"
            >
              <div class="person-emoji-large">{{ person.emoji }}</div>
              <div class="person-name-text">{{ person.name }}</div>
            </div>

            <!-- 新增卡片 -->
            <div
              class="person-card add-card"
              @click="handleAddPerson"
            >
              <div class="add-icon">+</div>
              <div class="add-text">新增人員</div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Person } from '@/types'

defineProps<{
  people: Person[]
  currentPersonId: string | null
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  selectPerson: [personId: string]
  addPerson: []
}>()

function handleSelectPerson(personId: string) {
  emit('selectPerson', personId)
  emit('close')
}

function handleAddPerson() {
  emit('addPerson')
  emit('close')
}
</script>

<style scoped>
.person-grid-overlay {
  @apply fixed inset-0 bg-black/50 z-50;
  @apply flex items-center justify-center;
}

.person-grid-modal {
  @apply w-full h-full bg-white;
  @apply flex flex-col;
}

.modal-header {
  @apply flex items-center justify-between px-4 h-14 border-b border-gray-200;
}

.modal-title {
  @apply text-lg font-semibold text-gray-900;
}

.close-btn {
  @apply w-10 h-10 flex items-center justify-center;
  @apply rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.close-icon {
  @apply w-5 h-5 text-gray-600;
}

.grid-container {
  @apply flex-1 overflow-y-auto p-4;
  @apply grid grid-cols-2 gap-4;
  /* 平板：3列 */
  @apply md:grid-cols-3;
}

.person-card {
  @apply flex flex-col items-center justify-center;
  @apply p-4 rounded-xl border-2 border-gray-200;
  @apply bg-white hover:bg-gray-50 active:scale-95;
  @apply transition-all cursor-pointer;
  min-height: 140px;
}

.person-card.current-person {
  @apply border-blue-500 bg-blue-50;
}

.person-emoji-large {
  @apply text-5xl mb-2;
}

.person-name-text {
  @apply text-base font-medium text-gray-900;
}

.add-card {
  @apply border-dashed border-gray-300;
}

.add-icon {
  @apply text-6xl text-gray-400 mb-2;
  @apply font-light leading-none;
}

.add-text {
  @apply text-base text-gray-500;
}

/* 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
