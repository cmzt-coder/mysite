# 掌柜智库项目 —— Milvus 检索全家桶

---

## 1. 概述

### 1.1 了解 Milvus 完整检索体系

在 RAG（检索增强生成）系统中，检索是决定最终回答质量的关键环节。Milvus 作为向量数据库，不仅提供向量检索能力，还具备完整的文本检索和标量过滤体系。掌握完整的检索方式，才能根据业务场景做出最优选择。

```
用户问题
    │
    ▼
┌─────────────────┐
│   嵌入模型       │  ← 将文本转换为向量（BGE-M3）
│   (BGE-M3)      │
└────────┬────────┘
         │ 向量 / 原始文本
         ▼
┌─────────────────────────────────────────────────┐
│               Milvus 检索体系                     │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ 向量检索  │  │ 文本检索  │  │ 标量过滤/查询 │   │
│  │ (ANN)    │  │ (BM25)   │  │ (Filter)     │   │
│  └──────────┘  └──────────┘  └──────────────┘   │
│       ↓              ↓              ↓             │
│       └──────── 可组合使用 ────────┘             │
└────────┬────────────────────────────────────────┘
         │ 相似文档
         ▼
┌─────────────────┐
│   LLM 生成      │  ← 基于检索结果生成答案
└─────────────────┘
```

### 1.2 Milvus 检索体系全景图

Milvus 的检索能力可以分为三大类、共十种左右方式：

<img src="../images/milvus-search-overview.jpg" style="zoom:67%;" />

### 1.3 本项目当前使用的检索方式

掌柜智库项目使用 **混合向量检索 + 标量过滤** 的方案：

```
当前方案 = 稠密向量(BGE-M3) + 稀疏向量(BGE-M3) + WeightedRanker融合 + item_name IN 过滤

涉及的检索方式：
├── 混合搜索（第6种）：稠密+稀疏双路检索，加权融合排序
├── 过滤搜索（第2种）：通过 item_name IN [...] 缩小检索范围
└── 标量过滤（第10种）：过滤表达式模板优化中日韩字符性能
```

---

## 2. 向量检索家族（基于语义相似度）

向量检索是 Milvus 的核心能力，基于 ANN（近似最近邻）算法，在向量空间中找到与查询向量最相似的文档。

### 2.1 基本 ANN 搜索

#### 2.1.1 核心原理

ANN（Approximate Nearest Neighbor）搜索是所有向量检索的基础。它通过预先构建索引（如 HNSW、IVF_FLAT），对向量空间进行预排序，在收到查询时快速定位到最相似的子集。

<img src="../images/ann-search-principle.jpg" style="zoom:67%;" />

#### 2.1.2 相似度度量方式

<img src="../images/similarity-metrics.jpg" style="zoom:67%;" />

#### 2.1.3 代码示例

```python
from pymilvus import MilvusClient

client = MilvusClient(uri="http://localhost:19530")

# 基本 ANN 搜索
results = client.search(
    collection_name="kb_chunks",
    data=[query_dense_vector],        # 查询向量（1024维浮点数列表）
    anns_field="dense_vector",        # 目标向量字段
    search_params={
        "metric_type": "COSINE",      # 余弦相似度
        "params": { }                 # HNSW 索引参数
    },
    limit=5,                          # 返回 Top 5
    output_fields=["content", "item_name"]
)
```

#### 2.1.4 使用场景

- 纯语义相似搜索，不需要任何过滤条件
- 通用问答系统，用户输入自然语言问题
- 场景示例："怎么使用万用表" → 找到语义最相关的文档片段

---

### 2.2 过滤搜索

#### 2.2.1 核心原理

过滤搜索 = ANN 搜索 + 标量字段过滤条件。Milvus 先根据过滤条件缩小候选集，然后在候选集上执行向量搜索。这样既利用了向量的语义能力，又能通过业务字段精确限定范围。

<img src="../images/filtered-search-principle.jpg" style="zoom:67%;" />

#### 2.2.2 过滤表达式语法

```python
# 等值过滤
expr = 'item_name == "RS-12 数字万用表"'

# IN 过滤（多值匹配）
expr = 'item_name in ["RS-12 数字万用表", "DM-200 示波器"]'

# 范围过滤
expr = 'price > 100 AND price < 500'

# 组合过滤
expr = 'category == "电子仪器" AND stock > 0'

# ⚠️ 性能优化：中日韩字符使用过滤表达式模板
# 直接拼接（性能差）：
expr = 'item_name in ["RS-12 数字万用表", "DM-200 示波器"]'

# 模板化参数（性能好）：
expr = "item_name in {item_names}"
filter_params = {"item_names": ["RS-12 数字万用表", "DM-200 示波器"]}
```

