# 命名规范（跨平台一致性）

本文档用于约束本仓库的文件与目录命名，目标是确保在 Windows、macOS、Linux 以及 CI/CD 环境中路径稳定、引用可靠，避免因字符集/转义/编码差异导致链接失效或脚本异常。

## 适用范围

- `docs/` 下的所有页面文件与资源文件
- 后续新增的任何文档页面、静态资源、导入引用路径

## 命名规则

- 统一使用英文（建议小写）
- 单词之间使用短横线 `-` 分隔
- 禁止使用空格
- 禁止使用全角中文标点（例如：`：`、`（`、`）`）
- 禁止使用其他特殊字符（建议仅使用：`a-z`、`0-9`、`-`、`.`）
- 文件名保持语义清晰但避免过长

推荐格式：

- 目录：`lowercase-words/`
- 文档页：`topic-name.md`
- 资源文件：`asset-name.ext`

## 示例

| 不推荐 | 推荐 |
|---|---|
| `ThreadLocal 详解.md` | `threadlocal-guide.md` |
| `Homebrew 简介及常用命令大全.md` | `homebrew-common-commands.md` |
| `Chroma向量数据库：全面介绍与详细安装使用指南.md` | `chroma-vector-database-guide.md` |

## 引用同步要求

发生重命名时必须同步更新以下引用，避免站点断链：

- `mkdocs_parts/nav.yml` 内导航路径
- 相关 `docs/**/*.md` 的站内链接
- 列表页（如 `docs/Utils/index.md`）中的条目链接

## 提交流程建议

- 新增/重命名文件后，先运行：
  - `python tools/mkdocs_merge.py`
  - `python -m mkdocs build --strict`
- 确保无断链、无找不到文件的报错再提交/推送

