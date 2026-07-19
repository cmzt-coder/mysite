# mysite 项目命名规范（已存入系统规则）

> 用于约束本仓库的文件与目录命名，确保跨平台一致性，避免链接失效

## 适用范围
- `docs/` 下的所有页面文件与资源文件
- 后续新增的任何文档页面、静态资源、导入引用路径

## 核心规则
1. ✅ 统一使用英文（**建议小写**）
2. ✅ 单词之间使用**短横线 `-`** 分隔
3. ❌ 禁止使用空格
4. ❌ 禁止使用全角中文标点（`：` `（` `）` 等）
5. ❌ 禁止使用其他特殊字符，仅允许：`a-z` `0-9` `-` `.`
6. ✅ 文件名保持语义清晰但避免过长

## 推荐格式
- 目录：`lowercase-words/`
- 文档页：`topic-name.md`
- 资源文件：`asset-name.ext`

## 示例对比
| 不推荐 | 推荐 |
|---|---|
| `ThreadLocal 详解.md` | `threadlocal-guide.md` |
| `Homebrew 简介及常用命令大全.md` | `homebrew-common-commands.md` |
| `Chroma向量数据库：全面介绍与详细安装使用指南.md` | `chroma-vector-database-guide.md` |

## 引用同步要求
重命名后必须同步更新：
- `mkdocs_parts/nav.yml` 内导航路径
- 相关 `docs/**/*.md` 的站内链接
- 列表页（如 `docs/Utils/index.md`）中的条目链接

## 本地验证命令
新增/重命名后，先验证再提交：
```bash
python3 tools/mkdocs_merge.py
python3 -m mkdocs build --strict
```
