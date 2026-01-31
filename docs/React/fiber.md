# React Fiber 原理与实践 Demo

本篇帮助你既理解*React Fiber*的本质，又学到“可中断渲染”的实现动机与核心架构。推荐结合下面代码动手实践体会。

---

## 一、浏览器渲染与任务调度简析

> 理解 React Fiber，首先理解浏览器的主线程任务与渲染阶段。

### 浏览器主线程：事件循环（Event Loop）大致流程

1. **宏任务阶段** 
   - 从队列取出宏任务执行（script、setTimeout、I/O 等）。
2. **微任务阶段**
   - 清空所有微任务队列（Promise.then、queueMicrotask 等）。
   - 微任务若过多会阻塞后续渲染。
3. **渲染阶段**
   - 判断是否需要渲染（16.6ms/帧）。
   - 如需渲染，则执行 requestAnimationFrame 回调、样式计算、布局、绘制、合成等。
4. **空闲阶段（Idle）**
   - requestIdleCallback 空闲调度（Fiber diff 典型用法）。


> 简化版伪代码如下：

```js
while (true) {
  let macroTask = taskQueue.pop();
  if (macroTask) execute(macroTask);

  while (microTaskQueue.hasTasks()) {
    let microTask = microTaskQueue.pop();
    execute(microTask);
  }

  if (shouldRender()) {
    runAnimationFrames();      // requestAnimationFrame 回调
    recalculateStyles();       // 样式计算
    layout();                  // 布局
    paint();                   // 绘制
    composite();               // 合成
  }

  if (hasIdleTime()) {
    runIdleCallbacks(deadline); // Fiber diff 主要在此处理
  }
}
```

#### 常见问题解答

- **每次 Event Loop 都会渲染吗？**  
  仅有变更时渲染，但微任务一定会被清空执行。

- **requestAnimationFrame 在哪？**  
  微任务后、渲染前。

- **requestIdleCallback 在哪？**  
  渲染后、下一帧前的空闲期。

- **为什么页面会卡顿？**  
  JS 或渲染步骤若单次占用大于 16.6ms，就会阻塞页面，导致掉帧卡顿。

---

## 二、Fiber 的设计动机与核心思想

### 为什么 Fiber 能解决卡顿体验？

早期 React 渲染/更新 DOM 时，采用同步递归，若组件树很大，则执行过程中无法中断、让步于用户交互，主线程易被阻塞。

**Fiber 架构的目标**：
- 把同步大任务切分为很多小任务（fiber 单元）
- 利用浏览器 Idle 阶段（requestIdleCallback），让主线程可以适时中断、恢复渲染
- 实现“可中断/可恢复”渲染，避免严重卡顿

---

## 三、React Fiber 手写演进实践

### 1. React 原生渲染结构

```js
import React from 'react';
import ReactDOM from 'react-dom';

const container = document.querySelector('#root');
const element = React.createElement(
  'div',
  { title: 'div', name: 'div' },
  'div  ',
  React.createElement(
    'h1', null, 'h1', React.createElement('p', null, 'p')
  ),
  React.createElement('h2', null, 'h2')
);

ReactDOM.render(element, container);
```

---

### 2. 手写简易 createElement 与同步递归 render（会卡顿）

#### createElement.js

```js
function createElement(type, props, ...children) {
  // 构建虚拟 DOM 节点
  return {
    type,
    props: {
      ...props,
      // 非对象的子元素（如字符串）转换为 TEXT_ELEMENT
      children: children.map(
        child => (typeof child === 'object' ? child : createTextElement(child))
      ),
    },
  };
}

// 创建文本类型节点（即 { type: 'TEXT_ELEMENT', ... }）
function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  };
}
export default { createElement };
```

#### render.js

```js
function render(element, container) {
  // 根据类型创建对应的 DOM 节点
  const dom =
    element.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(element.type);

  // 赋值属性（过滤掉 children）
  Object.keys(element.props)
    .filter(key => key !== 'children')
    .forEach(name => (dom[name] = element.props[name]));

  // 递归渲染子元素
  element.props.children.forEach(child => render(child, dom));
  // 将当前 dom 节点追加到父节点
  container.appendChild(dom);
}
export default { render };
```

#### 使用方式

```js
import { createElement } from './createElement.js';
import { render } from './render.js';

const container = document.querySelector('#root');
const element = createElement(
  'div',
  { title: 'div', name: 'div' },
  'div  ',
  createElement('h1', null, 'h1', createElement('p', null, 'p')),
  createElement('h2', null, 'h2')
);
render(element, container);
```

> **说明：** 递归同步渲染，遇到大数据或深层节点会阻塞页面，无中断点，用户体验差。

---

### 3. 第一版 Fiber 分片渲染——初步可中断

**核心思路**：

