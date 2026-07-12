# Caveman 安装与配置&#x20;

本指南专为 Windows 操作系统（CMD / PowerShell / Git Bash）定制，旨在指导你如何在已经初始化过 Claude Code 的本地项目目录中，正确、安全地部署 `caveman`（野人极限省钱模式）全套技能组件，并规避 Windows 平台特有的路径与权限坑点。

***

## 🛠️ 第一步：环境检查与准备

在安装前，请务必确保你的 Windows 电脑满足以下基础环境要求：

### 1. 验证 Node.js 与 npm 环境

`npx` 依赖于 Node.js 运行时。请打开你的 PowerShell 或 CMD，输入以下命令核验：

```powershell
node -v
npm -v
```

- **异常处理**：若提示“未找到命令”，请前往 [Node.js 官网](https://nodejs.org/) 下载并安装最新的 LTS（长期支持）版本。

### 2. 解锁 PowerShell 脚本执行策略（仅限使用 PowerShell 的用户）

Windows 系统出于安全考虑，默认禁止在终端运行未经签名的第三方脚本。

- **操作方法**：以 **管理员身份** 打开 PowerShell，运行以下命令解锁当前用户的执行权限：
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```
  *（在弹出的提示中输入* *`Y`* *并回车确认）*

### 3. 跨盘符进入你的目标项目目录

如果你的项目存放在非系统盘（如 D 盘），需要使用正确的命令切入。以进入路径 `D:\Project\claude\test` 为例：

- **在 PowerShell 中**：直接使用 `cd`：
  ```powershell
  cd D:\Project\claude\test
  ```
- **在 传统 CMD 中**：需加上 `/d` 参数实现跨盘：
  ```cmd
  cd /d D:\Project\claude\test
  ```
- **在 Git Bash 中**：使用 Linux 风格盘符，且斜杠方向相反：
  ```bash
  cd /d/Project/claude/test
  ```

### 4. 验证 Claude Code 是否已在该目录下初始化

`caveman` 的安装程序需要向项目根目录下的隐藏文件夹 `.claude` 注入技能。

- **验证方法**：在项目目录下输入 `ls -a` (Git Bash) 或 `Get-ChildItem -Force` (PowerShell)。
- **判断依据**：如果能看到 `.claude` 隐藏文件夹，说明已初始化，可继续；如果看不到，请先在当前目录敲击 `claude` 回车，待其首次扫描项目完成后输入 `/exit` 退出，即可自动完成初始化。

***

## 🚀 第二步：正式安装与多模态部署流程

完成上述准备后，请严格按照以下步骤在终端中执行全自动交互式安装：

### 1. 运行 Skills 安装指令

在项目根目录下，键入以下命令触发安装：

```bash
npx skills add JuliusBrussee/caveman
```

*提示* *`Ok to proceed? (y)`* *时，输入* *`y`* *并回车。*

### 2. 选择技能组件（Skills 多选菜单）

系统克隆仓库后，会展示一个多选列表。使用键盘 **上下方向键（↑/↓）** 移动光标，按下 **空格键（Space）** 勾选以下 5 个核心核心组件（确保选中的项左侧显示为蓝色的实心点 `[•]`）：

- `[•] cavecrew`：多 Agent 协同与子智能体分配组件。
- `[•] caveman`：**核心野人模式**，负责自然语言解释的极限脱水。
- `[•] caveman-commit`：自动提取 Git Diff 生成极简 Conventional Commit 的组件。
- `[•] caveman-compress`：核心瘦身神技，用于压缩本地大型说明书文档。
- `[•] caveman-review`：对二次开发代码进行一行流硬核评审的组件。
- *勾选完毕后，直接按下* ***回车键（Enter）*** *确认。*

### 3. 勾选适配的 AI 智能体矩阵

安装程序（`/caveman-init`）会让你选择该规则支持哪些本地 AI 辅助工具。

- **推荐操作**：直接按下 **回车键（Enter）** 保持默认全选状态（此时綠字会显示 `Selected: Amp, Antigravity... +10 more`）。这会一次性为 `Claude Code`、`Aider`、`Cursor`、`Zed` 等所有主流工具生成激活规则。

### 4. 选择安装方法 (Installation method)

- **选项**：确保绿色的箭头 `>` 指向 **`> Symlink (Recommended)`**（符号链接/软链接模式）。
- **操作**：直接按下 **回车键（Enter）** 确认。
- **原理**：软链接模式会保持单一样本源，未来官方更新插件时可实现全网一键同步，避免在 Windows 留下一堆肥胖的重复配置文件。

### 5. 绕过供应链安全风险审查 (Security Risk Assessments)

脚本运行中会调用 Snyk 等工具进行静态行为审计，此时屏幕上会弹出一个红色的高风险警告：

- ⚠️ **风险提示**：`caveman-compress Safe | 0 alerts | High Risk`
- **高风险成因**：由于 `caveman-compress` 的核心正当功能是“一键改写和覆盖你本地的 `CLAUDE.md` 等核心配置文件”，这类对本地文件具备写权限的行为会被安全审计工具自动拦截并提示高危。
- **正确操作**：此为已知安全插件，无需惊慌。确保绿色箭头 `>` 指向 **`Yes`**（Proceed with installation?），按下 **回车键（Enter）** 强制通过。

### 6. 安装内置技能搜索引擎组件 (One-time prompt)

在生成完所有软链接后，终端会弹出最后一次性的推荐询问：

- **提示内容**：`Install the find-skills skill? It helps your agent discover and suggest skills.`
- **正确操作**：确保绿色箭头 `>` 指向 **`Yes`**，按下 **回车键（Enter）** 完成。它能赋予 Claude Code 在后续开发中根据你的意图自动检索、推荐并在线安装其他成熟 Skills 的能力。

***

## 🎉 第三部分：安装成功验证与 Windows 避坑要点

当终端最下方重新出现盘符路径（如 `PS D:\Project\claude\test>`），且伴随绿色加粗的 `Done!` 时，说明部署圆满结束。

### 1. 验证激活

输入 `claude` 进入智能体交互界面，直接发送指令：

```text
/caveman full
```

随后输入中文：“`你好`”，如果它回复你极度精简、毫无寒暄的硬核短语（如 \`- Status: Active

- Mode: Caveman Full\`），则代表野人模式已在 Windows 下完美生效。

### 2. Windows 路径分隔符防坑指南

由于 Windows 系统底层采用反斜杠（`\`），而 `caveman` 的子命令严格遵循 Unix 的正斜杠（`/`）标准。

- **核心准则**：在后续调用其专属组件（如压缩文件）时，**在聊天框中输入路径一律使用正斜杠** **`/`**。
  - *错误示范*：`/caveman-compress .\CLAUDE.md`
  - *正确示范*：`/caveman-compress CLAUDE.md`

