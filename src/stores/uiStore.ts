import { defineStore } from 'pinia'
import type { Person } from '@/types'
import { usePeopleStore } from './peopleStore'

export const useUIStore = defineStore('ui', {
  state: () => ({
    currentPersonIndex: 0,
    isPersonGridVisible: false,  // 人员网格弹窗显示状态
  }),

  getters: {
    currentPerson(): Person | null {
      const peopleStore = usePeopleStore()
      return peopleStore.people[this.currentPersonIndex] || null
    },
  },

  actions: {
    /**
     * 打开人员网格视图
     */
    openPersonGrid() {
      this.isPersonGridVisible = true
    },

    /**
     * 关闭人员网格视图
     */
    closePersonGrid() {
      this.isPersonGridVisible = false
    },

    /**
     * 选择人员（跳转到对应视图）
     */
    selectPerson(personId: string) {
      const peopleStore = usePeopleStore()
      const index = peopleStore.people.findIndex(p => p.id === personId)
      if (index !== -1) {
        this.currentPersonIndex = index
      }
      this.closePersonGrid()
    },

    /**
     * 设置当前人员索引
     */
    setCurrentPersonIndex(index: number) {
      const peopleStore = usePeopleStore()
      if (index >= 0 && index < peopleStore.people.length) {
        this.currentPersonIndex = index
      }
    },
  },
})
