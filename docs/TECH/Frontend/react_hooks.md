# React Hooks 使用指南

## 简介

React Hooks 是 React 16.8 引入的新特性，它让你在不编写 class 的情况下使用 state 以及其他的 React 特性。Hooks 为函数组件提供了强大的功能，使代码更加简洁和可复用。

## 目录

- [基础 Hooks](#基础-hooks)
  - [useState](#usestate)
  - [useEffect](#useeffect)
  - [useContext](#usecontext)
- [额外的 Hooks](#额外的-hooks)
  - [useReducer](#usereducer)
  - [useCallback](#usecallback)
  - [useMemo](#usememo)
  - [useRef](#useref)
- [自定义 Hooks](#自定义-hooks)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

## 基础 Hooks

### useState

`useState` 是最常用的 Hook，用于在函数组件中添加状态。

```javascript
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>你点击了 {count} 次</p>
      <button onClick={() => setCount(count + 1)}>
        点击我
      </button>
    </div>
  );
}
```

### useEffect

`useEffect` 用于处理副作用，如数据获取、订阅或手动更改 DOM。

```javascript
import React, { useState, useEffect } from 'react';

function Example() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = `你点击了 ${count} 次`;
  });

  return (
    <div>
      <p>你点击了 {count} 次</p>
      <button onClick={() => setCount(count + 1)}>
        点击我
      </button>
    </div>
  );
}
```

### useContext

`useContext` 用于消费 React Context，避免组件嵌套过深时的 props 传递问题。

```javascript
import React, { useContext } from 'react';

const ThemeContext = React.createContext();

function Button() {
  const theme = useContext(ThemeContext);
  return (
    <button style={{ background: theme.background, color: theme.foreground }}>
      我是一个按钮
    </button>
  );
}
```

## 额外的 Hooks

### useReducer

`useReducer` 是 `useState` 的替代方案，适用于复杂的状态逻辑。

### useCallback

`useCallback` 返回一个 memoized 回调函数，用于性能优化。

### useMemo

`useMemo` 返回一个 memoized 值，用于避免昂贵的计算。

### useRef

`useRef` 返回一个可变的 ref 对象，用于访问 DOM 元素或保存任何可变值。

## 自定义 Hooks

自定义 Hook 是一个函数，其名称以 "use" 开头，函数内部可以调用其他的 Hook。

```javascript
import { useState, useEffect } from 'react';

function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => setCount(initialValue);

  return { count, increment, decrement, reset };
}
```

## 最佳实践

1. **只在最顶层使用 Hook**：不要在循环、条件或嵌套函数中调用 Hook
2. **只在 React 函数中调用 Hook**：不要在普通的 JavaScript 函数中调用 Hook
3. **使用 ESLint 插件**：使用 `eslint-plugin-react-hooks` 来强制执行这些规则
4. **合理使用依赖数组**：在 `useEffect`、`useCallback` 和 `useMemo` 中正确设置依赖数组
5. **避免过度优化**：不要过早使用 `useCallback` 和 `useMemo`

## 常见问题

### Q: 为什么我的 useEffect 会无限循环？
A: 通常是因为依赖数组设置不正确，或者在 useEffect 内部修改了依赖的状态。

### Q: 如何在 useEffect 中进行数据获取？
A: 可以在 useEffect 内部定义异步函数，或者使用自定义 Hook 来处理异步操作。

### Q: useState 的更新是同步的还是异步的？
A: useState 的更新是异步的，React 会批量处理状态更新以提高性能。

---

*最后更新时间：2024年*