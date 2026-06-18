# 第2章：系统要求与安装

## 学习目标

学完这一章，你将知道：

- ✅ 你的电脑能不能装MinerU
- ✅ 怎么安装MinerU（手把手教你）
- ✅ 怎么检查安装是否成功
- ✅ 遇到问题怎么解决

***

## 2.1 你的电脑能不能装MinerU？

### 先检查这几项

#### 检查项1：操作系统

MinerU支持的操作系统：

| 操作系统          | 版本要求                     | 能不能装 |
| ------------- | ------------------------ | ---- |
| **Windows**   | Win10、Win11              | ✅ 能装 |
| **苹果电脑（Mac）** | macOS 14.0或更新            | ✅ 能装 |
| **Linux**     | Ubuntu 20.04+、CentOS 8+等 | ✅ 能装 |

**怎么查看系统版本？**

**Windows**：

```
方法1：点击"开始" → "设置" → "系统" → "关于"
       看到"Windows版本"就可以了

方法2：按键盘 Win + R
       输入 winver
       回车
       会弹出一个窗口显示版本
```

**Mac**：

```
点击左上角  图标 → "关于本机"
看"macOS"后面的版本号
```

**Linux**：

```bash
# 在终端输入以下命令
cat /etc/os-release
```

***

#### 检查项2：Python版本

MinerU需要Python 3.10到3.13版本。

**怎么检查Python版本？**

**方法1：命令行检查**

```bash
# 打开命令行（Windows按Win+R输入cmd）
# 然后输入：
python --version
# 或
python3 --version
```

**可能的输出：**

```
Python 3.11.0  ✅ 能装（在3.10-3.13范围内）
Python 3.9.0  ❌ 不能装（太老了，需要升级）
Python 3.14.0 ❌ 不能装（太新了，还不支持）
```

**方法2：如果没有Python**

如果你看到这样的提示：

```
'python' 不是内部或外部命令
```

说明你还没有安装Python，需要先安装。

***

#### 检查项3：电脑配置

**最基本的要求**：

| 配置          | 最低要求 | 推荐配置  |
| ----------- | ---- | ----- |
| **内存（RAM）** | 16GB | 32GB  |
| **硬盘空间**    | 20GB | 50GB  |
| **CPU**     | 4核   | 8核或更多 |

**怎么看配置？**

**Windows**：

```
1. 右键"此电脑" → "属性"
2. 看到系统信息
   - 处理器 = CPU
   - 安装内存(RAM) = 内存
```

**Mac**：

```
点击左上角  图标 → "关于本机"
直接显示内存、CPU等信息
```

**Linux**：

```bash
# 查看内存
free -h

# 查看CPU
lscpu

# 查看硬盘
df -h
```

***

#### 检查项4：显卡（GPU）【可选】

**MinerU可以用GPU加速，但不是必须的！**

**怎么检查有没有GPU？**

**Windows**：

```
方法1：
1. 右键"此电脑" → "属性"
2. 点击"设备管理器"
3. 找到"显示适配器"
4. 如果看到NVIDIA开头的，说明有NVIDIA显卡

方法2：
按键盘 Win + R
输入 dxdiag
回车
看"显示"选项卡
```

**Mac**：

```
Mac自带显卡（M1/M2/M3芯片）
不用另外检查
```

**Linux**：

```bash
# 如果有NVIDIA显卡
nvidia-smi

# 如果没有这个命令，说明没有NVIDIA显卡
```

**总结**：

- ✅ 有GPU → 可以用GPU加速，速度更快
- ⭕ 没有GPU → 也可以用，用CPU处理，速度慢一点

***

## 2.2 安装Python（如果需要）

### 如果你的Python版本不对

**情况1：Python太老（3.9或更早）**

需要升级Python。

**Windows用户**：

```
1. 访问 https://www.python.org/downloads/
2. 下载Python 3.10、3.11、3.12或3.13版本
3. 运行安装程序
4. ⚠️ 重要：勾选 "Add Python to PATH"
5. 点击 "Install Now"
6. 等待安装完成
7. 重启电脑
```

**Mac用户**：

```bash
# 使用Homebrew安装（如果没有Homebrew，先安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装Python
brew install python@3.11
```

**Linux用户**：

```bash
# 使用pyenv安装（推荐）

# 1. 安装pyenv
curl https://pyenv.run | bash

# 2. 添加到环境变量
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bashrc
echo '[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(pyenv init -)"' >> ~/.bashrc
source ~/.bashrc

# 3. 安装Python 3.11
pyenv install 3.11.0
pyenv global 3.11.0
```

***

**情况2：没有Python**

按照上面的方法安装Python 3.11（推荐）

***

## 2.3 安装MinerU

### 最简单的安装方法：用pip安装

**什么是pip？**

