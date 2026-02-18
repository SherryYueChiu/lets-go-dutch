import pako from 'pako'
import type { Person, Expense, ExpensePayer, ExpenseSplit } from '@/types'

// 精简数据接口
export interface MinimalPerson {
  n: string    // name
  e: string    // emoji
}

export interface MinimalExpensePayer {
  p: number    // personIndex (人员索引)
  a: number    // amount
}

export interface MinimalExpenseSplit {
  p: number    // personIndex (人员索引)
  a: number    // amount
  d: boolean   // paid
}

export interface MinimalExpense {
  d: string           // description
  t: number           // totalAmount
  dt: number          // expenseDate (timestamp)
  py?: MinimalExpensePayer[]
  pid?: number        // payerIndex (付款人索引，兼容旧数据)
  sp: MinimalExpenseSplit[]
}

export interface ShareData {
  v: number           // version
  p: MinimalPerson[]   // people
  e: MinimalExpense[]  // expenses
}

// 旧格式数据（兼容性）
interface LegacyShareData {
  v: number
  p: MinimalPerson[]
  e: Array<{
    d: string
    t: number
    dt: number
    py?: Array<{ p: string; a: number }>  // 旧格式：personId是字符串
    pid?: string                          // 旧格式：personId是字符串
    sp: Array<{ p: string; a: number; d: boolean }>  // 旧格式：personId是字符串
  }>
}

// 编码函数
export function encodeShareData(data: ShareData): string {
  const json = JSON.stringify(data)
  const compressed = pako.deflate(json, { level: 9 })
  return btoa(String.fromCharCode(...compressed))
}

// 解码函数
export function decodeShareData(encoded: string): ShareData {
  try {
    // Base64解码
    const binary = atob(encoded)
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
    
    // Gzip解压
    const decompressed = pako.inflate(bytes, { to: 'string' })
    
    // JSON解析
    const parsed = JSON.parse(decompressed)
    
    // 检查是否是旧格式（personId是字符串）
    const isLegacyFormat = parsed.e && parsed.e.length > 0 && 
      parsed.e[0].sp && parsed.e[0].sp.length > 0 &&
      typeof parsed.e[0].sp[0].p === 'string'
    
    if (isLegacyFormat) {
      console.log('檢測到舊格式數據，進行轉換...')
      return convertLegacyFormat(parsed as LegacyShareData)
    }
    
    return parsed as ShareData
  } catch (error) {
    console.error('解碼步驟失敗:', {
      error,
      encodedLength: encoded.length,
      step: error instanceof Error ? error.message : 'unknown'
    })
    throw error
  }
}

// 转换旧格式数据为新格式
function convertLegacyFormat(legacy: LegacyShareData): ShareData {
  // 创建 personId 到索引的映射
  const personIdToIndex = new Map<string, number>()
  
  // 收集所有使用到的 personId
  const allPersonIds = new Set<string>()
  
  legacy.e.forEach(expense => {
    if (expense.py) {
      expense.py.forEach(payer => allPersonIds.add(payer.p))
    }
    if (expense.pid) {
      allPersonIds.add(expense.pid)
    }
    expense.sp.forEach(split => allPersonIds.add(split.p))
  })
  
  // 创建映射（按出现顺序）
  let index = 0
  allPersonIds.forEach(personId => {
    if (!personIdToIndex.has(personId)) {
      personIdToIndex.set(personId, index++)
    }
  })
  
  // 如果人员数量不匹配，使用映射中的人员
  const people: MinimalPerson[] = legacy.p.length >= personIdToIndex.size 
    ? legacy.p 
    : Array.from({ length: personIdToIndex.size }, (_, i) => ({
        n: `人員${i + 1}`,
        e: '👤'
      }))
  
  // 转换账目数据
  const expenses: MinimalExpense[] = legacy.e.map(expense => ({
    d: expense.d,
    t: expense.t,
    dt: expense.dt,
    py: expense.py?.map(p => ({
      p: personIdToIndex.get(p.p) ?? 0,
      a: p.a
    })),
    pid: expense.pid ? (personIdToIndex.get(expense.pid) ?? undefined) : undefined,
    sp: expense.sp.map(s => ({
      p: personIdToIndex.get(s.p) ?? 0,
      a: s.a,
      d: s.d
    }))
  }))
  
  return {
    v: legacy.v,
    p: people,
    e: expenses
  }
}

// 生成分享URL
export function generateShareUrl(people: Person[], expenses: Expense[]): string {
  const shareData = createShareData(people, expenses)
  const encoded = encodeShareData(shareData)
  const baseUrl = window.location.origin + window.location.pathname
  return `${baseUrl}#share=${encoded}`
}

