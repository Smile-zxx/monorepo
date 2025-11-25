# React  渲染与更新机制

## 1. 首次渲染（Initial Render）流程

首次渲染指组件第一次被挂载到 DOM 上，主要经过以下步骤：

1. **创建虚拟DOM（Virtual DOM）**  
   - 通过 `ReactDOM.render(<App />, rootElement)` 或组件返回 JSX，React 将 JSX 转换为虚拟 DOM（React Elements）。

2. **构建 Fiber 树**  
   - React 16+ 引入 Fiber 架构，用于描述和管理组件树。每个组件节点会生成 Fiber 节点，构成 Fiber 树。

3. **调和（Reconciliation）**  
   - 初次没有老Fiber树，React 递归遍历 Fiber 节点。遇到组件则执行渲染逻辑，遇到 DOM 节点则生成真实DOM元素。

4. **提交阶段（Commit Phase）**  
   - 所有 Fiber 节点准备好后，React 批量插入真实 DOM。

5. **副作用执行（Effects）**  
   - 最后依次执行副作用钩子（如 `useEffect`、`componentDidMount`）。

#### 简化流程图
```
JSX -> 创建虚拟DOM -> 构建Fiber树 -> 生成真实DOM -> 批量插入DOM -> 执行副作用
```

#### 首次渲染伪代码
```
function reactInitialRender(JSX, rootElement):
    # 1. 将 JSX 转换为虚拟 DOM（React Element）
    virtualDOM = transformJSXToVirtualDOM(JSX)

    # 2. 根据虚拟 DOM 构建 Fiber 树（初始阶段，我们没有老 Fiber 树）
    fiberRoot = createFiberTree(virtualDOM)

    # 3. 遍历 Fiber 树，进行递归渲染
    for each fiberNode in traverseFiberTree(fiberRoot):
        if fiberNode is Component:
            # 如果是组件节点，递归渲染其子组件（会触发生命周期等）
            fiberNode.children = renderComponent(fiberNode)
        else if fiberNode is DOMElement:
            # 如果是原生 DOM 节点，创建真实的 DOM 元素
            fiberNode.dom = createDOMElement(fiberNode)

    # 4. 批量插入 DOM（commit 阶段，把所有创建好的 DOM 挂载到 root 上）
    batchInsertDOM(fiberRoot, rootElement)
    
    # 5. 执行副作用，如 useEffect/componentDidMount
    executeEffects(fiberRoot)
```


#### 重点小结
- 采用 Fiber 架构提升渲染性能。
- 提交阶段批量插入 DOM，操作高效。
- 首次渲染后再触发副作用逻辑。

---

## 2. 组件更新机制

组件更新主要经历如下过程：

1. **更新触发**  
   - 触发来源：`state` 变化（`setState`/`useState`）、`props` 变化、`context` 变化、`forceUpdate` 等。

2. **调和（Reconciliation & Diff）**  
   - 自更新节点起，重新 render 生成新的虚拟 DOM。
   - 比较新旧 Fiber 树（Diff），标记需要更变的位置。

3. **标记 Fiber 变化**  
   - Fiber 节点分别标记“需要插入、删除、更新”等操作。

4. **批量更新和任务调度**  
   - React 会批量处理所有收集的更新，以提升性能，并利用调度机制（如时间分片）。

5. **提交阶段 & 副作用执行**  
   - 实际批量应用 DOM 更新。
   - 触发 `useEffect`、`componentDidUpdate` 等副作用钩子。

#### 更新流程图
```
State/Props 变化
   ↓
重新 render 组件
   ↓
新旧 Fiber diff
   ↓
标记变化
   ↓
批量更新 DOM
   ↓
副作用执行
```

#### 组件更新伪代码
```
function reactComponentUpdate(updatedComponent):
    # 1. 重新渲染组件，生成新的虚拟DOM
    newVirtualDOM = renderComponent(updatedComponent)
    # 2. 新旧 Fiber 树进行 diff，找出不同点
    diffResult = diffFiberTree(updatedComponent.fiber, newVirtualDOM)
    # 3. 标记所有需要更新的 fiber 节点（比如插入、删除、属性变更等）
    markUpdates(diffResult)
    # 4. 把所有标记的变动批量更新到真实 DOM 上
    applyUpdatesToDOM(diffResult)
    # 5. 执行本次更新需要调用的副作用（如 useEffect、componentDidUpdate）
    executeUpdateEffects(updatedComponent)
```

