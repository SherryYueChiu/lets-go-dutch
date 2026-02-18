import { defineStore } from 'pinia'
import type { Expense, ExpenseSplit } from '@/types'

export const useExpenseStore = defineStore('expense', {
  state: () => ({
    expenses: [] as Expense[],
  }),

  getters: {
    getExpenseById: (state) => {
      return (id: string) => state.expenses.find(e => e.id === id)
    },
  },

  actions: {
    /**
     * 添加分账记录
     */
    addExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Expense {
      const newExpense: Expense = {
        ...expense,
        expenseDate: expense.expenseDate || new Date(), // 如果没有提供，使用当前日期
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      this.expenses.push(newExpense)
      this.saveToLocalStorage()
      return newExpense
    },

    /**
     * 更新分账记录
     */
    updateExpense(id: string, updates: Partial<Expense>) {
      const expense = this.expenses.find(e => e.id === id)
      if (expense) {
        Object.assign(expense, updates)
        expense.updatedAt = new Date()
        this.saveToLocalStorage()
      }
    },

    /**
     * 删除分账记录
     */
    removeExpense(id: string) {
      const index = this.expenses.findIndex(e => e.id === id)
      if (index !== -1) {
        this.expenses.splice(index, 1)
        this.saveToLocalStorage()
      }
    },

    /**
     * 更新分账明细
     */
    updateExpenseSplit(expenseId: string, split: ExpenseSplit) {
      const expense = this.expenses.find(e => e.id === expenseId)
      if (expense) {
        const index = expense.splits.findIndex(s => s.personId === split.personId)
        if (index !== -1) {
          expense.splits[index] = split
        } else {
          expense.splits.push(split)
        }
        expense.updatedAt = new Date()
        this.saveToLocalStorage()
      }
    },

    /**
     * 保存到本地存储
     */
    saveToLocalStorage() {
      // 将Date对象转换为字符串
      const serialized = this.expenses.map(expense => ({
        ...expense,
        expenseDate: expense.expenseDate ? expense.expenseDate.toISOString() : expense.createdAt.toISOString(),
        createdAt: expense.createdAt.toISOString(),
        updatedAt: expense.updatedAt.toISOString(),
      }))
      localStorage.setItem('expenses', JSON.stringify(serialized))
    },

    /**
     * 从本地存储加载
     */
    loadFromLocalStorage() {
      const stored = localStorage.getItem('expenses')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          // 转换日期字符串为Date对象
          this.expenses = parsed.map((expense: any) => ({
            ...expense,
            expenseDate: expense.expenseDate ? new Date(expense.expenseDate) : new Date(expense.createdAt),
            createdAt: new Date(expense.createdAt),
            updatedAt: new Date(expense.updatedAt),
          }))
        } catch (e) {
          console.error('Failed to load expenses from localStorage:', e)
        }
      }
    },
  },
})
