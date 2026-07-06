# Claude Code 提示词：RAG 智能问答系统（入门级）

> **使用方式**：在 Claude Code 终端中，将下方提示词整段复制粘贴给 Claude，它会从零开始帮你搭建完整项目。
>
> **技术栈**：Vue 3 + FastAPI + LangChain + Milvus Lite + OpenAI

---

## 提示词正文（复制以下全部内容）

```
请帮我从零创建一个 RAG（检索增强生成）智能文档问答系统的完整项目。
这是一个入门级教学项目，请确保代码简洁、注释充分、结构清晰。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
一、项目目录结构
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

请严格按照以下结构创建所有文件：

rag-knowledge-base/
├── backend/
│   ├── main.py                  # FastAPI 主入口
│   ├── rag_engine.py            # RAG 核心引擎（LangChain + Milvus）
│   ├── config.py                # 配置管理（API Key、模型、Milvus 连接）
│   ├── requirements.txt         # Python 依赖
│   ├── .env.example             # 环境变量模板
│   └── docs/                    # 存放待检索的知识库文档
│       └── sample.md           # 示例文档（关于 RAG 的基础知识介绍）
│
├── frontend/
│   ├── index.html               # Vue 3 单文件应用（CDN 模式，无需 npm）
│   └── style.css                # 科技风格样式
│
├── README.md                    # 项目说明文档
└── start.bat                    # Windows 一键启动脚本


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
二、后端要求（FastAPI + LangChain + Milvus）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【main.py — FastAPI 主入口】
- 使用 FastAPI 框架，配置 CORS 允许前端跨域
- 提供以下 3 个 API 端点：

  1. POST /api/upload
     - 接收前端上传的 .txt 或 .md 文件
     - 调用 rag_engine 进行文档切分 → 向量化 → 存入 Milvus
     - 返回：{ "status": "success", "chunks": 切片数量, "filename": 文件名 }

  2. POST /api/chat
     - 接收 JSON：{ "question": "用户的问题" }
     - 调用 rag_engine 检索相关文档片段 + LLM 生成回答
     - 返回：{
         "answer": "LLM 生成的回答",
         "sources": [
           { "content": "相关片段内容", "score": 相似度分数 }
         ]
       }

  3. GET /api/status
     - 返回系统状态：向量库中的文档数量、是否就绪

- 启动时自动加载 docs/ 目录下的所有 .txt 文件作为默认知识库
- 添加 lifespan 事件：启动时初始化 Milvus 连接和默认文档

【rag_engine.py — RAG 核心引擎】
- 使用 LangChain 框架构建 RAG 管道
- 文档加载：使用 LangChain 的 TextLoader
- 文本切分：使用 RecursiveCharacterTextSplitter
  - chunk_size=500, chunk_overlap=50
- Embedding 模型：使用 OpenAI 的 text-embedding-3-small
- 向量数据库：使用 Milvus Lite（本地文件模式）
  - URI 设为 "./milvus_rag.db"（无需安装 Docker）
  - 使用 langchain_milvus 的 Milvus 类
- LLM：使用 OpenAI 的 gpt-4o-mini 模型
- RAG 链：使用 LCEL（LangChain Expression Language）构建
  - Prompt 模板要求 LLM 只基于检索到的上下文回答
  - 如果上下文中没有相关信息，要诚实回答"我不确定"
- 提供以下方法：
  - add_documents(file_path): 加载文档并存入向量库
  - query(question): 执行 RAG 检索 + 生成，返回答案和来源
  - get_doc_count(): 返回向量库中的文档数量

【config.py — 配置管理】
- 使用 pydantic-settings 从 .env 文件读取配置
- 配置项：OPENAI_API_KEY、OPENAI_BASE_URL（可选，用于代理）、
  MILVUS_URI、CHUNK_SIZE、CHUNK_OVERLAP、LLM_MODEL

【requirements.txt】
- 包含所有依赖及版本：
  fastapi, uvicorn, python-dotenv, pydantic-settings,
  langchain, langchain-core, langchain-community,
  langchain-openai, langchain-text-splitters,
  langchain-milvus, milvus-lite,
  python-multipart（文件上传用）

【docs/sample.txt — 示例知识库文档】
- 写一篇 800 字左右的中文文档，主题是"RAG 技术入门指南"
- 内容涵盖：什么是 RAG、RAG 的工作流程（文档切分→向量化→检索→生成）、
  RAG 的优势（减少幻觉、知识可更新）、常见应用场景


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
三、前端要求（Vue 3 + 科技风格）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【技术方案】
- 使用 Vue 3 的 CDN 模式（直接在 HTML 中引入 vue.global.js）
- 不需要 npm、不需要 Node.js、不需要构建工具
- 所有逻辑写在一个 index.html 文件中
- 样式单独放在 style.css 中

【科技风格 UI 设计要求】
- 整体色调：深色主题（#0a0e1a 深蓝黑底色）
- 主色调：青蓝色（#00d4ff）和紫色（#7c3aed）渐变
- 背景效果：
  - 用纯 CSS 实现一个动态科技感粒子网格背景
  - 使用 CSS @keyframes 动画让背景有缓慢流动/闪烁的效果
  - 可以用伪元素 + radial-gradient 模拟光晕效果
- 卡片样式：半透明毛玻璃效果（backdrop-filter: blur）
  - 边框用 1px 的青蓝色细线，带微弱发光（box-shadow glow）
- 按钮：渐变色背景，hover 时有发光脉冲动画
- 输入框：深色背景 + 青蓝色聚焦边框
- 文字：白色主文字 + 灰色辅助文字
- 字体：使用等宽字体（如 'JetBrains Mono' 或 monospace）作为标题字体，
  正文用系统默认 sans-serif
- 滚动条：自定义为细窄的青蓝色风格

【页面布局】
整个页面分为三个主要区域：

1. 顶部导航栏
   - 左侧：项目 Logo（用 SVG 或 Unicode 符号 ⚡ 代替）+ 项目名"RAG Knowledge Base"
   - 右侧：系统状态指示灯（绿色 = 就绪 / 红色 = 未连接）+ 文档数量

2. 左侧面板（文档管理 - 占 30% 宽度）
   - 文件上传区域：拖拽上传或点击选择 .txt/.md 文件
   - 上传进度条（用 CSS 动画模拟科技感进度效果）
   - 已上传文档列表（显示文件名 + 切片数量）

3. 右侧主区域（对话区 - 占 70% 宽度）
   - 顶部：大标题 "Ask Your Knowledge Base"
   - 中间：聊天记录区域（消息气泡样式）
     - 用户消息：右对齐，紫色渐变背景
     - AI 回答：左对齐，深灰色背景，带引用来源折叠面板
     - AI 回答底部可展开"参考来源"，显示检索到的文档片段和相似度分数
   - 底部：输入框 + 发送按钮（固定在底部）
     - 输入框支持 Enter 发送、Shift+Enter 换行
     - 发送按钮在请求中时显示加载动画（旋转的科技感圆环）

【交互细节】
- 页面加载时自动调用 /api/status 检查后端状态
- 上传文件后显示成功提示（带科技感的 toast 通知）
- 发送问题时，AI 回答区域显示"思考中..."的打字机闪烁效果
- 聊天记录自动滚动到底部
- 空状态提示："上传文档后，开始向知识库提问吧 🚀"


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
四、README.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

写一份简洁的中文 README，包含：
- 项目简介（一句话说明）
- 技术栈清单
- 快速启动步骤（3 步：配置 .env → 安装依赖 → 启动服务）
- 项目截图占位符
- API 接口文档（简要说明 3 个端点）
- 常见问题（如何更换模型、如何使用代理地址）


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
五、start.bat — Windows 一键启动脚本
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

写一个 Windows 批处理脚本：
- 检查 Python 是否安装
- 自动创建虚拟环境（如果不存在）
- 安装 requirements.txt 依赖
- 启动 FastAPI 服务（uvicorn main:app --reload --port 8000）
- 自动在浏览器中打开前端页面


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
六、关键约束和注意事项
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 使用 Milvus Lite（本地文件模式），不要 Docker，对入门用户友好
2. 所有 Python 代码必须有中文注释，解释每一步在做什么
3. 前端不依赖 npm/Node.js，纯 CDN 引入 Vue 3
4. .env.example 中的 API Key 用占位符，提醒用户替换
5. 错误处理要完善：后端每个接口都要 try-except，前端要有友好的错误提示
6. 代码风格：Python 用 PEP8，HTML/CSS 缩进用 2 空格
7. 这是入门级项目，请不要过度设计，保持代码量在合理范围内

请现在开始创建所有文件。先从后端开始，然后是前端，最后是配置和说明文件。
```