#### 2.2.3 代码示例

```python
# 过滤搜索：只在特定商品的文档中检索
results = client.search(
    collection_name="kb_chunks",
    data=[query_dense_vector],
    anns_field="dense_vector",
    search_params={"metric_type": "COSINE"},
    filter='item_name in ["RS-12 数字万用表"]',  # 过滤条件
    limit=5,
    output_fields=["content", "item_name"]
)
```

#### 2.2.4 本项目的应用

掌柜智库项目中，`VectorSearchNode` 和 `HyDeSearchNode` 都使用了过滤搜索，通过 `item_name IN [...]` 限定只检索特定商品的文档：

```python
# 使用过滤表达式模板（优化中日韩字符性能）
def _item_name_filter(self, validate_item_names):
    expr = "item_name in {item_names}"
    filter_params = {"item_names": validate_item_names}
    return expr, filter_params
```

#### 2.2.5 使用场景

- 多租户系统：按 tenant_id 过滤，每个租户只搜索自己的数据
- 商品知识库：按商品名过滤，只在对应商品的文档中搜索（本项目）
- 权限控制：按用户权限级别过滤可见文档

---

### 2.3 范围搜索

#### 2.3.1 核心原理

范围搜索在 ANN 搜索的基础上，增加了相似度分数的区间限制。不是简单返回最相似的 Top-K，而是返回相似度落在指定区间内的 Top-K。

<img src="../images/range-search-principle.jpg" style="zoom:67%;" />

**注意**：不同度量方式的 radius 和 range_filter 大小关系不同：
- L2/Hamming/Jaccard（距离越小越相似）：`range_filter < radius`
- COSINE/IP（分数越大越相似）：`range_filter > radius`



#### 2.3.2 理解 radius 和 range_filter

**先搞清楚这两个参数的字面含义**：

```
radius（半径）：
  定义搜索的最外层边界——"最远能搜到哪里"
  超过这个边界的结果一律不要
  
  类比：你站在原地画了一个大圆，圆外面的东西你不看

range_filter（范围过滤器）：
  定义搜索的最内层边界——"太近的也不要"
  比这个边界更近的结果被过滤掉
  
  类比：你又在大圆里面画了一个小圆，小圆里面的东西你也不看

最终结果 = 大圆和小圆之间的环形区域中的点

  ┌─────────────────────────────┐
  │  外面：超出 radius → 不要    │
  │  ┌───────────────────────┐  │
  │  │                       │  │
  │  │  里面：range_filter    │  │
  │  │  以内 → 也不要         │  │
  │  │       ● 查询点         │  │
  │  │                       │  │
  │  └───────────────────────┘  │
  │                             │
  │  ✅ 这个环形区域 = 结果集    │
  └─────────────────────────────┘
```

**但是**，搞混的根源在于：radius 和 range_filter 填的不是物理意义上的"圆的半径"，而是**相似度分数**（COSINE/IP）或**距离值**（L2）。不同度量方式下，"数值越大"代表的含义完全相反——COSINE 下分数越大表示越近，L2 下距离越大表示越远。这就导致同样是 radius=0.4、range_filter=0.6，在 COSINE 和 L2 下谁是大圆、谁是小圆完全反过来。

**COSINE / IP 度量（分数越大越相似）**：

```
metric_type: "COSINE"
radius: 0.4          ← 最低分数（最远边界）
range_filter: 0.6    ← 最高分数（最近边界）
要求: range_filter > radius

在向量空间中（想象同心圆）：
  分数 0.6 → 离查询点更近 → 对应内圈（小圆）
  分数 0.4 → 离查询点更远 → 对应外圈（大圆）

                查询点
                  ●
              ·  ·  ·  ·
          · ·    ·  ·    · ·
        ·   ·  ●  ●  ●  ·   ·
       ·  ● ·    ●  ●    · ●  ·
        ·   ·  ●  ●  ●  ·   ·
          · ·    ·  ·    · ·
              ·  ·  ·  ·
        
        |←── range_filter=0.6 ──→|    内圈（分数高，距离近）
        |←────── radius=0.4 ────────→| 外圈（分数低，距离远）
        
        结果 = 外圈和内圈之间的环形区域中的点

⚠️ 直觉陷阱：radius 这个词暗示"半径"，值小→圆小？
   错！COSINE 下 radius 是"最低分数"，分数低 = 距离远 = 圆大
```

