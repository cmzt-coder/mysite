# Claude Code 使用手册

> **版本说明**：本手册基于 2026 年 4 月最新官方文档编写
>  **官方文档**：[code.claude.com/docs](https://code.claude.com/docs/en/overview)
>  **GitHub**：[github.com/anthropics/claude-code](https://github.com/anthropics/claude-code)

------

## 目录

1. [Claude Code 是什么](https://claude.ai/chat/1937fb0f-2018-4a39-9135-22e481a56cbd#1-claude-code-是什么)
2. [安装与配置](https://claude.ai/chat/1937fb0f-2018-4a39-9135-22e481a56cbd#2-安装与配置)
3. [快速上手](https://claude.ai/chat/1937fb0f-2018-4a39-9135-22e481a56cbd#3-快速上手)
4. [核心功能详解](https://claude.ai/chat/1937fb0f-2018-4a39-9135-22e481a56cbd#4-核心功能详解)
5. [CLAUDE.md — 项目记忆文件](https://claude.ai/chat/1937fb0f-2018-4a39-9135-22e481a56cbd#5-claudemd--项目记忆文件)
6. [斜杠命令（Slash Commands）](https://claude.ai/chat/1937fb0f-2018-4a39-9135-22e481a56cbd#6-斜杠命令slash-commands)
7. [Skills — 技能系统](https://claude.ai/chat/1937fb0f-2018-4a39-9135-22e481a56cbd#7-skills--技能系统)
8. [Hooks — 事件钩子](https://claude.ai/chat/1937fb0f-2018-4a39-9135-22e481a56cbd#8-hooks--事件钩子)
9. [MCP — 外部工具集成](https://claude.ai/chat/1937fb0f-2018-4a39-9135-22e481a56cbd#9-mcp--外部工具集成)
10. [Subagents — 子代理](https://claude.ai/chat/1937fb0f-2018-4a39-9135-22e481a56cbd#10-subagents--子代理)
11. [多环境使用](https://claude.ai/chat/1937fb0f-2018-4a39-9135-22e481a56cbd#11-多环境使用)
12. [高级用法与技巧](https://claude.ai/chat/1937fb0f-2018-4a39-9135-22e481a56cbd#12-高级用法与技巧)
13. [最佳实践](https://claude.ai/chat/1937fb0f-2018-4a39-9135-22e481a56cbd#13-最佳实践)
14. [常见问题](https://claude.ai/chat/1937fb0f-2018-4a39-9135-22e481a56cbd#14-常见问题)
15. [本地 .claude 目录详解 — 全局 vs 项目配置](https://claude.ai/chat/1937fb0f-2018-4a39-9135-22e481a56cbd#15-本地-claude-目录详解--全局-vs-项目配置)

------

## 1. Claude Code 是什么

Claude Code 是 Anthropic 推出的 **智能编程代理工具**（Agentic Coding Tool）。它不是简单的代码补全，而是一个能够理解整个代码库、跨多文件编辑、执行命令并自主迭代的开发助手。

**核心特点：**

- **项目级理解**：读取整个代码库，理解模块间依赖关系
- **自主执行**：根据目标自动规划步骤、编辑文件、运行测试、修复错误
- **多环境支持**：终端 CLI、VS Code、JetBrains、桌面应用、浏览器
- **自然语言驱动**：用自然语言描述目标，Claude Code 负责实现
- **安全可控**：默认需要人工确认后才执行修改操作

**适用人群：** 开发者、产品经理、技术创始人，甚至非技术人员都可以通过描述需求来构建工具。

> Claude Code 本质上是一个运行在你本地终端（Terminal）里的智能体（Agent）。它的核心能力是**读取、分析和修改你本地硬盘上的文件**，以及**执行终端命令**。

------

## 2. 安装与配置

### 2.1 系统要求

- **操作系统**：macOS、Linux、Windows（通过 WSL 或 CMD）
- **Node.js**：需要安装 Node.js 运行环境
- **账户**：Claude Pro / Max 订阅，或 Anthropic API 密钥

### 2.2 安装方式

**方式一：Homebrew（macOS / Linux，推荐）**

```bash
# 稳定版（推荐，跳过有重大回归的版本）
brew install claude-code

# 最新版（第一时间获取新版本）
brew install claude-code@latest
```

> 当你敲下回车后，Homebrew 会在后台全自动完成：去 GitHub 拉取最新代码/二进制文件 -> 自动下载对应的依赖项 -> 自动放到系统统一的执行目录（如 `/opt/homebrew` 或 `/usr/local`） -> **自动帮你配置好环境变量**。
>
> 它的潜台词其实是：**“这是最优雅、最干净、绝对不会弄脏你系统环境变量的傻瓜式一键安装法。”**

**方式二：WinGet（Windows）**

```bash
winget install Anthropic.ClaudeCode
```

> 它的核心使命和 Homebrew 一模一样：**终结 Windows 传统那种“疯狂点击下一步”的图形化安装模式。**

**方式三：npm（Windows）**

```bash
npm install -g @anthropic-ai/claude-code
```

### 2.3 设置 API 密钥

```bash
# 方式一：通过环境变量
set ANTHROPIC_API_KEY="your-api-key-here"

# 方式二：通过cc-switch设置
```

### 2.4 验证安装

```bash
# 查看版本
claude --version

# 启动 Claude Code
claude
```

------

## 3. 快速上手

### 3.1 基本流程

```bash
# 1. 进入项目目录
cd your-project

# 2. 启动 Claude Code
claude

# 3. 用自然语言描述你的需求
> 帮我分析这个项目的架构，列出所有模块的依赖关系

# 4. Claude 会自动扫描代码库、分析结构、给出结果
```

### 3.2 常见使用场景

| 场景     | 示例提示词                                     |
| -------- | ---------------------------------------------- |
| 构建功能 | `"创建一个用户注册的 API 端点，并编写测试"`    |
| 修复 Bug | `"运行时报了这个错误，帮我找到原因并修复"`     |
| 理解代码 | `"解释一下认证系统的工作流程，指出关键文件"`   |
| 重构代码 | `"把这个模块从 JavaScript 迁移到 TypeScript"`  |
| Git 操作 | `"帮我创建一个带有清晰 commit message 的提交"` |
| 测试     | `"运行测试套件，修复失败的测试，直到全部通过"` |

### 3.3 首次使用建议

```bash
# 初始化 CLAUDE.md（项目记忆文件）
> /init

# 查看所有可用命令
> /help

# 清除当前对话（开始新任务前建议执行）
> /clear
```

------

## 4. 核心功能详解

### 4.1 代码库扫描与理解

Claude Code 在开始工作前会搜索目录结构，理解模块之间的关系。它能追踪依赖、理解 import 链条，帮助新成员快速上手项目。

### 4.2 多文件编辑

Claude Code 可以同时创建和编辑多个文件，执行跨文件的大规模重构。例如一次性完成数据库模型修改、API 路由更新和前端组件适配。

### 4.3 命令执行

开发者不需要记住 git、kubectl 等 CLI 工具的复杂命令。描述意图后，Claude Code 会用正确的语法执行对应命令。

### 4.4 自动测试修复循环

当测试失败时，Claude Code 会读取错误信息、修复代码、重新运行测试，循环直到所有测试通过。还能监控 GitHub/GitLab 的 CI 管道并自动提交修复。

### 4.5 权限与安全

Claude Code 提供多层权限控制：

- **默认模式**：每次修改文件或执行命令前都会请求确认
- **自主模式**：内置分类器自动区分安全操作和风险操作
- **跳过权限模式**：`claude --dangerously-skip-permissions`（谨慎使用）

------

## 5. CLAUDE.md — 项目记忆文件

CLAUDE.md 是 Claude Code 最重要的配置文件，相当于项目的"宪法"。每次启动会话时 Claude 都会自动读取。

### 5.1 文件层级

| 位置                   | 作用域 | 说明           |
| ---------------------- | ------ | -------------- |
| `~/.claude/CLAUDE.md`  | 全局   | 应用于所有项目 |
| `项目根目录/CLAUDE.md` | 项目   | 应用于当前项目 |
| `子目录/CLAUDE.md`     | 子目录 | 自动发现并加载 |

### 5.2 推荐内容模板

```markdown
# 项目：my-project

## 构建命令
npm run build

## 代码检查
npm run lint -- --fix

## 测试
npm test

## 编码规范
- 使用 TypeScript 严格模式
- 不使用默认导出（default export）
- Commit 格式：feat/fix/chore(scope): description

## 架构
- 前端：Next.js + TypeScript
- 后端：Node.js + Express
- 数据库：PostgreSQL + Prisma
- 状态管理：Zustand

## 目录结构
- 组件放在 `src/components/`
- 工具函数放在 `src/utils/`
- 测试文件与源文件同目录，使用 `.test.ts` 后缀
```

### 5.3 维护建议

- 对于个人项目，可以让 Claude 自动管理 CLAUDE.md
- 对于团队项目，建议手动维护，保持准确性
- 项目架构变更后及时更新
- 使用 `/init` 命令可以交互式初始化

------

## 6. 斜杠命令（Slash Commands）

在 Claude Code 会话中输入 `/` 即可查看所有可用命令。目前有 **60+ 内置命令** 和 **5 个内置 Skill**。

### 6.1 常用内置命令

| 命令                  | 说明                                |
| --------------------- | ----------------------------------- |
| `/help`               | 查看所有可用命令                    |
| `/clear`              | 清除当前对话历史                    |
| `/compact`            | 压缩对话以节省 token                |
| `/init`               | 初始化 CLAUDE.md 文件               |
| `/branch`             | 分支当前对话到新会话                |
| `/context`            | 查看当前上下文信息                  |
| `/hooks`              | 交互式配置钩子                      |
| `/effort`             | 设置努力级别（`max` 需要 Opus 4.6） |
| `/bug`                | 向 Anthropic 报告 Bug               |
| `/install-github-app` | 安装 GitHub 自动 PR 审查            |
| `/team-onboarding`    | 生成团队入职引导文档                |

### 6.2 自定义命令

创建自定义斜杠命令非常简单：

**项目级命令**（团队共享）：

```bash
mkdir -p .claude/commands

# 创建代码审查命令
cat > .claude/commands/review.md << 'EOF'
审查 $ARGUMENTS 中的代码，关注：
1. 逻辑错误
2. 安全漏洞
3. 缺失的错误处理
不要评论代码风格或命名规范。
EOF
```

**个人命令**（所有项目可用）：

```bash
mkdir -p ~/.claude/commands

# 创建安全检查命令
echo "审查这段代码中的安全漏洞：" > ~/.claude/commands/security.md
```

**使用自定义命令：**

```bash
> /review src/auth/login.ts
> /security
```

> 注意：自定义命令已与 Skills 合并，建议新项目直接使用 Skills。

### 6.3 实战案例：为你的项目创建 3 个高频命令

下面以一个真实的 Web 项目为例，演示如何创建并使用自定义命令。

**场景：** 你有一个 `claude_project` 项目，日常工作中反复做三件事——代码审查、修 Issue、生成 Git 提交信息。与其每次都打一长串自然语言描述，不如把它们固化成斜杠命令。

**第一步：创建命令目录**

```bash
cd claude_project
mkdir -p .claude/commands
```

**第二步：创建三个命令文件**

**命令 1：`/review` — 代码审查（带参数）**

创建 `.claude/commands/review.md`：

```markdown
请仔细审查 $ARGUMENTS 中的代码，只关注以下三类问题：

1. **逻辑错误**：条件判断是否遗漏边界情况、循环是否可能死循环
2. **安全漏洞**：SQL 注入、XSS、硬编码密钥、未校验的用户输入
3. **缺失的错误处理**：没有 try-catch、没有空值检查、没有超时处理

不要评论代码风格、变量命名或格式问题。
审查完毕后，按严重程度（高/中/低）排序列出所有问题。
如果没有发现问题，直接说"未发现明显问题"。
```

> `$ARGUMENTS` 是一个特殊变量，会被你在斜杠命令后面输入的内容替换。

**命令 2：`/fix-issue` — 修复 Issue（带参数）**

创建 `.claude/commands/fix-issue.md`：

```markdown
请修复 Issue #$ARGUMENTS，严格按照以下流程操作：

1. 先用 `gh issue view $ARGUMENTS` 查看 Issue 的完整描述
2. 分析问题根因，确定需要修改的文件
3. 实施修复，确保不引入新的问题
4. 运行相关测试（如果有的话），确认修复有效
5. 用 `git add` 和 `git commit` 提交修改
   - commit 信息格式：fix(模块): 一句话描述修复内容 (#Issue编号)
6. 最后汇报：修改了哪些文件、修复思路是什么
```

**命令 3：`/commit` — 智能提交（无参数）**

创建 `.claude/commands/commit.md`：

```markdown
请帮我提交当前的所有代码修改：

1. 先执行 `git status` 和 `git diff --stat` 查看改了什么
2. 分析所有修改内容，理解这次改动的意图
3. 生成一条符合 Conventional Commits 规范的提交信息：
   - feat: 新功能
   - fix: 修复 bug
   - docs: 文档变更
   - refactor: 重构
   - chore: 杂项
   - 格式示例：feat(auth): 添加邮箱格式校验
4. 执行 `git add -A` 然后 `git commit -m "生成的信息"`
5. 告诉我提交成功的 commit hash
```

**创建完成后的目录结构：**

```
claude_project/
├── .claude/
│   └── commands/
│       ├── review.md       ← /review 命令
│       ├── fix-issue.md    ← /fix-issue 命令
│       └── commit.md       ← /commit 命令
└── import.html
```

**第三步：使用命令**

重启 Claude Code（`/exit` → `claude`），然后直接使用：

```bash
# ——— 代码审查 ———
> /review src/auth/login.ts
# Claude 会严格按照三类问题（逻辑、安全、错误处理）审查该文件

> /review import.html
# 也可以审查你项目里的任何文件

# ——— 修复 Issue ———
> /fix-issue 7
# Claude 会自动：查看 Issue #7 → 分析 → 修改代码 → 提交
# $ARGUMENTS 被替换为 "7"

# ——— 智能提交 ———
> /commit
# Claude 会自动：分析改动 → 生成 commit 信息 → 提交
# 这个命令不需要参数
```

**效果对比：**

| | 不用命令 | 用了自定义命令 |
|---|---|---|
| 代码审查 | 每次要打 50+ 字描述审查要求 | `/review 文件名` 一句搞定 |
| 修 Issue | 要详细描述 Issue 内容和修复流程 | `/fix-issue 编号` 一步到位 |
| 提交代码 | 要告诉 Claude 用什么格式写 commit | `/commit` 无脑执行 |
| 一致性 | 每次描述不同，质量不稳定 | 每次都按固定流程执行 |

> **命令 vs Skill 怎么选？** 命令适合"你主动触发"的场景（`/命令名`）；Skill 适合"Claude 自动识别"的场景（你用自然语言描述需求，Claude 自动匹配对应 Skill）。如果你希望说"帮我审查一下代码"时 Claude 自动加载审查规则，就用 Skill。如果你只想要一个快捷入口，用命令更简单。

------

## 7. Skills — 技能系统

Skills 是比斜杠命令更强大的扩展机制。与命令不同，Skills 可以被 Claude **自动识别和调用**。

### 7.1 与斜杠命令的区别

| 特性     | 斜杠命令            | Skills                     |
| -------- | ------------------- | -------------------------- |
| 触发方式 | 手动输入 `/命令名`  | 手动 + 自动识别            |
| 文件结构 | 单个 .md 文件       | 目录 + SKILL.md + 辅助文件 |
| 复杂度   | 简单提示词          | 完整工作流                 |
| 位置     | `.claude/commands/` | `.claude/skills/`          |

### 7.2 创建 Skill

```bash
mkdir -p .claude/skills/explain-code
```

创建 `.claude/skills/explain-code/SKILL.md`：

```markdown
---
name: explain-code
description: 当用户询问代码工作原理、逻辑，或要求解释代码时自动启用此技能。
---

解释代码时，请严格并始终包含以下四个部分：

1. **类比开场**：将代码比作日常生活中的事物，通俗易懂地开场。
2. **绘制图表**：使用纯 ASCII 字符画图，展示流程和关系。
3. **逐步讲解**：分步骤解释每一段核心逻辑发生了什么。
4. **指出陷阱**：列出这段代码常见的误解或潜在错误。
```

### 7.3 Skill 的自动调用

SKILL.md 中的 `description` 字段决定了 Claude 何时自动加载该 Skill。Claude 会根据对话内容判断是否匹配。描述的前 250 个字符最为关键，建议把核心用途放在最前面。

### 7.4 Skill 上下文管理

- Claude 在首次调用 Skill 后不会重新读取文件，因此要把持续有效的指令写成"常驻规则"
- 对话压缩（compaction）时，最近调用的 Skill 会被保留（每个最多 5000 token）
- 多个 Skill 共享 25,000 token 的总预算

### 7.5 实战案例：以 claude_project 项目为例

下面以一个真实项目 `claude_project` 来演示 Skill 的完整创建和使用过程。

**项目结构**（创建 Skill 之前）：

```
claude_project/
├── .claude/          ← Claude Code 自动生成的项目级配置目录
└── import.html       ← 项目文件
```

**第一步：创建 Skill 目录和文件**

在项目根目录下执行：

```bash
cd claude_project
mkdir -p .claude/skills/explain-code
```

然后创建 `.claude/skills/explain-code/SKILL.md`，内容如下：

```markdown
---
name: explain-code
description: >
  解释代码的工作原理。当用户询问"这是怎么工作的"
  或需要理解代码逻辑时自动启用。
---

解释代码时，请始终包含：

1. **类比开场**：将代码比作日常生活中的事物
2. **绘制图表**：使用 ASCII 图展示流程和关系
3. **逐步讲解**：解释每一步发生了什么
4. **指出陷阱**：常见的误解或错误是什么？
```

**创建后的项目结构：**

```
claude_project/
├── .claude/
│   └── skills/
│       └── explain-code/
│           └── SKILL.md      ← 1 KB，Markdown File
└── import.html
```

**第二步：使用 Skill**

在项目目录启动 Claude Code 后，有两种触发方式：

```bash
# 方式一：手动调用（斜杠命令）
> /explain-code

# 方式二：自然语言触发（自动识别）
> 我需要理解 import.html 里面的 pollStatus 轮询代码逻辑。
```

当你用方式二提问时，Claude 会自动匹配 `description` 中的关键词（"解释代码"、"怎么工作的"），自动加载这个 Skill，然后按照四步格式（类比→图表→讲解→陷阱）来回答。

**第三步：验证 Skill 是否生效**

如果 Skill 生效，Claude 的回答会严格包含四个部分。例如对 `import.html` 的解释可能是：

```
1. 📦 类比开场：
   这个 HTML 文件就像一个"收货仓库"——它接收外部数据，
   拆包检查，然后分类存放到对应的位置……

2. 📊 流程图表：
   ┌──────────┐    ┌──────────┐    ┌──────────┐
   │ 用户上传  │ ──→│ 解析数据  │ ──→│ 导入系统  │
   └──────────┘    └──────────┘    └──────────┘

3. 🔍 逐步讲解：
   第1步：页面加载时初始化文件输入控件……
   第2步：用户选择文件后触发 onchange 事件……
   ……

4. ⚠️ 常见陷阱：
   - 没有校验文件格式就直接导入，可能导致……
   - 大文件未做分片处理，浏览器可能卡死……
```

> **关键区别**：如果没有这个 Skill，Claude 可能只会平铺直叙地解释代码。有了 Skill，回答会被强制规范为四段式结构，每次都一致、清晰。

### 7.6 实战案例：操作 GitHub 远程代码的 Skill

这个案例展示如何创建一个 Skill，实现"一句话完成 commit + push + 创建 PR"的完整 GitHub 工作流。

**前提条件：**

- 已安装 GitHub CLI（`gh`）并完成认证：`gh auth login`
- 项目已关联 GitHub 远程仓库

**初始化并关联远程仓库**

为了让后续的 PR（Pull Request）能成功创建，我们需要先在主分支（main）上推送一个初始记录打底：

```bash
# 1. 初始化本地 Git 仓库
git init

# 2. 将默认分支名改为 main
git branch -M main

# 3. 关联你的远程 GitHub 仓库
git remote add origin https://github.com/2019hzk/claude_git_skill_demo.git

# 4. 随便建一个文件并做首次提交（作为基准分支）
echo "# Claude Git Skill Demo" > README.md
git add README.md
git commit -m "chore: 初始提交"

# 5. 推送到远程 main 分支
git push -u origin main
```



**第一步：创建 Skill 目录**

```bash
mkdir -p .claude/skills/git-ship
```

**第二步：创建 `.claude/skills/git-ship/SKILL.md`**

```markdown
---
name: git-ship
description: >
  将当前修改提交并推送到 GitHub 远程仓库，自动创建 Pull Request。
  当用户说"提交代码"、"推送到GitHub"、"创建PR"、"ship it"时触发。
---

# Git Ship — 一键提交推送并创建 PR

执行以下步骤，任何一步失败都停   下来报告错误，不要继续：

## 步骤 1：检查环境
- 运行 `gh auth status` 确认 GitHub CLI 已认证
- 运行 `git status` 检查是否有未提交的修改
- 如果没有修改，告诉用户"没有需要提交的内容"并停止

## 步骤 2：暂存与提交
- 运行 `git add -A` 暂存所有修改
- 分析 `git diff --cached --stat` 的输出，理解修改了哪些文件
- 根据修改内容生成符合 Conventional Commits 规范的提交信息：
  - feat: 新功能
  - fix: 修复 bug
  - docs: 文档变更
  - refactor: 重构
  - chore: 杂项
- 提交格式示例：`feat(auth): 添加用户登录的邮箱验证`
- 执行 `git commit -m "生成的提交信息"`

## 步骤 3：推送到远程
- 获取当前分支名：`git branch --show-current`
- 如果是 main 或 master 分支，**警告用户**并询问是否要先创建新分支
- 推送：`git push origin <当前分支名>`
- 如果远程没有该分支，使用 `git push -u origin <当前分支名>`

## 步骤 4：创建 Pull Request
- 使用 `gh pr create` 创建 PR
- PR 标题 = commit 信息
- PR 描述自动生成，包含：
  - **变更摘要**：一句话概括
  - **修改列表**：列出所有变更的文件和修改内容
  - **测试说明**：建议的测试方式
- 目标分支默认为 main

## 安全规则
- **绝对不要** force push（`--force`）
- **绝对不要** 直接推送到 main/master（除非用户明确要求）
- 发现 .env、密钥文件、token 等敏感文件时**立即停止**并警告
```

**第三步：使用方式**

```bash
# 启动 Claude Code
cd your-project
claude

# 手动调用
> /git-ship

# 或自然语言触发
> 帮我把改的东西提交推送到 GitHub，顺便开个 PR
```

**实际执行效果示例：**

```
🔍 检查环境...
✅ GitHub CLI 已认证（用户：your-username）
✅ 发现 3 个修改文件

📦 分析修改内容...
   modified:  src/auth/login.ts     (+42, -8)
   modified:  src/auth/login.test.ts (+28, -0)
   new file:  src/utils/validate.ts  (+15, -0)

📝 生成提交信息：feat(auth): 添加登录时的邮箱格式校验

🚀 推送到远程 origin/feature/email-validation...
✅ 推送成功

📋 创建 Pull Request...
✅ PR #23 已创建：feat(auth): 添加登录时的邮箱格式校验
   链接：https://github.com/your-org/your-project/pull/23
```

> **提示**：这个 Skill 结合了 Claude Code 的终端命令执行能力和 GitHub CLI，不需要额外安装 MCP 服务器。如果你需要更高级的 GitHub 操作（如管理 Issue、审查 PR、触发 Actions），请看下面的 github-ops Skill。

### 7.7 实战案例：全面操作 GitHub 远程代码的 Skill

上面的 `git-ship` 只解决了"提交推送创建 PR"这一个场景。如果你需要用自然语言**全面操控 GitHub 远程仓库**（Issue 管理、PR 审查、Actions 监控、Release 发布等），可以创建一个更完整的 Skill。

**前提条件（同上）：**

1. 安装 GitHub CLI：`winget install GitHub.cli`（Windows）或 `brew install gh`（macOS）
2. 登录认证：`gh auth login`
3. 当前项目已关联 GitHub 远程仓库

**创建 Skill：**

```bash
mkdir -p .claude/skills/github-ops
```

写入 `.claude/skills/github-ops/SKILL.md`：

```markdown
---
name: github-ops
description: >
  全面管理 GitHub 远程仓库。当用户要求操作 Issue、PR、
  Actions、Release，或提到"GitHub"、"远程仓库"、"Issue"、
  "Pull Request"、"合并"、"CI"等关键词时自动启用。
---

# GitHub 远程仓库操作技能

使用 GitHub CLI（gh）执行所有操作。
涉及写操作（创建、合并、删除）时，必须先向用户确认。

## Issue 管理

- 创建 Issue：`gh issue create --title "标题" --body "描述"`
- 列出未关闭的 Issue：`gh issue list`
- 查看某个 Issue 详情：`gh issue view <编号>`
- 关闭 Issue：`gh issue close <编号>`（⚠️ 需确认）
- 重新打开：`gh issue reopen <编号>`
- 添加标签：`gh issue edit <编号> --add-label "bug,urgent"`
- 分配负责人：`gh issue edit <编号> --add-assignee "@me"`
- 搜索 Issue：`gh issue list --search "关键词"`

## Pull Request 管理

- 创建 PR：`gh pr create --title "标题" --body "描述" --base main`
- 列出所有 PR：`gh pr list`
- 查看 PR 的代码变更：`gh pr diff <编号>`
- 查看 PR 详情：`gh pr view <编号>`
- 合并 PR：`gh pr merge <编号> --merge`（⚠️ 需二次确认）
- 审查并批准：`gh pr review <编号> --approve`（⚠️ 需确认）
- 请求修改：`gh pr review <编号> --request-changes --body "原因"`
- 在 PR 上留言：`gh pr comment <编号> --body "评论内容"`

## GitHub Actions（CI/CD）

- 查看最近的工作流运行：`gh run list`
- 查看某次运行的详情：`gh run view <run-id>`
- 查看运行日志：`gh run view <run-id> --log`
- 手动触发工作流：`gh workflow run <workflow-name>`
- 重新运行失败的任务：`gh run rerun <run-id> --failed`
- 列出所有工作流：`gh workflow list`

## Release 管理

- 创建 Release：`gh release create <tag> --title "标题" --notes "说明"`
- 列出所有 Release：`gh release list`
- 下载 Release 附件：`gh release download <tag>`
- 删除 Release：`gh release delete <tag>`（⚠️ 需确认）

## 仓库信息

- 查看仓库概览：`gh repo view`
- 在浏览器中打开仓库：`gh repo view --web`
- 克隆仓库：`gh repo clone <owner/repo>`
- Fork 仓库：`gh repo fork <owner/repo>`

## 安全规则（必须严格遵守）

1. 所有**写操作**执行前必须向用户确认，明确说出即将执行的命令
2. **绝不**自动合并到 main/master 分支，必须等用户明确同意
3. **绝不**执行 force push（`--force`）
4. 发现 .env、密钥、token 等敏感文件时**立即停止**并警告
5. 操作完成后报告结果，附上可点击的 GitHub 链接
6. 遇到权限不足时，提示用户运行 `gh auth status` 检查认证状态
```

**创建后的完整目录结构：**

```
claude_project/
├── .claude/
│   └── skills/
│       ├── explain-code/       ← 代码解释技能
│       │   └── SKILL.md
│       ├── git-ship/           ← 一键提交推送 PR
│       │   └── SKILL.md
│       └── github-ops/         ← 全面 GitHub 远程操作
│           └── SKILL.md
└── import.html
```

**使用示例：**

```bash
cd claude_project
claude

# ——— Issue 操作 ———
> 帮我创建一个 Issue，标题是"修复登录页面样式问题"，加上 bug 标签
# Claude → gh issue create --title "修复登录页面样式问题" --label "bug"

> 列出所有还没关闭的 Issue
# Claude → gh issue list --state open

> 把 #7 这个 Issue 分配给我
# Claude → gh issue edit 7 --add-assignee "@me"

# ——— PR 操作 ———
> 看看 #15 这个 PR 改了什么
# Claude → gh pr diff 15 → 然后用自然语言总结变更内容

> 帮我批准 #15 这个 PR
# Claude → （先确认）→ gh pr review 15 --approve

> 把 #15 合并了
# Claude → （二次确认）→ gh pr merge 15 --merge


# ——— Release 操作 ———
> 帮我发一个 v1.2.0 的 Release，把最近的更新写到说明里
# Claude → 分析 git log → gh release create v1.2.0 --title "v1.2.0" --notes "..."
```

**更进一步 —— 在 GitHub 网页上直接 @claude：**

除了本地 Skill，你还可以安装 Claude Code GitHub App，让 Claude **直接在 GitHub 网页上**响应 Issue 和 PR 评论：

```bash
# 在 Claude Code 终端中一键安装
> /install-github-app
```

安装后效果：在 GitHub 的 Issue 或 PR 评论中写 `@claude 帮我审查这个 PR 的安全性`，Claude 就会自动分析代码并在 GitHub 上发布审查评论。

------

## 8. Hooks — 事件钩子

Hooks 的本质是：给 Claude 安排"自动保洁员"。你可以把 Claude 想象成一个跑腿员工，而 Hooks 就是你在它必经之路上设置的"触发器"——它每次干完活（写完代码），触发器就自动启动，替你打扫战场。

### 8.1 五大生命周期"检查站"

Claude Code 的 Hook 系统共有 5 个触发时机。在终端中输入 `/hooks` 可以查看当前配置状态：

| 事件 | 触发时机 | 用途举例 |
|------|---------|---------|
| `PreToolUse` | Claude **调用工具之前** | 安全锁：拦截 `rm -rf`、`DROP TABLE` 等高危命令 |
| `PostToolUse` | Claude **调用工具之后** | 善后员：自动格式化刚写好的代码 |
| `PostToolUseFailure` | Claude **执行命令失败时** | 救场员：编译失败时自动保存报错日志 |
| `Notification` | Claude **发送系统通知时** | 传话筒：长任务完成后弹出桌面通知 |
| `UserPromptSubmit` | **你敲回车后**，消息发给模型之前 | 隐形外挂：自动把当前 git 分支名拼到你的提问里 |

> `/hooks` 菜单是只读的。要添加或修改 Hook，需要直接编辑 `settings.json` 文件。

### 8.2 配置方式

**方式一：交互式查看**

```bash
> /hooks
# 会显示当前配置的 Hook 数量，例如 "1 hooks configured"
```

**方式二：编辑 settings.json（核心方式）**

Hook 配置写在项目的 `.claude/settings.json` 或全局的 `~/.claude/settings.json` 中：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write(*.py)",
        "hooks": [
          {
            "type": "command",
            "command": "python -m black \"$file\""
          }
        ]
      },
      {
        "matcher": "Write(*.ts)",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$file\""
          }
        ]
      }
    ]
  }
}
```

**逐层拆解这段配置：**

- `"PostToolUse"` — 触发时机：Claude 干完活之后
- `"matcher": "Write(*.py)"` — 触发雷达：只要 Claude 写入了 `.py` 文件就出动
- `"command": "python -m black \"$file\""` — 具体动作：调用 Black 格式化工具，`$file` 会被自动替换为刚写好的文件名
- 第二条规则同理，针对 `.ts` 文件使用 Prettier 格式化

### 8.3 实战案例：Python 代码自动格式化

下面用一个完整的实战流程演示 Hook 的部署和测试。

**前提条件：安装 Black**

Claude Code 本身不内置任何格式化工具。Hook 的 `command` 字段会被原封不动地扔给你的系统终端执行。所以你必须先安装 Black：

```bash
pip install black
```

> 如果你不装 Black，Hook 执行时会报错 `No module named black`，代码格式化就直接中断了。如果你想用其他工具（如 `autopep8` 或 `yapf`），需要同步修改 `command` 字段。

**第一步：创建配置文件**

在项目目录下创建 `.claude/settings.json`：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write(*.py)",
        "hooks": [
          {
            "type": "command",
            "command": "python -m black \"$file\""
          }
        ]
      }
    ]
  }
}
```

> ⚠️ **文件名必须是 `settings.json`（带 s）**，不是 `setting.json`。差一个字母 Claude 就会完全忽略它。

**第二步：重启 Claude Code 并验证**

```bash
# 必须先退出再重新进入，Claude 才会重新读取配置
> /exit
claude

# 验证 Hook 是否加载成功
> /hooks
# 应该显示 "1 hooks configured"（而不是 0）
```

> 如果显示 0，说明 JSON 格式有误（少逗号、多逗号、用了中文引号等）。JSON 对格式要求极其严格，建议直接复制上面的纯净版配置。

**第三步：测试——让 Claude 写一段"故意很乱"的代码**

```bash
> 帮我写一个 test_hook.py，里面写一个斐波那契数列函数。
  要求：语法必须正确能运行，但排版请故意写得很丑
  （缩进用2个空格，等号两边不加空格，多加几个空行）
```

**观察执行流程：**

```
Claude 写入文件...
📝 Write test_hook.py
   （此时终端显示的代码可能还是乱的——这只是"作案现场快照"）

🔧 Running PostToolUse hook...
   reformatted test_hook.py
   （Black 在后台瞬间完成格式化）
```

**第四步：验证结果**

不要只看终端输出！终端显示的是 Claude 写入那一瞬间的快照。请直接用编辑器打开 `test_hook.py`，查看真实文件内容——它应该已经被 Black 整理成了教科书级的完美排版。

### 8.4 踩坑排查指南

| 现象 | 原因 | 解决办法 |
|------|------|---------|
| `/hooks` 显示 0 | 文件名是 `setting.json`（缺少 s） | 改名为 `settings.json` |
| `/hooks` 显示 0 | JSON 语法错误（多/少逗号、中文引号） | 复制上面的纯净版配置 |
| Hook 加载了但代码没变 | 没安装 Black | 执行 `pip install black` |
| Hook 加载了但代码没变 | 代码有致命语法错误（如 Python 缩进完全丢失） | Black 只能格式化"能解析"的代码，无法修复语法错误 |
| 终端看到乱代码 | 你看到的是写入瞬间的快照 | 直接用编辑器打开真实文件查看 |
| `matcher` 匹配不上 | Windows 路径格式问题 | 把 matcher 改为 `"*"` 进行暴力匹配测试 |

> **Black 是"保洁员"，不是"急救医生"**：它能把"长得丑但能跑"的代码排版漂亮，但如果代码有致命语法错误（比如 Python 缩进完全丢失），Black 会直接报错 `Cannot parse`，拒绝处理。所以测试时要确保代码语法正确、只是排版丑。

### 8.5 暴力排查模式

如果正常配置始终不生效，可以用这个"宁可错杀一千"的极端配置来排查：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "python -m black test_hook.py"
          }
        ]
      }
    ]
  }
}
```

这里做了两个简化：把 matcher 改成 `*`（任何工具操作都触发），把 `$file` 直接写死为 `test_hook.py`（排除变量解析问题）。如果这个配置能生效，就说明之前的问题出在 matcher 匹配规则或 `$file` 变量解析上。

------

## 9. MCP — 外部工具集成

MCP（Model Context Protocol，模型上下文协议）是 Claude Code 最硬核的能力之一。它给 Claude 装上了真正的"手"和"眼睛"——让原本只能读写本地文件的 AI，可以去控制浏览器、查数据库、调用外部 API。

### 9.1 核心概念

可以把 MCP 理解为 Claude Code 的"万能适配器"：

```
Claude Code ──→ MCP 协议 ──→ Playwright（浏览器自动化）
                          ──→ GitHub（PR/Issue 管理）
                          ──→ Supabase（数据库操作）
                          ──→ 任何支持 MCP 的工具...
```

安装一个 MCP 服务器后，Claude 就能自动使用该工具的所有功能，你甚至不需要手动调用命令——用自然语言描述需求即可。

### 9.2 添加 MCP 服务器

在系统终端（不是 `claude >` 提示符下）执行安装命令：

```bash
# 添加 Playwright（浏览器自动化，最容易测试）
claude mcp add playwright npx -y @playwright/mcp@latest
```

### 9.3 验证安装

安装完成后，进入 Claude Code 并检查：

```bash
claude
> /mcp
```

如果能在列表里看到 `/mcp__playwright__...` 开头的命令，说明挂载成功。

### 9.4 实战案例：用 Playwright 控制浏览器

这是最容易验证 MCP 是否生效的测试——让 Claude 自己打开浏览器、抓取网页内容、截图保存。

**前提条件：** 电脑已安装 Node.js（因为 `npx` 是 Node.js 的包运行工具）。

**第一步：安装 MCP 服务器**

```bash
# 在系统终端中执行（不是 claude > 提示符下）
claude mcp add playwright npx -y @playwright/mcp@latest
```

**第二步：验证挂载**

```bash
claude
> /mcp
# 看到 mcp__playwright__ 开头的命令 = 成功
```

**第三步：用自然语言指挥 Claude 操控浏览器**

你完全不需要手动输入那些 `/mcp__xxx` 命令。MCP 的精髓在于 Claude 会自动挑选工具：

```bash
> 请使用 Playwright 工具帮我打开 https://code.claude.com/docs/en/quickstart这个网站。
  帮我读取网页的主标题（h1）是什么，然后截个图保存在当前目录下，
  名字叫 abc.png。
```

**观察执行流（见证奇迹的时刻）：**

```
🔧 Tool Use: mcp__playwright__navigate
   → 打开 https://example.com

🔧 Tool Use: mcp__playwright__evaluate
   → 抓取网页 h1 标签内容

🔧 Tool Use: mcp__playwright__screenshot
   → 保存截图到 example_screenshot.png

✅ 任务完成！
   网页主标题是 "Example Domain"
   截图已保存到 ./example_screenshot.png
```

> 看着命令行里的 AI 真的跑去控制浏览器截图，那种感觉非常像在指挥一个真实的赛博员工。

### 9.5 Windows 环境踩坑：`CLAUDE_CODE_GIT_BASH_PATH`

在 Windows 上安装 MCP 后，可能出现 `/mcp` 显示 `No MCP servers configured` 的情况。这通常是因为 Claude Code 找不到 `bash.exe` 来启动 MCP 服务器进程。

**永久解决方案（推荐）：**

打开 PowerShell，执行：

```powershell
[System.Environment]::SetEnvironmentVariable(
  'CLAUDE_CODE_GIT_BASH_PATH',
  'D:\你的Git安装路径\usr\bin\bash.exe',
  'User'
)
```

> 执行完后必须关掉所有终端窗口，重新打开才能生效。

**临时解决方案：**

在当前终端中执行：

```bash
export CLAUDE_CODE_GIT_BASH_PATH="D:\你的Git安装路径\usr\bin\bash.exe"
```

然后重新输入 `claude` 唤醒。

### 9.6 常用 MCP 服务器

| 服务器 | 安装命令 | 功能 |
|--------|---------|------|
| Playwright | `claude mcp add playwright npx -y @playwright/mcp@latest` | 浏览器自动化、截图、DOM 操作 |
| GitHub | 通过 `/install-github-app` 安装 | PR 管理、Issue 操作、代码审查 |
| Supabase | `claude mcp add --transport stdio supabase ...` | 数据库操作 |
| Airtable | `claude mcp add --transport stdio airtable ...` | 数据表管理 |

### 9.7 排坑指南

| 现象 | 原因 | 解决办法 |
|------|------|---------|
| 安装时报错 | 没装 Node.js | 安装 Node.js（`npx` 依赖它） |
| 安装时超时 | 国内网络拉取 npm 包慢 | 挂代理或切换淘宝镜像源 |
| `/mcp` 显示空列表 | Windows 找不到 bash.exe | 设置 `CLAUDE_CODE_GIT_BASH_PATH` 环境变量 |
| 提示成功但工具不可用 | 安装成功但服务器没启动 | 退出 Claude 重新进入 |

------

## 10. Subagents — 子代理

创建子代理，本质上就是在项目里"雇佣"一批拥有特定专业技能、且严格遵守你设定规范的虚拟员工。主 Claude 负责理解你的意图和分发任务，子代理在独立的上下文窗口中干脏活累活，干完只把结论汇报回来。

### 10.1 为什么需要子代理？——"上下文污染"问题

假设你正在让主 Claude 帮你写一个复杂的 React 页面，你们已经聊了 20 轮，它的脑子里装满了组件状态和 CSS 样式。这时候你突然让它去分析一个几百行的复杂 SQL 语句：

**不用子代理的后果：** 主 Claude 为了塞下 SQL 知识，可能会把之前记住的 React 组件细节给"挤出"上下文窗口。等你再让它改前端，它就懵了——它忘了之前的组件结构。

**用了子代理的好处：** 主 Claude 像大老板一样，在后台开一个完全独立的、干净的新上下文，把 SQL 任务扔给【数据库专家】处理。专家处理完，只把结论汇报给主 Claude。主 Claude 脑子里的 React 代码完好无损。

```
你 ──→ 主 Claude（协调员）
              │
              ├──→ 数据库专家（独立上下文，分析 SQL）──→ 只返回结论
              ├──→ 安全审计员（独立上下文，扫描漏洞）──→ 只返回结论
              └──→ 测试专家（独立上下文，写测试用例）──→ 只返回结论
```

### 10.2 创建子代理

在 `.claude/agents/` 目录中创建 Markdown 文件。文件名就是代理的代号。

**项目级代理**（团队共享，提交到 Git）：

```bash
mkdir -p .claude/agents
```

**个人代理**（所有项目可用）：

```bash
mkdir -p ~/.claude/agents
```

### 10.3 实战案例：数据库专家代理

**创建文件 `.claude/agents/db-expert.md`：**

```markdown
---
name: db-expert
description: 专注于数据库查询优化、架构设计和性能调优的专家代理。
---

# 数据库专家代理

你是一个专注于数据库的专家代理。

## 专业领域
- 查询优化和性能调优
- Schema 设计与规范化
- 索引策略分析
- 迁移规划与执行
- 安全和访问控制

## 可用工具
- 数据库查询执行（通过 MCP 或终端命令）
- 性能分析工具
- Schema 对比工具

## 回复格式
始终严格按照以下四个部分进行汇报：
1. **分析摘要**：一句话概括问题根因
2. **具体建议**：给出明确的技术方案
3. **实施步骤**：提供可直接执行的 SQL 语句或命令
4. **性能影响评估**：优化后的预期效果和潜在风险
```

**测试——派发任务：**

重启 Claude Code（`/exit` 然后 `claude`），让它重新加载代理配置，然后输入：

```bash
> 请帮我呼叫数据库专家代理。我有一张 MySQL 的 orders 表，
  里面有 5000 万条数据。前端每次用 user_id 和 status 组合
  查询用户的历史订单，都要卡 5 秒以上。请给我优化方案。
```

**观察回复结构——如果代理配置成功，回答会严格遵循四部分格式：**

```
1. 分析摘要
   → 全表扫描导致，user_id + status 没有联合索引

2. 具体建议
   → 建立联合索引 (user_id, status)
   → 考虑将 status 改为 tinyint 减少存储开销

3. 实施步骤
   → ALTER TABLE orders ADD INDEX idx_user_status (user_id, status);
   → 建议在业务低峰期执行，使用 pt-online-schema-change 避免锁表

4. 性能影响评估
   → 查询时间预计从 5s 降至 50ms 以内
   → 索引额外占用约 400MB 存储空间
   → 对 INSERT 性能有约 5% 的轻微影响
```

> **关键区别**：没有子代理时，Claude 会自由发挥，格式不固定。有了子代理，它的回复被强制规范为你设定的四段式结构，每次都一致、严谨。

### 10.4 实战案例：安全审计代理

**创建文件 `.claude/agents/security.md`：**

```markdown
---
name: security
description: 专注于代码安全审计和漏洞扫描的专家代理。
tools: ["Read", "Grep", "Glob"]
model: haiku
---

# 安全审计代理

你是一个专注于应用安全分析和漏洞评估的专家。

## 审计范围
- SQL 注入检测
- XSS 跨站脚本攻击
- 敏感信息泄露（API 密钥、密码硬编码）
- 不安全的依赖库
- 权限和认证漏洞

## 回复格式
1. 风险等级（高/中/低）
2. 漏洞描述
3. 受影响的文件和代码行
4. 修复建议和代码示例
```

注意两个高级配置项：

- `tools: ["Read", "Grep", "Glob"]` — 限制代理只能读取和搜索代码，不能写入或执行命令。安全审计员不需要写文件的权限。
- `model: haiku` — 使用更轻量、更便宜的 Haiku 模型。只读分析任务不需要 Opus 级别的重型模型，省钱又快。

**测试：**

```bash
> 请安全审计代理帮我扫描一下 src/ 目录下所有的代码，
  看看有没有硬编码的 API 密钥或者 SQL 注入风险。
```

### 10.5 子代理的工作原理

当主 Claude 调用子代理时，底层发生的事情是：

1. 主 Claude **开辟一个全新的独立上下文窗口**（子代理的"工位"）
2. 把你的问题 + 子代理的 Markdown 指令一起塞进去
3. 子代理在隔离环境中独立工作，**不会污染主会话的上下文**
4. 工作完成后，子代理**压缩结论**并汇报给主 Claude
5. 主 Claude 把结论转述给你

这就是"主代理解析意图，子代理干脏活累活"的架构模式。

### 10.6 代理选型指南

| 场景 | 推荐代理 | 工具权限 | 模型建议 |
|------|---------|---------|---------|
| 数据库优化 | db-expert | Read, Bash | Sonnet |
| 安全审计 | security | Read, Grep, Glob | Haiku |
| 代码审查 | code-review | Read, Grep | Haiku |
| 测试用例编写 | test-writer | Read, Write, Bash | Sonnet |
| 文档生成 | doc-writer | Read, Write | Sonnet |
| 前端 UI 设计 | ui-designer | Read, Write | Opus |

------

## 11. 多环境使用

### 11.1 终端 CLI

最完整的功能体验，适合专业开发者：

```bash
cd your-project
claude
```

### 11.2 VS Code 扩展

在扩展市场搜索 "Claude Code" 安装，提供：

- 内联 diff 显示
- `@` 提及文件
- 计划审查
- 对话历史

安装后按 `Cmd+Shift+P`（Mac）或 `Ctrl+Shift+P`（Windows/Linux），输入 "Claude Code" 即可开始。

### 11.3 JetBrains 插件

在 JetBrains 插件市场搜索 "Claude Code" 安装。

### 11.4 桌面应用

从官网下载独立桌面应用，支持：

- 可视化 diff 审查
- 多会话并行
- 定时任务调度
- 云端会话

### 11.5 Web 版

访问 [claude.ai/code](https://claude.ai/code)，无需本地安装：

- 适合长时间运行的任务
- 操作不在本地的代码仓库
- 多任务并行



------

## 12. 最佳实践

### 12.1 日常工作流

1. **频繁清除对话**：开始新任务前执行 `/clear`，避免无关上下文消耗 token
2. **维护 CLAUDE.md**：保持项目上下文的准确和精简
3. **善用 Skills**：为重复性工作流创建 Skill，比每次重新描述高效得多

### 13.2 提示词技巧

| 技巧     | 示例                                             |
| -------- | ------------------------------------------------ |
| 明确目标 | ✅ "创建用户注册 API，包含邮箱验证和速率限制"     |
| 避免模糊 | ❌ "帮我改改这个代码"                             |
| 指定约束 | ✅ "使用现有的 Express 路由风格，不要引入新依赖"  |
| 分步执行 | ✅ "首先分析当前架构，然后提出重构方案，最后执行" |

### 12.3 团队协作

- 在 `.claude/` 目录中共享命令、Skills 和 Hooks 配置
- 将 CLAUDE.md 纳入版本控制
- 统一 Hooks 配置确保代码质量

### 13.4 安全建议

- 生产环境建议使用默认的权限确认模式
- 定期审查 MCP 服务器的访问权限
- 不要在 CLAUDE.md 中存放敏感信息（API 密钥等）
- 使用 `--allowedTools` 限制可用工具范围

------

## 13. 常见问题

### Q: Claude Code 和代码补全工具（如 Copilot）有什么区别？

代码补全工具在你打字时建议下一行代码。Claude Code 在**项目层面**工作——它理解整个代码库，跨多文件规划和执行修改，并能自主运行测试和修复错误。

### Q: 如何更新 Claude Code？

```bash
# Homebrew
brew upgrade claude-code

# WinGet
winget upgrade Anthropic.ClaudeCode

# 查看当前版本
claude --version
```



### Q: 如何减少 token 消耗？

- 开始新任务前使用 `/clear`
- 使用 `/compact` 压缩长对话
- 保持 CLAUDE.md 精简
- 避免在上下文中加载不相关的文件

### Q: 如何把本地项目关联到 GitHub 远程仓库？

这是使用 `github-ops` 和 `git-ship` 等 Skill 的前提条件。分两种情况：

**情况一：GitHub 上还没有仓库（推荐，最简单）**

```bash
cd your-project
git init
git add .
git commit -m "feat: 初始提交"

# 用 gh 一键创建仓库并推送（需要先 gh auth login）
gh repo create your-project --public --source=. --remote=origin --push
```

**情况二：已在 GitHub 网页上创建了仓库（带 README/.gitignore）**

```bash
cd your-project
git init
git branch -M main
git remote add origin https://github.com/你的用户名/仓库名.git

# 关键步骤：先拉取云端的 README 等文件
git pull origin main
# 如果报错 "refusing to merge unrelated histories"，改用：
# git pull origin main --allow-unrelated-histories

# 然后提交本地文件并推送
git add .
git commit -m "feat: 首次推送本地项目"
git push -u origin main
```

> ⚠️ 注意分支名：旧版 Git 默认分支叫 `master`，GitHub 默认叫 `main`。如果 `git push -u origin main` 报错 `src refspec main does not match any`，说明你本地分支还叫 `master`，先执行 `git branch -M main` 改名。

### Q: 如何报告 Bug？

在 Claude Code 会话中使用 `/bug` 命令，或在 GitHub 仓库提交 Issue。

------

## 14. 本地 .claude 目录详解 — 全局 vs 项目配置

安装 Claude Code 后，系统中实际存在**两个** `.claude` 目录。理解它们的区别和协作关系，是用好 Claude Code 的关键。

### 14.1 全局目录

这是你的**个人全局配置中心**，所有项目共享。以我个人实际目录为例：

```
C:\Users\Administrator\.claude\
│
├── CLAUDE.md            ← 全局记忆文件（2 KB）
│                          所有项目通用的编码规范和个人偏好
│                          例如："我习惯用中文注释"、"永远用 TypeScript"
│
├── settings.json        ← 全局设置（1 KB）
│                          个人默认模型、全局权限规则、环境变量
│                          例如：{ "model": "claude-sonnet-4-6" }
│
├── config.json          ← Claude Code 运行配置（1 KB）
│                          账户信息、认证状态等内部配置
│
├── history.jsonl        ← 对话历史记录（124 KB）
│                          所有会话的完整历史，JSONL 格式
│                          每行一条记录，用于 /resume 恢复会话
│
├── stats-cache.json     ← 使用统计缓存（6 KB）
│                          token 用量、模型切换等统计数据
│
├── backups/             ← 配置文件备份
│                          Claude 自动备份修改过的配置文件
│
├── cache/               ← 缓存目录
│                          模型响应缓存，加速重复查询
│
├── debug/               ← 调试日志
│                          排查问题时的诊断信息
│
├── file-history/        ← 文件修改历史
│                          Claude 修改过的文件的历史版本
│                          相当于一个简易的"撤销"机制
│
├── ide/                 ← IDE 集成数据
│                          VS Code / JetBrains 扩展的通信数据
│
├── paste-cache/         ← 粘贴板缓存
│                          从剪贴板粘贴的大段内容的临时存储
│
├── plans/               ← 执行计划存储
│                          Claude 制定的任务计划文件
│
├── plugins/             ← 已安装的插件
│                          从市场安装的第三方插件
│
├── projects/            ← 项目级持久化数据
│   └── <项目路径哈希>/
│       └── memory/
│           └── MEMORY.md  ← Claude 自动记住的项目知识
│                            架构模式、常用命令、文件路径等
│                            可通过 /memory 命令查看和编辑
│
├── sessions/            ← 会话数据
│                          每个会话的完整状态，用于恢复
│
├── shell-snapshots/     ← Shell 环境快照
│                          记录终端环境变量和状态
│
├── statsig/             ← 特性标记数据
│                          A/B 测试和功能开关的本地缓存
│
├── telemetry/           ← 遥测数据
│                          匿名使用数据（可关闭）
│
└── todos/               ← 待办事项
                           Claude 记录的待办任务
```

### 14.2 项目目录

这是**项目级配置**，放在项目根目录下，通常提交到 Git，团队成员共享。

```
your-project/
├── CLAUDE.md                    ← 项目记忆（提交到 Git）
├── CLAUDE.local.md              ← 个人覆盖（自动 gitignore）
│
└── .claude/
    ├── settings.json            ← 项目权限和配置（提交到 Git）
    ├── settings.local.json      ← 个人权限覆盖（自动 gitignore）
    │
    ├── skills/                  ← 项目技能（提交到 Git）
    │   └── explain-code/
    │       └── SKILL.md
    │
    ├── commands/                ← 项目命令（提交到 Git）
    │   └── review.md
    │
    ├── agents/                  ← 项目子代理（提交到 Git）
    │   └── db-expert.md
    │
    └── rules/                   ← 模块化指令（提交到 Git）
        └── code-style.md          按 glob 模式匹配文件时加载
```

### 14.3 全局 vs 项目：如何选择？

**核心原则：全局放"个人偏好"，项目放"团队规范"。**

| 配置内容                         | 放全局 `~/.claude/` | 放项目 `.claude/` |
| -------------------------------- | ------------------- | ----------------- |
| 你个人的编码习惯和风格偏好       | ✅                   |                   |
| 默认使用的模型（如 Sonnet）      | ✅                   |                   |
| 通用安全规则（禁止 `rm -rf`）    | ✅                   |                   |
| 你个人常用的 Skill（如安全审查） | ✅                   |                   |
| 项目的技术栈和架构说明           |                     | ✅                 |
| 项目的构建/测试/部署命令         |                     | ✅                 |
| 团队统一的代码规范               |                     | ✅                 |
| 项目特有的 Skill 和命令          |                     | ✅                 |
| 项目的权限白名单/黑名单          |                     | ✅                 |
| MCP 服务器配置                   | 看情况              | 看情况            |

**配置优先级（从低到高）：**

```
全局 ~/.claude/settings.json         ← 最低优先级
  ↓ 被覆盖
项目 .claude/settings.json           ← 中等优先级
  ↓ 被覆盖
项目 .claude/settings.local.json     ← 较高优先级（个人覆盖）
  ↓ 被覆盖
命令行参数 --settings                 ← 最高优先级
```

> **简单记忆**：越具体的配置优先级越高。项目配置覆盖全局配置，个人覆盖覆盖团队配置，命令行参数覆盖一切。

### 14.4 实际操作建议

**场景一：个人开发者，只有一个人用**

以全局配置为主，把常用规范写在 `~/.claude/CLAUDE.md` 里，省去每个项目重复配置。

```markdown
# ~/.claude/CLAUDE.md
## 我的编码规范
- 使用 TypeScript 严格模式
- 注释用中文
- commit 信息用英文
- 优先使用函数式编程
```

**场景二：团队协作，多人共用项目**

以项目配置为主。项目级的 CLAUDE.md 和 `.claude/settings.json` 提交到 Git，确保每个人拿到一致的配置。个人特殊需求写在 `.local` 文件中。

```bash
# 团队配置（提交到 Git）
项目/CLAUDE.md                  ← 项目规范
项目/.claude/settings.json      ← 项目权限

# 个人覆盖（不提交，自动 gitignore）
项目/CLAUDE.local.md            ← "我习惯 Opus 模型"
项目/.claude/settings.local.json ← "我允许 git push"
```

**场景三：同时有全局和项目配置**

两者会**合并**加载。Claude 启动时会同时读取全局 CLAUDE.md 和项目 CLAUDE.md，规则叠加生效。如果有冲突，项目级配置胜出。

```
Claude 启动时的加载顺序：
1. ~/.claude/CLAUDE.md          ← 读取全局规范
2. 项目/CLAUDE.md               ← 读取项目规范（覆盖冲突项）
3. 项目/子目录/CLAUDE.md        ← 读取子目录规范（进一步覆盖）
4. ~/.claude/settings.json      ← 加载全局权限
5. .claude/settings.json        ← 加载项目权限（覆盖冲突项）
6. .claude/settings.local.json  ← 加载个人覆盖（最终覆盖）
```

### 14.5 关键提醒

- **全局 CLAUDE.md 是你的"个人工具箱"**——队友看不到它，所以项目的 CLAUDE.md 必须自成体系，不能依赖你的全局配置
- **MEMORY.md 是 Claude 的"自动笔记本"**——存储在 `~/.claude/projects/<项目>/memory/` 中，Claude 在工作中会自动往里写东西，可以用 `/memory` 命令查看和编辑
- **不要手动修改 `history.jsonl` 和 `sessions/`**——这些是内部数据格式，手动修改可能导致会话损坏
- **`settings.local.json` 会被自动 gitignore**——放心写你的个人配置，不会影响队友

------

## 附录：快捷键速查

| 快捷键     | 说明         |
| ---------- | ------------ |
| `Ctrl + C` | 中断当前操作 |
| `/clear`   | 清除对话     |
| `/compact` | 压缩对话     |
| `/help`    | 查看帮助     |
| `/branch`  | 分支对话     |
| `@文件名`  | 引用特定文件 |

------

> 📖 **更多信息**
>
> - 官方文档：[code.claude.com/docs](https://code.claude.com/docs/en/overview)
> - GitHub 仓库：[github.com/anthropics/claude-code](https://github.com/anthropics/claude-code)
> - Anthropic 产品页：[anthropic.com/product/claude-code](https://www.anthropic.com/product/claude-code)