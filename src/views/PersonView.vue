<template>
  <div class="person-view">
    <PersonSwiper
      :people="peopleStore.people"
      :expenses="expenseStore.expenses"
      :current-index="uiStore.currentPersonIndex"
      :settlements="settlements"
      @update:current-index="uiStore.setCurrentPersonIndex"
      @add-person="handleAddPerson"
      @edit-person-name="handleEditPersonName"
      @add-expense="handleAddExpense"
      @view-expense="handleViewExpense"
    />

    <!-- 记账表单 -->
    <ExpenseForm
      :visible="isExpenseFormVisible"
      :people="peopleStore.people"
      :payer-id="currentPayerId"
      :expense="editingExpense"
      @close="closeExpenseForm"
      @submit="handleExpenseSubmit"
    />

    <!-- 账目详情 -->
    <ExpenseDetail
      :visible="isExpenseDetailVisible"
      :expense="viewingExpense"
      :people="peopleStore.people"
      @close="closeExpenseDetail"
      @edit="handleExpenseEdit"
      @delete="handleExpenseDelete"
      @update-date="handleExpenseDateUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Expense } from '@/types'
import { usePeopleStore } from '@/stores/peopleStore'
import { useUIStore } from '@/stores/uiStore'
import { useExpenseStore } from '@/stores/expenseStore'
import { calculateNetAmounts } from '@/utils/algorithms'
import PersonSwiper from '@/components/Person/PersonSwiper.vue'
import ExpenseForm from '@/components/Expense/ExpenseForm.vue'
import ExpenseDetail from '@/components/Expense/ExpenseDetail.vue'

const peopleStore = usePeopleStore()
const uiStore = useUIStore()
const expenseStore = useExpenseStore()

// 计算结算结果
const settlements = computed(() => {
  return calculateNetAmounts(peopleStore.people, expenseStore.expenses)
})

// 记账表单状态
const isExpenseFormVisible = ref(false)
const currentPayerId = ref<string>('')
const editingExpense = ref<Expense | null>(null)

// 账目详情状态
const isExpenseDetailVisible = ref(false)
const viewingExpense = ref<Expense | null>(null)

function handleAddPerson() {
  peopleStore.addPerson()
  // 切换到新添加的人员
  uiStore.setCurrentPersonIndex(peopleStore.people.length - 1)
}

function handleEditPersonName(personId: string) {
  const person = peopleStore.getPersonById(personId)
  if (!person) return
  
  const newName = prompt('請輸入新名稱：', person.name)
  if (newName && newName.trim()) {
    peopleStore.updatePersonName(personId, newName.trim())
  }
}

function handleAddExpense(personId: string) {
  currentPayerId.value = personId
  editingExpense.value = null
  isExpenseFormVisible.value = true
}

function handleViewExpense(expenseId: string) {
  const expense = expenseStore.getExpenseById(expenseId)
  if (expense) {
    viewingExpense.value = expense
    isExpenseDetailVisible.value = true
  }
}

function closeExpenseForm() {
  isExpenseFormVisible.value = false
  editingExpense.value = null
  currentPayerId.value = ''
}

function handleExpenseSubmit(expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) {
  if (editingExpense.value) {
    // 更新现有账目
    expenseStore.updateExpense(editingExpense.value.id, expenseData)
  } else {
    // 创建新账目
    expenseStore.addExpense(expenseData)
  }
  closeExpenseForm()
}

function closeExpenseDetail() {
  isExpenseDetailVisible.value = false
  viewingExpense.value = null
}

function handleExpenseEdit() {
  if (viewingExpense.value) {
    editingExpense.value = viewingExpense.value
    isExpenseDetailVisible.value = false
    isExpenseFormVisible.value = true
  }
}

function handleExpenseDelete() {
  if (viewingExpense.value) {
    expenseStore.removeExpense(viewingExpense.value.id)
    closeExpenseDetail()
  }
}

function handleExpenseDateUpdate(date: Date) {
  if (viewingExpense.value) {
    expenseStore.updateExpense(viewingExpense.value.id, { expenseDate: date })
  }
}
</script>

<style scoped>
.person-view {
  @apply w-full h-full;
}
</style>