**L2 / Hamming / Jaccard 度量（距离越小越相似）**：

```
metric_type: "L2"
radius: 0.6          ← 最大距离（最远边界）
range_filter: 0.4    ← 最小距离（最近边界）
要求: range_filter < radius
解决 
这里就符合直觉了：
  radius=0.6    → 距离大 → 大圆（外圈）
  range_filter=0.4 → 距离小 → 小圆（内圈）
```

**对比总结**：

```
┌──────────────────┬──────────────────────┬──────────────────────┐
│                  │  COSINE / IP          │  L2 / Hamming        │
│                  │ （分数越大越相似）      │ （距离越小越相似）     │
├──────────────────┼──────────────────────┼──────────────────────┤
│  radius          │  最低分数（外圈/远）   │  最大距离（外圈/远）  │
│  range_filter    │  最高分数（内圈/近）   │  最小距离（内圈/近）  │
│  大小关系         │  range_filter > radius│  range_filter < radius│
│  值小的那个       │  是外圈（大圆）        │  是内圈（小圆）       │
└──────────────────┴──────────────────────┴──────────────────────┘

记忆技巧：
  COSINE：分数小 = 远 = 大圆   （反直觉）
  L2：    距离小 = 近 = 小圆   （符合直觉）
```



#### 2.3.3 代码示例

```python
results = client.search(
    collection_name="kb_chunks",
    data=[query_dense_vector],
    anns_field="dense_vector",
    search_params={
        "metric_type": "COSINE",
        "params": {
            "radius": 0.5,          # 最低相似度阈值
            "range_filter": 1.0     # 最高相似度阈值
        }
    },
    limit=5,
    output_fields=["content", "item_name"]
)
```

#### 2.3.4 使用场景

- **推荐系统**：推荐与用户点击商品有一定相似度但又不太相似的商品（避免推荐过于相似的同款）
- **异常检测**：找到与正常样本距离在特定范围内的数据点
- **去重场景**：找到相似度极高（如 > 0.98）的文档进行去重

---

### 2.4 分组搜索

#### 2.4.1 核心原理

分组搜索在 ANN 搜索的基础上，按指定字段进行分组，确保每个分组只返回一个最相似的结果。解决的核心问题：同一来源的文档占据了 Top-K 的全部位置，导致结果缺乏多样性。

<img src="../images/group-search-principle.jpg" style="zoom:67%;" />

#### 2.4.2 代码示例

```python
results = client.search(
    collection_name="kb_chunks",
    data=[query_dense_vector],
    anns_field="dense_vector",
    search_params={"metric_type": "COSINE"},
    group_by_field="item_name",     # 按商品名分组
    group_size=1,                    # 每组返回1条
    limit=5,
    output_fields=["content", "item_name"]
)
```

#### 2.4.3 使用场景

- **多商品知识库**：搜索"电压测量"时，希望每种仪器都有代表性结果
- **新闻搜索**：按新闻来源分组，避免单一来源垄断搜索结果
- **电商搜索**：按品牌分组，展示不同品牌的商品

---

### 2.5 主键搜索 / Get

#### 2.5.1 核心原理

主键搜索不是向量检索，而是通过主键 ID 直接精确获取实体。类似关系数据库的 `SELECT * FROM table WHERE id IN (...)` 操作，O(1) 查找。

```
向量搜索：根据"语义相似度"找文档（模糊匹配）
主键搜索：根据"唯一 ID"找文档（精确匹配）
```

#### 2.5.2 代码示例

```python
# 根据主键 ID 精确获取
results = client.get(
    collection_name="kb_chunks",
    ids=[1, 2, 3],                    # 主键 ID 列表
    output_fields=["content", "item_name"]
)

# 也可以通过 query 带条件查询
results = client.query(
    collection_name="kb_chunks",
    filter='chunk_id == "chunk_001"',
    output_fields=["content", "item_name"]
)
```

#### 2.5.3 使用场景

- 知道具体文档 ID，需要获取完整内容
- 向量检索后的二次详情获取
- 数据校验和调试

---

### 2.6 混合搜索

#### 2.6.1 核心原理

混合搜索是在多个向量字段上同时执行 ANN 搜索，然后通过融合排序算法合并结果。这是掌柜智库项目的核心检索方式。

