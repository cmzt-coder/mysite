# MinerU 模型架构与解析流程全解

> MinerU 是一个将 PDF 高质量转换为 Markdown 的开源工具。
> 本文档从整体架构到底层模型、从后端引擎到配置文件，完整梳理 MinerU 的解析体系。

---

## 1、整体架构概览

MinerU 提供了**两套解析方法**，搭配**三种运行方式**，组合出 5 种后端引擎。

```
MinerU 解析体系
├── 解析方法（做什么）
│   ├── Pipeline / Hybrid ── 传统流水线，8 个专业小模型协作
│   └── VLM ──────────────── 端到端视觉语言大模型，一步到位
│
└── 运行方式（怎么跑）
    ├── pipeline ─────────── 纯传统流水线，本地运行
    ├── auto-engine ──────── 本地自动引擎（hybrid / vlm）
    └── http-client ──────── 远程 API 调用（hybrid / vlm）
```

### 两套解析方法对比

| 对比项 | Pipeline / Hybrid（传统） | VLM（新一代） |
|--------|--------------------------|--------------|
| **模型目录** | `PDF-Extract-Kit-1.0` | `MinerU2.5-2509-1.2B` |
| **核心思路** | 8 个专业小模型流水线协作 | 1 个 1.2B 参数端到端大模型 |
| **处理方式** | PDF → 图片 → 切块 → 分类 → 各模型处理 → 排序拼接 | PDF → 图片 → VLM 直接输出 Markdown |
| **精度指标** | 82+ | 90+ |
| **优势** | 成熟稳定，各模块可单独调优 | 架构简洁，上下文理解更强 |
| **适用场景** | 复杂排版、高精度表格/公式 | 通用文档快速解析 |

---

## 2、五种后端引擎详解

### 引擎对比表

| 对比项 | pipeline | auto-engine hybrid | auto-engine vlm | http-client hybrid | http-client vlm |
|--------|----------|-------------------|-----------------|-------------------|-----------------|
| **解析方法** | 传统流水线 | 本地混合引擎 | 本地 VLM 引擎 | 远程混合引擎 | 远程 VLM 引擎 |
| **后端特性** | 兼容性好 | 硬件要求较高 | 硬件要求较高 | 适用于 OpenAI 兼容服务器 | 适用于 OpenAI 兼容服务器 |
| **精度指标** | 82+ | 82+ | 90+ | 82+ | 90+ |
| **纯 CPU 支持** | ✅ | ✅ | ❌ | ✅ | ✅ |
| **GPU 加速** | Volta 及以后架构 / Apple Silicon | 同左 | 同左 | 不需要 | 不需要 |
| **显存最低要求** | 6GB | 10GB | 8GB | 3GB | 不需要 |
| **内存要求** | 最低 16GB，推荐 32GB | 同左 | 同左 | 最低 8GB | 最低 8GB |
| **磁盘空间** | 20GB+，推荐 SSD | 同左 | 同左 | 至少 2GB | 至少 2GB |
| **Python 版本** | 3.10 - 3.13 | 同左 | 同左 | 同左 | 同左 |

### 三大类引擎说明

**pipeline（传统流水线）**
最经典的模式。8 个专业模型按流水线顺序处理，兼容性最好，纯 CPU 也能跑，精度 82+，显存最低 6GB。

**auto-engine（本地自动引擎）**
模型在本地运行，分两种方法：`hybrid` 混合模式（显存 10GB，精度 82+）和 `vlm` 端到端模式（显存 8GB，精度 90+，必须有 GPU）。

**http-client（远程客户端）**
模型不在本地运行，调用远程 OpenAI 兼容 API。本地硬件要求极低（内存 8GB、磁盘 2GB），不需要 GPU。同样分 `hybrid` 和 `vlm` 两种方法。

### 命令行切换

```bash
# Pipeline 模式（默认）
mineru -p input.pdf -o output_dir --source local

# VLM 模式
mineru -p input.pdf -o output_dir --source local --method vlm
```

---

## 3、VLM 引擎

