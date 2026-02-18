# Header 和人员网格视图详细设计

## 一、Header 组件设计

### 1.1 组件概述
`AppHeader.vue` 是一个固定在应用顶部的导航栏组件，显示当前人员信息并提供快速访问人员网格视图的入口。

### 1.2 功能需求
- ✅ 显示当前人员的动物名称（emoji + 文字）
- ✅ 右侧显示视图icon（网格/列表图标）
- ✅ 点击icon打开人员网格弹窗
- ✅ 固定在顶部，不随内容滚动

### 1.3 组件接口

```typescript
// AppHeader.vue Props
interface AppHeaderProps {
  currentPerson: Person | null;  // 当前显示的人员
}

// AppHeader.vue Emits
interface AppHeaderEmits {
  (e: 'open-grid'): void;  // 打开人员网格视图
}
```

### 1.4 UI 设计

```
┌─────────────────────────────────────┐
│  🐱 小猫咪              [👁️]      │
└─────────────────────────────────────┘
```

**布局说明**:
- **左侧区域**: 
  - 动物emoji（如 🐱）
  - 人员名称（如 "小猫咪"）
  - 字体大小：18-20px
  - 字体粗细：medium/semibold
  
- **右侧区域**:
  - 视图icon（👁️ 或网格图标）
  - 点击区域：44x44px（移动端友好）
  - 图标大小：24x24px
  - 颜色：主题色或灰色

**样式规范**:
- 高度：56-64px（移动端标准）
- 背景：白色或浅灰色（与内容区分）
- 阴影：轻微底部阴影（elevation）
- 内边距：左右16px，上下12px
- z-index：100（确保在内容之上）

### 1.5 实现示例

```vue
<template>
  <header class="app-header">
    <div class="header-left">
      <span class="person-emoji">{{ currentPerson?.emoji || '👤' }}</span>
      <span class="person-name">{{ currentPerson?.name || '未选择' }}</span>
    </div>
    <button 
      class="header-icon-btn"
      @click="$emit('open-grid')"
      aria-label="打开人员网格"
    >
      <svg class="grid-icon" viewBox="0 0 24 24">
        <!-- 网格图标 SVG -->
      </svg>
    </button>
  </header>
</template>

<script setup lang="ts">
import type { Person } from '@/types';

defineProps<{
  currentPerson: Person | null;
}>();

defineEmits<{
  openGrid: [];
}>();
</script>

<style scoped>
.app-header {
  @apply fixed top-0 left-0 right-0 h-14 bg-white shadow-sm z-50;
  @apply flex items-center justify-between px-4;
}

.header-left {
  @apply flex items-center gap-2;
}

.person-emoji {
  @apply text-2xl;
}

.person-name {
  @apply text-lg font-semibold text-gray-900;
}

.header-icon-btn {
  @apply w-11 h-11 flex items-center justify-center;
  @apply rounded-lg hover:bg-gray-100 transition-colors;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.grid-icon {
  @apply w-6 h-6 text-gray-600;
}
</style>
```

---

## 二、人员网格视图组件设计

### 2.1 组件概述
`PersonGridView.vue` 是一个全屏弹窗组件，以网格形式展示所有人员，支持快速跳转和新增人员。

### 2.2 功能需求
- ✅ 全屏弹窗显示（带遮罩层）
- ✅ 网格布局展示所有人员
- ✅ 当前人员高亮显示
- ✅ 点击人员卡片跳转到对应视图
- ✅ 显示"新增人员"卡片
- ✅ 点击遮罩或关闭按钮关闭弹窗
- ✅ 选择人员后自动关闭

### 2.3 组件接口

```typescript
// PersonGridView.vue Props
interface PersonGridViewProps {
  people: Person[];              // 所有人员列表
  currentPersonId: string | null; // 当前人员ID
  visible: boolean;              // 是否显示
}

// PersonGridView.vue Emits
interface PersonGridViewEmits {
  (e: 'close'): void;                    // 关闭弹窗
  (e: 'select-person', personId: string): void;  // 选择人员
  (e: 'add-person'): void;               // 新增人员
}
```

