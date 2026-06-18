# 第3章：命令行快速入门



## 学习目标

学完这一章，你将知道：
- ✅ 怎么用MinerU处理PDF
- ✅ 常用的命令有哪些
- ✅ 怎么选择不同的处理方式
- ✅ 怎么看懂输出结果

---

## 3.1 最简单的使用方法

### 只需要记住一个命令

```bash
mineru -p 输入文件 -o 输出目录
```

**这条命令在说什么？**

- `mineru`：运行MinerU程序
- `-p 输入文件`：要处理的PDF文件在哪里（p代表path=路径）
- `-o 输出目录`：处理后保存到哪里（o代表output=输出）

---

### 举个例子

假设你有一个PDF文件叫`技术手册.pdf`，想处理后保存到`output`文件夹：

```bash
mineru -p 技术手册.pdf -o output
```

**MinerU会做什么？**

1. 打开`技术手册.pdf`
2. 分析这个文件
3. 提取文字、表格、公式、图片
4. 保存到`output`文件夹

---

### 实际操作（手把手）

#### 步骤1：准备一个PDF文件

```bash
# 1. 创建一个文件夹
mkdir test1

# 2. 进入这个文件夹
cd test1

# 3. 把你的PDF文件复制到这里
# 或者用一个测试PDF
wget https://arxiv.org/pdf/2409.18839 -O test.pdf
```

**如果没有wget命令**：
直接用你的文件管理器，把PDF文件复制到test1文件夹。

---

#### 步骤2：运行MinerU

```bash
# 在test1文件夹中，运行：
mineru -p test.pdf -o output
```

**你会看到的输出**：
```
[INFO] 开始解析文档...
[INFO] 使用hybrid-auto-engine后端...
[INFO] 检测文档类型：text PDF
[INFO] 解析进度：100%
[INFO] 解析完成！
[INFO] 输出目录: output
```

**这些输出是什么意思？**

| 输出 | 意思 |
|------|------|
| [INFO] 开始解析文档... | 开始处理PDF |
| 使用hybrid-auto-engine后端 | 用了哪种处理方式（后面会讲） |
| 检测文档类型：text PDF | 这是一个文字版PDF（不是扫描版） |
| 解析进度：100% | 处理完成了 |
| 输出目录: output | 结果保存在output文件夹 |

---

#### 步骤3：查看结果

```bash
# 看看output文件夹里有什么
ls -lh output
```

**你会看到**：
```
output/
├── test.md                    # 这是处理后的文字
├── test_middle.json            # 这是中间数据
├── test_model.json            # 这是模型输出
├── test_content_list.json      # 这是内容列表
├── test_layout.pdf            # 这是布局可视化
├── test_span.pdf              # 这是文字可视化
├── test_origin.pdf            # 这是原始PDF
└── images/                   # 这里是提取的图片
    ├── image_0.png
    ├── image_1.png
    └── ...
```

---

#### 步骤4：打开处理结果

```bash
# 用文本编辑器打开test.md
# 可以用记事本、VSCode、或者其他编辑器

# 如果用命令行查看前几行：
head test.md
```

**你会看到什么？**
```markdown
# 技术手册

## 1. 产品介绍

这是产品介绍段落。

### 1.1 功能特点

- 特点1
- 特点2

**表格1.1**：技术参数

| 参数 | 值 |
|------|-----|
| 电压 | 220V |
| 功率 | 100W |

**公式**：$P = U \times I$
```

**这是什么格式？**
- 这是Markdown格式
- 是一种简单的文字格式
- 很多软件都能打开（记事本、VSCode等）

---

## 3.2 处理多个文件

### 方法1：一次处理一个文件夹里的所有PDF

假设你有一个文件夹叫`documents`，里面有很多PDF：

```bash
# 处理documents文件夹里的所有PDF
mineru -p documents -o output_all
```

**MinerU会做什么？**
- 自动找到documents文件夹里的所有PDF文件
- 逐个处理
- 把所有结果都放到output_all文件夹

