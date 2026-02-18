<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="settlement-modal-overlay" @click.self="handleClose">
        <div class="settlement-modal">
          <!-- 标题栏 -->
          <div class="modal-header">
            <h2 class="modal-title">結算結果</h2>
            <div class="header-actions">
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
            <!-- 淨金額列表 -->
            <div class="section">
              <h3 class="section-title">淨金額</h3>
              <div class="net-amount-list">
                <div
                  v-for="settlement in settlements"
                  :key="settlement.personId"
                  class="net-amount-item"
                  :class="{ 'positive': settlement.netAmount > 0, 'negative': settlement.netAmount < 0 }"
                >
                  <div class="person-info">
                    <span class="person-emoji">{{ getPersonById(settlement.personId)?.emoji }}</span>
                    <span class="person-name">{{ getPersonById(settlement.personId)?.name }}</span>
                  </div>
                  <div class="net-amount-value">
                    <span v-if="settlement.netAmount > 0" class="amount-text positive">
                      應收 ${{ settlement.netAmount.toFixed(2) }}
                    </span>
                    <span v-else-if="settlement.netAmount < 0" class="amount-text negative">
                      應付 ${{ Math.abs(settlement.netAmount).toFixed(2) }}
                    </span>
                    <span v-else class="amount-text zero">
                      已平衡
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 轉帳方案 -->
            <div v-if="transferPlans.length > 0" class="section">
              <h3 class="section-title">最少次轉帳方案</h3>
              <div class="transfer-list">
                <div
                  v-for="(plan, index) in transferPlans"
                  :key="index"
                  class="transfer-item"
                >
                  <div class="transfer-from">
                    <span class="person-emoji">{{ getPersonById(plan.fromPersonId)?.emoji }}</span>
                    <span class="person-name">{{ getPersonById(plan.fromPersonId)?.name }}</span>
                  </div>
                  <div class="transfer-arrow">→</div>
                  <div class="transfer-to">
                    <span class="person-emoji">{{ getPersonById(plan.toPersonId)?.emoji }}</span>
                    <span class="person-name">{{ getPersonById(plan.toPersonId)?.name }}</span>
                  </div>
                  <div class="transfer-amount">
                    ${{ plan.amount.toFixed(2) }}
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="empty-transfer">
              <p class="empty-text">所有人已平衡，無需轉帳</p>
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
import { computed } from 'vue'
import type { Person, SettlementResult } from '@/types'
import { calculateMinTransfers } from '@/utils/algorithms'

const props = defineProps<{
  visible: boolean
  people: Person[]
  settlements: SettlementResult[]
}>()

const emit = defineEmits<{
  close: []
  reset: []
}>()

// 计算转账方案
const transferPlans = computed(() => {
  return calculateMinTransfers(props.settlements)
})

function getPersonById(personId: string): Person | undefined {
  return props.people.find(p => p.id === personId)
}

function handleClose() {
  emit('close')
}

function handleResetClick() {
  if (confirm('確定要重置所有帳目嗎？此操作將刪除所有分帳記錄，且無法復原。')) {
    emit('reset')
    handleClose()
  }
}
</script>

<style scoped>
.settlement-modal-overlay {
  @apply fixed inset-0 bg-black/50 z-50;
  @apply flex items-center justify-center p-4;
}

.settlement-modal {
  @apply w-full max-w-lg bg-white rounded-xl shadow-xl;
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
  @apply flex-1 overflow-y-auto px-6 py-4 space-y-6;
}

.section {
  @apply space-y-3;
}

.section-title {
  @apply text-base font-semibold text-gray-900;
}

.net-amount-list {
  @apply space-y-2;
}

.net-amount-item {
  @apply flex items-center justify-between p-4 rounded-lg border-2;
  @apply border-gray-200;
}

.net-amount-item.positive {
  @apply border-green-200 bg-green-50;
}

.net-amount-item.negative {
  @apply border-red-200 bg-red-50;
}

.person-info {
  @apply flex items-center gap-2;
}

.person-emoji {
  @apply text-xl;
}

.person-name {
  @apply text-gray-900 font-medium;
}

.net-amount-value {
  @apply text-base font-semibold;
}

.amount-text.positive {
  @apply text-green-600;
}

.amount-text.negative {
  @apply text-red-600;
}

.amount-text.zero {
  @apply text-gray-500;
}

.transfer-list {
  @apply space-y-3;
}

.transfer-item {
  @apply flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200;
}

.transfer-from,
.transfer-to {
  @apply flex items-center gap-2 flex-1;
}

.transfer-arrow {
  @apply text-gray-600 font-semibold;
}

.transfer-amount {
  @apply text-lg font-bold text-blue-600;
}

.empty-transfer {
  @apply py-8 text-center;
}

.empty-text {
  @apply text-gray-500;
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
