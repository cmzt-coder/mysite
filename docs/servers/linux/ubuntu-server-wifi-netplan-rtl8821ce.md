# Ubuntu Server WiFi 配置（RTL8821CE 网卡）

## 一、环境说明

- 系统：Ubuntu Server
- 无线网卡：Realtek RTL8821CE
- 网卡名称：`wlp2s0`
- 配置方式：Netplan（系统默认 networkd 渲染器）
- 目标 WiFi：`360WiFi-5AD731`
- 内网网段：`192.168.100.0/24`
- 网关地址：`192.168.100.1`

***

## 二、前置准备（驱动与依赖安装）

### 1. 更新软件源

```bash
sudo apt update
```

### 2. 安装无线工具与固件

> 注意：Ubuntu 中包名为 `wpasupplicant`（无下划线），非 `wpa_supplicant`

```bash
sudo apt install iw wireless-tools wpasupplicant linux-firmware rfkill -y
```

### 3. 重启加载驱动固件

```bash
sudo reboot
```

***

## 三、网卡状态检查与解锁

### 1. 确认网卡识别

```bash
ip link show wlp2s0
```

正常输出应包含网卡硬件信息，状态可为 `DOWN`/`UP`。

### 2. 检查软硬屏蔽

```bash
rfkill list all
```

若 `Wireless LAN` 显示 `Soft blocked: yes`，执行解锁：

```bash
sudo rfkill unblock wifi
```

### 3. 手动启用网卡

```bash
sudo ip link set wlp2s0 up
```

### 4. 扫描附近 WiFi 热点（验证驱动正常）

```bash
sudo iw dev wlp2s0 scan | grep SSID
```

能输出目标 WiFi 名称则代表驱动工作正常。

***

## 四、Netplan 配置 WiFi（官方标准方案）

### 4.1 方案一：DHCP 自动获取 IP

适合临时使用，IP 由路由器分配。

1. 查看配置文件名称（默认文件名）
   ```bash
   ls /etc/netplan/
   # 通常输出：00-installer-config.yaml
   ```
2. 编辑配置文件
   ```bash
   sudo nano /etc/netplan/00-installer-config.yaml
   ```
3. 完整配置（保留原有有线网卡，新增 WiFi）
   ```yaml
   network:
     ethernets:
       enp1s0:
         dhcp4: true
         dhcp6: true
         match:
           macaddress: 68:1d:ef:34:6c:34
         set-name: enp1s0
     version: 2
     renderer: networkd
     wifis:
       wlp2s0:
         dhcp4: true
         optional: true
         access-points:
           "360WiFi-5AD731":
             password: "你的WiFi密码"
   ```

> 注意：YAML 严格使用空格缩进，禁止 Tab 键；WiFi 名称和密码用英文双引号包裹。

### 4.2 方案二：静态固定 IP（服务器推荐）

固定 IP 避免地址变动，SSH 连接更稳定。

```yaml
network:
  ethernets:
    enp1s0:
      dhcp4: true
      dhcp6: true
      match:
        macaddress: 68:1d:ef:34:6c:34
      set-name: enp1s0
  version: 2
  renderer: networkd
  wifis:
    wlp2s0:
      addresses: [192.168.100.165/24]
      nameservers:
        addresses: [223.5.5.5, 114.114.114.114]
      optional: true
      access-points:
        "360WiFi-5AD731":
          password: "你的WiFi密码"
      routes:
        - to: 0.0.0.0/0
          via: 192.168.100.1
          metric: 50
```

配置说明：

- `addresses`：静态 IP 地址与子网掩码
- `nameservers`：DNS 服务器
- `routes`：替代已废弃的 `gateway4`，配置默认网关
- `metric: 50`：路由优先级，数值越小优先级越高
- `optional: true`：开机不等待 WiFi 就绪，避免卡启动

### 4.3 配置生效与验证

1. 保存退出 nano：`Ctrl+O` → 回车 → `Ctrl+X`
2. 校验并应用配置
   ```bash
   sudo netplan generate
   sudo netplan apply
   ```
3. 查看网卡 IP
   ```bash
   ip a show wlp2s0
   ```
   输出包含 `inet 192.168.100.xxx` 即为连接成功。
4. 测试外网连通
   ```bash
   ping baidu.com
   ```

***

## 五、双网卡优先级调整（有线 + WiFi 共存）

通过 `metric` 值控制路由优先级，数值越小优先级越高。

- 有线网卡默认 metric：100
- WiFi 配置 metric：50（优先级更高）

查看当前路由表与优先级：

```bash
ip route
```

***

## 六、常见问题排查

### 6.1 扫描不到 WiFi 热点（RTL8821CE 驱动修复）

内核自带驱动存在兼容性问题时，可安装第三方驱动：

```bash
sudo apt install git dkms build-essential linux-headers-$(uname -r) -y
git clone https://github.com/tomaspinho/rtl8821ce.git
cd rtl8821ce
sudo ./dkms-install.sh
# 屏蔽系统自带驱动
echo "blacklist rtw88_8821ce" | sudo tee /etc/modprobe.d/blacklist-rtw88.conf
sudo reboot
```

### 6.2 netplan apply 报错处理

1. `unknown key 'metric'`

   `metric` 不能直接写在网卡层级，必须放在 `routes` 段落内。
2. `gateway4 has been deprecated`

   `gateway4` 已废弃，改用 `routes` 配置默认网关（参考静态 IP 配置）。
3. 缩进错误

   YAML 必须使用空格缩进，每一层级建议 2 个空格，禁止 Tab。

### 6.3 开机不自动连接 WiFi

1. 确认 systemd-networkd 服务开机自启
   ```bash
   sudo systemctl enable --now systemd-networkd
   ```
2. 配置中添加 `optional: true`，避免网卡启动超时跳过。

***

## 七、备选方案：nmcli 交互式连接

适合频繁切换 WiFi 的场景，需安装 NetworkManager。

1. 安装服务
   ```bash
   sudo apt install network-manager -y
   sudo systemctl enable --now NetworkManager
   ```
2. 扫描 WiFi
   ```bash
   sudo nmcli device wifi list
   ```
3. 连接 WiFi
   ```bash
   sudo nmcli device wifi connect "360WiFi-5AD731" password "WiFi密码" ifname wlp2s0
   ```
4. 设置开机自动连接
   ```bash
   sudo nmcli connection modify "360WiFi-5AD731" connection.autoconnect yes
   ```

