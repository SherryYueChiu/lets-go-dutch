// 人员模型
export interface Person {
  id: string              // 唯一标识
  name: string            // 显示名称（默认随机动物名）
  emoji: string           // 动物emoji
  avatar?: string         // 头像（可选）
}

// 付款人明细模型
export interface ExpensePayer {
  personId: string        // 付款人ID
  amount: number          // 该付款人支付的金额
}

// 分账记录模型
export interface Expense {
  id: string              // 唯一标识
  payerId: string         // 付款人ID（兼容旧数据，已废弃）
  payers?: ExpensePayer[]  // 付款人列表（多人支付）
  description: string     // 项目描述
  totalAmount: number     // 总金额
  expenseDate: Date       // 消費日期
  createdAt: Date        // 创建时间（系统记录）
  updatedAt: Date        // 更新时间（系统记录）
  
  // 分账明细
  splits: ExpenseSplit[]  // 分账列表
}

// 分账明细模型
export interface ExpenseSplit {
  personId: string        // 参与分账的人员ID
  amount: number          // 该人员应承担金额
  paid: boolean           // 是否已私下支付（特殊功能）
}

// 结算结果模型
export interface SettlementResult {
  personId: string
  netAmount: number       // 净金额（正数=应收，负数=应给）
}

// 转账方案模型（最少步数）
export interface TransferPlan {
  fromPersonId: string    // 转出人
  toPersonId: string      // 转入人
  amount: number          // 转账金额
}