### 2.4 UI 设计

```
┌─────────────────────────────────────┐
│  选择人员                    [✕]   │  ← 标题栏
├─────────────────────────────────────┤
│                                     │
│  ┌─────┐  ┌─────┐  ┌─────┐        │
│  │ 🐱  │  │ 🐶  │  │ 🐰  │        │
│  │小猫咪│  │大狗 │  │兔子 │        │
│  └─────┘  └─────┘  └─────┘        │
│                                     │
│  ┌─────┐  ┌─────┐                 │
│  │ 🐼  │  │  +  │                 │
│  │熊猫 │  │新增 │                 │
│  └─────┘  └─────┘                 │
│                                     │
└─────────────────────────────────────┘
```

**布局说明**:
- **标题栏**:
  - 左侧：标题文字（"选择人员"）
  - 右侧：关闭按钮（✕）
  - 高度：56px
  
- **网格区域**:
  - 响应式网格：每行2-3个卡片
  - 卡片间距：16px
  - 内边距：16px
  - 可滚动（如果人员较多）

- **人员卡片**:
  - 尺寸：约 120x140px（移动端）
  - 内容：emoji（大号）+ 名称
  - 当前人员：边框高亮或背景色区分
  - 点击效果：轻微缩放动画

- **新增卡片**:
  - 样式与其他卡片一致
  - 显示大大的加号（+）
  - 文字："新增"
  - 点击后触发新增流程

### 2.5 实现示例

```vue
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="person-grid-overlay" @click.self="$emit('close')">
        <div class="person-grid-modal">
          <!-- 标题栏 -->
          <div class="modal-header">
            <h2 class="modal-title">选择人员</h2>
            <button 
              class="close-btn"
              @click="$emit('close')"
              aria-label="关闭"
            >
              <svg class="close-icon" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>

          <!-- 网格区域 -->
          <div class="grid-container">
            <!-- 人员卡片 -->
            <div
              v-for="person in people"
              :key="person.id"
              class="person-card"
              :class="{ 'current-person': person.id === currentPersonId }"
              @click="handleSelectPerson(person.id)"
            >
              <div class="person-emoji-large">{{ person.emoji }}</div>
              <div class="person-name-text">{{ person.name }}</div>
            </div>

            <!-- 新增卡片 -->
            <div
              class="person-card add-card"
              @click="$emit('add-person')"
            >
              <div class="add-icon">+</div>
              <div class="add-text">新增</div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Person } from '@/types';

defineProps<{
  people: Person[];
  currentPersonId: string | null;
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
  selectPerson: [personId: string];
  addPerson: [];
}>();

function handleSelectPerson(personId: string) {
  emit('selectPerson', personId);
  emit('close'); // 选择后自动关闭
}
</script>

<style scoped>
.person-grid-overlay {
  @apply fixed inset-0 bg-black/50 z-50;
  @apply flex items-center justify-center;
}

.person-grid-modal {
  @apply w-full h-full bg-white;
  @apply flex flex-col;
}

.modal-header {
  @apply flex items-center justify-between px-4 h-14 border-b;
}

.modal-title {
  @apply text-lg font-semibold text-gray-900;
}

.close-btn {
  @apply w-10 h-10 flex items-center justify-center;
  @apply rounded-lg hover:bg-gray-100 transition-colors;
}

.close-icon {
  @apply w-5 h-5 text-gray-600;
}

.grid-container {
  @apply flex-1 overflow-y-auto p-4;
  @apply grid grid-cols-2 gap-4;
  /* 移动端：2列，平板：3列 */
  @apply md:grid-cols-3;
}

.person-card {
  @apply flex flex-col items-center justify-center;
  @apply p-4 rounded-xl border-2 border-gray-200;
  @apply bg-white hover:bg-gray-50;
  @apply transition-all cursor-pointer;
  @apply active:scale-95;
  min-height: 140px;
}

.person-card.current-person {
  @apply border-blue-500 bg-blue-50;
}

.person-emoji-large {
  @apply text-5xl mb-2;
}

.person-name-text {
  @apply text-base font-medium text-gray-900;
}

.add-card {
  @apply border-dashed border-gray-300;
}

.add-icon {
  @apply text-6xl text-gray-400 mb-2;
  @apply font-light;
}

.add-text {
  @apply text-base text-gray-500;
}

/* 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
```

