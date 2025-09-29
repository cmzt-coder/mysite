# Vue3 Composition API 详解

## 简介

Composition API 是 Vue 3 中引入的一套新的 API，它提供了一种更灵活的方式来组织组件逻辑。与 Options API 相比，Composition API 能够更好地支持逻辑复用和 TypeScript 类型推导。

## 目录

- [基础概念](#基础概念)
  - [setup 函数](#setup-函数)
  - [响应式基础](#响应式基础)
- [响应式 API](#响应式-api)
  - [ref](#ref)
  - [reactive](#reactive)
  - [computed](#computed)
  - [watch 和 watchEffect](#watch-和-watcheffect)
- [生命周期钩子](#生命周期钩子)
- [依赖注入](#依赖注入)
- [组合式函数](#组合式函数)
- [与 Options API 对比](#与-options-api-对比)
- [最佳实践](#最佳实践)

## 基础概念

### setup 函数

`setup` 是 Composition API 的入口点，它在组件创建之前执行。

```vue
<template>
  <div>
    <p>{{ count }}</p>
    <button @click="increment">增加</button>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  setup() {
    const count = ref(0)
    
    function increment() {
      count.value++
    }
    
    return {
      count,
      increment
    }
  }
}
</script>
```

### 响应式基础

Vue 3 的响应式系统基于 ES6 的 Proxy，提供了更好的性能和更完整的语言特性支持。

## 响应式 API

### ref

`ref` 用于创建响应式的数据引用，适用于基本数据类型。

```javascript
import { ref } from 'vue'

const count = ref(0)
console.log(count.value) // 0

count.value++
console.log(count.value) // 1
```

### reactive

`reactive` 用于创建响应式的对象，返回对象的响应式代理。

```javascript
import { reactive } from 'vue'

const state = reactive({
  count: 0,
  name: 'Vue'
})

state.count++
state.name = 'Vue 3'
```

### computed

`computed` 用于创建计算属性，基于响应式依赖进行缓存。

```javascript
import { ref, computed } from 'vue'

const count = ref(1)
const plusOne = computed(() => count.value + 1)

console.log(plusOne.value) // 2

count.value++
console.log(plusOne.value) // 3
```

### watch 和 watchEffect

`watch` 用于侦听特定的数据源，`watchEffect` 会立即执行传入的函数。

```javascript
import { ref, watch, watchEffect } from 'vue'

const count = ref(0)

// watch
watch(count, (newValue, oldValue) => {
  console.log(`count 从 ${oldValue} 变为 ${newValue}`)
})

// watchEffect
watchEffect(() => {
  console.log(`count 的值是: ${count.value}`)
})
```

## 生命周期钩子

Composition API 中的生命周期钩子需要在 `setup` 函数中调用。

```javascript
import { onMounted, onUpdated, onUnmounted } from 'vue'

export default {
  setup() {
    onMounted(() => {
      console.log('组件已挂载')
    })
    
    onUpdated(() => {
      console.log('组件已更新')
    })
    
    onUnmounted(() => {
      console.log('组件将卸载')
    })
  }
}
```

## 依赖注入

使用 `provide` 和 `inject` 实现跨组件通信。

```javascript
// 父组件
import { provide, ref } from 'vue'

export default {
  setup() {
    const theme = ref('dark')
    provide('theme', theme)
    
    return { theme }
  }
}

// 子组件
import { inject } from 'vue'

export default {
  setup() {
    const theme = inject('theme')
    
    return { theme }
  }
}
```

## 组合式函数

组合式函数是利用 Composition API 来封装和复用有状态逻辑的函数。

```javascript
// useCounter.js
import { ref } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  
  function increment() {
    count.value++
  }
  
  function decrement() {
    count.value--
  }
  
  function reset() {
    count.value = initialValue
  }
  
  return {
    count,
    increment,
    decrement,
    reset
  }
}

// 在组件中使用
import { useCounter } from './useCounter'

export default {
  setup() {
    const { count, increment, decrement, reset } = useCounter(10)
    
    return {
      count,
      increment,
      decrement,
      reset
    }
  }
}
```

## 与 Options API 对比

| 特性 | Options API | Composition API |
|------|-------------|------------------|
| 逻辑组织 | 按选项类型分组 | 按功能逻辑分组 |
| 逻辑复用 | Mixins | 组合式函数 |
| TypeScript 支持 | 有限 | 完整 |
| 代码可读性 | 适合简单组件 | 适合复杂组件 |
| 学习曲线 | 较平缓 | 较陡峭 |

## 最佳实践

1. **合理选择 ref 和 reactive**
   - 基本数据类型使用 `ref`
   - 对象和数组使用 `reactive`

2. **组合式函数命名**
   - 以 "use" 开头，如 `useCounter`、`useAuth`

3. **避免解构响应式对象**
   - 使用 `toRefs` 来解构 `reactive` 对象

4. **合理使用 computed**
   - 对于复杂计算使用 `computed` 而不是 `watch`

5. **清理副作用**
   - 在 `onUnmounted` 中清理定时器、事件监听器等

```javascript
// 好的实践
import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useWindowSize() {
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)
  
  function update() {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }
  
  onMounted(() => {
    window.addEventListener('resize', update)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })
  
  return {
    width,
    height
  }
}
```

---

*最后更新时间：2024年*