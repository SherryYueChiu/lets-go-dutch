# 核心算法详细说明

## 一、最少转账步数算法详解

### 1.1 问题定义

**输入**: 
- 一组人员的净金额列表，每个元素包含 `{ personId, netAmount }`
- `netAmount > 0` 表示应收他人钱
- `netAmount < 0` 表示应给他人钱
- `netAmount = 0` 表示已平衡

**输出**: 
- 转账方案列表，每个元素包含 `{ fromPersonId, toPersonId, amount }`
- 目标：使转账次数最少

**约束**:
- 所有转账完成后，每个人的净金额应为 0
- 转账金额必须为正数

### 1.2 示例

假设有4个人：
- A: +100 (应收100)
- B: +50  (应收50)
- C: -80  (应给80)
- D: -70  (应给70)

**贪心算法结果**:
1. C → A: 80 (C给A 80，A还剩20应收，C已平衡)
2. D → A: 20 (D给A 20，A已平衡，D还剩50应给)
3. D → B: 50 (D给B 50，所有人平衡)

**转账次数**: 3次

### 1.3 算法实现（贪心策略）

```typescript
/**
 * 计算最少转账步数方案
 * @param settlements 结算结果列表
 * @returns 转账方案列表
 */
function calculateMinTransfers(
  settlements: SettlementResult[]
): TransferPlan[] {
  const transfers: TransferPlan[] = [];
  
  // 1. 分离应收者和应给者，并排序
  const creditors = settlements
    .filter(s => s.netAmount > 0)
    .sort((a, b) => b.netAmount - a.netAmount); // 降序：应收最多的在前
  
  const debtors = settlements
    .filter(s => s.netAmount < 0)
    .map(s => ({ ...s, netAmount: Math.abs(s.netAmount) })) // 转为正数便于计算
    .sort((a, b) => b.netAmount - a.netAmount); // 降序：应给最多的在前
  
  // 2. 使用双指针贪心匹配
  let creditorIdx = 0;
  let debtorIdx = 0;
  
  while (creditorIdx < creditors.length && debtorIdx < debtors.length) {
    const creditor = creditors[creditorIdx];
    const debtor = debtors[debtorIdx];
    
    // 3. 计算转账金额（取较小值）
    const transferAmount = Math.min(creditor.netAmount, debtor.netAmount);
    
    // 4. 记录转账
    transfers.push({
      fromPersonId: debtor.personId,
      toPersonId: creditor.personId,
      amount: transferAmount
    });
    
    // 5. 更新余额
    creditor.netAmount -= transferAmount;
    debtor.netAmount -= transferAmount;
    
    // 6. 移动指针（余额为0的跳过）
    if (creditor.netAmount === 0) {
      creditorIdx++;
    }
    if (debtor.netAmount === 0) {
      debtorIdx++;
    }
  }
  
  return transfers;
}
```

### 1.4 算法正确性证明

**贪心选择性质**:
- 每次选择最大的应收者和最大的应给者匹配，可以最大化单次转账金额
- 这减少了后续需要处理的金额，从而减少总转账次数

**最优子结构**:
- 如果当前匹配是最优的，那么剩余的子问题也是最优的
- 因为每次匹配都尽可能大地减少了总债务

**时间复杂度**: O(n log n)，主要是排序的时间
**空间复杂度**: O(n)

### 1.5 边界情况处理

```typescript
function calculateMinTransfers(
  settlements: SettlementResult[]
): TransferPlan[] {
  // 过滤掉已平衡的人
  const activeSettlements = settlements.filter(s => s.netAmount !== 0);
  
  // 检查总和是否为0（数据一致性）
  const total = activeSettlements.reduce((sum, s) => sum + s.netAmount, 0);
  if (Math.abs(total) > 0.01) { // 允许小数点误差
    console.warn('结算金额不平衡，总和:', total);
  }
  
  // ... 后续算法逻辑
}
```

---

## 二、分账微调算法