---

## 三、状态管理集成

### 3.1 UI Store 更新

需要在 `uiStore` 中添加人员网格视图的状态：

```typescript
// stores/uiStore.ts
import { defineStore } from 'pinia';

export const useUIStore = defineStore('ui', {
  state: () => ({
    currentPersonIndex: 0,
    isPersonGridVisible: false,  // 人员网格弹窗显示状态
  }),

  actions: {
    openPersonGrid() {
      this.isPersonGridVisible = true;
    },

    closePersonGrid() {
      this.isPersonGridVisible = false;
    },

    selectPerson(personId: string) {
      const index = this.people.findIndex(p => p.id === personId);
      if (index !== -1) {
        this.currentPersonIndex = index;
      }
      this.closePersonGrid();
    },
  },
});
```

### 3.2 主应用集成

```vue
<!-- App.vue -->
<template>
  <div class="app">
    <!-- Header -->
    <AppHeader
      :current-person="currentPerson"
      @open-grid="uiStore.openPersonGrid()"
    />

    <!-- 主内容区域 -->
    <main class="main-content">
      <PersonView />
    </main>

    <!-- 结算按钮 -->
    <SettlementButton />

    <!-- 人员网格视图 -->
    <PersonGridView
      :people="peopleStore.people"
      :current-person-id="currentPerson?.id || null"
      :visible="uiStore.isPersonGridVisible"
      @close="uiStore.closePersonGrid()"
      @select-person="uiStore.selectPerson($event)"
      @add-person="handleAddPerson()"
    />
  </div>
</template>
```

---

## 四、交互细节

### 4.1 打开网格视图
- 点击Header右侧icon → 弹窗从上方滑入（或淡入）
- 遮罩层同时出现

### 4.2 选择人员
- 点击人员卡片 → 卡片有轻微缩放反馈
- 弹窗关闭动画
- 主视图切换到对应人员

### 4.3 新增人员
- 点击"新增"卡片 → 可以：
  - 直接在当前弹窗中显示输入框
  - 或关闭弹窗，打开新增人员表单
  - 推荐：在当前弹窗中显示输入框，更流畅

### 4.4 关闭弹窗
- 点击遮罩层 → 关闭
- 点击关闭按钮 → 关闭
- 按 ESC 键 → 关闭（可选）

---

## 五、响应式设计

### 5.1 移动端（< 768px）
- 网格：2列
- 卡片尺寸：较小
- 全屏弹窗

### 5.2 平板端（768px - 1024px）
- 网格：3列
- 卡片尺寸：中等
- 弹窗可以居中显示（非全屏）

### 5.3 桌面端（> 1024px）
- 网格：4列
- 弹窗：居中显示，最大宽度限制

---

## 六、无障碍设计

- ✅ 所有按钮都有 `aria-label`
- ✅ 键盘导航支持（Tab键切换，Enter键选择）
- ✅ 焦点管理（打开弹窗时焦点移到第一个卡片）
- ✅ 屏幕阅读器友好

---

## 七、性能优化

- ✅ 使用 `Teleport` 将弹窗渲染到 body
- ✅ 使用 `Transition` 组件实现动画
- ✅ 人员卡片使用 `v-for` 的 `key` 优化
- ✅ 如果人员很多，考虑虚拟滚动

---

## 总结

Header 和人员网格视图提供了快速访问和切换人员的功能，提升了用户体验。设计遵循移动端优先原则，确保在各种设备上都有良好的表现。
