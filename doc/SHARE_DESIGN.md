# 分账数据分享功能设计方案

## 目标
将分账数据（人员列表和账目记录）压缩后放入URL参数，实现无需上传文件即可分享分账数据。

## 一、数据结构设计

### 1.1 精简数据接口（只保留显示必需字段）

```typescript
// 精简版人员数据（用于URL分享）
interface MinimalPerson {
  n: string;    // name - 名称（必需）
  e: string;    // emoji - emoji（必需）
}

// 精简版付款人数据
interface MinimalExpensePayer {
  p: string;    // personId - 付款人ID
  a: number;    // amount - 金额
}

// 精简版分账明细
interface MinimalExpenseSplit {
  p: string;    // personId - 人员ID
  a: number;    // amount - 金额
  d: boolean;   // paid - 是否已私下支付
}

// 精简版账目数据
interface MinimalExpense {
  d: string;           // description - 项目说明
  t: number;           // totalAmount - 总金额
  dt: number;          // expenseDate - 消費日期（时间戳）
  py?: MinimalExpensePayer[];  // payers - 付款人列表（多人支付）
  pid?: string;       // payerId - 付款人ID（兼容旧数据）
  sp: MinimalExpenseSplit[];   // splits - 分账明细
}

// 分享数据包
interface ShareData {
  v: number;           // version - 数据格式版本（用于未来兼容性）
  p: MinimalPerson[];  // people - 人员列表
  e: MinimalExpense[]; // expenses - 账目列表
}
```

### 1.2 字段精简说明

**保留的字段（必需）：**
- **Person**: `name`, `emoji`（显示必需）
- **Expense**: `description`, `totalAmount`, `expenseDate`, `payers`/`payerId`, `splits`（计算和显示必需）

**省略的字段：**
- `id`: 分享时重新生成
- `createdAt`, `updatedAt`: 系统记录字段，分享不需要
- `avatar`: 可选字段，分享时省略

## 二、压缩和编码方案

### 2.1 压缩流程

```
原始数据 → JSON序列化 → Gzip压缩 → Base64编码 → URL参数
```

### 2.2 实现步骤

#### 步骤1：数据精简
```typescript
function minimizePerson(person: Person): MinimalPerson {
  return {
    n: person.name,
    e: person.emoji
  };
}

function minimizeExpensePayer(payer: ExpensePayer): MinimalExpensePayer {
  return {
    p: payer.personId,
    a: payer.amount
  };
}

function minimizeExpenseSplit(split: ExpenseSplit): MinimalExpenseSplit {
  return {
    p: split.personId,
    a: split.amount,
    d: split.paid
  };
}

function minimizeExpense(expense: Expense): MinimalExpense {
  return {
    d: expense.description,
    t: expense.totalAmount,
    dt: new Date(expense.expenseDate).getTime(),
    py: expense.payers?.map(minimizeExpensePayer),
    pid: expense.payerId || undefined,
    sp: expense.splits.map(minimizeExpenseSplit)
  };
}
```

#### 步骤2：压缩和编码
```typescript
import pako from 'pako';

function encodeShareData(data: ShareData): string {
  // 1. JSON序列化
  const json = JSON.stringify(data);
  
  // 2. Gzip压缩
  const compressed = pako.deflate(json, { level: 9 }); // level 9 = 最高压缩率
  
  // 3. Base64编码
  const base64 = btoa(String.fromCharCode(...compressed));
  
  return base64;
}
```

#### 步骤3：生成URL
```typescript
function generateShareUrl(
  people: Person[],
  expenses: Expense[]
): string {
  const shareData: ShareData = {
    v: 1, // 版本号
    p: people.map(minimizePerson),
    e: expenses.map(minimizeExpense)
  };
  
  const encoded = encodeShareData(shareData);
  
  // 使用hash路由，避免发送到服务器
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#share=${encoded}`;
}
```

### 2.3 解码流程

```typescript
function decodeShareData(encoded: string): ShareData {
  try {
    // 1. Base64解码
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    
    // 2. Gzip解压
    const decompressed = pako.inflate(bytes, { to: 'string' });
    
    // 3. JSON解析
    const data = JSON.parse(decompressed) as ShareData;
    
    return data;
  } catch (error) {
    throw new Error('Failed to decode share data');
  }
}

// 将精简数据转换回完整格式（用于兼容现有组件）
function expandToPerson(minimal: MinimalPerson, id: string): Person {
  return {
    id,
    name: minimal.n,
    emoji: minimal.e
  };
}