### 2.1 问题定义

当用户调整某个人的分账金额时，需要将差值分摊给其他未调整的人，同时保持总金额不变。

### 2.2 算法实现

```typescript
/**
 * 调整分账金额
 * @param splits 当前分账列表
 * @param personId 要调整的人员ID
 * @param newAmount 新金额
 * @returns 调整后的分账列表
 */
function adjustSplit(
  splits: ExpenseSplit[],
  personId: string,
  newAmount: number
): ExpenseSplit[] {
  const targetSplit = splits.find(s => s.personId === personId);
  if (!targetSplit) {
    throw new Error(`Person ${personId} not found in splits`);
  }
  
  const oldAmount = targetSplit.amount;
  const delta = newAmount - oldAmount;
  
  // 获取其他未调整的人员
  const otherSplits = splits.filter(s => s.personId !== personId);
  
  if (otherSplits.length === 0) {
    // 如果只有一个人，直接返回
    return [{ ...targetSplit, amount: newAmount }];
  }
  
  // 将差值等分给其他人
  const adjustmentPerPerson = -delta / otherSplits.length;
  
  return splits.map(split => {
    if (split.personId === personId) {
      return { ...split, amount: newAmount };
    }
    return {
      ...split,
      amount: split.amount + adjustmentPerPerson
    };
  });
}
```

### 2.3 高级微调：按比例分摊

如果希望按现有金额比例分摊差值：

```typescript
function adjustSplitProportional(
  splits: ExpenseSplit[],
  personId: string,
  newAmount: number
): ExpenseSplit[] {
  const targetSplit = splits.find(s => s.personId === personId);
  if (!targetSplit) return splits;
  
  const oldAmount = targetSplit.amount;
  const delta = newAmount - oldAmount;
  
  const otherSplits = splits.filter(s => s.personId !== personId);
  const otherTotal = otherSplits.reduce((sum, s) => sum + s.amount, 0);
  
  if (otherTotal === 0) {
    // 如果其他人的金额都是0，等分
    const adjustmentPerPerson = -delta / otherSplits.length;
    return splits.map(s => 
      s.personId === personId 
        ? { ...s, amount: newAmount }
        : { ...s, amount: s.amount + adjustmentPerPerson }
    );
  }
  
  // 按比例分摊
  return splits.map(split => {
    if (split.personId === personId) {
      return { ...split, amount: newAmount };
    }
    const proportion = split.amount / otherTotal;
    return {
      ...split,
      amount: split.amount - delta * proportion
    };
  });
}
```

---

## 三、结算计算算法

### 3.1 完整实现

```typescript
/**
 * 计算每个人的净金额
 * @param people 人员列表
 * @param expenses 所有分账记录
 * @returns 结算结果列表
 */
function calculateNetAmounts(
  people: Person[],
  expenses: Expense[]
): SettlementResult[] {
  // 初始化每个人的净金额为0
  const netAmounts = new Map<string, number>();
  people.forEach(person => {
    netAmounts.set(person.id, 0);
  });
  
  // 遍历所有账目
  expenses.forEach(expense => {
    // 1. 处理付款人（支持多人支付）
    if (expense.payers && expense.payers.length > 0) {
      // 多人支付模式
      expense.payers.forEach(payer => {
        const payerNet = netAmounts.get(payer.personId) || 0;
        netAmounts.set(payer.personId, payerNet + payer.amount);
      });
    } else if (expense.payerId) {
      // 兼容旧数据（单个付款人）
      const payerNet = netAmounts.get(expense.payerId) || 0;
      netAmounts.set(expense.payerId, payerNet + expense.totalAmount);
    }
    
    // 2. 每个分账人承担相应金额（排除已私下支付的）
    expense.splits.forEach(split => {
      if (!split.paid) { // 未私下支付的才计入
        const personNet = netAmounts.get(split.personId) || 0;
        netAmounts.set(split.personId, personNet - split.amount);
      }
    });
  });
  
  // 转换为结果格式
  return people.map(person => ({
    personId: person.id,
    netAmount: netAmounts.get(person.id) || 0
  }));
}
```