`MinerU2.5-2509-1.2B` 是一个 **1.2B 参数的视觉语言模型（Vision-Language Model）**，采用端到端架构。

### 3.1 工作原理

```
PDF 页面 → 渲染为图片 → VLM 模型一次性处理 → 直接输出 Markdown
```

与传统 Pipeline 不同，VLM 不需要先切块再分类，而是像一个"全能选手"一样，一次性完成版面理解、文字识别、表格还原、公式转换等所有任务。

### 3.2 核心优势

- **架构简洁**：不需要 8 个模型的复杂调度，部署和维护更简单。
- **上下文感知强**：大模型能理解页面的整体语义，不会因为切块而丢失上下文。
- **持续进化**：受益于视觉语言模型的快速发展，后续版本能力提升空间大。

---

## 4、Pipeline 引擎 

### 4.1 8 大模型职责一览

| 模型 | 全称 | 角色定位 | 核心职责 |
|------|------|----------|----------|
| **OriCls** | Orientation Classification | 方向分类器 | 判断页面是否旋转（0°/90°/180°/270°），将歪斜页面摆正 |
| **Layout** | Layout Analysis | 版面分析 | 画包围框，识别正文、标题、插图、页眉页脚等区域 |
| **MFD** | Math Formula Detection | 公式检测 | 扫描数学公式位置，区分行内公式与行间公式 |
| **MFR** | Math Formula Recognition | 公式识别 | 将公式截图转换为标准 LaTeX 代码 |
| **TabCls** | Table Classification | 表格分类 | 判断表格类型：有线表、无线表、三线表等 |
| **TabRec** | Table Recognition | 表格识别 | 还原行列结构和合并单元格，输出 HTML/Markdown 表格 |
| **OCR** | Optical Character Recognition | 文字识别 | 将"普通文本"区域的像素转换为可编辑文本 |
| **ReadingOrder** | Reading Order | 阅读顺序 | 决定所有区块的排列顺序，处理分栏、图文混排 |

### 4.2 处理流程（以复杂 PDF 页面为例）

**步骤 1：预处理与纠正**

```
PDF 页面 → 渲染为高清图片 → OriCls 检测方向 → 旋转摆正
```

**步骤 2：版面切割（定位区域）**

```
摆正后的页面图片
    ├── Layout  → 识别：段落、标题、图片、页眉页脚、表格等区块
    └── MFD     → 识别：行内公式、行间公式的位置
```

两个模型并行工作，将页面切成若干带标签的小方块。

**步骤 3：分类处理（各显神通）**

流水线在此处**分叉**，不同标签的区块交给对应的专家：

```
标签为「段落/标题」的区块  ──→  OCR      ──→  输出纯文本
标签为「公式」的区块        ──→  MFR      ──→  输出 LaTeX 代码
标签为「表格」的区块        ──→  TabCls   ──→  判断表格类型
                                  └──→  TabRec   ──→  输出 Markdown/HTML 表格
标签为「图片」的区块        ──→  直接提取保存为图片文件
```

**步骤 4：排序重组（最终输出）**

```
所有提取结果（文本 + LaTeX + 表格 + 图片引用）
    └── ReadingOrder → 按正确的阅读顺序排列 → 拼接为最终 Markdown
```

### 4.3 整体流水线图

```
┌─────────────────────────────────────────────────────────┐
│                    PDF 文件输入                           │
└────────────────────────┬────────────────────────────────┘
                         ▼
                  ┌──────────────┐
                  │   页面渲染    │  PDF → 高清图片
                  └──────┬───────┘
                         ▼
                  ┌──────────────┐
                  │   OriCls     │  方向检测 & 纠正
                  └──────┬───────┘
                         ▼
              ┌──────────┴──────────┐
              ▼                     ▼
       ┌────────────┐       ┌────────────┐
       │   Layout   │       │    MFD     │
       │  版面分析   │       │  公式检测   │
       └─────┬──────┘       └─────┬──────┘
             │                    │
             └────────┬───────────┘
                      ▼
            ┌─────────┴─────────┐
            │   区块分发中心     │
            └──┬────┬────┬───┬──┘
               │    │    │   │
    ┌──────┐ ┌─┴──┐ │ ┌──┴───┴──┐
    │ OCR  │ │MFR │ │ │ TabCls  │
    │文字  │ │公式│ │ │表格分类  │
    └──┬───┘ └─┬──┘ │ └───┬─────┘
       │       │    │     ▼
       │       │    │ ┌────────┐
       │       │    │ │ TabRec │
       │       │    │ │表格识别│
       │       │    │ └───┬────┘
       │       │    │     │
       └───────┴────┴─────┘
                    ▼
           ┌───────────────┐
           │ ReadingOrder  │  阅读顺序排列
           └───────┬───────┘
                   ▼
           ┌───────────────┐
           │  Markdown 输出 │
           └───────────────┘
```

