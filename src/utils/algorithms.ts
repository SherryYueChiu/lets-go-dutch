import type { ExpenseSplit, SettlementResult, TransferPlan } from '@/types'

/**
 * 调整分账金额
 * @param splits 当前分账列表
 * @param personId 要调整的人员ID
 * @param newAmount 新金额
 * @returns 调整后的分账列表
 */
export function adjustSplit(
  splits: ExpenseSplit[],
  personId: string,
  newAmount: number
): ExpenseSplit[] {
  const targetSplit = splits.find(s => s.personId === personId)
  if (!targetSplit) {
    throw new Error(`Person ${personId} not found in splits`)
  }
  
  const oldAmount = targetSplit.amount
  const delta = newAmount - oldAmount
  
  // 获取其他未调整的人员
  const otherSplits = splits.filter(s => s.personId !== personId)
  
  if (otherSplits.length === 0) {
    // 如果只有一个人，直接返回
    return [{ ...targetSplit, amount: newAmount }]
  }
  
  // 将差值等分给其他人
  const adjustmentPerPerson = -delta / otherSplits.length
  
  return splits.map(split => {
    if (split.personId === personId) {
      return { ...split, amount: newAmount }
    }
    return {
      ...split,
      amount: split.amount + adjustmentPerPerson
    }
  })
}

/**
 * 计算每个人的净金额
 * @param people 人员列表
 * @param expenses 所有分账记录
 * @returns 结算结果列表
 */
export function calculateNetAmounts(
  people: Array<{ id: string }>,
  expenses: Array<{
    payerId?: string
    payers?: Array<{ personId: string; amount: number }>
    totalAmount: number
    splits: ExpenseSplit[]
    description?: string
  }>
): SettlementResult[] {
  // 初始化每个人的净金额为0
  const netAmounts = new Map<string, number>()
  people.forEach(person => {
    netAmounts.set(person.id, 0)
  })
  
  let totalPaid = 0  // 总支付金额
  let totalOwed = 0  // 总承担金额（未私下支付的）
  
  // 遍历所有账目
  expenses.forEach((expense, index) => {
    let expensePaid = 0  // 这笔账目的支付总额
    let expenseOwed = 0  // 这笔账目的承担总额（未私下支付的）
    
    // 1. 处理付款人（支持多人支付）
    if (expense.payers && expense.payers.length > 0) {
      // 多人支付模式
      expense.payers.forEach(payer => {
        expensePaid += payer.amount
      })
    } else if (expense.payerId) {
      // 兼容旧数据（单个付款人）
      expensePaid = expense.totalAmount
    }
    
    // 计算原始分账总额（用于检查）
    const originalSplitTotal = expense.splits
      .filter(s => !s.paid)
      .reduce((sum, s) => sum + s.amount, 0)
    
    // 如果付款总额小于分账总额，按比例调整分账金额
    let adjustmentRatio = 1
    if (expensePaid > 0 && originalSplitTotal > expensePaid) {
      adjustmentRatio = expensePaid / originalSplitTotal
      console.warn(`帳目 ${index + 1} "${expense.description || '未命名'}" 數據不一致，自動按比例調整:`, {
        付款總額: expensePaid,
        原始分帳總額: originalSplitTotal,
        調整比例: `${(adjustmentRatio * 100).toFixed(1)}%`
      })
    }
    
    // 2. 每个分账人承担相应金额（排除已私下支付的，按比例调整）
    expense.splits.forEach(split => {
      if (!split.paid) { // 未私下支付的才计入
        const adjustedAmount = split.amount * adjustmentRatio
        const personNet = netAmounts.get(split.personId) || 0
        netAmounts.set(split.personId, personNet - adjustedAmount)
        expenseOwed += adjustedAmount
      }
    })
    
    // 3. 处理付款人（在分账之后处理，确保顺序正确）
    if (expense.payers && expense.payers.length > 0) {
      expense.payers.forEach(payer => {
        const payerNet = netAmounts.get(payer.personId) || 0
        netAmounts.set(payer.personId, payerNet + payer.amount)
      })
    } else if (expense.payerId) {
      const payerNet = netAmounts.get(expense.payerId) || 0
      netAmounts.set(expense.payerId, payerNet + expense.totalAmount)
    }
    
    totalPaid += expensePaid
    totalOwed += expenseOwed
    
    // 检查单笔账目的平衡性（调整后应该平衡）
    const expenseDiff = expensePaid - expenseOwed
    if (Math.abs(expenseDiff) > 0.01) {
      console.warn(`帳目 ${index + 1} "${expense.description || '未命名'}" 調整後仍不平衡:`, {
        總金額: expense.totalAmount,
        付款總額: expensePaid,
        調整後分帳總額: expenseOwed,
        差值: expenseDiff
      })
    }
  })
  
  // 检查总体平衡性
  const totalDiff = totalPaid - totalOwed
  if (Math.abs(totalDiff) > 0.01) {
    console.warn('結算金額不平衡:', {
      總支付: totalPaid,
      總承擔: totalOwed,
      差值: totalDiff,
      帳目數量: expenses.length
    })
  }
  
  // 转换为结果格式
  return people.map(person => ({
    personId: person.id,
    netAmount: netAmounts.get(person.id) || 0
  }))
}

/**
 * 计算最少转账步数方案
 * @param settlements 结算结果列表
 * @returns 转账方案列表
 */
export function calculateMinTransfers(
  settlements: SettlementResult[]
): TransferPlan[] {
  const transfers: TransferPlan[] = []
  
  // 过滤掉已平衡的人
  const activeSettlements = settlements.filter(s => Math.abs(s.netAmount) > 0.01)
  
  // 检查总和是否为0（数据一致性）
  const total = activeSettlements.reduce((sum, s) => sum + s.netAmount, 0)
  if (Math.abs(total) > 0.01) { // 允许小数点误差
    console.warn('结算金额不平衡，总和:', total)
  }
  
  // 1. 分离应收者和应给者，并排序
  const creditors = activeSettlements
    .filter(s => s.netAmount > 0)
    .map(s => ({ ...s })) // 复制避免修改原数组
    .sort((a, b) => b.netAmount - a.netAmount) // 降序：应收最多的在前
  
  const debtors = activeSettlements
    .filter(s => s.netAmount < 0)
    .map(s => ({ ...s, netAmount: Math.abs(s.netAmount) })) // 转为正数便于计算
    .sort((a, b) => b.netAmount - a.netAmount) // 降序：应给最多的在前
  
  // 2. 使用双指针贪心匹配
  let creditorIdx = 0
  let debtorIdx = 0
  
  while (creditorIdx < creditors.length && debtorIdx < debtors.length) {
    const creditor = creditors[creditorIdx]
    const debtor = debtors[debtorIdx]
    
    // 3. 计算转账金额（取较小值）
    const transferAmount = Math.min(creditor.netAmount, debtor.netAmount)
    
    // 4. 记录转账
    transfers.push({
      fromPersonId: debtor.personId,
      toPersonId: creditor.personId,
      amount: transferAmount
    })
    
    // 5. 更新余额
    creditor.netAmount -= transferAmount
    debtor.netAmount -= transferAmount
    
    // 6. 移动指针（余额为0的跳过）
    if (creditor.netAmount < 0.01) {
      creditorIdx++
    }
    if (debtor.netAmount < 0.01) {
      debtorIdx++
    }
  }
  
  return transfers
}
