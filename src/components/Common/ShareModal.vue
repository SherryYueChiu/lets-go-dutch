<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="share-modal-overlay" @click.self="handleClose">
        <div class="share-modal" @click.stop>
          <div class="share-modal-header">
            <h3 class="share-modal-title">分享分帳數據</h3>
            <button 
              class="share-close-btn"
              @click="handleClose"
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
                :value="shareUrl"
                type="text"
                readonly
                class="share-url-input"
              />
              <button 
                class="copy-btn"
                @click="handleCopy"
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
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  visible: boolean
  shareUrl: string
}>()

const emit = defineEmits<{
  close: []
}>()

const shareUrlInput = ref<HTMLInputElement | null>(null)
const isCopied = ref(false)

// 当 visible 变为 true 时，重置复制状态
watch(() => props.visible, (newVal) => {
  if (newVal) {
    isCopied.value = false
  }
})

function handleClose() {
  emit('close')
}

function handleCopy() {
  if (!shareUrlInput.value) return
  
  shareUrlInput.value.select()
  shareUrlInput.value.setSelectionRange(0, 99999) // 移动端兼容
  
  try {
    navigator.clipboard.writeText(props.shareUrl).then(() => {
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