<img src="../images/hybrid-search-principle.jpg" style="zoom:67%;" />

#### 2.6.2 融合排序算法

**WeightedRanker（加权融合）—— 本项目使用**：

```python
from pymilvus import WeightedRanker

rerank = WeightedRanker(
    0.5,              # 稠密向量权重
    0.5,              # 稀疏向量权重
    norm_score=True   # 归一化分数
)

# 最终分数 = normalize(稠密分数) × 0.5 + normalize(稀疏分数) × 0.5
```

分数归一化（norm_score）的必要性：

```
稠密向量分数范围: [-1, 1]（有界）
稀疏向量分数范围: [0, +∞)（无界，绝对值可能很大）

不归一化：
  稠密分数 0.8 × 0.5 = 0.4
  稀疏分数 2.5 × 0.5 = 1.25    ← 稀疏向量主导结果 ❌

归一化后（映射到 [0, 1]）：
  稠密分数 0.8 → 0.8 × 0.5 = 0.4
  稀疏分数 2.5 → 0.9 × 0.5 = 0.45   ← 两路公平参与 ✓
```

**RRFRanker（倒数排名融合）—— 另一种常用方式**：

```python
from pymilvus import RRFRanker

rerank = RRFRanker(k=60)  # k 为平滑常数

# 公式: score(doc) = Σ 1/(k + rank_i(doc))
# 只看排名，不看具体分数，对分数分布不敏感
```

#### 2.6.3 代码示例

```python
from pymilvus import AnnSearchRequest, WeightedRanker

# 创建稠密向量搜索请求
dense_req = AnnSearchRequest(
    data=[dense_vector],
    anns_field="dense_vector",
    param={"metric_type": "COSINE"},
    expr="item_name in {item_names}",          # 过滤表达式模板
    expr_params={"item_names": item_names},    # 模板参数
    limit=10
)

# 创建稀疏向量搜索请求
sparse_req = AnnSearchRequest(
    data=[sparse_vector],
    anns_field="sparse_vector",
    param={"metric_type": "IP"},
    expr="item_name in {item_names}",
    expr_params={"item_names": item_names},
    limit=10
)

# 执行混合搜索
results = client.hybrid_search(
    collection_name="kb_chunks",
    reqs=[dense_req, sparse_req],
    ranker=WeightedRanker(0.5, 0.5, norm_score=True),
    limit=5,
    output_fields=["chunk_id", "content", "item_name"]
)
```

#### 2.6.4 权重调优建议

<img src="../images/weight-tuning-tips.jpg" style="zoom:50%;" />

#### 2.6.5 使用场景

- **RAG 知识库检索**：语义理解 + 关键词精确匹配双重保障（本项目）
- **电商搜索**：商品描述的语义相似 + 品牌型号的精确匹配
- **多模态搜索**：文本向量 + 图片向量联合检索

---

## 3. 文本检索家族（基于关键词/词频）

文本检索是 Milvus 2.5+ 引入的能力，基于分词器（Analyzer）和倒排索引，不依赖外部嵌入模型。

### 3.1 文本检索的基础设施：Analyzer（分词器）

三种文本检索方式都依赖同一套基础设施——Analyzer。理解 Analyzer 是理解文本检索的前提。

#### 3.1.1 Analyzer 工作流程

<img src="../images/analyzer-workflow.png" style="zoom:67%;" />

在 Collection Schema 中启用分词器：

```python
# 创建字段时启用 Analyzer
schema.add_field(
    field_name="content",
    datatype=DataType.VARCHAR,
    max_length=5000,
    enable_analyzer=True,      # 启用分词器（全文检索必需）
    enable_match=True,         # 启用文本匹配（TEXT_MATCH 必需）
    analyzer_params={
        "type": "chinese"      # 中文分词器
    }
)
```



#### 3.1.2 Milvus Analyzer vs 模型 Tokenizer

Milvus Analyzer 和模型 Tokenizer（如 BGE-M3 的 SentencePiece）都在做"把文本拆成更小单元"的事情，但它们服务于完全不同的检索路径，不能混为一谈。

**本质区别**：

```
Milvus Analyzer  → 为「文本检索」服务（BM25 / TEXT_MATCH / 短语匹配）
                   目标：拆出有意义的"词"，建倒排索引

模型 Tokenizer   → 为「向量检索」服务（ANN 搜索 / 混合搜索）
                   目标：拆出模型能理解的"子词单元"，输入神经网络
```

**具体对比**：

**用同一段文本看两者的完整处理过程**：