pip是Python的"应用商店"，专门用来安装Python软件的。

***

### 安装步骤（手把手）

#### 步骤1：打开命令行

**Windows**：

```
方法1：按键盘 Win + R
       输入 cmd
       回车

方法2：点击"开始" → 搜索"cmd"
       点击"命令提示符"
```

**Mac**：

```
打开"终端"（Terminal）
按键盘 Cmd + 空格，搜索"终端"
```

**Linux**：

```
打开终端（Terminal）
按键盘 Ctrl + Alt + T
```

***

#### 步骤2：升级pip（可选但推荐）

```bash
# 在命令行输入：
pip install --upgrade pip
```

**做什么**：

- 把pip升级到最新版本
- 确保后面安装MinerU时不会出问题

**可能看到的输出**：

```
Requirement already satisfied: pip in ...
(已经是最新的了，不用管）
```

***

#### 步骤3：安装MinerU

```bash
# 在命令行输入：
pip install "mineru[all]"
```

**这条命令在做什么？**

- `pip install`：用pip安装软件
- `"mineru[all]"`：安装MinerU及其所有功能（包括OCR等）

**可能看到的输出**：

```
Collecting mineru
  Downloading mineru-2.7.6-py3-none-any.whl (xxx kB)
Installing collected packages: mineru
Successfully installed mineru-2.7.6
```

**可能需要几分钟**，因为：

- 要下载MinerU软件（约2GB）
- 要下载模型文件（约5-10GB）
- 要安装各种依赖

***

#### 步骤4：等待安装完成

**安装过程中的提示**：

正常情况：

```
Downloading...  (正在下载）
Installing...  (正在安装）
Successfully installed...  (安装成功）
```

***

### 常见问题解决

#### 问题1：网络问题（下载失败）

**错误提示**：

```
ERROR: Could not find a version that satisfies the requirement...
Connection timeout
```

**原因**：
网络无法连接到国外服务器（Hugging Face）

**解决方法1：使用国内镜像（推荐）**

```bash
# 设置使用国内镜像
export MINERU_MODEL_SOURCE=modelscope

# 然后重新安装
pip install "mineru[all]"
```

**解决方法2：使用代理（如果你有）**

```bash
# 设置代理（替换成你的代理地址）
export http_proxy=http://127.0.0.1:7890
export https_proxy=http://127.0.0.1:7890

# 然后安装
pip install "mineru[all]"
```

***

#### 问题2：权限问题（Windows）

**错误提示**：

```
ERROR: Could not install packages due to an EnvironmentError: [WinError 5] Access is denied
```

**原因**：
没有管理员权限

**解决方法**：

```
1. 右键点击"命令提示符"
2. 选择"以管理员身份运行"
3. 然后重新运行安装命令
```

***

#### 问题3：依赖冲突

**错误提示**：

```
ERROR: pip's dependency resolver does not currently take into account all the packages that are installed
```

**原因**：
电脑里已经有其他Python包，和MinerU的包有冲突

**解决方法：使用虚拟环境（推荐）**

```bash
# 创建一个虚拟环境（就像给MinerU准备一个独立的房间）
python -m venv mineru_env

# 激活虚拟环境

# Windows:
mineru_env\Scripts\activate

# Mac/Linux:
source mineru_env/bin/activate

# 然后在虚拟环境中安装MinerU
pip install "mineru[all]"
```

***

## 2.4 检查安装是否成功

### 验证步骤

#### 验证1：查看版本

```bash
# 在命令行输入：
mineru --version
```

**预期输出**：

```
MinerU 2.7.6
```

**如果看到这个，说明安装成功！** ✅

**如果看到错误**：

```
'mineru' 不是内部或外部命令
```

说明安装失败，回到上面检查问题。

***

#### 验证2：查看帮助

```bash
# 在命令行输入：
mineru --help
```

**预期输出**（会显示很多帮助信息）：

```
Usage: mineru [OPTIONS]

  MinerU: 一站式文档解析解决方案

Options:
  -p, --pdf-path PATH        PDF文件路径或目录
  -o, --output-dir PATH      输出目录
  -b, --backend TEXT         解析后端（默认：hybrid-auto-engine）
  ...
```

**如果看到这些帮助信息，说明没问题！** ✅

***

## 2.5 第一次使用MinerU

### 测试解析一个PDF

#### 准备测试PDF

**如果没有测试PDF，可以下载一个**：

```bash
# 创建测试目录
mkdir mineru_test
cd mineru_test

# 下载测试PDF（示例）
wget https://arxiv.org/pdf/2409.18839 -O test.pdf
```

**或者用自己的PDF**：

```
1. 找一个PDF文件
2. 复制到mineru_test目录
3. 改名为test.pdf
```

***

#### 运行MinerU

