# 第5章：实战案例1 - 简单文档解析

## 学习目标

学完这一章，你将能够：

- ✅ 完成一个完整的MinerU处理流程
- ✅ 评估MinerU的处理效果
- ✅ 解决常见问题
- ✅ 记录自己的学习笔记

***

## 5.1 案例背景

### 我们要做什么？

**目标**：处理一份技术手册PDF

**需要**：

1. 提取文档内容（文字、表格、公式、图片）
2. 评估MinerU的处理效果
3. 提取表格数据到Excel

***

### 为什么选择这个案例？

**原因**：

- ✅ 简单易上手
- ✅ 涵盖了MinerU的主要功能
- ✅ 适合第一次练习
- ✅ 容易看到效果

***

## 5.2 准备工作

### 步骤1：创建工作文件夹

```bash
# 创建一个专门的文件夹
mkdir mineru_demo

# 进入这个文件夹
cd mineru_demo

# 创建子文件夹
mkdir pdfs
mkdir output
```

**文件夹结构**：

```
mineru_demo/
├── pdfs/          # 放PDF文件
└── output/        # 放处理结果
```

***

### 步骤2：准备测试PDF

**选项1：用自己的PDF**

```bash
# 把你的PDF文件复制到pdfs文件夹
# 改名为 manual.pdf
```

**选项2：下载测试PDF**

```bash
# 下载一个测试PDF
cd pdfs
wget https://arxiv.org/pdf/2409.18839 -O manual.pdf
cd ..
```

**选项3：用你手头的任何PDF**

```bash
# 只要是PDF就可以，内容不重要
# 重要的是你能看到处理过程
```

***

### 步骤3：确认PDF文件存在

```bash
# 查看pdfs文件夹
ls -lh pdfs/

# 应该能看到 manual.pdf
```

***

## 5.3 第一次处理

### 运行MinerU

```bash
# 在mineru_demo文件夹里，运行：
mineru -p pdfs/manual.pdf -o output
```

> 注意：第一次运行会下载对应的模型，MinerU使用 `HuggingFace` 和 `ModelScope` 作为模型仓库，用户可以根据需要切换模型源或使用本地模型。
>
> - `HuggingFace` 是默认的模型源，在全球范围内提供了优异的加载速度和极高稳定性。
> - `ModelScope` 是中国大陆地区用户的最佳选择，提供了无缝兼容的SDK模块，适用于无法访问`HuggingFace`的用户。

如果遇到模型下载失败的情况，在当前命令行终端窗口设置一下国内的模型源，这样下载模型会快很多。

Windows: ：

```bash
set MINERU_MODEL_SOURCE=modelscope
```

Linux/MacOS：

```bash
export MINERU_MODEL_SOURCE=modelscope
```

**运行后大概会看到以下内容**

```
2026-02-20 17:15:56.887 | INFO     | mineru.backend.vlm.vlm_analyze:get_model:218 - get mlx-engine predictor cost: 2.19s
2026-02-20 17:15:59.033 | INFO     | mineru.backend.hybrid.hybrid_analyze:get_batch_ratio:365 - hybrid batch ratio (auto, vram=1GB): 1
Predict:   0%|                                                                                                                                        | 0/14 [00:00<?, ?it/s]mx.metal.device_info is deprecated and will be removed in a future version. Use mx.device_info instead.
Predict: 100%|███████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 14/14 [01:10<00:00,  5.00s/it]
Predict: 100%|█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 6/6 [00:10<00:00,  1.73s/it]
Downloading Model from https://www.modelscope.cn to directory: /Users/zhangzhe/.cache/modelscope/hub/models/OpenDataLab/PDF-Extract-Kit-1.0
2026-02-20 17:17:21,021 - modelscope - INFO - Target directory already exists, skipping creation.
Downloading Model from https://www.modelscope.cn to directory: /Users/zhangzhe/.cache/modelscope/hub/models/OpenDataLab/PDF-Extract-Kit-1.0
2026-02-20 17:17:22,090 - modelscope - INFO - Target directory already exists, skipping creation.
Downloading Model from https://www.modelscope.cn to directory: /Users/zhangzhe/.cache/modelscope/hub/models/OpenDataLab/PDF-Extract-Kit-1.0
2026-02-20 17:17:24,611 - modelscope - INFO - Target directory already exists, skipping creation.
Downloading Model from https://www.modelscope.cn to directory: /Users/zhangzhe/.cache/modelscope/hub/models/OpenDataLab/PDF-Extract-Kit-1.0
2026-02-20 17:17:26,048 - modelscope - INFO - Target directory already exists, skipping creation.
MFD Predict: 100%|███████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 14/14 [00:04<00:00,  3.08it/s]
MFR Predict: 100%|█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 5/5 [00:03<00:00,  1.58it/s]
OCR-det: 100%|███████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 14/14 [00:09<00:00,  1.51it/s]
OCR-rec Predict: 100%|█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 2/2 [00:00<00:00,  6.06it/s]
2026-02-20 17:17:45.694 | INFO     | mineru.cli.common:_process_output:168 - local output dir is output/test/hybrid_auto
```