#### 特点简明说明
- React 更新通常为**局部刷新**，仅最小化变更 DOM，性能高效。
- React 18+：支持并发渲染、自动批处理、空闲调和等新特性。

---

## 3. 触发组件更新的条件

组件会在以下情况发生更新：

1. **State 变化** - 组件自身 `setState` 或 `useState` setter。
2. **Props 变化** - 父组件传参改变。
3. **Context 变化** - Provider 的 value 改变。
4. **强制更新** - `this.forceUpdate()`。
5. **父组件重新渲染** - 没有阻断优化（如未用 `React.memo`/`shouldComponentUpdate`）时，子组件也会渲染。
6. **Hook 依赖变化** - `useEffect`、`useMemo`、`useCallback` 的 deps 改变会触发副作用和逻辑更新。

## 首次渲染 vs. 更新渲染流程对比

| 步骤         | 首次渲染                                                     | 更新渲染                                                   |
| ------------ | ------------------------------------------------------------ | ---------------------------------------------------------- |
| 入口触发     | 初次挂载：`ReactDOM.render`                                   | 由 `setState`/`props`/`context`/`forceUpdate` 等触发       |
| 虚拟DOM构建  | 由 JSX 生成虚拟DOM（React Element）                          | 组件重新 render 生成新的虚拟DOM                            |
| Fiber树      | 初始化 Fiber 树，无旧 Fiber；自顶向下递归生成                 | 以已有 Fiber 树为基础，新旧 Fiber 树 Diff 比较             |
| DOM操作      | 全量创建真实 DOM 节点，并批量插入                             | 仅针对标记的变动部分（插入、更新、删除）批量更新 DOM      |
| Reconciliation(调和) | 无需 diff，直接建立所有 Fiber 和 DOM                     | 新旧 Fiber diff，找出最小化 DOM 变更点                     |
| 副作用Hook   | 执行 `useEffect`/`componentDidMount` 等首次副作用             | 执行 `useEffect`/`componentDidUpdate` 等更新副作用         |
| 性能优化     | 批量挂载、Fiber 架构减少阻塞                                 | 局部刷新、自动批处理、并发调度等，提升效率                |

#### 总结要点

- 首次渲染需整体构建虚拟DOM、Fiber树和真实DOM；**没有 diff，直接渲染全部内容**。
- 更新渲染更关注**新旧 Fiber 树的 diff**，通过**最小化 DOM 操作**实现高效局部更新。
- 两者都会在递交阶段批量处理 DOM，但首次是批量挂载所有，更新是批量处理“变动部分”。
- 副作用 Hook 分别在首次/更新后对应调用（首次为`componentDidMount`/`useEffect`，更新为`componentDidUpdate`/`useEffect`）。


## React Fiber 简介

**Fiber** 是 React 16 引入的底层架构，旨在提升渲染和更新性能，支持更灵活的任务调度。传统 React 更新采用递归栈实现，无法中断，耗时长时容易造成主线程阻塞。Fiber 通过**将渲染拆分为“工作单元”实现可中断、可调度的异步渲染**，是 React 支持并发、优先级等能力的基础。

### Fiber 是什么？

- Fiber 是一种数据结构（对象），对应 React 树中的每个节点（元素/组件）。
- 每个 Fiber 节点包含：类型、props、指向父/子/兄弟 Fiber 的引用，当前状态、优先级、副作用标记等信息。

### Fiber 节点结构简化示例

```js
function FiberNode(type, props) {
    this.type = type;      // React 节点类型（如 div、组件函数）
    this.props = props;    // 节点属性
    this.child = null;     // 第一个子 Fiber
    this.sibling = null;   // 下一个兄弟 Fiber
    this.return = null;    // 父 Fiber
    this.alternate = null; // 上一版本的 Fiber（实现双缓存，用于 diff）
    // ... 状态、副作用、优先级等
}
```

### Fiber 的核心价值

1. **可中断/异步渲染**
   - Fiber 支持将渲染任务拆分、暂停和恢复，React 可在浏览器空闲时增量更新，减少主线程卡顿，页面大组件/长列表也能流畅响应。