---

## 5、mineru.json 配置文件

`mineru.json` 是 MinerU 的**全局配置文件**，控制模型路径、输出格式、LLM 辅助等核心行为。

### 5.1 完整配置示例

```json
{
    "bucket_info": {
        "bucket-name-1": ["ak", "sk", "endpoint"],
        "bucket-name-2": ["ak", "sk", "endpoint"]
    },
    "latex-delimiter-config": {
        "display": { "left": "$$", "right": "$$" },
        "inline":  { "left": "$",  "right": "$" }
    },
    "llm-aided-config": {
        "title_aided": {
            "api_key": "your_api_key",
            "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
            "model": "qwen3-next-80b-a3b-instruct",
            "enable_thinking": false,
            "enable": false
        }
    },
    "models-dir": {
        "pipeline": "",
        "vlm": ""
    },
    "config_version": "1.3.1"
}
```

### 5.2 说明

**`models-dir` — 本地模型路径（最关键）**

指定两套模型在本地磁盘的存放路径，连接"配置"与"模型目录"的桥梁：

```json
"models-dir": {
    "pipeline": "/path/to/PDF-Extract-Kit-1.0",
    "vlm": "/path/to/MinerU2.5-2509-1.2B"
}
```

- `pipeline`：指向传统 8 模型目录（第四节的 PDF-Extract-Kit-1.0）
- `vlm`：指向 VLM 端到端模型目录（第三节的 MinerU2.5-2509-1.2B）
- 留空则使用默认的 ModelScope 缓存路径

**`bucket_info` — 对象存储配置**

配置云端对象存储（如阿里云 OSS、AWS S3），解析出的图片可自动上传，Markdown 中的图片引用替换为云端 URL：

- `bucket-name`：存储桶名称
- `ak`：Access Key（访问密钥）
- `sk`：Secret Key（秘密密钥）
- `endpoint`：存储服务接入点地址
- 不需要上传图片到云端则留空即可

**`latex-delimiter-config` — LaTeX 公式定界符**

控制输出 Markdown 中数学公式的包裹符号：

- `display`：行间公式（块级，独占一行），默认 `$$...$$`
- `inline`：行内公式（与文字混排），默认 `$...$`
- 影响下游工具（Typora、Obsidian 等）能否正确渲染公式

**`llm-aided-config` — LLM 辅助增强**

调用外部 LLM 辅助优化解析结果：

- `title_aided`：标题辅助识别，当 PDF 标题层级不清晰时，调用 LLM 判断标题级别（H1/H2/H3...）
- `api_key`：LLM 服务的 API 密钥
- `base_url`：接入地址（兼容 OpenAI 协议）
- `model`：使用的模型名称
- `enable_thinking`：是否开启"思考模式"（部分模型支持）
- `enable`：**总开关**，`false` 则不启用（默认关闭）

**`config_version` — 配置文件版本**

标识当前配置版本号（`1.3.1`），MinerU 升级时用于判断是否需要迁移配置。

---

## 6、模型目录结构与软链接

### 6.1 目录结构

