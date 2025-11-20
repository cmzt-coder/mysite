# Docker 部署 MySQL 8.0 与 Redis（含 RediSearch）操作手册

## 一、MySQL 8.0 容器部署与管理

### 1.1 拉取 MySQL 8.0 镜像

执行以下命令从 Docker Hub 拉取官方 MySQL 8.0 镜像：

```bash
docker pull mysql:8.0
```

### 1.2 创建并启动 MySQL 8.0 容器

通过以下命令创建容器并后台启动，同时配置端口映射、root 密码及数据持久化：

```bash
docker run -d --name mysql8-container -p 3306:3306 -e MYSQL_ROOT_PASSWORD=102100 -e MYSQL_INITDB_SKIP_TZINFO=1 -v mysql8-data:/var/lib/mysql mysql:8.0
```

参数说明：

* -d：后台运行容器
* --name：指定容器名称为 mysql8-container
* -p 3306:3306：将主机 3306 端口映射到容器 3306 端口
* -e MYSQL_ROOT_PASSWORD=102100：设置 MySQL root 用户密码为 102100
* -e MYSQL_INITDB_SKIP_TZINFO=1：跳过时区初始化（避免部署时的时区配置问题）
* -v mysql8-data:/var/lib/mysql：挂载数据卷 mysql8-data 到容器数据存储目录，实现数据持久化

### 1.3 验证容器运行状态

通过以下命令确认容器是否正常启动，若启动失败可通过日志排查问题：

```bash
# 查看所有运行中的容器，确认 mysql8-container 存在
docker ps

# 若启动失败，查看容器日志排查错误
docker logs mysql8-container
```

### 1.4 连接 MySQL 容器

通过进入容器内部的方式连接 MySQL 服务，执行 SQL 命令：

```bash
# 1. 进入 mysql8-container 容器内部
docker exec -it mysql8-container bash

# 2. 使用 root 用户登录 MySQL，输入密码 102100 后回车
mysql -u root -p

# 3. 登录成功后，可执行 SQL 命令验证（如查看 MySQL 版本）
SELECT VERSION();  # 预期返回 8.0.x 版本信息
```

### 1.5 常用容器管理命令

```bash
# 停止容器
docker stop mysql8-container

# 启动容器
docker start mysql8-container

# 重启容器
docker restart mysql8-container

# 删除容器（需先停止容器）
docker rm mysql8-container

# 删除数据卷（谨慎操作，会丢失所有数据）
docker volume rm mysql8-data
```

## 二、Redis（含 RediSearch）容器部署与管理

Redis Stack 镜像已集成 RediSearch 功能，无需额外安装插件，直接部署即可使用。

### 2.1 拉取 Redis Stack 镜像

拉取官方集成 RediSearch 的 Redis Stack 最新镜像：

```bash
docker pull redis/redis-stack:latest
```

### 2.2 创建并启动 Redis 容器

#### 2.2.1 基础启动（无密码）

适用于本地测试环境，不建议生产环境使用：

```bash
docker run -d --name redis-with-search -p 6379:6379 -v redis-search-data:/data redis/redis-stack:latest
```

#### 2.2.2 带密码启动（推荐）

通过环境变量设置 Redis 连接密码，提升安全性：

```bash
docker run -d --name redis-with-search -p 6379:6379 -v redis-search-data:/data -e REDIS_ARGS="--requirepass mdiyby5hSsTaxKe6" redis/redis-stack:latest
```

参数说明：

* -v redis-search-data:/data：挂载数据卷实现 Redis 数据持久化
* -e REDIS_ARGS="--requirepass 密码"：设置 Redis 访问密码为 mdiyby5hSsTaxKe6

### 2.3 验证 RediSearch 功能

进入容器后执行 RediSearch 核心命令，验证功能是否正常启用：

```bash
# 1. 进入 redis-with-search 容器内部
docker exec -it redis-with-search bash

# 2. 连接 Redis（若设置密码，需先执行 AUTH 密码 进行认证）
redis-cli
# 带密码场景：执行 AUTH mdiyby5hSsTaxKe6 完成认证

# 3. 创建 RediSearch 索引（验证功能可用性）
FT.CREATE myidx ON hash PREFIX 1 doc: SCHEMA title TEXT weight 5.0 body TEXT
```

若命令执行无报错，说明 RediSearch 功能已正常生效。

### 2.4 常用容器管理命令

```bash
# 停止容器
docker stop redis-with-search

# 启动容器
docker start redis-with-search

# 重启容器
docker restart redis-with-search

# 删除容器（需先停止容器）
docker rm redis-with-search

# 删除数据卷（谨慎操作，会丢失所有数据）
docker volume rm redis-search-data
```

## 三、通用注意事项

* 数据卷操作：删除数据卷前务必确认数据已备份，执行后数据将永久丢失。
* 端口冲突：若主机 3306（MySQL）或 6379（Redis）端口已被占用，需修改端口映射（如 -p 3307:3306）。
* 生产环境：建议增加容器资源限制（--memory、--cpus），并配置自定义配置文件优化服务性能。
