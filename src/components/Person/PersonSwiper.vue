<template>
  <div class="person-swiper-container">
    <div 
      class="person-swiper-wrapper"
      :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <!-- 人员卡片 -->
      <div
        v-for="person in people"
        :key="person.id"
        class="person-swiper-slide"
      >
        <PersonCard
          :person="person"
          :expenses="expenses"
          :net-amount="getNetAmount(person.id)"
          @name-click="$emit('edit-person-name', person.id)"
          @add-expense="$emit('add-expense', person.id)"
          @view-expense="$emit('view-expense', $event)"
        />
      </div>

      <!-- 新增人员卡片 -->
      <div class="person-swiper-slide">
        <div class="add-person-card" @click="$emit('add-person')">
          <div class="add-person-icon">+</div>
          <div class="add-person-text">新增人員</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Person, Expense, SettlementResult } from '@/types'
import PersonCard from './PersonCard.vue'

const props = defineProps<{
  people: Person[]
  expenses: Expense[]
  currentIndex: number
  settlements: SettlementResult[]
}>()

const emit = defineEmits<{
  'update:currentIndex': [index: number]
  'add-person': []
  'edit-person-name': [personId: string]
  'add-expense': [personId: string]
  'view-expense': [expenseId: string]
}>()

// 触摸滑动相关
const touchStartX = ref(0)
const touchStartY = ref(0)
const isDragging = ref(false)

function handleTouchStart(e: TouchEvent) {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
  isDragging.value = false
}

function handleTouchMove(e: TouchEvent) {
  if (!isDragging.value) {
    const deltaX = Math.abs(e.touches[0].clientX - touchStartX.value)
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.value)
    // 如果水平移动大于垂直移动，认为是滑动
    if (deltaX > deltaY && deltaX > 10) {
      isDragging.value = true
    }
  }
}

function handleTouchEnd(e: TouchEvent) {
  if (!isDragging.value) return

  const touchEndX = e.changedTouches[0].clientX
  const deltaX = touchStartX.value - touchEndX
  const threshold = 50 // 滑动阈值

  if (Math.abs(deltaX) > threshold) {
    const totalSlides = props.people.length + 1 // 包括新增卡片
    let newIndex = props.currentIndex

    if (deltaX > 0) {
      // 向左滑动，显示下一个
      newIndex = Math.min(props.currentIndex + 1, totalSlides - 1)
    } else {
      // 向右滑动，显示上一个
      newIndex = Math.max(props.currentIndex - 1, 0)
    }

    emit('update:currentIndex', newIndex)
  }

  isDragging.value = false
}

function getNetAmount(personId: string): number | null {
  const settlement = props.settlements.find(s => s.personId === personId)
  return settlement ? settlement.netAmount : null
}
</script>

<style scoped>
.person-swiper-container {
  @apply w-full h-full overflow-hidden;
}

.person-swiper-wrapper {
  @apply flex h-full transition-transform duration-300 ease-out;
}

.person-swiper-slide {
  @apply w-full h-full flex-shrink-0;
}

.add-person-card {
  @apply w-full h-full flex flex-col items-center justify-center;
  @apply bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl;
  @apply cursor-pointer hover:bg-gray-100 active:bg-gray-200;
  @apply transition-colors;
}

.add-person-icon {
  @apply text-8xl text-gray-400 mb-4;
  @apply font-light leading-none;
}

.add-person-text {
  @apply text-xl text-gray-600 font-medium;
}
</style>