2. **优先级调度**
   - 各类更新（如交互、动画、网络）有不同优先级，Fiber 允许打断低优先级任务优先渲染高优先级任务，如输入和动画保障响应，很大程度提升体验。
3. **支持并发和 Suspense 等特性**
   - 并发渲染、Suspense、时间分片（time slicing）等 React 18+ 的现代特性都基于 Fiber。

### 工作流程简要说明

- **Current Fiber Tree**：当前“已挂载”到页面的 Fiber 树。
- **WorkInProgress Fiber Tree**：最新的“工作中” Fiber 树，包含即将生效的变更。
- React 更新时会从 Current Fiber 创建一棵新的 WorkInProgress Fiber 树，所有更新在 WIP 树上做，最终整体替换，过程中用户界面始终稳定，不会出现中间状态。

### Fiber 架构优势总结

- 异步/可中断渲染，提升高优先级任务体验。
- 灵活调度，细粒度优先级控制。
- 是并发、批量调和、Suspense 等新特性的基础。
- 有利于 React 内部逻辑维护和扩展。

---

## React Diff 算法简介

React 的 Diff（协调 Reconciliation）算法核心目的是实现高效的 UI 更新。在 Virtual DOM 有变化时，Diff 能迅速找出需要变更的最小集合，并同步到真实 DOM，提升性能。

### 为什么需要 Diff？

将两棵树做最优对比的复杂度是 $O(n^3)$，但大部分页面只会发生“局部变更”。因此 React 使用启发式算法，将复杂度降低至 $O(n)$，即“最小代价，快速响应”。

### Diff 的核心优化策略

1. **同层比较（Tree Diff）**
   - 只在同一层级的节点做比较，不跨层级（不会把子节点移动到别的父节点），这极大减少了对比范围和开销。
2. **基于 key 的高效列表 Diff（List Diff）**
   - 列表子元素应提供唯一 key，借此定位元素的新增、删除、移动，最大化复用 DOM。
3. **类型不同直接替换（Component Diff）**
   - 发现节点类型（如 div、span、组件名）不同，直接销毁与重建，不递归比较后代，可以大幅减少不必要遍历。

### Diff 简化流程

1. 遍历并比较 Virtual DOM 新旧节点：
   - 类型相同，递归对子节点比较，尽量复用旧节点。
   - 类型不同，替换旧节点及其子树。
2. 对列表子节点，用 key 定位决定复用、插入、移动、删除。
3. 最后生成最小的真实 DOM 操作集合，批量一次性应用，极大提升实际渲染效率。

```js
// 简化 Diff 伪代码
function diff(oldVNode, newVNode, parentDom) {
  if (!oldVNode) {
    // 初次渲染
    const dom = createDom(newVNode);
    parentDom.appendChild(dom);
  } else if (!newVNode) {
    // 删除节点
    parentDom.removeChild(oldVNode.dom);
  } else if (oldVNode.type !== newVNode.type) {
    // 类型不同，整体替换
    const dom = createDom(newVNode);
    parentDom.replaceChild(dom, oldVNode.dom);
  } else {
    // 类型相同，属性和子节点递归更新
    updateProps(oldVNode.dom, oldVNode.props, newVNode.props);

    // 区分 children 是数组还是单个节点
    if (Array.isArray(newVNode.children)) {
      // 多子节点（列表），用 key 匹配
      diffChildrenByKey(oldVNode, newVNode);
    } else {
      // 单子节点普通递归
      diff(oldVNode.children, newVNode.children, oldVNode.dom);
    }
  }
}

// 基于 key 的列表子节点 Diff
function diffChildrenByKey(oldParent, newParent) {
  const oldChildren = oldParent.children || [];
  const newChildren = newParent.children || [];
  const oldKeyed = {};
  oldChildren.forEach(child => {
    if (child.key != null) oldKeyed[child.key] = child;
  });

  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i];
    const oldChild = newChild.key != null ? oldKeyed[newChild.key] : oldChildren[i];
    diff(oldChild, newChild, oldParent.dom);
    // 这里可扩展处理移动/插入等
  }

  // 移除已经不存在的老节点
  oldChildren.forEach(child => {
    if (child.key && !newChildren.find(nc => nc.key === child.key)) {
      oldParent.dom.removeChild(child.dom);
    }
  });
}
```