- 将渲染任务分为一个个 fiber 节点，每次只做一点（处理一个 fiber）。
- 利用 requestIdleCallback 在浏览器空闲阶段执行，主线程忙则随时让步。
- 便于大树分批渲染，不阻塞主线程。

#### 简化代码：

```js
let nextUnitOfWork = null; // 下一个可执行的 fiber 单元

function workLoop(deadline) {
  let shouldYield = false;
  // 主循环：每次只做一小部分工作，若时间不够则退出等待空闲
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1; // 剩余时间小于 1ms 就交出主线程
  }
  requestIdleCallback(workLoop); // 注册下一轮
}
requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
  // 为当前 fiber 创建对应 dom 节点
  if (!fiber.dom) fiber.dom = createDOM(fiber);
  // 将当前 fiber 的 dom 插入父节点（直接挂载，后续可改为批量）
  if (fiber.parent) fiber.parent.dom.appendChild(fiber.dom);

  // 创建子 fiber，形成链表
  const elements = fiber.props?.children || [];
  let prevSibling = null;
  elements.forEach((child, i) => {
    const newFiber = {
      parent: fiber,
      props: child.props,
      type: child.type,
      dom: null,
      sibling: null
    };
    if (i === 0) fiber.child = newFiber;  // 第一个挂到 child
    else prevSibling.sibling = newFiber;  // 其余的挂到 sibling
    prevSibling = newFiber;
  });

  // 返回下一个要执行的 fiber
  if (fiber.child) return fiber.child;
  let next = fiber;
  while (next) {
    if (next.sibling) return next.sibling;
    next = next.parent;
  }
}

function createDOM(fiber) {
  // 根据 fiber 类型创建 dom 节点
  const dom = fiber.type === 'TEXT_ELEMENT'
    ? document.createTextNode('')
    : document.createElement(fiber.type);
  // 赋值属性
  Object.keys(fiber.props || {})
    .filter(key => key !== 'children')
    .forEach(name => dom[name] = fiber.props[name]);
  return dom;
}

// 开始渲染，将根 fiber 作为第一个分片任务
function render(element, container) {
  nextUnitOfWork = {
    dom: container,
    props: { children: [element] }
  };
}
export default { render };
```

> 优点：可分片调度，主线程流畅。  
> 缺点：频繁操作 DOM，页面会“逐步”渲染，闪烁、不连贯。

---

### 4. 第二版：**优化-批量挂载 DOM，减少重排重绘**

- 先以 fiber 链处理所有节点，创建好 DOM，但暂不真正挂载。
- 所有 fiber 处理完后，一次性 commit（批量 appendChild 上树）。

#### 关键实现：

```js
let nextUnitOfWork = null; // 下一个分片任务
let wipRoot = null;        // work in progress 的根节点

function workLoop(deadline) {
  let shouldYield = false;
  // 分片遍历任务
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1; // 用时快到头则暂停
  }
  // 如果所有 fiber 都遍历完成，将节点批量挂载
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  requestIdleCallback(workLoop);
}
requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
  // 创建 dom 节点
  if (!fiber.dom) fiber.dom = createDOM(fiber);
  // 遍历子元素，生成 fiber 链表(child、sibling)
  const elements = fiber?.props?.children || [];
  let prevSibling = null;
  elements.forEach((child, i) => {
    const newFiber = {
      parent: fiber,
      props: child.props,
      type: child.type,
      dom: null,
      sibling: null
    };
    if (i === 0) fiber.child = newFiber;
    else prevSibling.sibling = newFiber;
    prevSibling = newFiber;
  });
  // 返回下一个分片任务
  if (fiber.child) return fiber.child;
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;
    nextFiber = nextFiber.parent;
  }
}

// 挂载 fiber 树到 dom（批量 appendChild，减少重排重绘）
function commitRoot() {
  commitWork(wipRoot.child);
  wipRoot = null;
}
function commitWork(fiber) {
  if (!fiber) return;
  const parentDom = fiber.parent.dom;
  parentDom.appendChild(fiber.dom);
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function createDOM(element) {
  // 创建 dom 或 text 节点
  const dom = element.type === "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(element.type);
  // 处理属性
  Object.keys(element.props || {})
    .filter(key => key !== "children")
    .forEach(name => dom[name] = element.props[name]);
  return dom;
}

function render(element, container) {
  // 设置根 fiber
  wipRoot = { dom: container, props: { children: [element] } };
  nextUnitOfWork = wipRoot;
}
export default { render };
```
> 优点：减少了 DOM 频繁插入，提高性能。  
> 缺点：无 diff，依然是全量渲染。

---

### 5. 第三版：**引入 Diff 算法，按需递增/删除/更新**

- 每次对“新旧 fiber 树”做 diff，只处理有变动的部分，极大提升渲染效率。
- 用 effectTag 等标记，commit 阶段只批量更新必要 DOM 节点。