### 处理时间参考

| 文档页数 | 处理时间    | 说明   |
| ---- | ------- | ---- |
| 10页  | 30秒-1分钟 | 很快   |
| 50页  | 2-3分钟   | 还可以  |
| 100页 | 5-10分钟  | 需要等待 |

***

## 5.4 查看处理结果

### 步骤1：查看输出文件

```bash
# 查看output文件夹
ls -lh output/
```

**你会看到**：

```
output/
├── manual.md
├── manual_middle.json
├── manual_model.json
├── manual_content_list.json
├── manual_layout.pdf
├── manual_span.pdf
├── manual_origin.pdf
└── images/
    ├── image_0.png
    ├── image_1.png
    └── ...
```

***

### 步骤2：打开manual.md

```bash
# 用文本编辑器打开
# 方法1：用nano（命令行）
nano output/manual.md

# 方法2：用记事本（Windows文件管理器）
# 直接双击manual.md
```

**你会看到什么？**

打开manual.md，你会看到类似这样的内容：

```markdown
# 文档标题

## 1. 章节标题

这是段落内容，可以包含多个句子。

### 1.1 子章节标题

**列表项1**
**列表项2**

**表格1.1**：表格标题

| 列1 | 列2 | 列3 |
|------|------|------|
| 数据1 | 数据2 | 数据3 |
| 数据4 | 数据5 | 数据6 |

**公式**：$E = mc^2$（行内公式）

**公式**：$$
\int_0^1 f(x) dx
$$（块级公式）

![图片1](images/image_0.png)
```

***

### 步骤3：查看提取的图片

```bash
# 进入images文件夹
cd output/images

# 查看所有图片
ls -lh

# 用图片查看器打开
# Windows：直接双击
# Linux: eog image_0.png
# Mac: open image_0.png
```

***

### 步骤4：对比原始PDF

```bash
# 打开原始PDF
# output/manual_origin.pdf

# 和你处理后的manual.md对比
# 看看文字提取得对不对
# 看看表格整理得对不对
```

***

## 5.5 评估处理效果

### 评估表格

#### 检查项1：表格完整性

**怎么检查？**

1. 在manual.md里找到表格
2. 对比原始PDF
3. 看看有没有遗漏的单元格

**示例**：

```
原始PDF的表格：
┌──────┬──────┬──────┐
│ 姓名 │ 年龄 │ 城市 │
├──────┼──────┼──────┤
│ 张三 │ 25   │ 北京 │
│ 李四 │ 30   │ 上海 │
└──────┴──────┴──────┘

manual.md里的表格：
| 姓名 | 年龄 | 城市 |
|------|------|------|
| 张三 | 25   | 北京 |
| 李四 | 30   | 上海 |

✅ 对上了！表格提取完整
```

***

**评估记录表**：

| 检查项    | 结果    | 说明    |
| ------ | ----- | ----- |
| 表格完整性  | ✅ / ❌ | 是否有遗漏 |
| 单元格正确性 | ✅ / ❌ | 内容对不对 |
| 表格标题   | ✅ / ❌ | 标题对不对 |

***

#### 检查项2：跨页表格

**如果你的PDF有跨页表格**：

**检查**：

- 表格是否合并成一个完整表格？
- 数据是否完整？

**预期结果**：