```bash
# 在命令行输入：
mineru -p test.pdf -o output
```

**这条命令在做什么**：

- `-p test.pdf`：要处理的PDF文件是test.pdf
- `-o output`：输出到output目录

**可能看到的输出**：

```
[INFO] 开始解析文档...
[INFO] 使用hybrid-auto-engine后端...
[INFO] 检测文档类型：text PDF
[INFO] 解析进度：100%
[INFO] 解析完成！
[INFO] 输出目录: output
```

***

#### 查看输出结果

```bash
# 查看输出目录
ls -lh output/
```

**预期输出**：

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

**恭喜！如果看到这些文件，说明MinerU正常工作了！** 🎉

***

#### 查看处理结果

```bash
# 用文本编辑器打开test.md
# 或用命令行查看前几行
head test.md
```

**你会看到**：

- PDF里的文字都提取出来了
- 按照正确的顺序排列
- 表格、公式、图片都有标注

***

## 2.6 常见问题

### 问题1：安装很慢，一直卡住

**可能原因**：

- 正在下载模型文件（很大）
- 网络速度慢

**解决方法**：

1. 耐心等待（可能需要10-20分钟）
2. 换个网络试试（比如手机热点）
3. 使用国内镜像（见上面问题1的解决方法）

***

### 问题2：安装时提示磁盘空间不足

**错误提示**：

```
ERROR: No space left on device
```

**解决方法**：

1. 清理磁盘空间
2. 或者安装到其他磁盘

```bash
# 安装到其他磁盘（Windows）
# D盘改为你的目标盘
set PYTHONUSERBASE=D:\MinerU
pip install --user "mineru[all]"
```

***

### 问题3：运行mineru命令提示找不到

**错误提示**：

```
'mineru' 不是内部或外部命令
```

**解决方法**：

**方法1：检查Python路径**

```bash
# 查看Python安装位置
python -m site --user-base

# 查看Scripts目录
ls C:\Users\你的用户名\AppData\Roaming\Python\Python311\Scripts\
```

**方法2：添加Python到PATH（Windows）**

```
1. 搜索"环境变量"
2. 点击"编辑系统环境变量"
3. 点击"环境变量"
4. 在"系统变量"中找到"Path"
5. 点击"编辑"
6. 添加Python的Scripts目录
7. 点击"确定"
8. 重启命令行
```

***

### 问题4：想用GPU加速，但不知道怎么配置

**简单方法**：

如果你有NVIDIA显卡，MinerU会自动使用GPU（如果有的话）

**检查是否用了GPU**：

```bash
# 运行mineru时，观察CPU/GPU使用率
# Windows：打开任务管理器
# 如果GPU使用率上升，说明在用GPU
```

**如果没用到GPU**：

- 检查NVIDIA驱动是否安装
- 检查CUDA是否安装
- 或者在第3章会详细讲解

***

## 2.7 安装检查清单

完成安装后，请逐项检查：

### 基础检查

- [ ] 操作系统是Windows/Mac/Linux
- [ ] Python版本在3.10-3.13之间
- [ ] 内存≥16GB，硬盘空间≥20GB
- [ ] 运行`mineru --version`能看到版本号
- [ ] 运行`mineru --help`能看到帮助信息

### 功能检查

- [ ] 能解析一个测试PDF
- [ ] 输出目录正常生成
- [ ] test.md文件存在且不为空
- [ ] images目录存在

### GPU检查（可选）

- [ ] （有GPU）查看GPU使用率，确认在用GPU
- [ ] （无GPU）知道MinerU会自动用CPU

***

## 本章小结

### 核心要点

1. **系统要求**：
   - 操作系统：Win10+ / Mac14+ / Linux 20.04+
   - Python：3.10-3.13
   - 内存：≥16GB
   - 硬盘：≥20GB
   - GPU：可选，但推荐
2. **安装步骤**：
   - 打开命令行
   - 升级pip
   - 运行`pip install "mineru[all]"`
   - 等待完成
3. **验证安装**：
   - `mineru --version`：查看版本
   - `mineru --help`：查看帮助
   - 测试解析一个PDF
4. **常见问题**：
   - 网络问题 → 用国内镜像
   - 权限问题 → 用管理员运行
   - 依赖冲突 → 用虚拟环境
   - 命令找不到 → 检查PATH

***

## 实践任务

### 任务1：检查系统

- [ ] 查看操作系统版本
- [ ] 查看Python版本
- [ ] 查看内存和硬盘空间

### 任务2：安装MinerU

- [ ] 打开命令行
- [ ] 升级pip
- [ ] 安装MinerU
- [ ] 等待安装完成

### 任务3：验证安装

- [ ] 运行`mineru --version`
- [ ] 运行`mineru --help`
- [ ] 测试解析一个PDF

