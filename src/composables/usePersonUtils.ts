import { computed, type Ref, unref } from 'vue'
import type { Person } from '@/types'

export function usePersonUtils(people: Person[] | Ref<Person[]>) {
  // 将 people 转换为响应式引用
  const peopleRef = computed(() => unref(people))

  function getPersonById(personId: string): Person | undefined {
    return peopleRef.value.find(p => p.id === personId)
  }

  function getPersonName(personId: string): string {
    return getPersonById(personId)?.name || '未知'
  }

  function getPersonEmoji(personId: string): string {
    return getPersonById(personId)?.emoji || '❓'
  }

  return {
    getPersonById,
    getPersonName,
    getPersonEmoji
  }
}