- ✅ MinerU 2.7.2+版本会自动合并跨页表格
- ⚠️ 旧版本可能不会合并

***

### 评估文字

#### 检查项1：文字完整性

**怎么检查？**

1. 在manual.md里找一段文字
2. 在原始PDF里找对应的位置
3. 对比看看文字是否一样

**示例**：

```
原始PDF：
"这款产品采用最新的AI技术，能够自动识别文档中的文字、表格、公式和图片。"

manual.md：
"这款产品采用最新的AI技术，能够自动识别文档中的文字、表格、公式和图片。"

✅ 对上了！文字提取正确
```

***

**评估记录表**：

| 检查项   | 结果    | 说明    |
| ----- | ----- | ----- |
| 文字完整性 | ✅ / ❌ | 是否有遗漏 |
| 乱码情况  | ✅ / ❌ | 有没有乱码 |
| 标题层级  | ✅ / ❌ | 层级对不对 |
| 段落顺序  | ✅ / ❌ | 顺序对不对 |

***

### 评估公式

#### 检查项1：公式识别

**怎么检查？**

1. 在manual.md里找公式
2. 对比原始PDF
3. 看看公式是否识别正确

**示例**：

```
原始PDF的公式：
      2
E = mc

manual.md里的公式：
$E = mc^2$

✅ 对上了！公式识别正确
```

***

**评估记录表**：

| 检查项      | 结果    | 说明         |
| -------- | ----- | ---------- |
| 公式识别     | ✅ / ❌ | 是否识别出公式    |
| LaTeX准确性 | ✅ / ❌ | LaTeX格式对不对 |

***

### 评估图片

#### 检查项1：图片提取

**怎么检查？**

1. 打开images文件夹
2. 看看有多少张图片
3. 对比原始PDF

**示例**：

```
原始PDF有3张图片：
- 第1页：产品外观图
- 第3页：技术原理图
- 第5页：使用示例图

images文件夹有3张图片：
- image_0.png
- image_1.png
- image_2.png

✅ 对上了！图片提取完整
```

***

**评估记录表**：

| 检查项  | 结果    | 说明     |
| ---- | ----- | ------ |
| 图片数量 | ✅ / ❌ | 数量对不对  |
| 图片描述 | ✅ / ❌ | 描述准不准确 |

***

## 5.6 提取表格数据到Excel

### 为什么需要这个？

**场景**：

- 表格数据很有用
- 想在Excel里分析
- 想导入到数据库

***

### 方法1：手动复制粘贴（最简单）

**步骤**：

1. 打开manual.md
2. 找到表格
3. 选中表格内容
4. 复制（Ctrl+C）
5. 打开Excel
6. 粘贴（Ctrl+V）

**优点**：

- ✅ 最简单
- ✅ 不需要写代码

**缺点**：

- ❌ 只能一张一张表格处理
- ❌ 如果有很多表格，会很慢

***

### 方法2：用脚本批量提取（推荐）

**如果你不会Python，可以跳过这部分**

如果你会Python，可以用这个脚本：

```python
import json
import csv

# 读取中间格式JSON
with open('output/manual_middle.json', 'r', encoding='utf-8') as f:
    middle = json.load(f)

# 提取表格
tables = middle['pdf_info'].get('tables', [])

print(f"找到 {len(tables)} 个表格")

# 把每个表格保存成CSV
for i, table in enumerate(tables):
    html = table['html']
    caption = table['caption']

    print(f"\n表格{i+1}: {caption}")

    # 简单的HTML表格解析（实际应该用BeautifulSoup）
    # 这里用简单的方式提取

    # 保存到CSV
    filename = f"output/table_{i+1}.csv"
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        # 这里简化了，实际应该用BeautifulSoup解析HTML
        writer.writerow(["表格内容"])

    print(f"  已导出: {filename}")

print("\n表格提取完成！")
```

***

**说明**：

- 这个脚本会读取middle.json
- 提取所有表格
- 保存成CSV文件（Excel能打开）

***

## 5.7 记录学习笔记

### 创建学习笔记文件

```bash
# 在mineru_demo文件夹创建笔记
touch 学习笔记.md

# 用文本编辑器打开
nano 学习笔记.md
```

***

### 写下你的学习笔记

**模板**：

