# MobxTable 组件文档

`MobxTable` 是一个基于 **Arco Design Table** 和 **MobX** 封装的高阶表格组件。它旨在简化复杂的表格业务逻辑，通过配置化和自动化的方式，解决数据获取、分页、筛选、排序、轮询等常见需求。

## 1. 设计思想与实现方案

### 1.1 核心设计理念

*   **数据驱动 (Data-Driven)**: 使用 MobX 响应式管理表格的所有状态（数据、分页、筛选条件等）。UI 组件只负责渲染，状态变更由 Store 驱动，避免了手动管理大量 `useState` 和 `useEffect`。
*   **关注点分离 (Separation of Concerns)**: 采用 **MVVM (Model-View-ViewModel)** 风格的分层架构：
    *   **Model (Store)**: `MobxTableStore` 负责核心业务逻辑、状态管理和数据获取。它是纯粹的逻辑层，不依赖 UI 渲染。
    *   **View (Components)**: `index.tsx` 和 `Toolbar.tsx` 负责 UI 渲染。它们通过 Props 接收配置，并通过 Store 实例与逻辑层交互。
    *   **Controller (Logic)**: `usePolling` hook 和组件内的 `useEffect` 充当胶水层，处理生命周期、事件绑定和副作用。
*   **配置化 (Configuration over Implementation)**: 通过 Props 配置即可实现复杂功能（如轮询、Toolbar 生成），减少重复代码。

### 1.2 实现方案

*   **状态管理**: 使用 MobX 的 `makeAutoObservable` 自动追踪状态。
*   **竞态处理**: 在 `fetchData` 中使用 **请求序列号 (Request ID)** 机制。每次请求生成唯一 ID，回调时检查 ID 是否匹配，从而丢弃过期的请求结果，完美解决快速切换页码或筛选条件导致的数据错乱问题。
*   **模式分流**: 通过 `mode` 属性支持三种数据加载策略：
    *   `remote`: 标准后端分页。
    *   `local`: 前端全量加载 + 前端分页/排序。
    *   `loadmore`: 无限滚动/追加加载模式。
*   **轮询机制**: 封装 `usePolling` hook，利用 `setInterval` 实现定时刷新，并结合 `Visibility API` 支持页面不可见时自动暂停，节省资源。

### 1.3 深入实现原理

#### 1.3.1 响应式数据流 (Reactive Data Flow)

组件的核心是 **MobX** 的响应式系统。整个数据流是单向且自动的：

1.  **Action**: 用户交互（如点击分页、输入筛选）调用 Store 的 Action 方法（如 `setPagination`, `setFilterValue`）。
2.  **Mutation**: Action 修改 Store 中的 Observable State（如 `pagination`, `filterValues`）。
3.  **Reaction**:
    *   `MobxTableStore` 内部监听到状态变化，自动触发 `fetchData`（在 `handleTableChange` 中显式调用，或在 `setFilterValue` 后调用）。
    *   被 `observer` 包裹的 UI 组件（`MobxTable`, `Toolbar`）监听到 Observable State 变化，自动重新渲染视图。

这种模式消除了手动传递回调和层层更新 Props 的繁琐，保证了 View 和 Model 的高度同步。

#### 1.3.2 竞态条件处理 (Race Condition Handling)

在异步数据请求中，"先发后至"是常见问题。例如用户快速点击第2页，然后立即点回第1页。如果第2页的请求比第1页晚回来，表格就会错误地停留在第2页的数据，但页码显示第1页。

`MobxTable` 通过 **Request ID** 机制优雅解决：

```typescript
// store.ts 核心逻辑伪代码
class Store {
  requestId = 0; // 全局计数器

  async fetchData() {
    const currentId = ++this.requestId; // 1. 每次请求生成唯一 ID (闭包变量)
    
    this.setLoading(true);
    const data = await api.query();     // 2. 异步等待
    
    // 3. 闭包检查：比较闭包中的 currentId 与实例当前的 this.requestId
    if (currentId !== this.requestId) {
      return; // 如果不相等，说明在等待期间发起了新请求，当前结果已过期，直接丢弃
    }
    
    this.setData(data); // 4. 只有最新请求才更新数据
  }
}
```

#### 1.3.3 本地模式 (Local Mode) 内部逻辑

当设置 `mode="local"` 时，Store 的行为逻辑会发生分支：

1.  **首次加载**: `fetchData` 正常调用 `fetcher`，但获取到的**全量数据**会被额外存入 `this.localData` 缓存。
2.  **交互拦截**: 当用户操作分页、排序时，`fetchData` 会检测到缓存存在且非强制刷新。
3.  **内存计算**: 此时不发起网络请求，而是调用 `processLocalData()` 方法。
    *   **Sort**: 基于 `sorter` 对 `localData` 进行数组排序。
    *   **Slice**: 基于 `pagination` 对排序后的数组进行切片 (`slice(start, end)`)。
4.  **状态更新**: 将切片后的数据赋值给 `this.data`，触发 UI 更新。

这使得本地模式拥有极快的交互响应速度。

#### 1.3.4 LoadMore 模式与数据合并

当设置 `mode="loadmore"` 时，主要改变在于数据更新策略：