<img src="../images/analyzer-vs-tokenizer.jpg" style="zoom:50%;" />

### 3.2 全文检索

#### 3.2.1 核心原理

全文检索基于 BM25 算法，是信息检索领域最经典的评分算法。Milvus 内置了完整的 BM25 实现，用户只需插入原始文本，Milvus 自动完成分词、建索引、评分排序。

```
BM25 评分公式的核心思想：

score(query, document) = Σ IDF(term) × TF(term, document) × 标准化因子

对查询中的每个词，计算 IDF × TF，然后求和得到文档的最终得分。

其中：
├── TF（词频）：衡量某个词在「这篇文档」中出现得多不多
│   出现越多 → TF 越高（但有饱和上限，不会无限增长）
│
├── IDF（逆文档频率）：衡量某个词在「整个文档库」中是不是稀罕货
│   出现在越少的文档中 → 这个词的 IDF 权重越高
│   即：稀有词的权重大，常见词的权重小
│   注意：IDF 是这个词自身的全局权重，不是某篇文档的得分
│
└── 文档长度归一化：把「出现次数」修正为「出现密度」
    同样出现5次，500字的短文档比5000字的长文档密度更高、更相关
```

**TF（词频）—— 这个词在这篇文档里重要吗？**

一个词在某篇文档里出现得越多，说明这篇文档和这个词越相关。比如"电阻"在文档A里出现了 8 次，在文档B里只出现了 1 次，那文档A大概率比文档B更深入地讨论了电阻相关的内容。

但 BM25 给 TF 加了一个"饱和"机制：出现 1 次到 5 次，得分增长明显；从 5 次到 50 次，增长就很缓慢了。这是因为一个词出现 50 次和出现 500 次，文档的相关性其实差别不大，不应该让高频堆叠无限拉高分数。

```
"电阻"在文档中的出现次数 vs TF 得分（增长趋于饱和）：

出现次数:  0    1    2    3    5    10   50
TF 得分:   0   0.6  0.8  0.86 0.91 0.95 0.99
                ↑ 增长快          ↑ 趋于饱和
```



**IDF（逆文档频率）—— 这个词本身有区分度吗？**

IDF 从整个文档库的角度衡量一个词的价值。如果一个词几乎每篇文档都有（如"的"、"是"），它就没什么区分度；如果只在少数文档中出现（如"RS-12"），它的区分度就很高。

```
假设知识库有 100 篇文档：

"的"    → 100 篇都有  → IDF ≈ 0（极低）  → 几乎没有检索价值
"测量"  → 40 篇都有   → IDF 较低          → 有一定价值但不够精确
"电阻"  → 8 篇有      → IDF 较高          → 有较好的区分度
"RS-12" → 2 篇有      → IDF 很高          → 区分度极强

BM25 会自动给稀有词更高的权重，给常见词几乎为零的权重
不需要手动指定哪个词更重要
```

简单总结：**TF 看的是"这个词在这篇文档里出不出现、出现多不多"，IDF 看的是"这个词在整个库里是不是稀罕货"**。两者相乘，就能同时衡量一个词对某篇文档的相关性贡献。

**TF × IDF 结合的完整示例**：

