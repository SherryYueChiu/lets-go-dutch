<template>
  <div class="person-card-container">
    <!-- 人员名称（可点击改名） -->
    <div class="person-name-section" @click="handleNameClick">
      <span class="person-emoji-large">{{ person.emoji }}</span>
      <h2 class="person-name-title">{{ person.name }}</h2>
      <span class="edit-hint">點擊改名</span>
    </div>

    <!-- 记账板块 -->
    <div class="expense-section">
      <button 
        class="add-expense-btn"
        @click="$emit('add-expense')"
      >
        <span class="add-icon">+</span>
        <span class="add-text">記帳</span>
      </button>
    </div>

    <!-- 帳目列表 -->
    <div class="expenses-list">
      <div
        v-for="expense in personExpenses"
        :key="expense.id"
        class="expense-item"
        @click="$emit('view-expense', expense.id)"
      >
        <div class="expense-info">
          <div class="expense-description">{{ expense.description }}</div>
          <div class="expense-amount">${{ expense.totalAmount.toFixed(2) }}</div>
        </div>
        <div class="expense-meta">
          <span class="expense-date">{{ formatDate(expense.createdAt) }}</span>
        </div>
      </div>
      
      <div v-if="personExpenses.length === 0" class="empty-state">
        <p class="empty-text">還沒有帳目</p>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { Person, Expense } from '@/types'
import { computed } from 'vue'

const props = defineProps<{
  person: Person
  expenses: Expense[]
}>()

const emit = defineEmits<{
  'name-click': []
  'add-expense': []
  'view-expense': [expenseId: string]
}>()

// 获取该人员相关的账目（作为付款人或分账人）
const personExpenses = computed(() => {
  return props.expenses.filter(expense => {
    // 是付款人（支持多人支付）
    if (expense.payers && expense.payers.length > 0) {
      if (expense.payers.some(payer => payer.personId === props.person.id)) return true
    } else if (expense.payerId === props.person.id) {
      return true
    }
    // 是分账人
    return expense.splits.some(split => split.personId === props.person.id)
  })
})

function handleNameClick() {
  emit('name-click')
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${month}/${day}`
}
</script>

<style scoped>
.person-card-container {
  @apply w-full h-full flex flex-col;
  @apply px-4 py-6;
}

.person-name-section {
  @apply flex flex-col items-center mb-6 cursor-pointer;
  @apply py-4 px-6 rounded-xl;
  @apply hover:bg-gray-50 active:bg-gray-100 transition-colors;
}

.person-emoji-large {
  @apply text-6xl mb-2;
}

.person-name-title {
  @apply text-2xl font-bold text-gray-900 mb-1;
}

.edit-hint {
  @apply text-sm text-gray-500;
}

.expense-section {
  @apply mb-4;
}

.add-expense-btn {
  @apply w-full flex items-center justify-center gap-2;
  @apply py-4 px-6 rounded-xl border-2 border-dashed border-gray-300;
  @apply bg-white hover:bg-gray-50 active:bg-gray-100;
  @apply transition-colors cursor-pointer;
}

.add-icon {
  @apply text-2xl text-gray-400 font-light;
}

.add-text {
  @apply text-lg text-gray-600 font-medium;
}

.expenses-list {
  @apply flex-1 overflow-y-auto space-y-3 mb-4;
}

.expense-item {
  @apply p-4 rounded-xl bg-white border border-gray-200;
  @apply hover:bg-gray-50 active:bg-gray-100;
  @apply transition-colors cursor-pointer;
}

.expense-info {
  @apply flex items-center justify-between mb-2;
}

.expense-description {
  @apply text-base font-medium text-gray-900;
}

.expense-amount {
  @apply text-lg font-semibold text-gray-900;
}

.expense-meta {
  @apply flex items-center justify-between;
}

.expense-date {
  @apply text-sm text-gray-500;
}

.empty-state {
  @apply py-12 text-center;
}

.empty-text {
  @apply text-gray-400;
}

</style>
