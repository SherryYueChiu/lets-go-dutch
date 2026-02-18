<template>
  <div class="app">
    <!-- Header -->
    <AppHeader
      :current-person="uiStore.currentPerson"
      @open-grid="uiStore.openPersonGrid()"
    />

    <!-- 主内容区域 -->
    <main class="main-content">
      <PersonView v-if="peopleStore.people.length > 0" />
      <div v-else class="empty-state">
        <p class="empty-text">還沒有人員，請新增人員開始使用</p>
        <button class="add-first-person-btn" @click="handleAddFirstPerson">
          新增第一位人員
        </button>
      </div>
    </main>

    <!-- 结算按钮 -->
    <SettlementButton 
      v-if="peopleStore.people.length > 0"
      :net-amount="currentPersonNetAmount"
      @click="handleSettlementClick"
    />

    <!-- 人员网格视图 -->
    <PersonGridView
      :people="peopleStore.people"
      :current-person-id="uiStore.currentPerson?.id || null"
      :visible="uiStore.isPersonGridVisible"
      @close="uiStore.closePersonGrid()"
      @select-person="uiStore.selectPerson($event)"
      @add-person="handleAddPerson"
    />

    <!-- 结算弹窗 -->
    <SettlementModal
      :visible="isSettlementModalVisible"
      :people="peopleStore.people"
      :settlements="settlements"
      @close="isSettlementModalVisible = false"
      @reset="handleResetExpenses"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePeopleStore } from '@/stores/peopleStore'
import { useUIStore } from '@/stores/uiStore'
import { useExpenseStore } from '@/stores/expenseStore'
import { calculateNetAmounts } from '@/utils/algorithms'
import AppHeader from '@/components/Layout/AppHeader.vue'
import PersonView from '@/views/PersonView.vue'
import PersonGridView from '@/components/Person/PersonGridView.vue'
import SettlementButton from '@/components/Settlement/SettlementButton.vue'
import SettlementModal from '@/components/Settlement/SettlementModal.vue'

const peopleStore = usePeopleStore()
const uiStore = useUIStore()
const expenseStore = useExpenseStore()

// 结算弹窗状态
const isSettlementModalVisible = ref(false)

// 计算结算结果
const settlements = computed(() => {
  return calculateNetAmounts(peopleStore.people, expenseStore.expenses)
})

// 当前人员的净金额
const currentPersonNetAmount = computed(() => {
  if (!uiStore.currentPerson) return null
  const settlement = settlements.value.find(s => s.personId === uiStore.currentPerson?.id)
  return settlement ? settlement.netAmount : null
})

// 初始化数据
onMounted(() => {
  // 从本地存储加载数据
  peopleStore.loadFromLocalStorage()
  expenseStore.loadFromLocalStorage()
  
  // 如果没有人员，初始化默认人员
  if (peopleStore.people.length === 0) {
    peopleStore.initializeDefaultPeople()
  }
})

function handleAddPerson() {
  peopleStore.addPerson()
  // 切换到新添加的人员
  uiStore.setCurrentPersonIndex(peopleStore.people.length - 1)
}

function handleAddFirstPerson() {
  handleAddPerson()
}

function handleSettlementClick() {
  isSettlementModalVisible.value = true
}

function handleResetExpenses() {
  // 清空所有帳目
  expenseStore.expenses = []
  expenseStore.saveToLocalStorage()
  
  // 重置人員為預設兩名
  peopleStore.people = []
  peopleStore.initializeDefaultPeople()
  
  // 重置當前人員索引
  uiStore.setCurrentPersonIndex(0)
}
</script>

<style scoped>
.app {
  @apply min-h-screen bg-gray-50;
  @apply flex flex-col;
}

.main-content {
  @apply flex-1 overflow-hidden;
  @apply pt-14 pb-20; /* Header高度 + SettlementBar高度 */
}

.empty-state {
  @apply flex flex-col items-center justify-center;
  @apply h-full p-8;
}

.empty-text {
  @apply text-gray-500 mb-4;
}

.add-first-person-btn {
  @apply px-6 py-3 bg-blue-600 text-white rounded-lg;
  @apply hover:bg-blue-700 active:bg-blue-800;
  @apply transition-colors font-medium;
}
</style>
