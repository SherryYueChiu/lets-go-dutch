<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="expense-list-overlay" @click.self="handleClose">
        <div class="expense-list-modal">
          <!-- 标题栏 -->
          <div class="modal-header">
            <h2 class="modal-title">帳目明細</h2>
            <button 
              class="close-btn"
              @click="handleClose"
              aria-label="關閉"
            >
              <svg class="close-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <!-- 内容区域 -->
          <div class="modal-content">
            <div v-if="sortedExpenses.length === 0" class="empty-state">
              <p class="empty-text">還沒有任何帳目</p>
            </div>
            
            <div v-else class="expenses-list">
              <div
                v-for="expense in sortedExpenses"
                :key="expense.id"
                class="expense-card"
                @click="handleExpenseClick(expense.id)"
              >
                <!-- 顶部：项目说明和总金额 -->
                <div class="expense-header">
                  <div class="expense-description">{{ expense.description }}</div>
                  <div class="expense-total">${{ expense.totalAmount.toFixed(2) }}</div>
                </div>

                <!-- 付款人信息 -->
                <div class="expense-payers">
                  <span class="label">付款：</span>
                  <div class="payers-list">
                    <template v-if="getPayers(expense).length > 0">
                      <span
                        v-for="(payer, index) in getPayers(expense)"
                        :key="payer.personId"
                        class="payer-item"
                      >
                        <span v-if="index > 0" class="separator">、</span>
                        {{ getPersonById(payer.personId)?.emoji }} {{ getPersonById(payer.personId)?.name }}
                        <span class="payer-amount">${{ payer.amount.toFixed(2) }}</span>
                      </span>
                    </template>
                    <span v-else class="no-payer">無付款人</span>
                  </div>
                </div>

                <!-- 分账明细 -->
                <div class="expense-splits">
                  <span class="label">分帳：</span>
                  <div class="splits-list">
                    <template v-if="expense.splits.length > 0">
                      <span
                        v-for="(split, index) in expense.splits"
                        :key="split.personId"
                        class="split-item"
                        :class="{ 'paid': split.paid }"
                      >
                        <span v-if="index > 0" class="separator">、</span>
                        {{ getPersonById(split.personId)?.emoji }} {{ getPersonById(split.personId)?.name }}
                        <span class="split-amount">${{ split.amount.toFixed(2) }}</span>
                        <span v-if="split.paid" class="paid-badge">已付</span>
                      </span>
                    </template>
                    <span v-else class="no-split">無分帳人</span>
                  </div>
                </div>

                <!-- 消费日期 -->
                <div class="expense-date">
                  {{ formatExpenseDate(expense.expenseDate || expense.createdAt) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Expense, ExpensePayer, Person } from '@/types'

const props = defineProps<{
  visible: boolean
  expenses: Expense[]
  people: Person[]
}>()

const emit = defineEmits<{
  close: []
  viewExpense: [expenseId: string]
}>()

// 按日期排序（最新的在前）
const sortedExpenses = computed(() => {
  return [...props.expenses].sort((a, b) => {
    const dateA = a.expenseDate ? new Date(a.expenseDate).getTime() : new Date(a.createdAt).getTime()
    const dateB = b.expenseDate ? new Date(b.expenseDate).getTime() : new Date(b.createdAt).getTime()
    return dateB - dateA
  })
})

function getPersonById(personId: string): Person | undefined {
  return props.people.find(p => p.id === personId)
}

function getPayers(expense: Expense): ExpensePayer[] {
  if (expense.payers && expense.payers.length > 0) {
    return expense.payers
  } else if (expense.payerId) {
    // 兼容旧数据
    return [{
      personId: expense.payerId,
      amount: expense.totalAmount
    }]
  }
  return []
}

function formatExpenseDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${year}/${month}/${day}`
}

function handleClose() {
  emit('close')
}

function handleExpenseClick(expenseId: string) {
  emit('viewExpense', expenseId)
  handleClose()
}
</script>

<style scoped>
.expense-list-overlay {
  @apply fixed inset-0 bg-black/50 z-50;
  @apply flex items-center justify-center p-4;
}

.expense-list-modal {
  @apply w-full max-w-2xl bg-white rounded-xl shadow-xl;
  @apply flex flex-col max-h-[90vh];
}

.modal-header {
  @apply flex items-center justify-between px-6 py-4 border-b border-gray-200;
}

.modal-title {
  @apply text-lg font-semibold text-gray-900;
}

.close-btn {
  @apply w-8 h-8 flex items-center justify-center;
  @apply rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors;
}

.close-icon {
  @apply w-5 h-5 text-gray-600;
}

.modal-content {
  @apply flex-1 overflow-y-auto px-6 py-4;
}

.empty-state {
  @apply py-12 text-center;
}

.empty-text {
  @apply text-gray-500;
}

.expenses-list {
  @apply space-y-3;
}

.expense-card {
  @apply p-4 rounded-xl bg-white border border-gray-200;
  @apply hover:bg-gray-50 active:bg-gray-100;
  @apply transition-colors cursor-pointer;
}

.expense-header {
  @apply flex items-center justify-between mb-3;
}

.expense-description {
  @apply text-base font-semibold text-gray-900;
}

.expense-total {
  @apply text-lg font-bold text-blue-600;
}

.expense-payers,
.expense-splits {
  @apply mb-2 text-sm;
}

.label {
  @apply text-gray-600 font-medium mr-2;
}

.payers-list,
.splits-list {
  @apply inline-flex flex-wrap items-center;
}

.payer-item,
.split-item {
  @apply inline-flex items-center gap-1;
}

.payer-item {
  @apply px-2 py-1 rounded-md;
  @apply bg-blue-50 text-gray-900;
}

.separator {
  @apply text-gray-400 mx-1;
}

.no-payer,
.no-split {
  @apply text-gray-400 italic;
}

.split-item.paid {
  @apply bg-gray-100 opacity-75;
}

.payer-amount,
.split-amount {
  @apply font-semibold text-gray-700;
}

.paid-badge {
  @apply ml-1 px-1.5 py-0.5 text-xs;
  @apply bg-green-100 text-green-700 rounded;
  @apply font-medium;
}

.expense-date {
  @apply text-xs text-gray-500 mt-2;
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
