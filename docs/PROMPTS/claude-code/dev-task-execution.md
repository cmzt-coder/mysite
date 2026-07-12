title: 开发任务执行模板
category: PROMPTS/claude-code
created: 2026-07-12

# 开发任务执行模板（Claude Code）

## 适用场景

- 新增功能（需要修改多文件，且要保证验证/构建通过）
- 文档站点维护（迁移、重命名、补齐导航与索引）
- Bug 定位与修复（需要先复现/定位，再修复/验证）

## 提示词模板

```text
你是一个强约束的工程助手，请按以下流程完成任务，不要跳步：

1) 现状盘点：列出涉及文件、入口导航、相关引用点（给出可点击的文件路径或行号范围）。
2) 变更方案：说明将新增/修改/删除哪些文件，如何保证命名规范、路由不失效。
3) 执行变更：逐个应用修改，避免引入与任务无关的重构。
4) 全链路校验：运行构建/测试命令，输出结果；如有告警说明是否是历史问题。
5) 交付回顾：总结改动点 + 新入口访问路径 + 需要我手动验证的关键页面。

任务背景：
{background}

具体要求：
{requirements}

约束：
- 文件/目录命名必须全英文小写，短横线分隔，禁止空格与中文
- 新增文档必须更新所属栏目 index.md 与 mkdocs_parts/nav.yml
- 修改后必须执行：python tools/mkdocs_merge.py && python -m mkdocs build --strict
```

## 参数说明

- `{background}`：补充业务背景/已有目录结构/你希望放到哪个栏目
- `{requirements}`：逐条列出验收标准（可访问性、排序、跳转规则等）

## 示例输入输出

示例输入（节选）：

```text
{background} = 在 MkDocs + Material 文档站点中新增一个“Claude Code”提示词子栏目
{requirements} = 新增目录与文档；挂载到“提示词”栏目；构建严格校验通过
```

预期输出（节选）：

```text
- 新增文件：docs/PROMPTS/claude-code/index.md、docs/PROMPTS/claude-code/dev-task-execution.md
- 更新导航：mkdocs_parts/nav.yml（提示词 -> Claude Code）
- 验证：mkdocs build --strict exit code 0
```

## 注意事项

- 如果页面路径变更且项目未启用 redirects 插件，优先通过“保留旧页占位 + 明确跳转提示”避免 404。
- 对同一目录下的多个 Markdown 示例，保持一致的标题层级（H1 仅一个，后续用 H2/H3）。
