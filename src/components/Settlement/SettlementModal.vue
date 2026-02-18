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

          <!-- 分享弹窗 -->
          <Teleport to="body">
            <Transition name="modal">
              <div v-if="isShareModalVisible" class="share-modal-overlay" @click.self="isShareModalVisible = false">
                <div class="share-modal" @click.stop>
                  <div class="share-modal-header">
                    <h3 class="share-modal-title">分享分帳數據</h3>
                    <button 
                      class="share-close-btn"
                      @click="isShareModalVisible = false"
                      aria-label="關閉"
                    >
                      <svg class="share-close-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <div class="share-modal-content">
                    <p class="share-hint">複製以下連結分享給其他人：</p>
                    <div class="share-url-container">
                      <input
                        ref="shareUrlInput"
                        v-model="shareUrl"
                        type="text"
                        readonly
                        class="share-url-input"
                      />
                      <button 
                        class="copy-btn"
                        @click="handleCopyUrl"
                        :class="{ 'copied': isCopied }"
                      >
                        {{ isCopied ? '已複製' : '複製' }}
                      </button>
                    </div>
                    <p class="share-warning">
                      ⚠️ 注意：連結包含所有分帳數據，請謹慎分享
                    </p>
                  </div>
                </div>
              </div>
            </Transition>
          </Teleport>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Person, SettlementResult, Expense } from '@/types'
import { calculateMinTransfers } from '@/utils/algorithms'
import { generateShareUrl } from '@/utils/shareEncoder'

const props = defineProps<{
  visible: boolean
  people: Person[]
  settlements: SettlementResult[]
  expenses: Expense[]
}>()

const emit = defineEmits<{
  close: []
  reset: []
}>()

// 分享相关状态
const isShareModalVisible = ref(false)
const shareUrl = ref('')
const shareUrlInput = ref<HTMLInputElement | null>(null)
const isCopied = ref(false)

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

function handleShareClick() {
  try {
    const url = generateShareUrl(props.people, props.expenses)
    shareUrl.value = url
    
    // 检查URL长度
    if (url.length > 2000) {
      alert('數據量過大，無法生成分享連結。建議減少帳目數量後再試。')
      return
    }
    
    // 检查是否有有效数据
    if (props.people.length === 0) {
      alert('沒有人員數據，無法生成分享連結。')
      return
    }
    
    isShareModalVisible.value = true
    isCopied.value = false
  } catch (error) {
    console.error('生成分享連結失敗:', error)
    const errorMessage = error instanceof Error ? error.message : '未知錯誤'
    alert(`生成分享連結失敗：${errorMessage}\n\n請檢查控制台查看詳細信息。`)
  }
}

function handleCopyUrl() {
  if (!shareUrlInput.value) return
  
  shareUrlInput.value.select()
  shareUrlInput.value.setSelectionRange(0, 99999) // 移动端兼容
  
  try {
    navigator.clipboard.writeText(shareUrl.value).then(() => {
      isCopied.value = true
      setTimeout(() => {
        isCopied.value = false
      }, 2000)
    }).catch(() => {
      // 降级方案：使用 execCommand
      document.execCommand('copy')
      isCopied.value = true
      setTimeout(() => {
        isCopied.value = false
      }, 2000)
    })
  } catch (error) {
    console.error('複製失敗:', error)
    alert('複製失敗，請手動複製連結。')
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

/* 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* 分享弹窗样式 */
.share-modal-overlay {
  @apply fixed inset-0 bg-black/50 z-[60];
  @apply flex items-center justify-center p-4;
}

.share-modal {
  @apply w-full max-w-md bg-white rounded-xl shadow-xl;
  @apply flex flex-col;
}

.share-modal-header {
  @apply flex items-center justify-between px-6 py-4 border-b border-gray-200;
}

.share-modal-title {
  @apply text-lg font-semibold text-gray-900;
}

.share-close-btn {
  @apply w-8 h-8 flex items-center justify-center;
  @apply rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors;
}

.share-close-icon {
  @apply w-5 h-5 text-gray-600;
}

.share-modal-content {
  @apply px-6 py-4 space-y-4;
}

.share-hint {
  @apply text-sm text-gray-600;
}

.share-url-container {
  @apply flex items-center gap-2;
}

.share-url-input {
  @apply flex-1 px-3 py-2 border border-gray-300 rounded-lg;
  @apply text-sm text-gray-900 bg-gray-50;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.copy-btn {
  @apply px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm;
  @apply hover:bg-blue-700 active:bg-blue-800 transition-colors;
  @apply whitespace-nowrap;
}

.copy-btn.copied {
  @apply bg-green-600 hover:bg-green-700 active:bg-green-800;
}

.share-warning {
  @apply text-xs text-orange-600;
}
</style>
