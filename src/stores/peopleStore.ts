import { defineStore } from 'pinia'
import type { Person } from '@/types'
import { getUnusedRandomAnimal } from '@/utils/animalNames'
import { generateUUID } from '@/utils/uuid'

export const usePeopleStore = defineStore('people', {
  state: () => ({
    people: [] as Person[],
  }),

  getters: {
    getPersonById: (state) => {
      return (id: string) => state.people.find(p => p.id === id)
    },
  },

  actions: {
    /**
     * 添加人员
     */
    addPerson(name?: string): Person {
      const usedNames = this.people.map(p => p.name)
      const animal = name 
        ? { name, emoji: '👤' } // 如果提供了名称，使用默认emoji
        : getUnusedRandomAnimal(usedNames)
      
      const newPerson: Person = {
        id: generateUUID(),
        name: animal.name,
        emoji: animal.emoji,
      }
      
      this.people.push(newPerson)
      this.saveToLocalStorage()
      return newPerson
    },

    /**
     * 删除人员
     */
    removePerson(id: string) {
      const index = this.people.findIndex(p => p.id === id)
      if (index !== -1) {
        this.people.splice(index, 1)
        this.saveToLocalStorage()
      }
    },

    /**
     * 更新人员名称
     */
    updatePersonName(id: string, newName: string) {
      const person = this.people.find(p => p.id === id)
      if (person) {
        person.name = newName
        this.saveToLocalStorage()
      }
    },

    /**
     * 初始化默认人员（如果列表为空）
     */
    initializeDefaultPeople() {
      if (this.people.length === 0) {
        this.addPerson()
        this.addPerson()
      }
    },

    /**
     * 保存到本地存储
     */
    saveToLocalStorage() {
      localStorage.setItem('people', JSON.stringify(this.people))
    },

    /**
     * 从本地存储加载
     */
    loadFromLocalStorage() {
      const stored = localStorage.getItem('people')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          // 转换日期字段（如果需要）
          this.people = parsed
        } catch (e) {
          console.error('Failed to load people from localStorage:', e)
        }
      }
    },
  },
})
