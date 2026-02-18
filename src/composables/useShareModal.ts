import { ref } from 'vue'
import type { Person, Expense } from '@/types'
import { generateShareUrl } from '@/utils/shareEncoder'

export function useShareModal(people: Person[], expenses: Expense[]) {
  const isShareModalVisible = ref(false)
  const shareUrl = ref('')

  function handleShareClick() {
    try {
      const url = generateShareUrl(people, expenses)
      shareUrl.value = url
      
      // 检查URL长度
      if (url.length > 2000) {
        alert('數據量過大，無法生成分享連結。建議減少帳目數量後再試。')
        return
      }
      
      // 检查是否有有效数据
      if (people.length === 0) {
        alert('沒有人員數據，無法生成分享連結。')
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