**注意**：
- `-p`后面可以是单个文件，也可以是文件夹
- 如果是文件夹，会处理里面所有的PDF

---

### 方法2：只处理特定文件

```bash
# 只处理第一个PDF
mineru -p documents/产品手册.pdf -o output_1

# 只处理第二个PDF
mineru -p documents/技术规格.pdf -o output_2
```

---

## 3.3 不同的处理方式

### 5种"后端"（处理引擎）

MinerU有5种不同的处理方式，我们叫它们"后端"（backend）。

**用生活中的例子理解**：
就像你做菜，可以用不同的方法：
- 方法1：用煤气灶（快，但需要燃气）
- 方法2：用电饭煲（慢，但方便）
- 方法3：用微波炉（最快，但不是所有菜都适合）

MinerU的5种后端也是类似的道理。

---

| 后端 | 速度 | 准确度 | 需要什么 | 什么时候用 |
|------|------|--------|---------|-----------|
| **pipeline** | 较慢 | 一般（82%） | 纯CPU | 没有GPU，快速测试 |
| **vlm-auto-engine** | 快 | 很高（90%） | GPU/NPU | 有GPU，要高准确度 |
| **vlm-http-client** | 一般 | 很高（90%） | 服务器 | 用远程服务器处理 |
| **hybrid-auto-engine** | 最快 | 很高（90%） | GPU/NPU | ⭐ 推荐用这个（默认） |
| **hybrid-http-client** | 一般 | 很高（90%） | 服务器 | 用远程服务器 |

---

### 选择哪个后端？

#### 情况1：你的电脑没有GPU

**用什么**：pipeline

**命令**：
```bash
mineru -p test.pdf -o output -b pipeline
```

**说明**：
- `-b`代表backend（后端）
- 用CPU处理，速度慢一点，但能用

---

#### 情况2：你的电脑有GPU（NVIDIA显卡）

**用什么**：hybrid-auto-engine（推荐）

**命令**：
```bash
mineru -p test.pdf -o output -b hybrid-auto-engine
```

**说明**：
- 这是默认的，不写`-b`也行
- 用GPU加速，速度快，准确度高

---

#### 情况3：你想用远程服务器

**用什么**：vlm-http-client 或 hybrid-http-client

**命令**：
```bash
mineru -p test.pdf -o output -b vlm-http-client -u http://服务器地址:端口
```

**说明**：
- `-u`指定服务器地址
- 适合本地资源不够的情况

---

### 后端对比（实际例子）

**测试同一个PDF（10页）**：

| 后端 | 处理时间 | 准确度 | 适用情况 |
|------|---------|--------|---------|
| pipeline | 30秒 | 82% | 没GPU，快速测试 |
| hybrid-auto-engine | 12秒 | 90% | 有GPU，推荐用这个 ⭐ |
| vlm-auto-engine | 15秒 | 92% | 有GPU，要最高准确度 |

**结论**：
- 有GPU就用`hybrid-auto-engine`（默认）
- 没GPU就用`pipeline`
- 没GPU但想提高准确度 → 换个有GPU的电脑，或者用远程服务器

---

## 3.4 处理不同类型的PDF

### 3种PDF类型

| 类型 | 说明 | 怎么判断 |
|------|------|---------|
| **文字PDF** | 可以直接复制文字的PDF | 选中文字，能复制粘贴 |
| **扫描PDF** | 整个是图片的PDF | 选中文字，复制的是空白 |
| **混合PDF** | 有文字有图片 | 部分能复制，部分不能 |

---

### 自动检测 vs 手动指定

**默认情况**：

```bash
mineru -p test.pdf -o output -m auto
```

**说明**：
- `-m auto`：自动检测PDF类型（默认）
- MinerU会自己判断是文字PDF还是扫描PDF
- 自动选择最合适的处理方式

---

**强制指定**：

如果MinerU判断错了，你可以手动指定：