```
假设知识库有 100 篇文档，搜索: "万用表 电阻 测量"

第一步：计算每个查询词的 IDF（全局权重，与具体文档无关）
┌──────────┬──────────────────┬────────────┐
│  查询词   │  出现在多少篇文档  │  IDF 权重  │
├──────────┼──────────────────┼────────────┤
│  万用表   │  30 篇           │  1.2（中）  │
│  电阻    │  8 篇            │  2.5（高）  │  ← 稀有词，区分度强
│  测量    │  45 篇           │  0.8（低）  │  ← 常见词，区分度弱
└──────────┴──────────────────┴────────────┘

第二步：计算每篇文档中每个查询词的 TF（局部词频）

文档A: "RS-12数字万用表电阻测量指南：电阻测量是万用表最常用的功能..."
┌──────────┬────────────┬────────────┬─────────────────┐
│  查询词   │  出现次数   │  TF 得分    │  TF × IDF       │
├──────────┼────────────┼────────────┼─────────────────┤
│  万用表   │  3次       │  0.86      │  0.86 × 1.2 = 1.03 │
│  电阻    │  4次       │  0.89      │  0.89 × 2.5 = 2.23 │  ← 贡献最大
│  测量    │  3次       │  0.86      │  0.86 × 0.8 = 0.69 │
├──────────┼────────────┼────────────┼─────────────────┤
│  合计    │            │            │  BM25 ≈ 3.95       │
└──────────┴────────────┴────────────┴─────────────────┘

文档B: "各类仪器概述：万用表可以测量电压、电流、电阻等..."
┌──────────┬────────────┬────────────┬─────────────────┐
│  查询词   │  出现次数   │  TF 得分    │  TF × IDF       │
├──────────┼────────────┼────────────┼─────────────────┤
│  万用表   │  1次       │  0.60      │  0.60 × 1.2 = 0.72 │
│  电阻    │  1次       │  0.60      │  0.60 × 2.5 = 1.50 │
│  测量    │  1次       │  0.60      │  0.60 × 0.8 = 0.48 │
├──────────┼────────────┼────────────┼─────────────────┤
│  合计    │            │            │  BM25 ≈ 2.70       │
└──────────┴────────────┴────────────┴─────────────────┘

最终: BM25(文档A) = 3.95 >> BM25(文档B) = 2.70

分析：
├── TF 的作用：文档A每个词出现次数更多 → TF 得分更高
├── IDF 的作用："电阻"的 IDF=2.5 远高于"测量"的 IDF=0.8
│   → 即使两篇文档的"电阻"TF差距不大，乘上高 IDF 后差距被放大
│   → "电阻"这个词对最终排序的影响力远大于"测量"
└── 两者结合：TF 决定"这篇文档和查询词有多相关"
              IDF 决定"这个查询词本身有多重要"
```

**文档长度归一化 —— 避免长文档的不公平优势**：

```
文档C: 500字的电阻测量专题    → "电阻"出现5次 → 密度高，专门在讲电阻，非常相关
文档D: 5000字的万用表全手册   → "电阻"出现5次 → 密度低，只是顺带提到电阻

不做归一化，BM25 只看"出现了几次"，那这两篇文档得分一样。但从用户搜索"电阻"的角度看，文档C明显更相关——这就是不公平。

BM25 的做法是：计算 TF 得分时，把文档长度除以整个库的平均文档长度，得到一个"长度比"，然后用这个比值去"惩罚"长文档。
归一化后: 文档C密度更高 → 得分更高 ✓
```

**全文检索的内部流程**：

```
1. 建索引阶段：
   原始文本 → Analyzer 分词 → BM25 Function 自动生成稀疏向量 → 存入 sparse 字段

2. 查询阶段：
   查询文本 → Analyzer 分词 → 自动生成查询稀疏向量 → 稀疏向量检索 → BM25 评分排序
```



#### 3.2.2 Collection 配置

```python
from pymilvus import MilvusClient, DataType, Function, FunctionType

client = MilvusClient(uri="http://localhost:19530")
schema = client.create_schema()

# 1. 主键字段
schema.add_field(field_name="id", datatype=DataType.INT64, is_primary=True, auto_id=True)

# 2. 文本字段（启用分词器）
schema.add_field(
    field_name="content",
    datatype=DataType.VARCHAR,
    max_length=5000,
    enable_analyzer=True,        # 启用分词
    analyzer_params={"type": "chinese"}
)

# 3. 稀疏向量字段（BM25 函数自动生成的内部向量存储在此字段）
schema.add_field(field_name="sparse", datatype=DataType.SPARSE_FLOAT_VECTOR)

# 4. 定义 BM25 函数：自动将文本转为稀疏向量
bm25_function = Function(
    name="text_bm25_emb",
    input_field_names=["content"],     # 输入：原始文本字段（VARCHAR）
    output_field_names=["sparse"],     # 存储到：稀疏向量字段（内部使用，不可直接输出）
    function_type=FunctionType.BM25
)
schema.add_function(bm25_function)
```

#### 3.2.3 代码示例

```python
# 插入数据：直接插入原始文本，无需手动生成向量
client.insert(collection_name="kb_docs", data=[
    {"content": "RS-12数字万用表电阻测量方法：将旋钮拨到Ω档..."},
    {"content": "直流电压测量：将红表笔接正极..."},
])

# 搜索：直接使用原始文本查询
results = client.search(
    collection_name="kb_docs",
    data=["万用表如何测量电阻"],     # 直接传入原始文本
    anns_field="sparse",             # 搜索 BM25 生成的稀疏向量字段
    limit=5,
    output_fields=["content"]
)
```

#### 3.2.4 与手动稀疏向量（BGE-M3）的对比

