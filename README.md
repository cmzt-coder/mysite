# CMZT的个人网站

<https://cmzt-coder.github.io/mysite/>

- 生成 [MkDocs](https://www.mkdocs.org)
- 主题 [Material](https://github.com/squidfunk/mkdocs-material)
- 发布 [GitHub Pages](https://pages.github.com) 

## 配置拆分与生成（MkDocs）

为便于维护，已将 `mkdocs.yml` 配置按模块与类型拆分到 `mkdocs_parts/` 目录，并提供合并脚本在本地与 CI 中生成最终配置。

### 目录结构
- `mkdocs_parts/info.yml`：站点基本信息（名称、URL、作者、描述）
- `mkdocs_parts/nav.yml`：导航结构（各模块与页面）
- `mkdocs_parts/theme.yml`：主题配置（Material 主题、调色板、特性）
- `mkdocs_parts/repo.yml`：仓库与编辑链接配置（`repo_url`、`repo_name`、`edit_uri`）
- `mkdocs_parts/copyright.yml`：页脚版权
- `mkdocs_parts/extra.yml`：额外信息（社交链接等）
- `mkdocs_parts/plugins.yml`：插件配置（`search`、`tags` 等）
- `mkdocs_parts/markdown_extensions.yml`：Markdown 扩展（高亮、提示、目录等）
- `mkdocs_parts/assets.yml`：静态资源（`extra_javascript`、`extra_css`）

### 使用方法
- 本地一次性安装依赖：`python -m pip install pyyaml`
- 本地生成合并后的配置：`python tools/mkdocs_merge.py`
  - 生成的 `mkdocs.yml` 顶部带有注释，提示该文件由脚本生成。
  - 请优先修改 `mkdocs_parts/` 下的拆分文件，不要直接编辑 `mkdocs.yml`。
- CI/CD：GitHub Actions 已在部署前自动运行合并脚本（见 `.github/workflows/PublishMySite.yml`）。

### 扩展说明
- 如需新增配置模块，可在 `mkdocs_parts/` 新增对应 `.yml` 文件，并在 `tools/mkdocs_merge.py` 的 `PART_FILES` 列表中加入文件名以确定合并顺序。
- 合并策略为“字典深合并 + 列表覆盖”，保证最终行为与原单文件配置一致。