```bash
# 强制当文字PDF处理（不OCR）
mineru -p test.pdf -o output -m txt

# 强制当扫描PDF处理（用OCR）
mineru -p test.pdf -o output -m ocr
```

**什么时候需要手动指定？**
- 你很确定这个PDF是扫描版，但MinerU没识别出来
- 你知道这个PDF是文字版，想跳过OCR（更快）

---

### OCR是什么？

**OCR = 光学字符识别**

**简单说**：
- 把图片里的文字"认"出来
- 就像扫描仪扫描文件后，识别里面的文字

**什么时候需要OCR？**
- 扫描版PDF（整个是图片）
- 手机拍照的文档
- 图片里的文字

---

## 3.5 处理不同语言的PDF

### 109种语言支持

MinerU支持109种语言，包括：

| 语言 | 命令参数 | 说明 |
|------|---------|------|
| **中文（简体）** | `-l ch` | 默认 |
| **中文（服务器版）** | `-l ch_server` | 准确度更高，速度稍慢 |
| **中文（轻量版）** | `-l ch_lite` | 速度更快，准确度稍低 |
| **英文** | `-l en` | 英文文档 |
| **日文** | `-l japan` | 日文文档 |
| **韩文** | `-l korean` | 韩文文档 |
| **繁体中文** | `-l chinese_cht` | 港台文档 |

---

### 怎么指定语言？

```bash
# 中文文档（默认，不用写）
mineru -p test.pdf -o output

# 英文文档
mineru -p test.pdf -o output -l en

# 日文文档
mineru -p test.pdf -o output -l japan
```

**说明**：
- `-l`代表language（语言）
- 如果知道是什么语言，最好指定一下
- 这样识别更准确

---

### 自动语言检测

**不指定语言会怎样？**

```bash
# 不指定语言
mineru -p test.pdf -o output
```

**MinerU会做什么？**

- 默认用中文模型处理
- 如果是英文，也能识别（但可能不那么准确）

**建议**：

- 如果知道是什么语言，最好指定`-l`
- 例如英文文档写`-l en`

---

## 3.6 只处理部分页面

### 什么时候需要？

**场景1**：文档太大
- 有100页的PDF
- 你只想看看前面10页
- 不想等太久

**场景2**：跳过封面和目录
- 前3页是封面、目录
- 正文从第4页开始
- 只想处理正文

**场景3**：测试效果
- 看看处理效果怎么样
- 不想等全部处理完

---

### 怎么指定页面范围？

```bash
# 只处理前10页（从第1页到第10页）
mineru -p test.pdf -o output --end-page-id 9

# 从第5页开始处理（跳过前4页）
mineru -p test.pdf -o output --start-page-id 4

# 只处理第5页到第10页
mineru -p test.pdf -o output --start-page-id 4 --end-page-id 9
```

**注意**：
- 页码是从0开始算的（不是1）
- 第1页 = page 0
- 第5页 = page 4
- 第10页 = page 9

**例子**：

```
--start-page-id 4    从第5页开始（page 4）
--end-page-id 9      到第10页结束（page 9）
```

---

### 页码对照表

| 你说的 | 命令里写的 | 例子 |
|-------|-----------|------|
| 第1页 | 0 | `--start-page-id 0` |
| 第5页 | 4 | `--start-page-id 4` |
| 第10页 | 9 | `--end-page-id 9` |

---

## 3.7 完整命令示例

### 示例1：最简单的用法

```bash
# 处理一个PDF，用默认设置
mineru -p test.pdf -o output
```

**等价于**：
```bash
mineru -p test.pdf -o output -b hybrid-auto-engine -m auto -l ch
```

**说明**：
- 默认后端：hybrid-auto-engine
- 默认方法：auto（自动检测）
- 默认语言：ch（中文）

---

### 示例2：处理英文PDF

```bash
# 英文PDF，用GPU加速
mineru -p manual_en.pdf -o output_en -l en -b hybrid-auto-engine
```