<img src="../images/bm25-vs-manual-sparse-vector.jpg" style="zoom:67%;" />

---

### 3.3 文本匹配（Text Match）

#### 3.3.1 核心原理

文本匹配是一种**布尔过滤器**，用于判断文档是否包含指定关键词。它不做评分排序，只做"包含/不包含"的判断，通常作为向量、标量搜索的前置过滤条件。

```
文本匹配 vs 全文检索：

全文检索：返回按 BM25 评分排序的结果（独立检索方式）
文本匹配：返回"包含关键词"的文档集合（过滤条件，通常配合向量搜索）

TEXT_MATCH 的分词逻辑：
  TEXT_MATCH(content, 'keyword1 keyword2')
  分词后: ["keyword1", "keyword2"]
  逻辑: 包含 keyword1 OR 包含 keyword2

  如果要 AND 逻辑，需要写两个 TEXT_MATCH：
  TEXT_MATCH(content, 'keyword1') AND TEXT_MATCH(content, 'keyword2')
```

#### 3.3.2 代码示例

```python
# 作为向量搜索的过滤条件：先文本匹配缩小范围，再向量检索
results = client.search(
    collection_name="kb_chunks",
    data=[query_dense_vector],
    anns_field="dense_vector",
    search_params={"metric_type": "COSINE"},
    filter="TEXT_MATCH(content, '电阻 测量')",  # 先过滤包含"电阻"或"测量"的文档
    limit=5,
    output_fields=["content", "item_name"]
)

# 单独用于查询（不配合向量搜索）
results = client.query(
    collection_name="kb_chunks",
    filter="TEXT_MATCH(content, '电阻') AND TEXT_MATCH(content, '测量')",
    output_fields=["content", "item_name"],
    limit=10
)
```

#### 3.3.3 使用场景

- **缩小向量搜索范围**：先用关键词过滤，再做语义搜索，提升精度和性能
- **必须包含某个关键词**：用户搜索"RS-12"时，结果必须包含"RS-12"
- **高并发过滤**：基于倒排索引，性能远超 LIKE 通配符匹配（高达 400 倍 QPS 提升）

---

### 3.4 短语匹配

#### 3.4.1 核心原理

短语匹配在文本匹配的基础上，增加了**词序和位置信息**的约束。不仅要求文档包含指定的词，还要求这些词按特定顺序、在一定位置间距内出现。

```
文本匹配 vs 短语匹配：

TEXT_MATCH(content, '直流 电压')
  匹配: "电压是直流的" ✓  （包含"直流"和"电压"即可，不管顺序）
  匹配: "直流电压测量" ✓

TEXT_MATCH_PHRASE(content, '直流 电压')
  不匹配: "电压是直流的" ✗  （顺序不对）
  匹配:   "直流电压测量" ✓  （"直流"紧接着"电压"）

短语匹配 + slop 参数（允许词间距）：
  TEXT_MATCH_PHRASE(content, '直流 电压', slop=1)
  匹配: "直流的电压测量" ✓  （中间隔了1个词，slop=1 允许）
```

#### 3.4.2 工作原理

```
底层实现（基于 Tantivy 搜索引擎库）：

1. 分词时记录每个 token 的位置信息：
   "RS-12数字万用表直流电压测量"
   → ["RS-12":0, "数字":1, "万用表":2, "直流":3, "电压":4, "测量":5]

2. 查询时检查 token 的位置关系：
   查询: "直流 电压"
   → 要求: position("电压") - position("直流") == 1（紧邻）
   → slop=2 时: position("电压") - position("直流") <= 3（允许间隔2个位置）
```

#### 3.4.3 代码示例

```python
# 精确短语匹配
results = client.query(
    collection_name="kb_chunks",
    filter='TEXT_MATCH_PHRASE(content, "直流电压测量")',
    output_fields=["content", "item_name"],
    limit=10
)

# 带 slop 的短语匹配（允许词间有间距）
results = client.query(
    collection_name="kb_chunks",
    filter='TEXT_MATCH_PHRASE(content, "直流 电压", 1)',  # slop=1
    output_fields=["content", "item_name"],
    limit=10
)
```

#### 3.4.4 使用场景

- **精确短语搜索**：搜索"直流电压测量"要求这几个词按顺序连续出现
- **法律/合同文档**：搜索精确条款措辞
- **技术文档**：搜索特定操作步骤的精确描述

---

## 4. 标量过滤与查询

### 4.1 过滤表达式

#### 4.1.1 核心原理