---

## 使用说明

### 第一步：在 Claude Code 中执行

```bash
# 进入你想创建项目的目录
cd D:\projects

# 启动 Claude Code
claude

# 把上面提示词正文（```之间的内容）整段粘贴给 Claude
```

### 第二步：Claude 会自动创建的文件

Claude 会逐个创建所有文件，你只需要在它每次请求写入权限时点"允许"。最终你会得到一个完整的项目目录。

### 第三步：配置并启动

```bash
# 1. 复制环境变量模板并填入你的 OpenAI API Key
cd rag-knowledge-base/backend
copy .env.example .env
# 编辑 .env，填入 OPENAI_API_KEY=sk-xxxx

# 2. 安装依赖
pip install -r requirements.txt

# 3. 启动后端
uvicorn main:app --reload --port 8000

# 4. 用浏览器打开前端
# 直接双击 frontend/index.html 即可
```

---

## 项目架构图

```
用户浏览器（Vue 3 前端）
    │
    │  HTTP 请求
    ▼
FastAPI 后端（main.py）
    │
    ├── POST /api/upload ──→ 文档切分 → 向量化 → 存入 Milvus
    │
    ├── POST /api/chat   ──→ 问题向量化 → Milvus 检索 → LLM 生成回答
    │
    └── GET  /api/status  ──→ 返回系统状态
    │
    ▼
RAG 引擎（rag_engine.py）
    │
    ├── LangChain TextSplitter ──→ 文档切片
    ├── OpenAI Embeddings      ──→ 向量化
    ├── Milvus Lite             ──→ 向量存储与检索
    └── OpenAI GPT-4o-mini      ──→ 答案生成
```





