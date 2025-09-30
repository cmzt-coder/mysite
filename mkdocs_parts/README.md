# mkdocs_parts 目录说明

此目录用于按模块与配置类型拆分 MkDocs 主配置（原 `mkdocs.yml`），便于维护与协作。通过合并脚本将各分片合成为最终配置文件。

## 文件概览
- `info.yml`：站点基础信息（`site_name`、`site_url`、`site_author`、`site_description`）。
- `nav.yml`：导航结构与分组，控制顶部和侧栏条目及顺序。
- `theme.yml`：主题与外观（Material 主题、配色方案、交互特性、语言、仓库图标）。
- `repo.yml`：仓库与在线编辑设置（`repo_url`、`repo_name`、`edit_uri`）。
- `copyright.yml`：页脚版权声明。
- `extra.yml`：额外信息（如社交链接），由主题在特定位置渲染（通常在页脚）。
- `plugins.yml`：插件启用与配置（站内搜索、标签等）。
- `markdown_extensions.yml`：Markdown 扩展（代码高亮、提示块、目录、数学公式等）。
- `assets.yml`：静态资源（`extra_javascript`、`extra_css`），自托管资源建议放在 `docs/mkdocs/` 下。

## 使用说明
1. 安装依赖（首次）：`python -m pip install pyyaml`
2. 合并生成配置：`python tools/mkdocs_merge.py`
   - 脚本会从本目录读取各 `*.yml` 分片，合并后写入项目根目录的 `mkdocs.yml`。
   - 生成的 `mkdocs.yml` 顶部包含“由脚本生成”的注释，但不保留各分片中的注释（YAML 解析后再生成会丢失注释）。
3. 本地预览：`python -m mkdocs serve -a 127.0.0.1:8000`
4. 部署：GitHub Actions 在部署前会自动运行合并脚本（见 `.github/workflows/PublishMySite.yml`）。

## 合并规则与顺序
- 合并顺序由 `tools/mkdocs_merge.py` 的 `PART_FILES` 列表决定，当前顺序为：
  `info.yml` → `nav.yml` → `theme.yml` → `repo.yml` → `copyright.yml` → `extra.yml` → `plugins.yml` → `markdown_extensions.yml` → `assets.yml`
- 合并策略：
  - 字典（mapping）采用“深合并”：后续分片的同名键覆盖或递归合并到前者。
  - 列表（list）采用“整体覆盖”：后续分片同名键的列表替换前者，不做去重或拼接。

## 约定与扩展
- 如需新增配置分片：在本目录新增 `.yml` 文件，并将文件名添加到 `tools/mkdocs_merge.py` 的 `PART_FILES` 以纳入合并流程。
- 路径与链接：`nav.yml` 中应使用具体文档路径（如 `TECH/index.md`），避免仅写目录名导致“未识别的相对链接”提示。
- 自定义脚本与样式：
  - 建议将 JS/CSS 放置于 `docs/mkdocs/` 子目录中并在 `assets.yml` 引用。
  - 外链资源需确保长期可用性。

## 常见问题
- 预览日志出现“未识别的相对链接”提示：请在 `docs/index.md` 或对应文档中将目录链接调整为具体页面（例如 `TECH/` 改为 `TECH/index.md`）。
- 页面内锚点不存在的提示：检查 Markdown 标题是否与链接的锚点完全匹配，或移除无效的内部链接。