标量过滤是最基础的条件筛选能力，作用于非向量字段（如字符串、数字、布尔值），可以独立使用，也可以与向量搜索、文本检索组合使用。

```
支持的操作符：

比较运算符：  ==, !=, >, >=, <, <=
逻辑运算符：  AND, OR, NOT
集合运算符：  IN, NOT IN
字符串操作：  LIKE (通配符匹配，性能较差)
文本操作：    TEXT_MATCH (倒排索引匹配，性能好)
JSON 操作：   JSON_CONTAINS, JSON_CONTAINS_ALL, JSON_CONTAINS_ANY
数组操作：    ARRAY_CONTAINS, ARRAY_LENGTH
```

#### 4.1.2 常用过滤表达式示例

```python
# 等值匹配
filter = 'category == "电子仪器"'

# IN 匹配
filter = 'item_name in ["RS-12 数字万用表", "DM-200 示波器"]'

# 范围查询
filter = 'price >= 100 AND price <= 500'

# 组合条件
filter = 'category == "电子仪器" AND stock > 0 AND status != "下架"'

# 字符串模糊匹配（性能较差，建议用 TEXT_MATCH 替代）
filter = 'item_name LIKE "%万用表%"'

# JSON 字段过滤
filter = 'JSON_CONTAINS(tags, "热门")'
```

#### 4.1.3 过滤表达式模板（性能优化）

对于包含中日韩字符的过滤条件，使用表达式模板可以显著提升性能：

```python
# ❌ 直接拼接（Milvus 每次都要解析中日韩字符，性能差）
filter = 'item_name in ["RS-12 数字万用表", "DM-200 示波器"]'

# ✅ 模板化参数（动态值分离，查询引擎高效处理）
filter = "item_name in {item_names}"
filter_params = {"item_names": ["RS-12 数字万用表", "DM-200 示波器"]}
```

#### 4.1.4 查询（Query）vs 搜索（Search）

```
Query（查询）：纯标量条件查询，不涉及向量，类似 SQL 的 SELECT ... WHERE
Search（搜索）：向量相似度搜索，可选配标量过滤

# Query 示例
results = client.query(
    collection_name="kb_chunks",
    filter='item_name == "RS-12 数字万用表"',
    output_fields=["content", "chunk_id"],
    limit=10
)

# Search 示例（向量搜索 + 标量过滤）
results = client.search(
    collection_name="kb_chunks",
    data=[query_vector],
    filter='item_name == "RS-12 数字万用表"',
    ...
)
```

---

## 5. 检索方式组合策略

Milvus 的强大之处在于这些检索方式可以灵活组合。以下是常见的组合模式：

### 5.1 组合模式一览

<img src="../images/combination-patterns.jpg" style="zoom:67%;" />

### 5.2 本项目的完整检索链路

```
用户提问: "RS-12万用表如何测量电阻"
                    │
                    ▼
┌────────────────────────────────────────────┐
│  1. 查询改写 (RewriteNode)                  │
│     → "RS-12 数字万用表 电阻测量 方法 步骤"   │
└─────────────────┬──────────────────────────┘
                  │
         ┌────────┴────────┐
         ▼                 ▼
┌──────────────┐  ┌──────────────────┐
│ VectorSearch │  │ HyDeSearch       │
│ 混合搜索      │  │ 假设性文档+混合搜索│
│ +标量过滤     │  │ +标量过滤         │
│              │  │                  │
│ 稠密+稀疏     │  │ (查询+假设文档)   │
│ ANN检索       │  │ 嵌入后ANN检索    │
│ item_name    │  │ item_name       │
│ IN过滤       │  │ IN过滤           │
└──────┬───────┘  └───────┬──────────┘
       │                  │
       └────────┬─────────┘
                ▼
┌────────────────────────────────────────────┐
│  2. 结果融合去重 (MergeNode)                 │
│     合并两路检索结果，去重，排序               │
└─────────────────┬──────────────────────────┘
                  │
                  ▼
         最终 Top-K 文档块 → 送入 LLM 生成答案
```

---

## 6. 索引类型与性能优化

### 6.1 向量索引类型选择

<img src="../images/vector-index-selection.jpg" style="zoom:67%;" />



---

## 7. 总结：如何选择检索方式

### 7.1 决策流程

<img src="../images/decision-flow.jpg" style="zoom:67%;" />

### 7.2 各检索方式速查表

<img src="../images/search-methods-cheatsheet.jpg" style="zoom:67%;" />
