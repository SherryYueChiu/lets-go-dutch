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
      :expenses="expenseStore.expenses"
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
import { loadFromUrl, expandToPerson, expandToExpense } from '@/utils/shareEncoder'
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
  // 首先检查URL中是否有分享数据
  const shareData = loadFromUrl()
  
  if (shareData) {
    // 如果有分享数据，询问用户是否加载
    if (confirm('檢測到分享連結，是否載入分享的分帳數據？\n\n注意：這將替換當前所有數據。')) {
      try {
        // 验证数据版本
        if (shareData.v !== 1) {
          throw new Error(`不支援的數據版本: ${shareData.v}`)
        }
        
        // 验证数据完整性
        if (!shareData.p || !Array.isArray(shareData.p) || shareData.p.length === 0) {
          throw new Error('人員數據為空或格式不正確')
        }
        
        if (!shareData.e || !Array.isArray(shareData.e)) {
          throw new Error('帳目數據格式不正確')
        }
        
        // 加载分享的人员数据，并创建索引到新ID的映射
        const indexToPersonId = new Map<number, string>()
        const timestamp = Date.now()
        const people = shareData.p.map((p, index) => {
          if (!p.n || !p.e) {
            throw new Error(`人員數據不完整 (索引 ${index})`)
          }
          const newId = `share-${index}-${timestamp}`
          indexToPersonId.set(index, newId)
          return expandToPerson(p, newId)
        })
        peopleStore.people = people
        peopleStore.saveToLocalStorage()
        
        // 加载分享的账目数据，使用索引映射到新的人员ID
        const expenses = shareData.e.map((e, index) => {
          try {
            // 验证账目数据
            if (!e.d || typeof e.t !== 'number' || !e.sp || !Array.isArray(e.sp)) {
              throw new Error(`帳目數據不完整 (索引 ${index})`)
            }
            
            // 验证所有索引是否有效
            if (e.py) {
              for (const payer of e.py) {
                if (!indexToPersonId.has(payer.p)) {
                  throw new Error(`付款人索引 ${payer.p} 不存在`)
                }
              }
            }
            if (e.pid !== undefined && !indexToPersonId.has(e.pid)) {
              throw new Error(`付款人索引 ${e.pid} 不存在`)
            }
            for (const split of e.sp) {
              if (!indexToPersonId.has(split.p)) {
                throw new Error(`分帳人索引 ${split.p} 不存在`)
              }
            }
            
            return expandToExpense(e, `share-expense-${index}-${timestamp}`, indexToPersonId)
          } catch (error) {
            console.error(`處理帳目 ${index} 時發生錯誤:`, error)
            throw error
          }
        })
        expenseStore.expenses = expenses
        expenseStore.saveToLocalStorage()
        
        // 重置当前人员索引
        uiStore.setCurrentPersonIndex(0)
        
        // 清除URL中的分享参数
        window.history.replaceState(null, '', window.location.pathname)
        
        alert(`分享數據載入成功！\n人員: ${people.length} 人\n帳目: ${expenses.length} 筆`)
      } catch (error) {
        console.error('載入分享數據失敗:', error)
        const errorMessage = error instanceof Error ? error.message : '未知錯誤'
        alert(`載入分享數據失敗：${errorMessage}\n\n請檢查連結是否正確，或聯繫分享者重新生成連結。`)
        // 如果加载失败，继续使用本地存储的数据
        loadLocalData()
      }
    } else {
      // 用户选择不加载，清除URL参数
      window.history.replaceState(null, '', window.location.pathname)
      loadLocalData()
    }
  } else {
    // 没有分享数据，正常加载本地存储
    loadLocalData()
  }
})

function loadLocalData() {
  // 从本地存储加载数据
  peopleStore.loadFromLocalStorage()
  expenseStore.loadFromLocalStorage()
  
  // 如果没有人员，初始化默认人员
  if (peopleStore.people.length === 0) {
    peopleStore.initializeDefaultPeople()
  }
}

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
