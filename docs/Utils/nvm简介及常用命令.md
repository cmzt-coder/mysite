
# nvm简介及常用命令

## 一、nvm简介

### 1. 定义

nvm（Node Version Manager）是一款开源的Node.js版本管理工具，专为解决多版本Node.js共存问题而设计。它允许开发者在同一台设备上快速安装、切换、管理不同版本的Node.js及配套的npm（Node包管理器），无需手动修改系统环境变量，彻底规避因版本不兼容导致的开发冲突。

### 2. 核心价值

* **版本灵活切换** ：一键切换不同Node.js版本，满足不同项目对Node版本的特定需求（如老项目依赖Node.js 14，新项目需Node.js 20）。
* **避免权限问题** ：无需以管理员权限安装Node.js，所有版本文件均存储在nvm专属目录，防止修改系统级文件引发的权限错误。
* **轻量无侵入** ：仅管理Node.js版本，不干扰项目代码和依赖，安装与卸载过程简单，对系统环境影响极小。
* **跨平台支持** ：主流版本适配macOS、Linux及Windows系统（Windows需使用nvm-windows分支版本），保持操作逻辑一致。

### 3. 核心概念

* **nvm本身** ：版本管理工具的核心程序，负责解析命令、管理版本安装目录、控制环境变量切换。
* **Node.js版本** ：包括稳定版（Stable）、长期支持版（LTS）、开发版（Current）等，nvm可通过版本号或别名（如lts、latest）精准定位。
* **npm** ：Node.js自带的包管理工具，nvm在切换Node版本时会自动同步切换配套的npm版本，确保依赖安装兼容性。
* **镜像源** ：Node.js版本文件的下载来源，默认使用国外源，国内用户可配置淘宝镜像源提升下载速度。

### 4. 基本原理

nvm通过在系统环境变量中注入专属路径，将Node.js的调用指向nvm管理的版本目录。当执行版本切换命令时，nvm会动态更新环境变量中的Node.js可执行路径，实现不同版本的即时生效。所有安装的Node.js版本均独立存储在nvm的versions目录下，互不干扰。

## 二、nvm安装与环境配置

### 1. 各系统安装命令

#### 1.1 macOS/Linux系统

通过curl或wget执行官方安装脚本，安装前建议卸载已手动安装的Node.js，避免冲突：

* curl方式：`curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash`
* wget方式：`wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash`

安装完成后，关闭终端并重新打开，或执行 `source ~/.bashrc`（bash用户）、`source ~/.zshrc`（zsh用户）使配置生效。

#### 1.2 Windows系统

需安装nvm-windows分支，通过官方压缩包安装：

1. 卸载已安装的Node.js，删除相关环境变量。
2. 从[nvm-windows Releases](https://github.com/coreybutler/nvm-windows/releases)下载最新版 `nvm-setup.exe`。
3. 运行安装程序，指定nvm和Node.js的安装目录（路径避免含中文和空格）。
4. 安装完成后，打开CMD或PowerShell验证是否生效。

### 2. 国内镜像源配置（提速必备）

默认镜像源在国内下载较慢，可配置淘宝镜像源：

#### 40.1 macOS/Linux

编辑终端配置文件（.bashrc、.zshrc等），添加以下内容：

```Plain
export NVM_NODEJS_ORG_MIRROR=https://npm.taobao.org/mirrors/node/
export NVM_NPM_MIRROR=https://npm.taobao.org/mirrors/npm/
```

执行 `source ~/.bashrc`使配置生效。

#### 45.1 Windows

打开nvm安装目录下的 `settings.txt`，添加以下内容：

```Plain
node_mirror: https://npm.taobao.org/mirrors/node/
npm_mirror: https://npm.taobao.org/mirrors/npm/
```

## 三、nvm常用命令

### 1. 基础命令（状态查询与帮助）

* **查看nvm版本** ：`nvm --version`，验证nvm是否安装成功。
* **查看命令帮助** ：`nvm --help`，获取所有命令及参数说明。
* **检查nvm状态** ：`nvm status`，显示当前使用的Node.js版本及状态。

### 2. 版本安装命令

* **查看可安装的Node版本** ：`nvm ls-remote`，列出远程仓库所有可用版本（Windows可简化为 `nvm list available`）。
* **安装指定版本** ：`nvm install <版本号>`，版本号可精确到补丁版。示例：安装LTS版18.17.0 `nvm install 18.17.0`；安装最新版 `nvm install latest`；安装长期支持版 `nvm install lts`。
* **安装配套npm** ：安装Node.js时会自动同步安装对应npm，若需单独修复npm，可执行 `nvm use <版本号> && npm install -g npm@latest`。

### 3. 版本管理命令

* **查看已安装版本** ：`nvm ls`，列表中带 `*`的为当前使用版本。
* **切换Node版本** ：`nvm use <版本号>`，示例：切换到16.20.2 `nvm use 16.20.2`；切换到LTS版 `nvm use lts`。
* **设置默认版本** ：`nvm alias default <版本号>`，终端重启后自动使用该版本，示例：`nvm alias default 18.17.0`。
* **创建版本别名** ：`nvm alias <别名> <版本号>`，简化切换命令，示例：`nvm alias work 16.20.2`，后续可通过 `nvm use work`切换。
* **删除版本别名** ：`nvm unalias <别名>`，示例：`nvm unalias work`。

### 4. 版本卸载命令

* **卸载指定版本** ：`nvm uninstall <版本号>`，需先确保该版本未被使用，示例：`nvm uninstall 14.21.3`。
* **卸载nvm（Windows）** ：1. 执行 `nvm uninstall`删除所有Node版本；2. 控制面板卸载nvm程序；3. 删除安装目录及环境变量。
* **卸载nvm（macOS/Linux）** ：1. 执行 `rm -rf ~/.nvm`删除核心目录；2. 编辑.bashrc/.zshrc删除nvm相关环境变量配置。

### 5. 其他实用命令

* **查看当前Node路径** ：`nvm which <版本号>`，示例：`nvm which 18.17.0`，用于排查环境变量问题。
* **临时禁用nvm** ：`nvm deactivate`，恢复系统默认的Node版本（若有）。
* **更新nvm（macOS/Linux）** ：`nvm install node --reinstall-packages-from=node`，更新nvm同时迁移全局npm包。

## 四、常见问题

* **切换版本后命令失效** ：关闭终端重新打开，或执行 `source ~/.bashrc`（macOS/Linux）刷新环境变量。
* **Windows下“nvm不是内部命令”** ：检查安装目录是否添加到系统环境变量，或重启CMD/PowerShell。
* **全局npm包不共享** ：不同Node版本的全局npm包独立存储，需在对应版本下重新安装，或使用 `nvm reinstall-packages <旧版本>`迁移包。
