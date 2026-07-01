title: 02_python进阶积累
category: Python
created: 2026-07-01

# 02_python进阶积累

## 目录

| 编号 | 知识点 | 日期 |
|------|--------|------|
| 001 | `asyncio.gather` 并发执行多个协程 | 2026-07-01 |
| 002 | `functools.lru_cache` 函数级缓存 | 2026-07-01 |

---

## 内容

### [001] `asyncio.gather` 并发执行多个协程（2026-07-01）

**分类**：并发

**标签**：asyncio, gather, 并发, 协程

**要点**：`asyncio.gather()` 可并发执行多个协程，等所有协程完成后按传入顺序返回结果列表；若其中一个抛出异常，默认会传播异常。

**示例**：

```python
import asyncio

async def fetch(url):
    await asyncio.sleep(1)
    return f"data from {url}"

async def main():
    results = await asyncio.gather(
        fetch("/a"), fetch("/b"), fetch("/c")
    )
    print(results)  # ["data from /a", "data from /b", "data from /c"]

asyncio.run(main())
```

**详见**：[asyncio.gather 官方文档](https://docs.python.org/3/library/asyncio-task.html#asyncio.gather)

---

### [002] `functools.lru_cache` 函数级缓存（2026-07-01）

**分类**：性能

**标签**：functools, lru_cache, 缓存, 性能优化

**要点**：`@functools.lru_cache` 为纯函数提供自动缓存，基于最近最少使用策略淘汰旧条目，对递归或重复调用场景提升显著。

**示例**：

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(100))  # 无缓存时不可行，有缓存后瞬间完成
```

**详见**：[functools.lru_cache 官方文档](https://docs.python.org/3/library/functools.html#functools.lru_cache)