**分解**：
- `-p manual_en.pdf`：输入文件是manual_en.pdf
- `-o output_en`：输出到output_en文件夹
- `-l en`：是英文文档
- `-b hybrid-auto-engine`：用GPU加速

---

### 示例3：只处理前10页

```bash
# 处理前10页，扫描PDF
mineru -p manual.pdf -o output_10pages -m ocr --end-page-id 9
```

**分解**：
- `-p manual.pdf`：输入文件
- `-o output_10pages`：输出目录
- `-m ocr`：强制用OCR（扫描PDF）
- `--end-page-id 9`：只处理到第10页

---

### 示例4：批量处理文件夹

```bash
# 处理documents文件夹里所有PDF
mineru -p documents -o output_all
```

**说明**：
- `-p documents`：documents是一个文件夹
- 会处理这个文件夹里所有的PDF

---

## 3.8 常用参数总结

### 必需参数

| 参数 | 说明 | 例子 |
|------|------|------|
| `-p` | 输入文件或文件夹 | `-p test.pdf` |
| `-o` | 输出目录 | `-o output` |

---

### 常用可选参数

| 参数 | 说明 | 默认值 | 例子 |
|------|------|--------|------|
| `-b` | 处理后端 | hybrid-auto-engine | `-b pipeline` |
| `-m` | 处理方法 | auto | `-m ocr` |
| `-l` | 语言 | ch | `-l en` |
| `--start-page-id` | 起始页码（从0开始） | 0 | `--start-page-id 4` |
| `--end-page-id` | 结束页码（不包含） | 全部 | `--end-page-id 9` |

---

## 3.9 输出文件详解

### 输出目录里有什么？

```
output/
├── test.md                    # ⭐ 这是最重要的：处理后的文字
├── test_middle.json            # 中间数据（给程序用的）
├── test_model.json            # 模型输出（给调试用的）
├── test_content_list.json      # 内容列表（按顺序排列）
├── test_layout.pdf            # 布局可视化（看布局的）
├── test_span.pdf              # 文字可视化（看文字的）
├── test_origin.pdf            # 原始PDF（备份）
└── images/                   # 提取的图片
    ├── image_0.png
    ├── image_1.png
    └── ...
```

---

### 哪些文件最重要？

**最重要的文件**：
1. **test.md** - 处理后的文字（你需要这个！）
2. **images/** - 提取的图片（如果有图片）

**给程序用的文件**：

3. **test_middle.json** - 中间数据
4. **test_content_list.json** - 内容列表

**调试用的文件**：
5. **test_model.json** - 模型输出
6. **test_layout.pdf** - 布局可视化
7. **test_span.pdf** - 文字可视化
8. **test_origin.pdf** - 原始PDF

---

## 本章小结

### 核心要点

1. **最简单命令**：
   ```bash
   mineru -p 输入文件 -o 输出目录
   ```

2. **后端选择**：
   - 有GPU → hybrid-auto-engine（默认）
   - 没GPU → pipeline

3. **方法选择**：
   - 自动检测 → `-m auto`（默认）
   - 强制OCR → `-m ocr`

4. **语言选择**：
   - 中文 → 不用写
   - 英文 → `-l en`

5. **页面控制**：
   - 只处理前N页 → `--end-page-id N-1`
   - 从第N页开始 → `--start-page-id N-1`

---

## 实践任务

### 任务1：处理你的第一个PDF

- [ ] 准备一个PDF文件
- [ ] 运行`mineru -p 你的PDF -o output`
- [ ] 查看output目录
- [ ] 打开.md文件查看

### 任务2：尝试不同参数

- [ ] 用不同的后端试试（`-b`）
- [ ] 指定页面范围（`--start-page-id`和`--end-page-id`）
- [ ] 对比处理结果

### 任务3：处理文件夹

- [ ] 准备一个有多个PDF的文件夹
- [ ] 运行`mineru -p 文件夹 -o output`
- [ ] 查看处理了多少个PDF
