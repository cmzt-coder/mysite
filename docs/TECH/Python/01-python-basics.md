title: 01_python基础积累
category: Python
created: 2026-07-01

# 01_python基础积累

## 目录

| 编号 | 知识点 | 日期 |
|------|--------|------|
| 001 | 列表推导式 vs 生成器表达式 | 2026-07-01 |
| 002 | `defaultdict` 简化分组统计 | 2026-07-01 |
| 003 | `enumerate` 替代 `range(len(...))` | 2026-07-01 |
| 004 | `zip` 并行迭代 | 2026-07-01 |
| 005 | `with` 语句与上下文管理器 | 2026-07-01 |
| 006 | f-string 格式化 | 2026-07-01 |
| 007 | `isinstance` 类型检查 | 2026-07-01 |
| 008 | `any()` / `all()` 快速判断 | 2026-07-01 |

---

## 内容

### [001] 列表推导式 vs 生成器表达式（2026-07-01）

**分类**：语法

**标签**：列表推导式, 生成器, 内存优化

**要点**：列表推导式 `[...]` 一次性生成全部元素到内存中；生成器表达式 `(...)` 惰性求值，仅在迭代时产出元素，适合处理大规模数据流。

**示例**：

```python
# 列表推导式：立即计算，占用全部内存
squares_list = [x ** 2 for x in range(10_000_000)]  # 可能 OOM

# 生成器表达式：惰性求值，内存开销极小
squares_gen = (x ** 2 for x in range(10_000_000))
first = next(squares_gen)  # 0
```

**详见**：[PEP 289 - Generator Expressions](https://peps.python.org/pep-0289/)

---

### [002] `defaultdict` 简化分组统计（2026-07-01）

**分类**：标准库

**标签**：collections, defaultdict, 分组, 统计

**要点**：使用 `collections.defaultdict` 可避免手动检查键是否存在再初始化的样板代码，是分组/聚合场景的首选。

**示例**：

```python
from collections import defaultdict

data = [("a", 1), ("b", 2), ("a", 3)]
groups = defaultdict(list)
for key, val in data:
    groups[key].append(val)
# groups: {"a": [1, 3], "b": [2]}
```

**详见**：[collections.defaultdict 官方文档](https://docs.python.org/3/library/collections.html#collections.defaultdict)

---

### [003] `enumerate` 替代 `range(len(...))`（2026-07-01）

**分类**：语法

**标签**：enumerate, 迭代, 索引, 可读性

**要点**：用 `enumerate(seq)` 同时获取索引和值，避免手写 `range(len(seq))`，代码更 Pythonic 且不易出错。

**示例**：

```python
items = ["a", "b", "c"]

# ❌ 不推荐
for i in range(len(items)):
    print(i, items[i])

# ✅ 推荐
for i, val in enumerate(items):
    print(i, val)
```

**详见**：[enumerate 官方文档](https://docs.python.org/3/library/functions.html#enumerate)

---

### [004] `zip` 并行迭代（2026-07-01）

**分类**：语法

**标签**：zip, 并行迭代, 元组, strict

**要点**：`zip()` 将多个可迭代对象"拉链"对齐，按最短者截断；Python 3.10+ 支持 `strict=True`，长度不一致时抛 `ValueError`。

**示例**：

```python
names = ["Alice", "Bob", "Charlie"]
scores = [85, 92, 78]

for name, score in zip(names, scores):
    print(f"{name}: {score}")

# strict 模式：长度不一致则报错
list(zip(names, scores, strict=True))
```

**详见**：[zip 官方文档](https://docs.python.org/3/library/functions.html#zip)

---

### [005] `with` 语句与上下文管理器（2026-07-01）

**分类**：语法

**标签**：with, 上下文管理器, 资源管理, __enter__, __exit__

**要点**：`with` 语句确保资源（文件、锁、连接等）在使用后自动释放，即使发生异常也会执行清理逻辑，替代 `try/finally` 样板代码。

**示例**：

```python
# 文件操作：自动关闭
with open("data.txt") as f:
    content = f.read()

# 自定义上下文管理器
from contextlib import contextmanager

@contextmanager
def timer():
    import time
    start = time.time()
    yield
    print(f"耗时: {time.time() - start:.2f}s")
```

**详见**：[PEP 343 - The "with" Statement](https://peps.python.org/pep-0343/)

---

### [006] f-string 格式化（2026-07-01）

**分类**：语法

**标签**：f-string, 字符串格式化, 表达式, 对齐

**要点**：f-string（`f"..."`）是 Python 3.6+ 最简洁高效的字符串格式化方式，支持内嵌表达式、格式化说明符（精度、对齐、进制等）。

**示例**：

```python
name = "Alice"
score = 92.567

# 基本用法
print(f"{name} 得分: {score:.1f}")       # Alice 得分: 92.6

# 对齐与填充
print(f"{name:<10} | {score:>8.2f}")     # Alice      |    92.57

# 进制转换
print(f"255 的二进制: {255:#b}")          # 255 的二进制: 0b11111111
```

**详见**：[PEP 498 - Literal String Interpolation](https://peps.python.org/pep-0498/)

---

### [007] `isinstance` 类型检查（2026-07-01）

**分类**：语法

**标签**：isinstance, 类型检查, 多态, 鸭子类型

**要点**：`isinstance(obj, Type)` 检查对象是否属于某个类型或元组中的任意类型，比 `type(obj) == Type` 更安全（支持继承）。同时支持抽象基类检查。

**示例**：

```python
# 检查单个类型
isinstance(42, int)          # True

# 检查多种类型（元组）
isinstance(3.14, (int, float))  # True

# 检查抽象基类（鸭子类型）
from collections.abc import Iterable
isinstance([1, 2, 3], Iterable)  # True
```

**详见**：[isinstance 官方文档](https://docs.python.org/3/library/functions.html#isinstance)

---

### [008] `any()` / `all()` 快速判断（2026-07-01）

**分类**：语法

**标签**：any, all, 布尔, 短路求值

**要点**：`any(iterable)` 任一元素为真即返回 `True`；`all(iterable)` 全部为真才返回 `True`。两者均短路求值，遇到确定结果立即返回。

**示例**：

```python
nums = [0, 1, 2, 3]

any(n > 2 for n in nums)   # True  （有元素 > 2）
all(n >= 0 for n in nums)  # True  （全部 >= 0）
all(n > 0 for n in nums)   # False （0 不大于 0）

# 实用场景：检查列表是否全为非空字符串
items = ["a", "b", ""]
all(items)  # False
```

**详见**：[any / all 官方文档](https://docs.python.org/3/library/functions.html#all)

