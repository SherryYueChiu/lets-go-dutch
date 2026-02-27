# 维护日志 (Maintenance Log)

## 项目概述

**项目名称**: lets-go-dutch  
**技术栈**: Vite + Vue 3 + TypeScript + Tailwind CSS  
**项目类型**: 移动端友好的分账应用

---

## 版本历史

### v0.2.7 - 行動裝置相容性與表單優化 (2026-02-18)

**主要變更**
- ✅ 修復 `crypto.randomUUID` 在舊版手機瀏覽器不支援的問題
- ✅ 修復 `navigator.clipboard` 在部分手機不可用導致的複製失敗
- ✅ 修復 `formData.totalAmount.toFixed` 型別錯誤（字串無 toFixed）
- ✅ 付款人金額輸入：0 元時切換到編輯模式顯示空字串，無需先刪除 0

**技術細節**
- 新增 `src/utils/uuid.ts`：generateUUID 函數，支援 randomUUID / getRandomValues / Math.random 降級
- 更新 `peopleStore.ts`、`expenseStore.ts`：使用 generateUUID 取代 crypto.randomUUID
- 更新 `ShareModal.vue`：檢查 clipboard 是否存在，不可用時使用 execCommand + 臨時 textarea 降級
- 更新 `ExpenseForm.vue`：totalAmount 全面使用 Number() 確保數值型別；payerAmounts 支援空字串；startEditingPayer / togglePayer 在 0 元時設為空字串

---

### v0.2.6 - 人员网格弹窗图标优化 (2026-02-18)

**主要变更**
- ✅ 更新人员网格弹窗右上角按钮图标
- ✅ 使用页面视图图标（中间完整页面，左右不完整页面局部）
- ✅ 更直观表达"回到页面模式"的功能

**技术细节**
- 更新 `src/components/Person/PersonGridView.vue`
- 图标设计：中间完整长方形表示当前页，左右不完整局部表示相邻页面
- 更新 `aria-label` 为"回到頁面模式"

---

### v0.2.5 - 付款人0元自动取消选择 (2026-02-18)

**主要变更**
- ✅ 付款人金额为0时自动取消选择状态
- ✅ 编辑完成后自动检查并移除0元付款人
- ✅ 选中付款人时自动打开输入框，提升用户体验

**技术细节**
- 更新 `src/components/Expense/ExpenseForm.vue`
- `finishEditingPayer` 函数：编辑完成后检查金额，为0则取消选择
- `watch` 监听器：实时移除金额为0的付款人（排除正在编辑的）
- `togglePayer` 函数：选中时自动开始编辑，便于直接输入金额

---

### v0.2.4 - 表单UX优化 (2026-02-18)

**主要变更**
- ✅ 重新设计新增账目表单的付款/分账人员UX
- ✅ 采用左右布局，中间箭头设计（参考明细弹窗）
- ✅ 统一付款和分账区域，更直观易用
- ✅ 修复个人板块账目日期显示（使用消费日期）

**技术细节**
- 更新 `src/components/Expense/ExpenseForm.vue`
- 左右布局：左侧付款者，中间箭头，右侧分账者
- 卡片式人员选择，选中后显示金额输入框
- 更新 `src/components/Person/PersonCard.vue` 使用消费日期

---

### v0.2.3 - UI优化 (2026-02-18)

**主要变更**
- ✅ 结算弹窗净金额视图改为网格布局（一行两人）
- ✅ 应收（绿色）优先显示
- ✅ 卡片式设计，更清晰易读

**技术细节**
- 更新 `src/components/Settlement/SettlementModal.vue`
- 添加排序逻辑：应收优先，按金额绝对值降序
- 使用 Tailwind Grid 布局实现一行两个卡片

---

### v0.2.2 - 代码重构优化 (2026-02-18)

**主要变更**
- ✅ 提取 ShareModal 组件，消除重复代码
- ✅ 创建 useShareModal composable，统一分享逻辑
- ✅ 创建 usePersonUtils composable，统一人员工具函数
- ✅ 修复结算弹窗人员信息显示问题

**技术细节**
- 新增 `src/components/Common/ShareModal.vue` 分享弹窗组件
- 新增 `src/composables/useShareModal.ts` 分享功能 composable
- 新增 `src/composables/usePersonUtils.ts` 人员工具函数 composable
- 减少约300行重复代码
- 提高代码可维护性和复用性

---

### v0.2.1 - 明细列表功能 (2026-02-18)

**主要变更**
- ✅ 新增明细列表功能：底部结算栏左侧添加"明细"按钮
- ✅ 明细列表弹窗显示所有已登记账目，清晰展示多人合付情况
- ✅ 按日期排序（最新的在前）
- ✅ 点击账目卡片可查看详情

**技术细节**
- 新增 `src/components/Expense/ExpenseListModal.vue` 明细列表组件
- 更新 `src/components/Settlement/SettlementButton.vue` 添加明细按钮
- 明细列表展示：项目说明、总金额、付款人信息、分账明细、消费日期

---

### v0.2.0 - 分享功能 (2026-02-18)

**主要变更**
- ✅ 实现分账数据分享功能：URL参数压缩分享
- ✅ 修复分享数据加载时的ID映射问题
- ✅ 自动过滤无效账目（引用已删除人员的账目）

**技术细节**
- 新增 `src/utils/shareEncoder.ts` 分享编码/解码工具
- 数据精简：使用索引替代personId，减少60-70%数据量
- 压缩流程：JSON → Gzip → Base64 → URL参数
- 新增依赖：`pako` (Gzip压缩库)

---

### v0.1.1 - UI优化 (2026-02-18)

**主要变更**
- ✅ 结算栏显示当前人员净金额
- ✅ 重置功能恢复预设两名人员
- ✅ 改为仅使用鸟类名称和emoji
- ✅ 消费日期功能，支持编辑
- ✅ 总金额自动计算，分账自动平均分配

---

### v0.1.0 - 核心功能 (2026-02-18)

**主要变更**
- ✅ 项目搭建：Vite + Vue 3 + TypeScript + Tailwind CSS + Pinia
- ✅ 人员管理、分账记录管理
- ✅ 多人支付支持、分账金额微调
- ✅ 结算计算、最少转账步数算法
- ✅ 已私下支付标记、数据持久化

---

## 技术栈

- Vue 3 + TypeScript + Vite
- Tailwind CSS + Pinia
- pako (Gzip压缩)

---

## 核心算法

- **净金额计算**: O(m × n)，支持多人支付
- **最少转账步数**: 贪心算法，O(n log n)
- **分账微调**: 差值等分分摊，O(n)

---

## 数据持久化

使用 localStorage 保存数据（人员、账目）

---

## 分享功能

- 数据压缩：精简数据 → JSON → Gzip → Base64 → URL参数
- URL格式：`#share={encoded_data}`
- 数据大小：10人+50账目约2.7-5.3KB，20人+100账目约5.3-10.7KB
