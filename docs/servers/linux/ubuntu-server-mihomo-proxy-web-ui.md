# Ubuntu Server 部署 Mihomo 代理内核与本地 Web 仪表盘手册

本手册记录了在无图形界面的 Ubuntu Server 系统中，直接部署 **Mihomo**（原 Clash.Meta）二进制内核、配置为其底层常驻服务，并通过本地上传官方 **MetaCubeXD** 网页前端实现可视化管理的完整流程。

## 目录

1. [环境与准备工作](https://www.google.com/search?q=%231-环境与准备工作)
2. [内核下载与安装](https://www.google.com/search?q=%232-内核下载与安装)
3. [配置文件与分流数据准备](https://www.google.com/search?q=%233-配置文件与分流数据准备)
4. [本地管理面板 (Web UI) 上传与解压](https://www.google.com/search?q=%234-本地管理面板-web-ui-上传与解压)
5. [配置 Systemd 守护进程](https://www.google.com/search?q=%235-配置-systemd-守护进程)
6. [防火墙配置](https://www.google.com/search?q=%236-防火墙配置)
7. [服务验证与日常管理](https://www.google.com/search?q=%237-服务验证与日常管理)

## 1. 环境与准备工作

- **服务器环境**：Ubuntu Server（经测试适用于各种云服务器及老旧 CPU 虚拟化虚拟机）。
- **服务器 IP**：假设为 `192.168.100.165`（请根据实际情况替换）。
- **本地准备**：在本地电脑下载好前端面板压缩包 `metacubexd-gh-pages.zip`。

## 2. 内核下载与安装

由于部分虚拟化环境（如老旧 VPS、旧版 PVE/ESXi 虚拟机）的 CPU 缺少高级指令集（如 AVX2），默认的 Go 编译版可能会报 `This program can only be run on AMD64 processors with v3 microarchitecture support` 错误。因此，**推荐统一采用 `compatible`（兼容版）内核**。

Bash

```
# 创建临时目录并进入
mkdir -p ~/mihomo-src && cd ~/mihomo-src

# 下载 v1.18.9 兼容版内核
wget https://github.com/MetaCubeX/mihomo/releases/download/v1.18.9/mihomo-linux-amd64-compatible-v1.18.9.gz

# 解压文件
gzip -d mihomo-linux-amd64-compatible-v1.18.9.gz

# 移动到系统可执行路径并赋予运行权限
sudo mv mihomo-linux-amd64-compatible-v1.18.9 /usr/local/bin/mihomo
sudo chmod +x /usr/local/bin/mihomo
```

## 3. 配置文件与分流数据准备

### 3.1 创建配置目录

Bash

```
sudo mkdir -p /etc/mihomo
```

### 3.2 准备配置文件 `config.yaml`

在本地代理软件中导出可用的订阅配置，然后在服务器上创建并编辑：

Bash

```
sudo nano /etc/mihomo/config.yaml
```

将订阅内容粘贴进去，并**必须确保修改或添加**以下基础核心字段（注意 YAML 语法的冒号后空格）：

YAML

```
# 允许局域网设备连接
allow-lan: true
mixed-port: 7890

# 开启外部控制器，用于远程 Web 网页端管理
external-controller: '0.0.0.0:9090'
# 远程连接的访问密码
secret: 'YourSecurePassword123'

# 指定配置目录，方便内核读取 Geodata 数据
directory: '/etc/mihomo'

# 指定本地 Web UI 面板目录
external-ui: 'ui'
```

*保存并退出 (`Ctrl+O` -> `Enter` -> `Ctrl+X`)*。

### 3.3 下载必要的分流地理数据库

Bash

```
cd /etc/mihomo
sudo wget https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/country.mmdb
sudo wget https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat
sudo wget https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip.dat

# 确保数据库文件名为小写，避免内核无法识别
sudo mv Country.mmdb country.mmdb 2>/dev/null
```

## 4. 本地管理面板 (Web UI) 上传与解压

为规避现代浏览器的 **HTTPS/HTTP 混合内容拦截限制**（Mixed Content Block），将前端面板直接部署在 Ubuntu 本地是最完美的方案。

### 4.1 在本地电脑上传文件

打开本地电脑的终端（CMD/PowerShell/Terminal），将本地 `D:\metacubexd-gh-pages.zip` 上传至服务器用户的家目录下（不建议直接传 `/tmp`，可能遭遇系统权限拒绝）：

DOS

```
scp D:\metacubexd-gh-pages.zip luzhentian@192.168.100.165:~
```

### 4.2 在 Ubuntu 服务器上解压并安置面板

回到服务器的 SSH 终端执行：

Bash

```
# 确保系统安装了解压工具
sudo apt update && sudo apt install -y unzip

cd /etc/mihomo

# 将刚才上传到家目录的压缩包移动过来
sudo mv /home/luzhentian/metacubexd-gh-pages.zip ./

# 解压并重命名文件夹为 ui
sudo unzip metacubexd-gh-pages.zip
sudo mv metacubexd-gh-pages ui

# 清理无用的压缩包
sudo rm metacubexd-gh-pages.zip
```

## 5. 配置 Systemd 守护进程

配置 Systemd 可使服务常驻后台并在服务器重启后自动拉起。

### 5.1 创建服务文件

Bash

```
sudo nano /etc/systemd/system/mihomo.service
```

### 5.2 写入配置内容

Ini, TOML

```
[Unit]
Description=Mihomo Daemon (Clash.Meta)
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/etc/mihomo
ExecStart=/usr/local/bin/mihomo -d /etc/mihomo
Restart=on-failure
RestartSec=5
LimitNOFILE=1048576

[Install]
WantedBy=multi-user.target
```

### 5.3 启动并激活自启

Bash

```
sudo systemctl daemon-reload
sudo systemctl enable --now mihomo
```

## 6. 防火墙配置

若服务器开启了 UFW 防火墙，必须显式放行端口，本地电脑方可访问。

Bash

```
# 放行 9090 Web控制端口
sudo ufw allow 9090/tcp

# 放行 7890 代理端口（入站）
sudo ufw allow 7890/tcp
sudo ufw allow 7890/udp

# 重新载入生效
sudo ufw reload
```

## 7. 服务验证与日常管理

### 7.1 检查内核状态

Bash

```
sudo systemctl status mihomo
```

若显示绿色的 `active (running)`，说明服务运转正常。若遇到闪退，可通过 `sudo journalctl -u mihomo.service -n 50 --no-pager` 查看具体日志。

### 7.2 登录可视化面板

在本地电脑浏览器访问以下地址（**末尾的斜杠 `/` 必须加上**）：

Plaintext

```
http://192.168.100.165:9090/ui/
```

- **Host**: `192.168.100.165`
- **Port**: `9090`
- **Secret**: 输入 `config.yaml` 中配置的密码，点击连接。

### 7.3 终端代理流量测试

在 Ubuntu 终端手动为当前会话注入代理环境变量：

Bash

```
export http_proxy="http://127.0.0.1:7890"
export https_proxy="http://127.0.0.1:7890"
```

发起一个持续的长连接下载测试：

Bash

```
wget -O /dev/null https://dl.google.com/chrome/mac/stable/GGRO/googlechrome.dmg
```

**预期现象**：此时刷新 Web 仪表盘，左下角实时流量图将拉起速度波浪线，顶部“活动”计数变为 `1`，并能在活动连接列表中捕获到去往 `dl.google.com:443` 的分流明细。测试完毕后，可在终端通过 `unset http_proxy https_proxy` 解除当前会话的代理绑定。