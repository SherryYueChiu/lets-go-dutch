# 分账应用 - Let's Go Dutch

一个移动端友好的分账应用，支持多人分账、灵活调整、智能结算和最少转账步数优化。

## 技术栈

- **构建工具**: Vite
- **框架**: Vue 3 + TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Pinia
- **压缩库**: pako (用于分享功能)

## 功能特性

- ✅ 人员管理（添加、删除、重命名，使用鸟类名称和emoji）
- ✅ Header显示当前人员 + 快速访问人员网格
- ✅ 人员网格视图（快速跳转和新增）
- ✅ 分账记录管理（支持多人支付、消費日期编辑）
- ✅ 总金额自动计算（从付款人金额总和）
- ✅ 分账金额自动平均分配（总金额变化或分账人员变动时）
- ✅ 分账金额微调
- ✅ 结算计算（支持多人支付）
- ✅ 底部结算栏显示当前人员净金额
- ✅ 最少转账步数算法
- ✅ 已私下支付标记
- ✅ 账目删除功能
- ✅ 重置功能（清空账目并恢复预设人员）
- ✅ 分享功能（URL参数压缩分享，一键生成分享链接）

## 项目结构

```
lets-go-dutch/
├── src/
│   ├── components/          # 组件
│   │   ├── Person/          # 人员相关组件
│   │   ├── Expense/         # 分账相关组件
│   │   ├── Settlement/      # 结算相关组件
│   │   └── Layout/          # 布局组件
│   ├── views/               # 页面视图
│   ├── composables/         # 组合式函数
│   ├── utils/               # 工具函数
│   │   ├── algorithms.ts    # 核心算法
│   │   ├── animalNames.ts   # 随机鸟类名称
│   │   └── shareEncoder.ts  # 分享编码/解码工具
│   ├── stores/              # 状态管理（Pinia）
│   ├── types/               # TypeScript 类型
│   ├── App.vue
│   ├── main.ts
│   └── style.css
├── package.json
└── vite.config.ts
```

## 开发

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 设计文档

- [DESIGN.md](./DESIGN.md) - 完整设计企划书
- [ALGORITHMS.md](./ALGORITHMS.md) - 核心算法详细说明
- [HEADER_DESIGN.md](./HEADER_DESIGN.md) - Header和人员网格视图设计
- [doc/SHARE_DESIGN.md](./doc/SHARE_DESIGN.md) - 分享功能设计文档
- [doc/MAINTENANCE_LOG.md](./doc/MAINTENANCE_LOG.md) - 维护日志

## 许可证

MIT
