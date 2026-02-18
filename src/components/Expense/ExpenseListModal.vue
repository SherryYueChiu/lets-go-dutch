<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="expense-list-overlay" @click.self="handleClose">
        <div class="expense-list-modal">
          <!-- 标题栏 -->
          <div class="modal-header">
            <h2 class="modal-title">帳目明細</h2>
            <div class="header-actions">
              <button 
                class="action-btn share-btn"
                @click="handleShareClick"
                aria-label="分享"
              >
                <svg class="action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.22482 15.0257 5.44338 15.0732 5.65338L8.92682 9.34662C8.44338 8.52572 7.57628 8 6.5 8C4.567 8 3 9.567 3 11.5C3 13.433 4.567 15 6.5 15C7.57628 15 8.44338 14.4743 8.92682 13.6534L15.0732 17.3466C15.0257 17.5566 15 17.7752 15 18C15 19.6569 16.3431 21 18 21C19.6569 21 21 19.6569 21 18C21 16.3431 19.6569 15 18 15C16.3431 15 15 16.3431 15 18C15 18.2248 15.0257 18.4434 15.0732 18.6534L8.92682 14.9466C8.44338 15.7675 7.57628 16.2932 6.5 16.2932C4.567 16.2932 3 14.7262 3 12.7932C3 10.8602 4.567 9.29318 6.5 9.29318C7.57628 9.29318 8.44338 9.8189 8.92682 10.6398L15.0732 6.94662C15.0257 6.73662 15 6.51806 15 6.29324C15 4.63639 16.3431 3.29324 18 3.29324C19.6569 3.29324 21 4.63639 21 6.29324C21 8.22624 19.6569 9.79324 18 9.79324Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button 
                class="action-btn reset-btn"
                @click="handleResetClick"
                aria-label="重置"
              >
                <svg class="action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 4V10H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M23 20V14H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
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

                <!-- 付款和分账信息（左右布局） -->
                <div class="expense-split-info">
                  <!-- 左侧：付款者 -->
                  <div class="payers-section">
                    <div class="payers-list">
                      <template v-if="getPayers(expense).length > 0">
                        <span
                          v-for="payer in getPayers(expense)"
                          :key="payer.personId"
                          class="payer-item"
                        >
                          {{ getPersonById(payer.personId)?.emoji }} {{ getPersonById(payer.personId)?.name }}
                          <span class="payer-amount">${{ payer.amount.toFixed(2) }}</span>
                        </span>
                      </template>
                      <span v-else class="no-payer">無付款人</span>
                    </div>
                  </div>

                  <!-- 中间：箭头 -->
                  <div class="arrow-section">
                    <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>

                  <!-- 右侧：分账者 -->
                  <div class="splits-section">
                    <div class="splits-list">
                      <template v-if="expense.splits.length > 0">
                        <span
                          v-for="split in expense.splits"
                          :key="split.personId"
                          class="split-item"
                          :class="{ 'paid': split.paid }"
                        >
                          {{ getPersonById(split.personId)?.emoji }} {{ getPersonById(split.personId)?.name }}
                          <span class="split-amount">${{ split.amount.toFixed(2) }}</span>
                          <span v-if="split.paid" class="paid-badge">已付</span>
                        </span>
                      </template>
                      <span v-else class="no-split">無分帳人</span>
                    </div>
                  </div>
                </div>

                <!-- 消费日期 -->
                <div class="expense-date">
                  {{ formatExpenseDate(expense.expenseDate || expense.createdAt) }}
                </div>
              </div>
            </div>
          </div>

          <!-- 分享弹窗 -->
          <ShareModal
            :visible="isShareModalVisible"
            :share-url="shareUrl"
            @close="closeShareModal"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Expense, ExpensePayer, Person } from '@/types'
import { useShareModal } from '@/composables/useShareModal'
import { usePersonUtils } from '@/composables/usePersonUtils'
import ShareModal from '@/components/Common/ShareModal.vue'

const props = defineProps<{
  visible: boolean
  expenses: Expense[]
  people: Person[]
}>()

const emit = defineEmits<{
  close: []
  viewExpense: [expenseId: string]
  reset: []
}>()

// 使用 composables
const { isShareModalVisible, shareUrl, handleShareClick, closeShareModal } = useShareModal(computed(() => props.people), computed(() => props.expenses))
const { getPersonById } = usePersonUtils(computed(() => props.people))

// 按日期排序（最新的在前）
const sortedExpenses = computed(() => {
  return [...props.expenses].sort((a, b) => {
    const dateA = a.expenseDate ? new Date(a.expenseDate).getTime() : new Date(a.createdAt).getTime()
    const dateB = b.expenseDate ? new Date(b.expenseDate).getTime() : new Date(b.createdAt).getTime()
    return dateB - dateA
  })
})

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


function handleResetClick() {
  if (confirm('確定要重置所有帳目嗎？此操作將刪除所有分帳記錄，且無法復原。')) {
    emit('reset')
  }
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

.header-actions {
  @apply flex items-center gap-2;
}

.action-btn {
  @apply w-8 h-8 flex items-center justify-center;
  @apply rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors;
}

.action-icon {
  @apply w-5 h-5 text-gray-600;
}

.share-btn .action-icon {
  @apply text-blue-600;
}

.reset-btn .action-icon {
  @apply text-orange-600;
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

.expense-split-info {
  @apply flex items-center gap-3 mb-2 text-sm;
}

.payers-section,
.splits-section {
  @apply flex-1 min-w-0;
}

.payers-list,
.splits-list {
  @apply flex flex-wrap items-center gap-2;
}

.arrow-section {
  @apply flex-shrink-0;
  @apply text-gray-400;
}

.arrow-icon {
  @apply w-5 h-5;
}

.payer-item,
.split-item {
  @apply inline-flex items-center gap-1;
}

.payer-item {
  @apply px-2 py-1 rounded-md;
  @apply bg-blue-50 text-gray-900;
}

.split-item {
  @apply px-2 py-1 rounded-md;
  @apply bg-blue-50 text-gray-900;
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