```
models/OpenDataLab/
├── MinerU2.5-2509-1.2B          ← 真实目录（VLM 端到端模型，见第三节）
├── MinerU2__5-2509-1__2B        ← 软链接 → MinerU2.5-2509-1.2B
├── PDF-Extract-Kit-1.0          ← 真实目录（Pipeline 8 模型，见第四节）
└── PDF-Extract-Kit-1__0         ← 软链接 → PDF-Extract-Kit-1.0
```

`PDF-Extract-Kit-1.0` 内部的 8 个模型子目录：

```
PDF-Extract-Kit-1.0/models/
├── Layout          版面分析模型
├── MFD             公式检测模型
├── MFR             公式识别模型
├── OCR             文字识别模型
├── OriCls          方向分类模型
├── ReadingOrder    阅读顺序模型
├── TabCls          表格分类模型
└── TabRec          表格识别模型
```

### 6.2 软链接的作用

带双下划线的文件夹（如 `PDF-Extract-Kit-1__0`）是 MinerU 自动创建的**兼容性软链接**：

1. **原因**：ModelScope 的缓存机制等系统组件会把文件名中的 `.`（点号）误认为文件扩展名分隔符，导致路径解析出错。
2. **做法**：MinerU 下载模型后，自动创建一个将 `.` 替换为 `__` 的软链接。例如 `PDF-Extract-Kit-1.0` → `PDF-Extract-Kit-1__0`。
3. **结论**：两个文件夹指向完全相同的内容，代码内部通过带下划线的路径引用模型。**你不需要手动操作这些软链接**。

---

## 7、模型下载与自定义存储路径

### 7.1 默认下载行为

使用 `mineru-models-download` 命令下载模型时，默认会存储到系统用户目录下的缓存文件夹：

```
# Windows 默认路径
C:\Users\<用户名>\.cache\modelscope\hub\models\OpenDataLab\

# Linux 默认路径
~/.cache/modelscope/hub/models/OpenDataLab/
```

模型体积很大，默认全部塞进 C 盘的 `.cache` 会导致系统盘空间不足。

### 7.2 自定义下载目录

通过设置环境变量，可以将模型下载到指定磁盘：

**PowerShell（Windows）：**

```powershell
# 第一步：设置 ModelScope 缓存路径（当前终端窗口有效）
$env:MODELSCOPE_CACHE = "D:\models\mineru_models"

# 第二步：执行下载
mineru-models-download
# 选择 modelscope 源，选择 all 下载全部模型
```

**Bash（Linux / macOS）：**

```bash
# 第一步：设置 ModelScope 缓存路径
export MODELSCOPE_CACHE="/data/models/mineru_models"

# 第二步：执行下载
mineru-models-download
```

如果使用 HuggingFace 作为下载源，对应的环境变量是：

```powershell
# Windows
$env:HF_HOME = "D:\models\huggingface_cache"

# Linux
export HF_HOME="/data/models/huggingface_cache"
```

### 7.3 下载完成后必须更新 mineru.json

模型下载到自定义目录后，**必须**同步修改 `mineru.json` 中的 `models-dir`，否则 MinerU 运行时仍会去默认路径找模型，报 `FileNotFound` 错误。

`mineru.json` 的位置通常在用户根目录下（如 `C:\Users\Administrator\mineru.json` 或 `~/mineru.json`）。

修改 `models-dir` 字段，路径要指到包含模型文件的实际目录：

```json
"models-dir": {
    "pipeline": "D:/models/mineru_models/hub/models/OpenDataLab/PDF-Extract-Kit-1.0",
    "vlm": "D:/models/mineru_models/hub/models/OpenDataLab/MinerU2.5-2509-1.2B"
}
```

> **注意**：路径中建议使用正斜杠 `/` 或双反斜杠 `\\`，避免 JSON 中单反斜杠被转义。具体路径层级以实际下载后的文件夹结构为准。

### 7.4 完整操作流程总结

```
1. 设置环境变量     →  指定下载目录（避免 C 盘爆满）
       ▼
2. mineru-models-download  →  下载 Pipeline + VLM 模型
       ▼
3. 修改 mineru.json →  更新 models-dir 指向新路径
       ▼
4. mineru -p xx.pdf →  正常使用，模型从自定义路径加载
```