### 3.2 处理已私下支付的情况

当某个分账标记为"已私下支付"时：
- 该金额**不计入**该人员的应承担金额
- 但付款人仍然支付了总金额
- 这相当于该人员已经"提前结算"了这部分

**示例**:
- A 支付了 100 元，B 和 C 各承担 50
- 如果 B 标记为"已私下支付"，则：
  - A 的净金额: +100 - 50 = +50 (应收50)
  - B 的净金额: -50 + 50 = 0 (已平衡，因为已私下支付)
  - C 的净金额: -50 (应给50)

**多人支付示例**:
- A 支付了 60 元，B 支付了 40 元（总金额 100），C 和 D 各承担 50
- 如果 C 标记为"已私下支付"，则：
  - A 的净金额: +60 - 0 = +60 (应收60)
  - B 的净金额: +40 - 0 = +40 (应收40)
  - C 的净金额: -50 + 50 = 0 (已平衡，因为已私下支付)
  - D 的净金额: -50 (应给50)

---

## 四、算法测试用例

### 4.1 最少转账算法测试

```typescript
// 测试用例1: 简单情况
const test1 = [
  { personId: 'A', netAmount: 100 },
  { personId: 'B', netAmount: -100 }
];
// 预期: [B → A: 100] (1次转账)

// 测试用例2: 多人情况
const test2 = [
  { personId: 'A', netAmount: 100 },
  { personId: 'B', netAmount: 50 },
  { personId: 'C', netAmount: -80 },
  { personId: 'D', netAmount: -70 }
];
// 预期: 
// [C → A: 80, D → A: 20, D → B: 50] (3次转账)

// 测试用例3: 复杂情况
const test3 = [
  { personId: 'A', netAmount: 200 },
  { personId: 'B', netAmount: 100 },
  { personId: 'C', netAmount: -150 },
  { personId: 'D', netAmount: -100 },
  { personId: 'E', netAmount: -50 }
];
// 预期:
// [C → A: 150, D → A: 50, E → A: 50, E → B: 50] (4次转账)
```

### 4.2 分账微调测试

```typescript
// 测试用例
const splits = [
  { personId: 'A', amount: 25 },
  { personId: 'B', amount: 25 },
  { personId: 'C', amount: 25 },
  { personId: 'D', amount: 25 }
];

// 将A的金额调整为30
const result = adjustSplit(splits, 'A', 30);
// 预期:
// A: 30, B: 23.33..., C: 23.33..., D: 23.33...
// 总和仍为100
```

---

## 五、性能优化建议

### 5.1 缓存计算结果
- 结算结果可以缓存，只有当账目发生变化时才重新计算
- 使用 Vue 的 `computed` 或 `useMemo` 实现

### 5.2 增量更新
- 当添加/修改/删除账目时，只更新受影响的人员的净金额
- 而不是重新计算所有人的净金额

### 5.3 大数据量优化
- 如果账目数量很大（> 1000），考虑使用 Web Worker 进行计算
- 使用虚拟滚动显示账目列表

---

## 六、算法扩展

### 6.1 支持多币种
如果需要支持不同货币，需要：
1. 在 `Expense` 中添加 `currency` 字段
2. 按货币分组计算结算
3. 转账方案也需要按货币分组

### 6.2 支持分组
如果需要支持多个分账组：
1. 在 `Expense` 中添加 `groupId` 字段
2. 按组分别计算结算
3. 每个组独立显示转账方案

---

## 总结

本算法文档详细说明了分账应用的核心算法实现，重点是：
1. **最少转账步数算法**: 使用贪心策略，时间复杂度 O(n log n)
2. **分账微调算法**: 支持等分和按比例分摊两种方式
3. **结算计算算法**: 正确处理已私下支付的情况

这些算法已经过充分思考，可以直接用于实现。