#### 精华代码片段：

```js
let nextUnitOfWork = null; // 下一个待处理的 fiber 节点
let wipRoot = null;        // work in progress 的根
let currentRoot = null;    // 当前已经挂载的 fiber 树
let deletions = [];        // 待删除的 fiber 列表

function workLoop(deadline) {
  let shouldYield = false;
  // 分片执行 fiber
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  // fiber 收敛后进行真正 commit
  if (!nextUnitOfWork && wipRoot) commitRoot();
  requestIdleCallback(workLoop);
}
requestIdleCallback(workLoop);

// 执行单个 fiber 单元的处理
function performUnitOfWork(fiber) {
  // 创建 dom
  if (!fiber.dom) fiber.dom = createDOM(fiber);

  const elements = fiber.props.children || [];
  // diff 新旧 children fiber
  reconcileChildren(fiber, elements);

  // 深度优先，下一个单元是 child 或 sibling 或父级 sibling
  if (fiber.child) return fiber.child;
  let f = fiber;
  while (f) {
    if (f.sibling) return f.sibling;
    f = f.parent;
  }
}

// commit 阶段，批量处理 effectTag 标记的操作
function commitRoot() {
  deletions.forEach(commitWork);   // 执行所有待删除节点的移除
  commitWork(wipRoot.child);       // 执行新 fiber 树的挂载或更新
  currentRoot = wipRoot;           // 更新当前 fiber 树
  wipRoot = null;
  deletions = [];
}
function commitWork(fiber) {
  if (!fiber) return;
  const parentDom = fiber.parent.dom;
  // 处理对应 effectTag 的 DOM 操作
  if (fiber.effectTag === "PLACEMENT" && fiber.dom) {
    parentDom.appendChild(fiber.dom); // 新增节点
  } else if (fiber.effectTag === "UPDATE" && fiber.dom) {
    updateDOM(fiber.dom, fiber.alternate.props, fiber.props); // 属性更新
  } else if (fiber.effectTag === "DELETION" && fiber.dom) {
    parentDom.removeChild(fiber.dom); // 移除节点
  }
  // 递归处理子及兄弟 fiber
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

// 对比新旧 props，赋值/删除属性
function updateDOM(dom, prevProps, nextProps) {
  // 移除旧属性
  Object.keys(prevProps)
    .filter(key => key !== "children" && !(key in nextProps))
    .forEach(key => (dom[key] = ""));
  // 新增或更新属性
  Object.keys(nextProps)
    .filter(key => key !== "children")
    .forEach(key => (dom[key] = nextProps[key]));
}

function createDOM(element) {
  // 创建 dom 或文本节点
  const dom = element.type === "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(element.type);
  // 属性赋值
  Object.keys(element.props || {})
    .filter(key => key !== "children")
    .forEach(name => dom[name] = element.props[name]);
  return dom;
}

// 子节点 diff 对比，新建/复用/删除 fiber，设置 effectTag
function reconcileChildren(wipFiber, elements) {
  let index = 0; // 新 children 下标
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child; // 老 fiber 链
  let prevSibling = null;

  // 对新旧 fiber/element 进行一一对比
  while (index < elements.length || oldFiber) {
    const element = elements[index];
    // 类型一样则尝试复用
    const sameType = oldFiber && element && oldFiber.type === element.type;
    let newFiber;
    if (sameType) {
      // 复用旧 DOM，标记为 UPDATE
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE"
      };
    }
    if (element && !sameType) {
      // 新增节点
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT"
      };
    }
    if (oldFiber && !sameType) {
      // 旧 fiber 需删除
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }
    // 向后推进旧 fiber 链
    if (oldFiber) oldFiber = oldFiber.sibling;
    // 构建新 fiber 链表
    if (newFiber) {
      if (index === 0) wipFiber.child = newFiber;
      else prevSibling.sibling = newFiber;
      prevSibling = newFiber;
    }
    index++;
  }
}

// 调用入口，挂载新树，设置 diff 数据
function render(element, container) {
  wipRoot = {
    dom: container,
    props: { children: [element] },
    alternate: currentRoot, // 前一棵树的快照
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}
export default { render };
```
> 优点：精细增量型更新、批量挂载、极致减少无效 DOM 操作。Fiber 就此具备现代前端最佳性能。

---

## 结语：Fiber 的意义

- **可中断渲染**：让主线程更流畅，不卡界面
- **批量挂载 & 精细 Diff**：处理大树如丝般顺滑
- **光采未尽**：真正的 React Fiber 还覆盖优先级、生命周期等调度，值得深入挖掘！

你可以基于上述代码，自行迭代尝试支持更新、删除、优先级等 Fiber 更复杂特性，助你底层原理 “触类旁通”。

---