function expandToExpense(minimal: MinimalExpense, id: string): Expense {
  return {
    id,
    description: minimal.d,
    totalAmount: minimal.t,
    expenseDate: new Date(minimal.dt),
    payers: minimal.py?.map(p => ({
      personId: p.p,
      amount: p.a
    })),
    payerId: minimal.pid || '',
    splits: minimal.sp.map(s => ({
      personId: s.p,
      amount: s.a,
      paid: s.d
    })),
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
```

## 三、URL格式设计

### 3.1 URL结构

```
https://your-app.com/#share={encoded_data}
```

**参数说明：**
- `share`: Base64编码的压缩数据（必需）

### 3.2 使用Hash路由的原因

1. **隐私保护**：Hash部分（`#`之后）不会发送到服务器
2. **无需后端**：完全前端实现
3. **浏览器兼容**：所有现代浏览器都支持

## 四、数据大小估算

### 4.1 单个数据大小

**精简前（完整数据）：**
```json
{
  "id": "uuid-123",
  "name": "麻雀",
  "emoji": "🐦",
  "avatar": null
}
```
**大小：约 50-80 字节**

**精简后（MinimalPerson）：**
```json
{"n":"麻雀","e":"🐦"}
```
**大小：约 20-30 字节（减少60-70%）**

**精简前（完整Expense）：**
```json
{
  "id": "uuid-456",
  "description": "午餐",
  "totalAmount": 100,
  "expenseDate": "2026-02-18T00:00:00.000Z",
  "payers": [{"personId": "id1", "amount": 60}, {"personId": "id2", "amount": 40}],
  "splits": [{"personId": "id1", "amount": 50, "paid": false}, {"personId": "id2", "amount": 50, "paid": false}],
  "createdAt": "2026-02-18T00:00:00.000Z",
  "updatedAt": "2026-02-18T00:00:00.000Z"
}
```
**大小：约 300-400 字节**

**精简后（MinimalExpense）：**
```json
{"d":"午餐","t":100,"dt":1737216000000,"py":[{"p":"id1","a":60},{"p":"id2","a":40}],"sp":[{"p":"id1","a":50,"d":false},{"p":"id2","a":50,"d":false}]}
```
**大小：约 120-150 字节（减少60-70%）**

### 4.2 压缩效果

- **10个人员 + 50笔账目**：
  - 精简后JSON：约 8-12KB
  - Gzip压缩后：约 2-4KB
  - Base64编码后：约 2.7-5.3KB

- **20个人员 + 100笔账目**：
  - 精简后JSON：约 16-24KB
  - Gzip压缩后：约 4-8KB
  - Base64编码后：约 5.3-10.7KB

### 4.3 URL长度限制

- **浏览器限制**：通常 2048-8192 字符
- **推荐限制**：保持在 2000 字符以内
- **如果超出**：提示用户数据量过大，建议分批分享或使用其他方式

## 五、实现方案

### 5.1 需要安装的依赖

```bash
npm install pako
npm install --save-dev @types/pako
```

### 5.2 文件结构

```
src/
├── utils/
│   └── shareEncoder.ts      # 新增：分享编码/解码工具
└── components/
    └── Settlement/
        └── SettlementModal.vue  # 修改：添加分享功能
```

### 5.3 核心功能实现

**src/utils/shareEncoder.ts**
```typescript
import pako from 'pako';
import type { Person, Expense, ExpensePayer, ExpenseSplit } from '@/types';

// 精简数据接口
export interface MinimalPerson {
  n: string;    // name
  e: string;    // emoji
}

export interface MinimalExpensePayer {
  p: string;    // personId
  a: number;    // amount
}

export interface MinimalExpenseSplit {
  p: string;    // personId
  a: number;    // amount
  d: boolean;   // paid
}

export interface MinimalExpense {
  d: string;           // description
  t: number;           // totalAmount
  dt: number;          // expenseDate (timestamp)
  py?: MinimalExpensePayer[];
  pid?: string;
  sp: MinimalExpenseSplit[];
}

export interface ShareData {
  v: number;           // version
  p: MinimalPerson[];  // people
  e: MinimalExpense[];  // expenses
}

// 编码函数
export function encodeShareData(data: ShareData): string {
  const json = JSON.stringify(data);
  const compressed = pako.deflate(json, { level: 9 });
  return btoa(String.fromCharCode(...compressed));
}

// 解码函数
export function decodeShareData(encoded: string): ShareData {
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  const decompressed = pako.inflate(bytes, { to: 'string' });
  return JSON.parse(decompressed) as ShareData;
}

// 生成分享URL
export function generateShareUrl(people: Person[], expenses: Expense[]): string {
  const shareData = createShareData(people, expenses);
  const encoded = encodeShareData(shareData);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#share=${encoded}`;
}

// 从URL读取数据
export function loadFromUrl(): ShareData | null {
  const hash = window.location.hash;
  const match = hash.match(/share=([^&]+)/);
  if (!match) return null;
  
  try {
    return decodeShareData(match[1]);
  } catch {
    return null;
  }
}

// 辅助函数
function minimizePerson(person: Person): MinimalPerson {
  return {
    n: person.name,
    e: person.emoji
  };
}

function minimizeExpensePayer(payer: ExpensePayer): MinimalExpensePayer {
  return {
    p: payer.personId,
    a: payer.amount
  };
}

function minimizeExpenseSplit(split: ExpenseSplit): MinimalExpenseSplit {
  return {
    p: split.personId,
    a: split.amount,
    d: split.paid
  };
}

function minimizeExpense(expense: Expense): MinimalExpense {
  return {
    d: expense.description,
    t: expense.totalAmount,
    dt: new Date(expense.expenseDate).getTime(),
    py: expense.payers?.map(minimizeExpensePayer),
    pid: expense.payerId || undefined,
    sp: expense.splits.map(minimizeExpenseSplit)
  };
}

function createShareData(people: Person[], expenses: Expense[]): ShareData {
  return {
    v: 1,
    p: people.map(minimizePerson),
    e: expenses.map(minimizeExpense)
  };
}

// 将精简数据扩展为完整格式
export function expandToPerson(minimal: MinimalPerson, id: string): Person {
  return {
    id,
    name: minimal.n,
    emoji: minimal.e
  };
}

export function expandToExpense(minimal: MinimalExpense, id: string): Expense {
  return {
    id,
    description: minimal.d,
    totalAmount: minimal.t,
    expenseDate: new Date(minimal.dt),
    payers: minimal.py?.map(p => ({
      personId: p.p,
      amount: p.a
    })),
    payerId: minimal.pid || '',
    splits: minimal.sp.map(s => ({
      personId: s.p,
      amount: s.a,
      paid: s.d
    })),
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
```

## 六、使用流程

### 6.1 生成分享链接

1. 用户在结算弹窗点击"分享"按钮
2. 系统获取所有人员和账目数据
3. 精简、压缩、编码数据
4. 生成URL并显示给用户
5. 用户复制链接或生成二维码

### 6.2 打开分享链接

1. 应用启动时检查URL hash参数
2. 如果存在`share`参数，解码数据
3. 将精简数据扩展为完整格式
4. 加载到应用中，替换当前数据
5. 显示确认提示

## 七、限制和注意事项

### 7.1 数据限制

- **数据量**：建议不超过20个人员和100笔账目
- **URL长度**：如果超过2000字符，提示用户数据量过大

### 7.2 兼容性

- **版本控制**：使用`v`字段标识数据格式版本
- **向后兼容**：未来如果修改格式，需要支持旧版本解码

### 7.3 隐私和安全

- ✅ Hash路由保护：数据不会发送到服务器
- ⚠️ 浏览器历史：URL会保存在浏览器历史中
- ⚠️ 分享风险：链接包含所有数据，一旦分享无法撤销

### 7.4 性能考虑

- 压缩/解压是同步操作，数据量大时可能阻塞UI
- 建议添加加载提示
- 考虑使用Web Worker处理压缩/解压

## 八、扩展功能

### 8.1 二维码生成

```typescript
import QRCode from 'qrcode';

async function generateQRCode(url: string): Promise<string> {
  return await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    errorCorrectionLevel: 'M'
  });
}
```

### 8.2 分享弹窗

可以创建一个分享弹窗组件，包含：
- 分享链接显示和复制按钮
- 二维码显示
- 数据大小提示
- 分享说明

## 九、测试建议

1. **数据大小测试**：测试不同数量人员和账目的数据大小
2. **压缩率测试**：验证压缩效果
3. **URL长度测试**：确保不超过浏览器限制
4. **解码测试**：验证各种边界情况
5. **兼容性测试**：不同浏览器和设备的URL处理

## 十、未来优化方向

1. **增量压缩**：如果数据量大，考虑只压缩增量数据
2. **数据加密**：如果需要隐私保护，可以添加加密层
3. **服务端存储**：如果URL太长，可以存储到服务端，只传递ID
4. **选择性分享**：允许用户选择分享哪些账目
