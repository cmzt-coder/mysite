# Ollama 常用命令

Ollama 提供命令行工具与本地 HTTP 服务（默认 `http://localhost:11434`），用于下载、管理并运行本地大模型。

## 快速命令清单

| 场景      | 命令                                         |
| :------ | :----------------------------------------- |
| 查看版本    | `ollama --version`                         |
| 拉取模型    | `ollama pull <model>`                      |
| 查看本地模型  | `ollama ls`                                |
| 查看模型详情  | `ollama show <model>`                      |
| 删除模型    | `ollama rm <model>`                        |
| 启动服务    | `ollama serve`                             |
| 运行模型    | `ollama run <model> ["prompt"]`            |
| 查看运行中   | `ollama ps`                                |
| 停止运行    | `ollama stop <model>`                      |
| 创建自定义模型 | `ollama create <name> -f Modelfile`        |
| 登录/推送   | `ollama signin` / `ollama push user/model` |

## 版本与帮助

### 版本查询

```bash
ollama --version
ollama -v
```

### 查看帮助

```bash
ollama --help
ollama help
ollama help run
```

## 模型管理

### 拉取模型（下载/更新）

**功能**：从模型仓库下载模型；若本地已有，会按仓库版本更新。

```bash
ollama pull llama3.2
ollama pull qwen2.5:7b
```

**参数说明**：

- `<model>`：模型名（可带 tag），例如 `qwen2.5:7b`

### 查看本地模型列表

**功能**：列出已下载到本机的模型。

```bash
ollama ls
```

### 查看模型详情

**功能**：查看模型的元信息（如模板、参数、license 等）。

```bash
ollama show llama3.2
ollama show --license llama3.2
```

**参数说明**：

- `--license`：仅显示许可证信息

### 删除模型

**功能**：从本机删除指定模型。

```bash
ollama rm llama3.2
ollama rm qwen2.5:7b
```

### 复制模型

**功能**：将一个本地模型复制为新名字（常用于在修改前留备份）。

```bash
ollama cp llama3.2 my-llama3.2
```

**参数说明**：

- `<source>`：源模型名
- `<destination>`：目标模型名

### 创建自定义模型（Modelfile）

**功能**：基于 `Modelfile` 创建自定义模型（例如修改系统提示词、合并 adapter、变更参数等）。

```bash
ollama create my-model -f Modelfile
```

**参数说明**：

- `-f, --file`：Modelfile 路径（默认文件名为 `Modelfile`）

### 登录/登出（用于推送到仓库）

```bash
ollama signin
ollama signout
```

### 推送模型（发布到仓库）

**功能**：将模型发布到仓库（通常需要先 `signin`）。

```bash
ollama push username/my-model
```

**参数说明**：

- `<model>`：通常为 `用户名/模型名`

## 服务启动与配置

### 启动服务

**功能**：启动 Ollama 本地服务，供 CLI/SDK/HTTP API 调用。

```bash
ollama serve
```

### 常见配置方式（环境变量）

不同版本支持的环境变量可能略有差异，建议以本机输出为准：

```bash
ollama serve --help
```

常见场景：

- 修改监听地址（例如局域网内访问）
  - Windows（PowerShell）：
    ```bash
    $env:OLLAMA_HOST="0.0.0.0:11434"
    ollama serve
    ```
  - macOS/Linux（bash/zsh）：
    ```bash
    export OLLAMA_HOST="0.0.0.0:11434"
    ollama serve
    ```

## 模型运行与交互

### 交互式运行（聊天模式）

**功能**：启动交互式会话，持续对话。

```bash
ollama run llama3.2
```

### 单次运行（一次性提示词）

**功能**：直接给出 prompt，返回一次结果后退出。

```bash
ollama run llama3.2 "用三句话解释什么是 RAG"
```

### 管道输入（适合处理文件/日志）

```bash
type README.md | ollama run llama3.2
```

**参数说明**：

- 当通过管道传入内容时，Ollama 会将标准输入作为 prompt
- 需要指定“总结/改写”等任务时，建议把指令写进输入内容本身（例如先拼接指令与原文再管道输入）

### 多行输入（适合粘贴长段落）

交互模式中可用 `"""` 包住多行文本：

```text
>>> """第一行
... 第二行
... 第三行"""
```

## 运行中的模型管理

### 查看正在运行的模型

```bash
ollama ps
```

### 停止运行中的模型

```bash
ollama stop llama3.2
```

<br />

