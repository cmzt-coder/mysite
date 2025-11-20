# Homebrew 简介及常用命令大全

## 一、Homebrew 核心简介

### 1.1 什么是 Homebrew？

Homebrew 是一款 **免费开源的包管理器** ，核心使命是“将 Apple 没有预装但你需要的东西装给你”，专为 macOS 设计，同时兼容 Linux 系统（Linux 环境下称为 Linuxbrew）。它彻底解决了 macOS 自带工具链版本老旧、软件安装分散、依赖管理复杂等问题，通过命令行即可实现软件的一键安装、更新、卸载与维护。

其核心优势包括：

* **便捷高效** ：无需手动下载源码或安装包，命令行一键完成操作，自动处理依赖关系；
* **社区驱动** ：拥有庞大的软件包仓库（Formulae），覆盖开发工具、服务程序等各类资源；
* **非侵入式安装** ：默认安装路径为 macOS 的 `/usr/local/Cellar` 或 Linux 的 `~/.linuxbrew`，不污染系统核心目录；
* **功能全面** ：支持命令行工具（如 git、nginx）和图形化应用（通过 brew cask 扩展）。

 **官方网站** ：[https://brew.sh/zh-cn/](https://brew.sh/zh-cn/)

### 1.2 安装 Homebrew

#### 1.2.1 前置条件

macOS 系统需先安装 Xcode 命令行工具（无需完整安装 Xcode），终端执行：

```bash
xcode-select --install
```

#### 1.2.2 官方安装命令

打开终端，复制以下命令并回车，脚本执行前会明确说明操作内容：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

安装完成后，根据终端提示将 Homebrew 路径添加到 `~/.zshrc` 或 `~/.bash_profile` 中，确保命令全局可用。

#### 1.2.3 国内镜像加速安装（可选）

若访问 GitHub 速度较慢，可使用国内 Gitee 镜像源，安装命令如下：

```bash
/bin/zsh -c "$(curl -fsSL https://gitee.com/cunkai/HomebrewCN/raw/master/Homebrew.sh)"
```

#### 1.2.4 安装验证

输入以下命令，若显示 Homebrew 版本号则安装成功：

```bash
brew -v
```

### 1.3 卸载 Homebrew

如需彻底卸载，执行官方卸载脚本或国内镜像卸载脚本：

* 官方卸载：`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/uninstall.sh)"`
* 国内镜像卸载：`/bin/zsh -c "$(curl -fsSL https://gitee.com/cunkai/HomebrewCN/raw/master/HomebrewUninstall.sh)"`

## 二、Homebrew 常用核心命令

以下命令涵盖包管理、更新维护、服务控制等核心场景，表格中“示例”列可直接复制执行。

### 2.1 基础包管理命令

用于软件包的安装、卸载、查询等基础操作，是日常使用频率最高的命令集合。

- `brew install <包名>` 安装指定软件包，自动处理依赖
  - 示例: `brew install git`（安装 git 工具）
- `brew uninstall <包名>` 卸载指定软件包
  - 示例: `brew uninstall nginx`（卸载 nginx 服务）
- `brew reinstall <包名>` 重装指定软件包，解决包损坏问题
  - 示例: `brew reinstall node`（重装 Node.js）
- `brew list` 列出所有已安装的包
  - 示例: `brew list --versions`（显示包及对应版本）
- `brew list <包名>` 查看指定包的安装文件路径
  - 示例: `brew list mysql`（查看 MySQL 安装文件）
- `brew info <包名>` 查看包的详细信息（版本、依赖、路径等）
  - 示例: `brew info redis`（查看 Redis 详细信息）
- `brew search <关键词>` 按包名模糊搜索相关软件
  - 示例: `brew search python`（搜索 Python 相关包）
- `brew search --desc <关键词>` 按包描述精准搜索，适合场景化需求
  - 示例: `brew search --desc "web server"`（搜索 Web 服务器）

### 2.2 包更新与版本控制

确保 Homebrew 仓库及已安装软件处于最新状态，支持版本锁定避免意外升级。

- `brew update` 更新 Homebrew 自身的软件包仓库（必执行前置操作）
  - 示例: `brew update`
- `brew upgrade` 升级所有已安装的包到最新版本（需先执行 update）
  - 示例: `brew upgrade`
- `brew upgrade <包名>` 仅升级指定包，不影响其他软件
  - 示例: `brew upgrade python@3.11`
- `brew pin <包名>` 固定包版本，防止被 `brew upgrade` 自动升级
  - 示例: `brew pin docker`
- `brew unpin <包名>` 取消版本固定，恢复正常升级
  - 示例: `brew unpin docker`
- `brew outdated` 列出所有可升级的包及当前版本、最新版本
  - 示例: `brew outdated`

### 2.3 Homebrew 自身管理与诊断

用于查看 Homebrew 状态、配置信息及排查问题，是故障处理的核心命令。

- `brew -v` / `brew version` 查看 Homebrew 及包仓库版本
  - 示例: `brew -v`
- `brew doctor` 检查 Homebrew 健康状态，排查依赖缺失、路径错误等问题并给出修复建议
  - 示例: `brew doctor`
- `brew config` 查看 Homebrew 配置信息（安装路径、镜像源、系统环境等）
  - 示例: `brew config`

### 2.4 缓存清理（释放磁盘空间）

Homebrew 会保留软件旧版本和安装缓存，定期清理可释放大量磁盘空间。

- `brew --cache` 查看 Homebrew 缓存目录路径（默认：`~/Library/Caches/Homebrew`）
  - 示例: `brew --cache`
- `brew cleanup` 清理所有包的旧版本和缓存文件，保留最新版本
  - 示例: `brew cleanup`
- `brew cleanup <包名>` 仅清理指定包的缓存，不影响其他软件
  - 示例: `brew cleanup git`
- `brew cleanup -n` 预览可清理的内容及占用空间，不实际执行删除操作
  - 示例: `brew cleanup -n`
- `brew autoremove` 卸载不再被其他包依赖的“孤儿包”，类似 `apt autoremove`
  - 示例: `brew autoremove`

### 2.5 服务管理（brew services）

针对 `nginx`、`mysql`、`redis` 等后台服务，提供启动、停止、自启配置等功能，类似 Linux 的 `systemd`。

- `brew services start <包名>` 启动指定服务
  - 示例: `brew services start mysql`
- `brew services stop <包名>` 停止指定服务
  - 示例: `brew services stop redis`
- `brew services restart <包名>` 重启指定服务（修改配置后常用）
  - 示例: `brew services restart nginx`
- `brew services enable <包名>` 设置服务开机自启
  - 示例: `brew services enable mysql`
- `brew services disable <包名>` 取消服务开机自启
  - 示例: `brew services disable nginx`
- `brew services list` 查看所有服务的运行状态（启动/停止/自启状态）
  - 示例: `brew services list`

### 2.6 图形化应用管理（brew cask）

Homebrew Cask 是扩展功能，专门用于安装 macOS 图形化桌面应用（如浏览器、编辑器等），命令逻辑与基础包管理一致，仅需添加 `--cask` 参数。

- 安装图形化应用: `brew install --cask <应用名>`
  - 示例: `brew install --cask google-chrome`（安装 Chrome）
- 卸载图形化应用: `brew uninstall --cask <应用名>`
  - 示例: `brew uninstall --cask visual-studio-code`（卸载 VS Code）
- 搜索图形化应用: `brew search --cask <关键词>`
  - 示例: `brew search --cask wechat`（搜索微信）
- 列出已安装的图形化应用: `brew list --cask`
  - 示例: `brew list --cask`

### 2.7 高级实用命令

适用于依赖分析、路径查询等进阶场景，助力高效管理软件包。

- `brew deps <包名>` 查看指定包的直接依赖关系
  - 示例: `brew deps node`（查看 Node.js 依赖）
- `brew deps --tree <包名>` 以树形结构展示包的所有依赖（直观清晰）
  - 示例: `brew deps --tree python`（树形展示 Python 依赖）
- `brew --prefix <包名>` 查看指定包的安装根路径（配置文件修改常用）
  - 示例: `brew --prefix nginx`（输出 Nginx 安装路径）
- `brew leaves` 列出“顶级包”（无其他包依赖的包，即手动安装的核心包）
  - 示例: `brew leaves`
- `brew audit <包名>` 检查包是否存在安全漏洞或合规问题
  - 示例: `brew audit --strict mysql`（严格检查 MySQL）

## 三、日常使用最佳实践与注意事项

### 3.1 常用操作流

日常更新所有软件的推荐流程（确保安全且高效）：

```bash
# 1. 先更新 Homebrew 仓库（获取最新软件信息）
brew update
# 2. 查看可升级的软件列表（确认升级范围）
brew outdated
# 3. 升级所有软件或指定软件
brew upgrade  # 升级全部
# brew upgrade <包名>  # 升级指定软件
# 4. 清理旧版本和缓存（释放磁盘空间）
brew cleanup
# 5. （可选）检查 Homebrew 健康状态
brew doctor
```

一键执行更新与清理（适合快速操作）：

```bash
brew update && brew upgrade && brew cleanup
```

### 3.2 核心注意事项

* **权限问题** ：Homebrew 设计为非 root 用户使用，**`sudo brew`****禁止使用 ** 执行命令，否则会导致权限混乱，后续操作报错。
* **Linux 适配** ：Linuxbrew 默认安装路径为 `~/.linuxbrew`，需手动将路径加入环境变量：`echo 'export PATH="$HOME/.linuxbrew/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc`
* **版本兼容** ：部分软件支持多版本共存（如 `python@3.9`、`python@3.11`），安装时需指定完整版本号，避免版本冲突。
* **镜像源维护** ：若使用国内镜像源，后续更新时建议同步更新镜像配置，避免出现仓库不一致问题（参考各镜像站官方文档）。

## 四、参考资源

* Homebrew 官方文档：[https://docs.brew.sh/](https://docs.brew.sh/)
* Homebrew Cask 官方文档：[https://docs.brew.sh/Cask-Cookbook](https://docs.brew.sh/Cask-Cookbook)
* 清华镜像源配置：[https://mirrors.tuna.tsinghua.edu.cn/help/homebrew/](https://mirrors.tuna.tsinghua.edu.cn/help/homebrew/)
