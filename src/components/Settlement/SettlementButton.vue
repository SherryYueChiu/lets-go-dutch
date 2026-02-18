<template>
  <div class="settlement-bar">
    <div class="settlement-info">
      <div class="settlement-label">最終結算</div>
      <div 
        class="settlement-amount"
        :class="{ 
          'positive': netAmount !== null && netAmount > 0, 
          'negative': netAmount !== null && netAmount < 0, 
          'zero': netAmount === null || netAmount === 0 
        }"
      >
        <span v-if="netAmount !== null && netAmount > 0" class="amount-text">
          應收 ${{ netAmount.toFixed(2) }}
        </span>
        <span v-else-if="netAmount !== null && netAmount < 0" class="amount-text">
          應付 ${{ Math.abs(netAmount).toFixed(2) }}
        </span>
        <span v-else class="amount-text">
          已平衡
        </span>
      </div>
    </div>
    <div class="action-buttons">
      <button 
        class="detail-button"
        @click="$emit('detailClick')"
      >
        <span class="button-text">明細</span>
      </button>
      <button 
        class="settlement-button"
        @click="$emit('click')"
      >
        <span class="button-text">結算</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  netAmount: number | null
}>()

defineEmits<{
  click: []
  detailClick: []
}>()
</script>

<style scoped>
.settlement-bar {
  @apply fixed bottom-0 left-0 right-0;
  @apply h-20 bg-white border-t border-gray-200;
  @apply flex items-center justify-between px-4;
  @apply shadow-lg z-40;
}

.action-buttons {
  @apply flex items-center gap-3;
}

.settlement-info {
  @apply flex flex-col;
}

.settlement-label {
  @apply text-xs text-gray-500 mb-1;
}

.settlement-amount {
  @apply text-lg font-semibold;
}

.settlement-amount.positive .amount-text {
  @apply text-green-600;
}

.settlement-amount.negative .amount-text {
  @apply text-red-600;
}

.settlement-amount.zero .amount-text {
  @apply text-gray-500;
}

.detail-button {
  @apply px-5 py-3 bg-gray-100 rounded-lg;
  @apply font-semibold text-base;
  @apply hover:bg-gray-200 active:bg-gray-300;
  @apply transition-colors shadow-md;
  @apply flex-shrink-0;
}

.detail-button .button-text {
  @apply text-gray-700;
}

.settlement-button {
  @apply px-6 py-3 bg-blue-600 text-white rounded-lg;
  @apply font-semibold text-base;
  @apply hover:bg-blue-700 active:bg-blue-800;
  @apply transition-colors shadow-md;
  @apply flex-shrink-0;
}

.settlement-button .button-text {
  @apply text-white;
}
</style>