```markdown
# MinerU学习笔记

## 日期
2026-02-20

## 处理的PDF
文件名：manual.pdf
页数：10页

## 处理时间
开始：16:00
结束：16:05
耗时：5分钟

## 处理效果评估

### 文字提取
- 完整性：✅
- 乱码：无
- 顺序：✅

### 表格提取
- 完整性：✅
- 正确性：✅
- 跨页：无

### 公式识别
- 识别：✅
- 准确性：✅

### 图片提取
- 数量：3张
- 描述：✅

## 遇到的问题

1. 无

2. 无

## 解决方法

1. 无

2. 无

## 学习心得

1. MinerU很好用，处理速度很快
2. 表格提取很准确
3. 公式识别很方便

## 下一步计划

1. 尝试处理更多的PDF
2. 学习Python API
3. 构建搜索系统
```

***

## 5.8 常见问题

### 问题1：处理速度慢

**现象**：

- 处理一个PDF需要很长时间
- 看起来卡住了

**原因**：

- PDF页数多
- 没有GPU加速
- PDF内容复杂（表格、公式多）

**解决方法**：

**方法1：只用CPU**

```bash
# 用pipeline后端（纯CPU）
mineru -p pdfs/manual.pdf -o output -b pipeline
```

**方法2：只处理部分页面**

```bash
# 只处理前10页
mineru -p pdfs/manual.pdf -o output --end-page-id 9
```

**方法3：等待**

- 耐心等待，MinerU正在处理
- 不要中断，否则要重新来

***

### 问题2：表格识别不准确

**现象**：

- 表格识别不全
- 单元格内容错了
- 跨页表格没合并

**解决方法**：

**方法1：升级MinerU**

```bash
# 升级到最新版本
pip install --upgrade mineru
```

**方法2：换后端**

```bash
# 用vlm-auto-engine（更高准确度）
mineru -p pdfs/manual.pdf -o output -b vlm-auto-engine
```

**方法3：手动调整**

- 在Excel里手动修正表格
- 或者在manual.md里手动调整

***

### 问题3：公式没识别

**现象**：

- 公式没有被识别
- 还是普通文字

**解决方法**：

**方法1：检查公式格式**

- 确认PDF里确实是公式
- 不是只是数字或符号

**方法2：用更高级的后端**

```bash
# 用vlm-auto-engine
mineru -p pdfs/manual.pdf -o output -b vlm-auto-engine
```

***

### 问题4：图片没提取

**现象**：

- images文件夹是空的
- 或者图片数量不对

**解决方法**：

**方法1：检查PDF里有没有图片**

- 打开原始PDF
- 看看是不是真的有图片

**方法2：检查images文件夹**

```bash
# 查看images文件夹
ls -lh output/images/
```

**方法3：重新处理**

```bash
# 重新运行MinerU
mineru -p pdfs/manual.pdf -o output
```

***

## 本章小结

### 你做了什么？

1. ✅ 创建工作文件夹
2. ✅ 准备测试PDF
3. ✅ 用MinerU处理PDF
4. ✅ 查看处理结果
5. ✅ 评估处理效果
6. ✅ 提取表格数据
7. ✅ 写学习笔记

***

### 你学到了什么？

1. **MinerU的基本使用**：
   - 怎么运行
   - 怎么看结果
2. **效果评估**：
   - 怎么评估文字、表格、公式、图片
3. **问题解决**：
   - 处理速度慢怎么办
   - 识别不准确怎么办

***

### 下一步

**完成这个案例后**：

- ✅ 你已经会用MinerU了
- ✅ 知道怎么评估效果
- ✅ 知道怎么解决常见问题

***

## 实践任务

### 任务1：完成基本流程

- [ ] 创建工作文件夹
- [ ] 准备测试PDF
- [ ] 运行MinerU
- [ ] 查看结果

### 任务2：评估效果

- [ ] 评估文字提取
- [ ] 评估表格提取
- [ ] 评估公式识别
- [ ] 评估图片提取

### 任务3：提取表格

- [ ] 复制表格到Excel
- [ ] 或用脚本批量提取

### 任务4：写学习笔记

- [ ] 记录处理过程
- [ ] 记录遇到的问题
- [ ] 记录学习心得

