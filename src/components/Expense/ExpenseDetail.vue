<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible && expense" class="expense-detail-overlay" @click.self="handleClose">
        <div class="expense-detail-modal">
          <!-- 标题栏 -->
          <div class="modal-header">
            <h2 class="modal-title">帳目詳情</h2>
            <div class="header-actions">
              <button 
                class="action-btn"
                @click="handleEdit"
                aria-label="編輯"
              >
                <svg class="action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button 
                class="action-btn delete-btn"
                @click="handleDelete"
                aria-label="刪除"
              >
                <svg class="action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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
            <!-- 基本信息 -->
            <div class="info-section">
              <div class="info-item">
                <span class="info-label">付款人</span>
                <div class="info-value payers-list">
                  <span
                    v-for="payer in getPayers(expense)"
                    :key="payer.personId"
                    class="payer-info"
                  >
                    {{ getPersonById(payer.personId)?.emoji }} {{ getPersonById(payer.personId)?.name }}
                    <span class="payer-amount-text">${{ payer.amount.toFixed(2) }}</span>
                  </span>
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">項目說明</span>
                <span class="info-value">{{ expense.description }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">總金額</span>
                <span class="info-value amount">${{ expense.totalAmount.toFixed(2) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">消費日期</span>
                <input
                  v-if="editingDate"
                  v-model="expenseDateStr"
                  type="date"
                  class="date-input"
                  @blur="handleDateBlur"
                  @keyup.enter="handleDateBlur"
                  @click.stop
                />
                <span v-else class="info-value date-value" @click="startEditingDate">
                  {{ formatExpenseDate(expense.expenseDate || expense.createdAt) }}
                </span>
              </div>
            </div>

            <!-- 分帳明細 -->
            <div class="split-section">
              <h3 class="section-title">分帳明細</h3>
              <div class="split-list">
                <div
                  v-for="split in expense.splits"
                  :key="split.personId"
                  class="split-item"
                >
                  <div class="split-person-info">
                    <span class="split-person-emoji">{{ getPersonById(split.personId)?.emoji }}</span>
                    <span class="split-person-name">{{ getPersonById(split.personId)?.name }}</span>
                    <span 
                      v-if="split.paid"
                      class="paid-badge"
                    >
                      已付款
                    </span>
                  </div>
                  <div class="split-amount">
                    ${{ split.amount.toFixed(2) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部按钮 -->
          <div class="modal-footer">
            <button class="btn-close" @click="handleClose">關閉</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Person, Expense, ExpensePayer } from '@/types'
import { usePersonUtils } from '@/composables/usePersonUtils'

const props = defineProps<{
  visible: boolean
  expense: Expense | null
  people: Person[]
}>()

const emit = defineEmits<{
  close: []
  edit: []
  delete: []
  updateDate: [date: Date]
}>()

const editingDate = ref(false)
const expenseDateStr = ref('')

// 使用 composable
const { getPersonById } = usePersonUtils(computed(() => props.people))

function getPayers(expense: Expense): ExpensePayer[] {
  if (expense.payers && expense.payers.length > 0) {
    return expense.payers
  } else if (expense.payerId) {
    // 兼容旧数据（单个付款人）
    return [{ personId: expense.payerId, amount: expense.totalAmount }]
  }
  return []
}

function formatExpenseDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function startEditingDate() {
  if (props.expense) {
    const date = props.expense.expenseDate || props.expense.createdAt
    expenseDateStr.value = new Date(date).toISOString().split('T')[0]
    editingDate.value = true
  }
}

function handleDateBlur() {
  if (props.expense && expenseDateStr.value) {
    const newDate = new Date(expenseDateStr.value)
    emit('updateDate', newDate)
  }
  editingDate.value = false
}

function handleClose() {
  emit('close')
}

function handleEdit() {
  emit('edit')
}

function handleDelete() {
  if (confirm('確定要刪除這筆帳目嗎？')) {
    emit('delete')
  }
}
</script>

<style scoped>
.expense-detail-overlay {
  @apply fixed inset-0 bg-black/50 z-50;
  @apply flex items-center justify-center p-4;
}

.expense-detail-modal {
  @apply w-full max-w-md bg-white rounded-xl shadow-xl;
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

.delete-btn .action-icon {
  @apply text-red-600;
}

.close-btn {
  @apply w-8 h-8 flex items-center justify-center;
  @apply rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors;
}

.close-icon {
  @apply w-5 h-5 text-gray-600;
}

.modal-content {
  @apply flex-1 overflow-y-auto px-6 py-4 space-y-6;
}

.info-section {
  @apply space-y-4;
}

.info-item {
  @apply flex items-center justify-between;
}

.info-label {
  @apply text-sm text-gray-600;
}

.info-value {
  @apply text-base font-medium text-gray-900;
}

.info-value.amount {
  @apply text-lg font-semibold text-blue-600;
}

.payers-list {
  @apply flex flex-wrap gap-2;
}

.payer-info {
  @apply flex items-center gap-1;
}

.payer-amount-text {
  @apply text-sm text-gray-600 font-normal;
}

.date-input {
  @apply px-2 py-1 border border-gray-300 rounded;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.date-value {
  @apply cursor-pointer hover:text-blue-600 transition-colors;
}

.split-section {
  @apply space-y-3;
}

.section-title {
  @apply text-base font-semibold text-gray-900;
}

.split-list {
  @apply space-y-2;
}

.split-item {
  @apply flex items-center justify-between p-3 bg-gray-50 rounded-lg;
}

.split-person-info {
  @apply flex items-center gap-2;
}

.split-person-emoji {
  @apply text-xl;
}

.split-person-name {
  @apply text-gray-900 font-medium;
}

.paid-badge {
  @apply ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded;
}

.split-amount {
  @apply text-base font-semibold text-gray-900;
}

.modal-footer {
  @apply flex items-center justify-end px-6 py-4 border-t border-gray-200;
}

.btn-close {
  @apply px-6 py-2 bg-blue-600 text-white rounded-lg font-medium;
  @apply hover:bg-blue-700 active:bg-blue-800 transition-colors;
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