// 从URL读取数据
export function loadFromUrl(): ShareData | null {
  const hash = window.location.hash
  console.log('當前 URL hash:', hash)
  
  // 支持多种格式：share=xxx 或 #share=xxx
  const match = hash.match(/share=([^&]+)/)
  if (!match) {
    console.log('未找到 share 參數')
    return null
  }
  
  const encodedData = match[1]
  console.log('提取的編碼數據長度:', encodedData.length)
  
  try {
    const data = decodeShareData(encodedData)
    console.log('解碼後的數據:', {
      version: data.v,
      peopleCount: data.p?.length,
      expensesCount: data.e?.length
    })
    
    // 验证数据格式
    if (!data || !data.p || !data.e || typeof data.v !== 'number') {
      console.error('分享數據格式不正確:', data)
      return null
    }
    return data
  } catch (error) {
    console.error('解碼分享數據失敗:', error)
    if (error instanceof Error) {
      console.error('錯誤詳情:', error.message, error.stack)
    }
    return null
  }
}

// 辅助函数
function minimizePerson(person: Person): MinimalPerson {
  return {
    n: person.name,
    e: person.emoji
  }
}

function minimizeExpensePayer(payer: ExpensePayer, personIdToIndex: Map<string, number>): MinimalExpensePayer | null {
  const index = personIdToIndex.get(payer.personId)
  if (index === undefined) {
    console.warn(`付款人 ID ${payer.personId} 不在人員列表中，已跳過`)
    return null
  }
  return {
    p: index,
    a: payer.amount
  }
}

function minimizeExpenseSplit(split: ExpenseSplit, personIdToIndex: Map<string, number>): MinimalExpenseSplit | null {
  const index = personIdToIndex.get(split.personId)
  if (index === undefined) {
    console.warn(`分帳人 ID ${split.personId} 不在人員列表中，已跳過`)
    return null
  }
  return {
    p: index,
    a: split.amount,
    d: split.paid
  }
}

function minimizeExpense(expense: Expense, personIdToIndex: Map<string, number>): MinimalExpense | null {
  // 检查付款人是否有效
  const validPayers = expense.payers
    ?.map(p => minimizeExpensePayer(p, personIdToIndex))
    .filter((p): p is MinimalExpensePayer => p !== null) || []
  
  // 检查旧格式付款人是否有效
  const payerIndex = expense.payerId ? personIdToIndex.get(expense.payerId) : undefined
  if (expense.payerId && payerIndex === undefined) {
    console.warn(`帳目 "${expense.description}" 的付款人 ID ${expense.payerId} 不在人員列表中`)
  }
  
  // 检查分账人是否有效
  const validSplits = expense.splits
    .map(s => minimizeExpenseSplit(s, personIdToIndex))
    .filter((s): s is MinimalExpenseSplit => s !== null)
  
  // 如果没有任何有效的付款人或分账人，跳过这个账目
  if (validPayers.length === 0 && payerIndex === undefined && validSplits.length === 0) {
    console.warn(`帳目 "${expense.description}" 沒有有效的付款人或分帳人，已跳過`)
    return null
  }
  
  // 如果分账人列表为空，跳过这个账目
  if (validSplits.length === 0) {
    console.warn(`帳目 "${expense.description}" 沒有有效的分帳人，已跳過`)
    return null
  }
  
  return {
    d: expense.description,
    t: expense.totalAmount,
    dt: new Date(expense.expenseDate).getTime(),
    py: validPayers.length > 0 ? validPayers : undefined,
    pid: payerIndex,
    sp: validSplits
  }
}

function createShareData(people: Person[], expenses: Expense[]): ShareData {
  // 创建 personId 到索引的映射
  const personIdToIndex = new Map<string, number>()
  people.forEach((person, index) => {
    personIdToIndex.set(person.id, index)
  })
  
  // 过滤并转换账目，只保留有效的账目
  const validExpenses = expenses
    .map(expense => minimizeExpense(expense, personIdToIndex))
    .filter((e): e is MinimalExpense => e !== null)
  
  console.log(`分享數據統計: 人員 ${people.length} 人，原始帳目 ${expenses.length} 筆，有效帳目 ${validExpenses.length} 筆`)
  
  return {
    v: 1,
    p: people.map(minimizePerson),
    e: validExpenses
  }
}

// 将精简数据扩展为完整格式
export function expandToPerson(minimal: MinimalPerson, id: string): Person {
  return {
    id,
    name: minimal.n,
    emoji: minimal.e
  }
}

export function expandToExpense(
  minimal: MinimalExpense, 
  id: string,
  indexToPersonId: Map<number, string>
): Expense {
  return {
    id,
    description: minimal.d,
    totalAmount: minimal.t,
    expenseDate: new Date(minimal.dt),
    payers: minimal.py?.map(p => {
      const personId = indexToPersonId.get(p.p)
      if (!personId) {
        throw new Error(`Person index ${p.p} not found`)
      }
      return {
        personId,
        amount: p.a
      }
    }),
    payerId: minimal.pid !== undefined ? (indexToPersonId.get(minimal.pid) || '') : '',
    splits: minimal.sp.map(s => {
      const personId = indexToPersonId.get(s.p)
      if (!personId) {
        throw new Error(`Person index ${s.p} not found`)
      }
      return {
        personId,
        amount: s.a,
        paid: s.d
      }
    }),
    createdAt: new Date(),
    updatedAt: new Date()
  }
}