1.  **UI 适配**: 强制隐藏 Table 的默认分页器 (`pagination={false}`)，改为在底部渲染“加载更多”按钮。
2.  **追加逻辑**:
    *   如果是第一页请求 (`current === 1`)：`this.data = newData` (重置)。
    *   如果是后续页请求：`this.data = [...this.data, ...newData]` (追加)。
3.  **结束判断**: 每次请求后计算 `hasMore = this.data.length < total`，用于控制底部按钮显示“加载更多”还是“没有更多数据”。

## 2. 优缺点分析

### 2.1 优点

*   **开发效率高**: 极大地减少了样板代码。只需提供 `fetcher` 和 `columns`，即可得到一个功能完备的表格。
*   **健壮性强**: 内置了竞态条件处理、错误捕获、Loading 状态管理，避免了常见的异步数据 bug。
*   **拓展性好**: 
    *   Toolbar 支持自定义配置数组或完全自定义 ReactNode。
    *   提供丰富的生命周期钩子 (`onBeforeInit`, `onBeforeFetch` 等)。
    *   通过 `ref` 暴露了 Store 的核心方法，方便外部控制。
*   **体验优化**: 支持本地模式（前端分页）和 LoadMore 模式（无限滚动），适应不同场景。支持轮询时的智能暂停。

### 2.2 局限性

*   **MobX 依赖**: 强依赖 MobX。如果项目未使用 MobX，引入此组件会增加包体积和学习成本。
*   **UI 库绑定**: 目前深度绑定 Arco Design。虽然逻辑层解耦了，但 UI 层（`index.tsx`, `Toolbar.tsx`）仍直接使用 Arco 组件。若要迁移到 Antd 或其他库，需要修改 View 层代码。
*   **本地筛选限制**: `local` 模式下的筛选逻辑目前较为简单（基于 `filterValues` 的基础实现），对于复杂的本地筛选需求，可能需要开发者在 `fetcher` 或 `localData` 处理上做更多工作。

## 3. 使用说明

### 3.1 基础用法 (Remote 模式)

最常见的场景，每次分页都会请求后端接口。

```tsx
import { MobxTable } from '@/components/MobxTable';

const MyTable = () => {
  // 定义列
  const columns = [
    { title: 'ID', dataIndex: 'id' },
    { title: '名称', dataIndex: 'name' },
  ];

  // 定义数据获取函数
  const fetcher = async (params) => {
    const { current, pageSize, filterValues } = params;
    const res = await api.getUsers({ page: current, size: pageSize, ...filterValues });
    return {
      list: res.data.items,
      total: res.data.total,
    };
  };

  return (
    <MobxTable
      columns={columns}
      fetcher={fetcher}
    />
  );
};
```

### 3.2 配置 Toolbar (筛选表单)

支持通过数组配置快速生成筛选栏，输入变更会自动触发搜索。

```tsx
const toolbar = [
  {
    name: 'keyword',
    label: '搜索',
    component: ({ value, onChange }) => (
      <Input 
        value={value} 
        onChange={onChange} 
        placeholder="请输入关键词" 
      />
    ),
  },
  {
    name: 'status',
    label: '状态',
    component: ({ value, onChange }) => (
      <Select 
        value={value} 
        onChange={onChange} 
        options={[{ label: '开启', value: 1 }, { label: '关闭', value: 0 }]} 
      />
    ),
  }
];

<MobxTable toolbar={toolbar} ... />
```

### 3.3 启用轮询

```tsx
// 简单配置：每 5 秒刷新一次
<MobxTable polling={5000} ... />

// 高级配置
<MobxTable 
  polling={{
    interval: 3000,
    enabled: true,
    pauseOnHidden: true // 页面不可见时暂停
  }} 
  ... 
/>
```

### 3.4 Local 模式 (前端分页)

适用于数据量不大，一次性加载所有数据，之后在前端进行分页和排序。

```tsx
<MobxTable
  mode="local"
  fetcher={async () => {
    const allData = await api.getAllUsers();
    return { list: allData, total: allData.length };
  }}
  columns={columns}
/>
```

### 3.5 LoadMore 模式 (无限滚动)

适用于移动端或 Feed 流场景。

```tsx
<MobxTable
  mode="loadmore"
  fetcher={fetchFeedData}
  columns={columns}
/>
```

### 3.6 Ref 方法调用

可以通过 `ref` 手动控制表格。

```tsx
const tableRef = useRef<MobxTableRef>(null);

// 手动刷新
tableRef.current?.refresh();

// 手动搜索
tableRef.current?.search({ keyword: 'new' });

// 开启/停止轮询
tableRef.current?.startPoll(3000);
tableRef.current?.stopPoll();
```

### 3.7 生命周期钩子

```tsx
<MobxTable
  onBeforeInit={async (store) => {
    // 初始化前执行，例如获取默认筛选配置
    const defaultStatus = await api.getDefaultStatus();
    return { filterValues: { status: defaultStatus } }; // 返回值会自动合入 store
  }}
  onFetchSuccess={(data) => console.log('数据加载成功', data)}
  onFetchError={(err) => console.error('数据加载失败', err)}
  ...
/>
```

