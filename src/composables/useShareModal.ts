import { ref, computed, type Ref, unref } from 'vue'
import type { Person, Expense } from '@/types'
import { generateShareUrl } from '@/utils/shareEncoder'

export function useShareModal(people: Person[] | Ref<Person[]> | (() => Person[]), expenses: Expense[] | Ref<Expense[]> | (() => Expense[])) {
  const isShareModalVisible = ref(false)
  const shareUrl = ref('')

  // 创建响应式引用，确保能访问最新的数据
  const peopleRef = computed(() => {
    if (typeof people === 'function') {
      return people()
    }
    return unref(people)
  })

  const expensesRef = computed(() => {
    if (typeof expenses === 'function') {
      return expenses()
    }
    return unref(expenses)
  })

  function handleShareClick() {
    try {
      const currentPeople = peopleRef.value
      const currentExpenses = expensesRef.value
      
      // 检查是否有有效数据
      if (currentPeople.length === 0) {
        alert('沒有人員數據，無法生成分享連結。')
        return
      }
      
      const url = generateShareUrl(currentPeople, currentExpenses)
      shareUrl.value = url
      
      // 检查URL长度
      if (url.length > 2000) {
        alert('數據量過大，無法生成分享連結。建議減少帳目數量後再試。')
        return
      }
      
      isShareModalVisible.value = true
    } catch (error) {
      console.error('生成分享連結失敗:', error)
      const errorMessage = error instanceof Error ? error.message : '未知錯誤'
      alert(`生成分享連結失敗：${errorMessage}\n\n請檢查控制台查看詳細信息。`)
    }
  }

  function closeShareModal() {
    isShareModalVisible.value = false
  }

  return {
    isShareModalVisible,
    shareUrl,
    handleShareClick,
    closeShareModal
  }
}
