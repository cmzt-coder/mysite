# Conda 简介及常用命令

Conda 是一个跨平台的包管理与环境管理工具，常用于 Python（也可用于 R 等）项目的依赖隔离与版本管理。它既能管理包（安装/卸载/更新），也能管理环境（创建/切换/导出）。

## 基础概念

- 环境（environment）：一组独立的依赖与解释器版本，常用于隔离不同项目的运行条件。
- 发行版（distribution）：常见的有 Anaconda（全家桶）与 Miniconda（精简版，仅含 conda）。
- Channel：包的来源仓库，优先级与配置会影响安装到的版本与速度。

## 常用环境命令

### 查看与创建

```bash
conda --version
conda info
conda info --envs
conda env list
```

```bash
conda create -n myenv python=3.12
conda create -n myenv python=3.10 numpy pandas
```

### 激活与退出

```bash
conda activate myenv
conda deactivate
```

Windows（PowerShell/CMD）首次使用可能需要初始化：

```bash
conda init powershell
conda init cmd.exe
```

执行后重新打开终端再 `conda activate`。

### 删除环境

```bash
conda remove -n myenv --all
```

## 常用包管理命令

### 安装、更新、卸载

```bash
conda install numpy
conda install numpy=1.26
conda install -n myenv numpy
```

```bash
conda update numpy
conda update --all
```

```bash
conda remove numpy
```

### 搜索与查看已安装

```bash
conda search numpy
conda list
conda list numpy
```

## 导出与复现环境

### 导出为 environment.yml（推荐）

```bash
conda env export -n myenv > environment.yml
```

使用导出的文件创建环境：

```bash
conda env create -f environment.yml
```

指定新环境名：

```bash
conda env create -n newenv -f environment.yml
```

### 更新已有环境（根据 yml 同步依赖）

```bash
conda env update -n myenv -f environment.yml --prune
```

`--prune` 会移除 yml 中不存在的包，适合用 yml 做环境“期望状态”管理。

## Channel 与镜像配置

### 查看当前配置

```bash
conda config --show
conda config --show-sources
conda config --get channels
```

### 添加/移除 Channel

```bash
conda config --add channels conda-forge
conda config --set channel_priority strict
```

```bash
conda config --remove channels conda-forge
```

说明：

- `conda-forge` 通常包更全、版本更新更快。
- `channel_priority strict` 可减少“混装”导致的依赖冲突。

## 常用清理与排错

### 清理缓存与无用包

```bash
conda clean --all
```

### 检查可用更新与依赖信息

```bash
conda search --outdated
conda info --json
```

### 解决安装慢/卡住的常见操作

- 优先确认网络与 Channel 配置是否合理（尤其是 Windows）。
- 若某个包在默认 channel 不存在，可尝试加 `-c conda-forge`：

```bash
conda install -c conda-forge <package>
```

## 快速命令清单

| 场景 | 命令 |
|---|---|
| 创建环境 | `conda create -n myenv python=3.12` |
| 激活环境 | `conda activate myenv` |
| 退出环境 | `conda deactivate` |
| 删除环境 | `conda remove -n myenv --all` |
| 安装包 | `conda install numpy` |
| 卸载包 | `conda remove numpy` |
| 查看已装 | `conda list` |
| 导出环境 | `conda env export -n myenv > environment.yml` |
| 从 yml 创建 | `conda env create -f environment.yml` |
| 清理缓存 | `conda clean --all` |

