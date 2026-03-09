<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="expense-form-overlay" @click.self="handleClose">
        <div class="expense-form-modal">
          <!-- 标题栏 -->
          <div class="modal-header">
            <h2 class="modal-title">{{ titleText }}</h2>
            <div class="header-actions">
              <div v-if="!isEdit" class="mode-switch" role="switch" :aria-checked="formMode === 'transfer'" aria-label="切換帳目或轉帳">
                <button
                  type="button"
                  class="mode-btn"
                  :class="{ active: formMode === 'expense' }"
                  @click="setFormMode('expense')"
                >
                  記錄消費
                </button>
                <button
                  type="button"
                  class="mode-btn"
                  :class="{ active: formMode === 'transfer' }"
                  @click="setFormMode('transfer')"
                >
                  記錄轉帳
                </button>
              </div>
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

          <!-- 表单内容 -->
          <div class="form-content">
            <!-- 項目說明 / 備註 -->
            <div class="form-section">
              <label class="form-label">{{ formMode === 'transfer' ? '備註' : '什麼項目' }}</label>
              <input
                v-model="formData.description"
                type="text"
                class="form-input"
                :placeholder="formMode === 'transfer' ? '選填' : '例如：午餐、交通費等'"
              />
            </div>

            <!-- 消費日期 -->
            <div class="form-section">
              <label class="form-label">哪一天</label>
              <input
                v-model="formData.expenseDate"
                type="date"
                class="form-input"
              />
            </div>

            <!-- 付款和分账 / 轉出轉入（左右布局） -->
            <div class="form-section">
              <div class="split-layout">
                <!-- 左侧：付款者 / 轉出 -->
                <div class="payers-section">
                  <div class="section-title">{{ formMode === 'transfer' ? '誰給錢' : '誰墊付' }}</div>
                  <div class="payers-list">
                    <button
                      v-for="person in people"
                      :key="person.id"
                      type="button"
                      class="person-card"
                      :class="{ 'selected': isPayerSelected(person.id), 'disabled': formMode === 'transfer' && selectedPeople.length === 1 && selectedPeople[0] === person.id }"
                      :disabled="formMode === 'transfer' && selectedPeople.length === 1 && selectedPeople[0] === person.id"
                      @click="togglePayer(person.id)"
                    >
                      <span class="person-info">
                        {{ person.emoji }} {{ person.name }}
                      </span>
                      <div v-if="isPayerSelected(person.id)" class="amount-section">
                        <input
                          v-if="editingPayerId === person.id || (formMode === 'transfer' && payers.length === 1)"
                          v-model.number="payerAmounts[person.id]"
                          type="number"
                          step="0.01"
                          min="0"
                          class="amount-input"
                          @blur="formMode === 'transfer' ? syncTransferAmount() : finishEditingPayer(person.id)"
                          @keyup.enter="formMode === 'transfer' ? syncTransferAmount() : finishEditingPayer(person.id)"
                          @input="formMode === 'transfer' && syncTransferAmount()"
                          @click.stop
                        />
                        <span v-else class="amount-display" @click.stop="formMode === 'transfer' ? null : startEditingPayer(person.id)">
                          ${{ (Number(payerAmounts[person.id]) || 0).toFixed(2) }}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                <!-- 中间：箭头（帳目向左，轉帳向右，旋轉動畫） -->
                <div class="arrow-section">
                  <div class="arrow-icon-wrapper" :class="{ 'arrow-point-right': formMode === 'transfer' }">
                    <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                </div>

                <!-- 右侧：分账者 / 轉入 -->
                <div class="splits-section">
                  <div class="section-title">{{ formMode === 'transfer' ? '誰拿錢' : '誰分攤' }}</div>
                  <div class="splits-list">
                    <button
                      v-for="person in people"
                      :key="person.id"
                      type="button"
                      class="person-card"
                      :class="{ 'selected': selectedPeople.includes(person.id), 'disabled': formMode === 'transfer' && payers.length === 1 && payers[0] === person.id }"
                      :disabled="formMode === 'transfer' && payers.length === 1 && payers[0] === person.id"
                      @click="togglePerson(person.id)"
                    >
                      <span class="person-info">
                        {{ person.emoji }} {{ person.name }}
                      </span>
                      <div v-if="selectedPeople.includes(person.id)" class="amount-section">
                        <template v-if="formMode === 'transfer'">
                          <span class="amount-display">${{ (Number(formData.totalAmount) || 0).toFixed(2) }}</span>
                        </template>
                        <template v-else>
                          <input
                            v-model.number="splitAmounts[person.id]"
                            type="number"
                            step="0.01"
                            min="0"
                            class="amount-input"
                            @input="handleSplitAmountChange(person.id, $event)"
                            @click.stop
                          />
                        </template>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- 总金额显示 -->
              <div class="total-section">
                <span class="total-label">{{ formMode === 'transfer' ? '金額：' : '總金額：' }}</span>
                <span 
                  class="total-amount"
                  :class="{ 'error': !isTotalValid }"
                >
                  ${{ (Number(formData.totalAmount) || 0).toFixed(2) }}
                </span>
                <span v-if="formMode === 'expense'" class="total-hint">（由付款人金額自動計算）</span>
              </div>
            </div>
          </div>

          <!-- 底部按钮 -->
          <div class="modal-footer">
            <button class="btn-cancel" @click="handleClose">取消</button>
            <button 
              class="btn-submit"
              :disabled="!isFormValid"
              @click="handleSubmit"
            >
              {{ isEdit ? '儲存' : '建立' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Person, Expense, ExpenseSplit, ExpensePayer, ExpenseType } from '@/types'

const props = defineProps<{
  visible: boolean
  people: Person[]
  payerId?: string
  expense?: Expense | null
}>()

const emit = defineEmits<{
  close: []
  submit: [expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'expenseDate'> & { expenseDate: Date }]
}>()

// 表單模式：帳目 | 轉帳
const formMode = ref<ExpenseType>('expense')

const isEdit = computed(() => !!props.expense)

const titleText = computed(() => {
  if (formMode.value === 'transfer') {
    return isEdit.value ? '編輯轉帳' : '記錄轉帳'
  }
  return isEdit.value ? '編輯帳目' : '記錄消費'
})

function setFormMode(mode: ExpenseType) {
  if (formMode.value === mode) return
  formMode.value = mode
  resetForm()
}

// 表单数据
const formData = ref({
  payerId: props.payerId || props.people[0]?.id || '', // 兼容旧数据
  description: '',
  totalAmount: 0,
  expenseDate: new Date().toISOString().split('T')[0], // 默认今天
})

// 付款人列表（多人支付）
const payers = ref<string[]>([]) // 选中的付款人ID列表
const payerAmounts = ref<Record<string, number | string>>({}) // 每个付款人支付的金额（編輯時可能為空字串）
const editingPayerId = ref<string | null>(null) // 正在编辑的付款人ID

// 选中的分账人员
const selectedPeople = ref<string[]>([])

// 每个人的分账金额
const splitAmounts = ref<Record<string, number>>({})

// 计算当前总金额（从付款人金额计算）
const currentTotalAmount = computed(() => {
  return Object.values(payerAmounts.value).reduce<number>((sum, amount) => sum + (Number(amount) || 0), 0)
})

// 轉帳模式：同步「轉出金額」到總額與「轉入方」金額
function syncTransferAmount() {
  if (formMode.value !== 'transfer' || payers.value.length !== 1 || selectedPeople.value.length !== 1) return
  const amt = Number(payerAmounts.value[payers.value[0]]) || 0
  const toId = selectedPeople.value[0]
  formData.value.totalAmount = amt
  splitAmounts.value = { ...splitAmounts.value, [toId]: amt }
}

// 分配金额给所有选中的分账人员
function distributeAmountToSelectedPeople() {
  if (selectedPeople.value.length === 0) {
    return
  }
  
  const total = currentTotalAmount.value
  
  if (total > 0) {
    const amountPerPerson = total / selectedPeople.value.length
    // 创建新对象以确保响应式更新
    const newSplitAmounts = { ...splitAmounts.value }
    selectedPeople.value.forEach(personId => {
      newSplitAmounts[personId] = amountPerPerson
    })
    splitAmounts.value = newSplitAmounts
  } else {
    // 总金额为0时，确保所有选中的人员金额都是0
    const newSplitAmounts = { ...splitAmounts.value }
    selectedPeople.value.forEach(personId => {
      if (!(personId in newSplitAmounts)) {
        newSplitAmounts[personId] = 0
      }
    })
    splitAmounts.value = newSplitAmounts
  }
}

// 监听选中人员变化，自动平均分账（帳目）或同步轉帳金額（轉帳）
watch(selectedPeople, (newPeople, oldPeople) => {
  if (newPeople.length === 0) {
    splitAmounts.value = {}
    return
  }

  if (formMode.value === 'transfer') {
    // 轉帳：僅一人，同步金額
    syncTransferAmount()
    return
  }

  // 找出被移除的人员，清除他们的金额
  if (oldPeople && oldPeople.length > 0) {
    oldPeople.forEach(personId => {
      if (!newPeople.includes(personId)) {
        delete splitAmounts.value[personId]
      }
    })
  }

  // 立即分配金额
  distributeAmountToSelectedPeople()
}, { immediate: true })

// 监听总金额变化（通过computed），自动重新平均分账（僅帳目）
watch(currentTotalAmount, () => {
  if (formMode.value === 'transfer') {
    syncTransferAmount()
    return
  }
  if (selectedPeople.value.length > 0) {
    distributeAmountToSelectedPeople()
  }
}, { immediate: false })

// 监听付款人金额变化，更新总金额并重新分配
watch(() => payerAmounts.value, () => {
  const total = Object.values(payerAmounts.value).reduce(
    (sum: number, amount) => sum + (Number(amount) || 0),
    0
  )
  formData.value.totalAmount = total

  if (formMode.value === 'transfer') {
    syncTransferAmount()
    return
  }
  
  // 自动移除金额为0的付款人（但不在编辑中的）
  payers.value.forEach(personId => {
    const amt = payerAmounts.value[personId]
    if (editingPayerId.value !== personId && (amt === '' || amt === undefined || Number(amt) === 0)) {
      const index = payers.value.indexOf(personId)
      if (index > -1) {
        payers.value.splice(index, 1)
        delete payerAmounts.value[personId]
      }
    }
  })
  
  if (selectedPeople.value.length > 0) {
    distributeAmountToSelectedPeople()
  }
}, { deep: true, immediate: false })

// 如果是编辑模式，加载数据
watch(() => props.expense, (expense) => {
  if (expense && props.visible) {
    formMode.value = (expense.type === 'transfer' ? 'transfer' : 'expense') as ExpenseType

    const expenseDateStr = expense.expenseDate 
      ? new Date(expense.expenseDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
    
    formData.value = {
      payerId: expense.payerId || '',
      description: expense.description,
      totalAmount: Number(expense.totalAmount) || 0,
      expenseDate: expenseDateStr,
    }
    
    if (expense.payers && expense.payers.length > 0) {
      payers.value = expense.payers.map(p => p.personId)
      expense.payers.forEach(payer => {
        payerAmounts.value[payer.personId] = Number(payer.amount) || 0
      })
    } else if (expense.payerId) {
      payers.value = [expense.payerId]
      payerAmounts.value[expense.payerId] = Number(expense.totalAmount) || 0
    }
    
    selectedPeople.value = expense.splits.map(s => s.personId)
    expense.splits.forEach(split => {
      splitAmounts.value[split.personId] = Number(split.amount) || 0
    })
  } else if (!expense && props.visible) {
    formMode.value = 'expense'
    resetForm()
  }
}, { immediate: true })

// 重置表单函数
function resetForm() {
  const payerId = props.payerId || props.people[0]?.id || ''
  formData.value = {
    payerId,
    description: '',
    totalAmount: 0,
    expenseDate: new Date().toISOString().split('T')[0],
  }
  if (formMode.value === 'transfer') {
    payers.value = []
    payerAmounts.value = {}
    selectedPeople.value = []
    splitAmounts.value = {}
  } else {
    payers.value = payerId ? [payerId] : []
    payerAmounts.value = payerId ? { [payerId]: 0 } : {}
    selectedPeople.value = payerId ? [payerId] : []
    splitAmounts.value = {}
  }
  editingPayerId.value = null
}

// 监听弹窗打开，如果是新建模式，重置表单並預設為帳目
watch(() => props.visible, (visible) => {
  if (visible && !props.expense) {
    formMode.value = 'expense'
    resetForm()
  }
})

// 当前分账总金额（用于验证）
const currentSplitTotal = computed(() => {
  return Object.values(splitAmounts.value).reduce((sum, amount) => sum + (Number(amount) || 0), 0)
})

// 总金额是否有效（分账金额总和应该等于总金额）
const isTotalValid = computed(() => {
  const total = Number(formData.value.totalAmount) || 0
  return Math.abs(currentSplitTotal.value - total) < 0.01
})

// 表单是否有效
const isFormValid = computed(() => {
  if (formMode.value === 'transfer') {
    const fromId = payers.value[0]
    const toId = selectedPeople.value[0]
    const amt = Number(payerAmounts.value[fromId]) || Number(formData.value.totalAmount) || 0
    return (
      payers.value.length === 1 &&
      selectedPeople.value.length === 1 &&
      fromId != null &&
      toId != null &&
      fromId !== toId &&
      amt > 0
    )
  }
  return (
    payers.value.length > 0 &&
    formData.value.description.trim() &&
    (Number(formData.value.totalAmount) || 0) > 0 &&
    selectedPeople.value.length > 0 &&
    isTotalValid.value
  )
})

function togglePerson(personId: string) {
  if (formMode.value === 'transfer') {
    if (selectedPeople.value[0] === personId) {
      selectedPeople.value = []
      splitAmounts.value = {}
    } else {
      selectedPeople.value = [personId]
      syncTransferAmount()
    }
    return
  }
  const index = selectedPeople.value.indexOf(personId)
  if (index > -1) {
    selectedPeople.value = selectedPeople.value.filter(id => id !== personId)
  } else {
    selectedPeople.value = [...selectedPeople.value, personId]
  }
  distributeAmountToSelectedPeople()
}

// 付款人相关函数
function isPayerSelected(personId: string): boolean {
  return payers.value.includes(personId)
}

function togglePayer(personId: string) {
  if (formMode.value === 'transfer') {
    if (payers.value[0] === personId) {
      payers.value = []
      payerAmounts.value = {}
      formData.value.totalAmount = 0
      if (selectedPeople.value.length === 1) splitAmounts.value[selectedPeople.value[0]] = 0
    } else {
      payers.value = [personId]
      payerAmounts.value[personId] = ''
      startEditingPayer(personId)
    }
    return
  }
  const index = payers.value.indexOf(personId)
  if (index > -1) {
    payers.value.splice(index, 1)
    delete payerAmounts.value[personId]
  } else {
    payers.value.push(personId)
    payerAmounts.value[personId] = ''
    startEditingPayer(personId)
  }
}

function startEditingPayer(personId: string) {
  editingPayerId.value = personId
  // 若金額為0，改為空字串，避免用戶需先刪除0再輸入
  const val = payerAmounts.value[personId]
  if (val === 0 || val === undefined || val === null) {
    payerAmounts.value[personId] = ''
  }
}

function finishEditingPayer(personId: string) {
  editingPayerId.value = null
  const val = payerAmounts.value[personId]
  const num = Number(val)
  // 确保金额不为负数
  if (num < 0) {
    payerAmounts.value[personId] = 0
  }
  // 如果金额为0或空，自动取消选择
  if (num === 0 || val === '' || val === undefined || val === null || Number.isNaN(num)) {
    const index = payers.value.indexOf(personId)
    if (index > -1) {
      payers.value.splice(index, 1)
      delete payerAmounts.value[personId]
    }
  }
}

function handleSplitAmountChange(personId: string, event: Event) {
  const newAmount = parseFloat((event.target as HTMLInputElement).value) || 0
  const oldAmount = splitAmounts.value[personId] || 0
  splitAmounts.value[personId] = newAmount
  
  // 如果调整了某个人的金额，将差值分摊给其他人
  if (selectedPeople.value.length > 1) {
    const delta = newAmount - oldAmount
    const otherPeople = selectedPeople.value.filter(id => id !== personId)
    const adjustmentPerPerson = -delta / otherPeople.length
    
    otherPeople.forEach(id => {
      splitAmounts.value[id] = (splitAmounts.value[id] || 0) + adjustmentPerPerson
    })
  }
}

function handleClose() {
  // 关闭时重置表单（如果是新建模式）
  if (!props.expense) {
    resetForm()
  }
  emit('close')
}

function handleSubmit() {
  if (!isFormValid.value) return

  const splits: ExpenseSplit[] = selectedPeople.value.map(personId => ({
    personId,
    amount: splitAmounts.value[personId] || 0,
    paid: false,
  }))

  // 构建付款人列表（过滤掉金额为0的付款人）
  const expensePayers: ExpensePayer[] = payers.value
    .map(personId => ({
      personId,
      amount: Number(payerAmounts.value[personId]) || 0,
    }))
    .filter(payer => payer.amount > 0) // 过滤掉金额为0的付款人

  // 计算实际付款总额
  const actualPaidTotal = expensePayers.reduce((sum, p) => sum + p.amount, 0)
  
  // 计算实际分账总额
  const actualSplitTotal = splits.reduce((sum, s) => sum + s.amount, 0)
  
  // 验证数据一致性
  let finalTotal = Number(formData.value.totalAmount) || 0
  if (Math.abs(actualPaidTotal - finalTotal) > 0.01) {
    console.warn('付款總額與總金額不一致:', {
      付款總額: actualPaidTotal,
      總金額: finalTotal,
      差值: actualPaidTotal - finalTotal
    })
    formData.value.totalAmount = actualPaidTotal
    finalTotal = actualPaidTotal
  }
  
  if (Math.abs(actualSplitTotal - finalTotal) > 0.01) {
    console.warn('分帳總額與總金額不一致:', {
      分帳總額: actualSplitTotal,
      總金額: finalTotal,
      差值: actualSplitTotal - finalTotal
    })
    alert(`警告：分帳總額（$${actualSplitTotal.toFixed(2)}）與總金額（$${finalTotal.toFixed(2)}）不一致，請檢查後再儲存。`)
    return // 阻止保存
  }

  // 将日期字符串转换为Date对象
  const expenseDate = new Date(formData.value.expenseDate)

  const description = formMode.value === 'transfer'
    ? (formData.value.description.trim() || '轉帳')
    : formData.value.description.trim()

  emit('submit', {
    type: formMode.value,
    payerId: payers.value[0] || '',
    payers: expensePayers,
    description,
    totalAmount: finalTotal,
    expenseDate,
    splits: formMode.value === 'transfer'
      ? splits.map(s => ({ ...s, paid: true }))
      : splits,
  })

  handleClose()
}
</script>

<style scoped>
.expense-form-overlay {
  @apply fixed inset-0 bg-black/50 z-50;
  @apply flex items-center justify-center p-4;
}

.expense-form-modal {
  @apply w-full max-w-xl bg-white rounded-xl shadow-xl;
  @apply flex flex-col max-h-[90vh];
}

.modal-header {
  @apply flex items-center justify-between gap-2 px-6 py-4 border-b border-gray-200;
}

.modal-title {
  @apply text-lg font-semibold text-gray-900 truncate min-w-0;
}

.header-actions {
  @apply flex items-center gap-2 flex-shrink-0;
}

.mode-switch {
  @apply inline-flex rounded-lg p-0.5 bg-gray-100;
}

.mode-btn {
  @apply px-3 py-1.5 text-sm font-medium rounded-md transition-colors;
  @apply text-gray-600 hover:text-gray-900;
}

.mode-btn.active {
  @apply bg-white text-gray-900 shadow-sm;
}

.close-btn {
  @apply w-8 h-8 flex items-center justify-center;
  @apply rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors;
}

.close-icon {
  @apply w-5 h-5 text-gray-600;
}

.form-content {
  @apply flex-1 overflow-y-auto px-6 py-4 space-y-4;
  scrollbar-width: thin;
  scrollbar-color: rgb(203 213 225) transparent;
}

.form-content::-webkit-scrollbar {
  width: 6px;
}

.form-content::-webkit-scrollbar-track {
  background: transparent;
}

.form-content::-webkit-scrollbar-thumb {
  background: rgb(203 213 225);
  border-radius: 3px;
}

.form-content::-webkit-scrollbar-thumb:hover {
  background: rgb(148 163 184);
}

.form-section {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700;
}

.form-input {
  @apply w-full px-4 py-2 border border-gray-300 rounded-lg text-white;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
  @apply bg-gray-800 placeholder-gray-400;
}

.form-select {
  @apply w-full px-4 py-2 border border-gray-300 rounded-lg bg-white;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.amount-input-wrapper {
  @apply flex items-center border border-gray-300 rounded-lg;
  @apply focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent;
}

.amount-display-wrapper {
  @apply flex items-center border border-gray-300 rounded-lg bg-gray-100 px-4 py-2;
}

.currency-symbol {
  @apply px-3 text-gray-600 font-medium;
}

.amount-input {
  @apply border-0 flex-1;
}

.amount-display {
  @apply text-lg font-semibold text-gray-900;
}

.amount-hint {
  @apply text-xs text-gray-500 mt-1;
}

/* 付款和分账布局 */
.split-layout {
  @apply flex items-start gap-4 mb-4;
}

.payers-section,
.splits-section {
  @apply flex-1 min-w-0;
}

.section-title {
  @apply text-sm font-semibold text-gray-700 mb-2;
}

.payers-list,
.splits-list {
  @apply flex flex-col gap-2;
}

.person-card {
  @apply w-full px-3 py-2 rounded-lg border-2;
  @apply border-gray-200 bg-white;
  @apply text-left transition-all;
  @apply hover:border-blue-400 hover:bg-blue-50;
  @apply active:scale-95;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1;
}

.person-card.selected {
  @apply border-blue-600 bg-blue-50;
}

.person-card.disabled,
.person-card:disabled {
  @apply opacity-50 cursor-not-allowed hover:border-gray-200 hover:bg-white active:scale-100;
}

.person-info {
  @apply flex items-center gap-2 text-gray-900 font-medium;
}

.amount-section {
  @apply mt-1 ml-6;
}

.amount-display {
  @apply text-sm text-blue-600 font-semibold cursor-pointer;
  @apply hover:text-blue-700;
}

.amount-input {
  @apply w-full px-2 py-1 rounded border border-gray-300 bg-white;
  @apply text-sm text-gray-900 text-right;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.arrow-section {
  @apply flex-shrink-0 flex items-center justify-center;
  @apply text-gray-400;
  @apply self-stretch;
}

.arrow-icon-wrapper {
  @apply flex items-center justify-center;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.arrow-icon-wrapper.arrow-point-right {
  transform: rotate(180deg);
}

.arrow-icon {
  @apply w-6 h-6;
}

.total-section {
  @apply mt-4 pt-4 border-t border-gray-200;
  @apply flex items-center gap-2;
}

.total-label {
  @apply text-sm font-semibold text-gray-700;
}

.total-amount {
  @apply text-lg font-bold text-gray-900;
}

.total-amount.error {
  @apply text-red-600;
}

.total-hint {
  @apply text-xs text-gray-500;
}

.modal-footer {
  @apply flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200;
}

.btn-cancel {
  @apply px-4 py-2 text-gray-700 rounded-lg;
  @apply hover:bg-gray-100 active:bg-gray-200 transition-colors;
}

.btn-submit {
  @apply px-6 py-2 bg-blue-600 text-white rounded-lg font-medium;
  @apply hover:bg-blue-700 active:bg-blue-800 transition-colors;
  @apply disabled:bg-gray-300 disabled:cursor-not-allowed;
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
