
# Docker简介及常用命令

## 一、Docker简介

### 1. 定义

Docker是一个开源的应用容器引擎，能够让开发者将应用程序及其所有依赖项（如代码、库、配置文件等）打包到一个轻量级、可移植的容器中，随后该容器可在任何支持Docker的环境中一致性运行。它彻底解决了传统开发中“在我机器上能跑，线上却不行”的环境不一致难题，是现代DevOps和云计算领域的核心工具之一。

### 2. 核心价值

* **轻量性** ：容器共享宿主机的操作系统内核，无需模拟完整硬件环境和运行独立操作系统，相比传统虚拟机体积更小、启动更快，资源占用极低。
* **可移植性** ：打包后的容器可在本地开发机、物理服务器、云平台等所有支持Docker的环境中无缝运行，环境差异对应用的影响被降至最低。
* **隔离性** ：每个容器拥有独立的文件系统、网络空间和进程环境，不同应用之间互不干扰，有效避免依赖冲突问题。
* **标准化** ：提供统一的工具链和接口，使镜像构建、分发、运行的流程标准化，大幅简化开发、测试和部署环节。

### 3. 核心概念

* **镜像（Image）** ：创建容器的模板，包含运行应用所需的完整环境和依赖。镜像采用分层存储结构，构建后内容不可修改，可从公共或私有仓库获取，也可自定义构建。
* **容器（Container）** ：镜像的运行实例，是Docker的核心运行单元。通过镜像启动容器后，可对其进行启动、停止、删除等操作，容器内的应用运行状态独立可控。
* **Dockerfile** ：定义镜像构建流程的文本文件，包含FROM（指定基础镜像）、RUN（执行命令）等一系列指令，确保镜像构建过程可重复、透明。
* **镜像仓库（Repository）** ：集中存储和分发镜像的平台，最常用的公共仓库是Docker Hub，也可搭建企业私有仓库用于内部镜像管理。

### 4. 基本架构

Docker采用客户端-服务器（C/S）架构：Docker客户端负责接收用户输入的命令（如docker run），Docker守护进程（服务端）负责执行这些命令，完成镜像管理、容器运行等核心操作。客户端与守护进程可运行在同一台机器上，通过UNIX套接字或网络接口通信，使用REST API交换数据。

## 二、Docker常用命令

### 1. 基础命令

用于查看Docker版本信息、系统状态及帮助文档，是入门必备的基础操作。

* **查看Docker版本** ：`docker version`，分别显示客户端和服务器的版本信息。
* **查看Docker系统信息** ：`docker info`，包含本地镜像数量、运行中容器数量、存储驱动等详细系统数据。
* **获取命令帮助** ：`docker 命令 --help`，如 `docker run --help`可查看run命令的所有选项及用法。

### 2. 镜像管理命令

涵盖镜像的拉取、查看、构建、推送、删除等全生命周期操作，是Docker核心命令集之一。

* **拉取镜像** ：`docker pull 镜像名:标签`，标签未指定时默认拉取latest（最新版）。示例：拉取指定版本的Nginx镜像 `docker pull nginx:1.23-alpine`；拉取最新版Redis `docker pull redis:latest`。
* **查看本地镜像** ：新版推荐 `docker image ls`，旧版命令 `docker images`。扩展用法：`docker image ls -a`查看包括中间层的所有镜像；`docker image ls --filter "dangling=true"`筛选出无标签的悬空镜像。
* **构建镜像** ：`docker build -t 镜像名:标签 构建上下文路径`。示例：基于当前目录Dockerfile构建名为myapp:v1的镜像 `docker build -t myapp:v1 .`；指定Dockerfile路径并添加构建参数 `docker build -f ./docker/Dockerfile --build-arg VERSION=1.0 -t myapp:v1 .`。
* **推送镜像** ：`docker push 镜像名:标签`，用于将本地镜像上传至仓库。示例：推送到私有仓库 `docker push registry.example.com/myapp:v1`，推送前需先通过 `docker login`登录仓库。
* **删除镜像** ：新版推荐 `docker image rm 镜像名:标签|镜像ID`，旧版命令 `docker rmi`。示例：强制删除依赖该镜像的容器 `docker rmi -f nginx:1.23-alpine`；批量删除所有悬空镜像 `docker image prune`。
* **镜像详情与历史** ：`docker inspect 镜像名:标签`查看镜像完整配置信息；`docker history 镜像名:标签`查看镜像分层构建历史，清晰展示每一步修改内容。
* **镜像导出/导入** ：`docker save -o 文件名.tar 镜像名:标签`将镜像导出为本地tar文件（如 `docker save -o nginx.tar nginx:alpine`）；`docker load -i 文件名.tar`从tar文件导入镜像。

### 3. 容器操作命令

围绕容器的创建、启动、管理、交互等操作，是日常使用Docker最频繁的命令类别。

#### 3.1 容器创建与启动

`docker run 选项 镜像名:标签 命令`，核心选项如下：

* -d：后台运行容器（守护态）；-it：交互式终端（通常组合使用，用于进入容器操作）
* --name：指定容器名称，避免使用默认随机名称
* -p：端口映射，格式“宿主端口:容器端口”，实现外部访问容器服务
* -v：目录/数据卷挂载，格式“宿主路径:容器路径:权限”，实现数据持久化
* --rm：容器退出后自动删除，适合临时任务场景

示例1：启动交互式Ubuntu容器 `docker run -it --name ubuntu-test ubuntu:22.04 /bin/bash`

示例2：后台启动Nginx，映射8080端口并挂载配置文件 `docker run -d --name nginx-web -p 8080:80 -v ./nginx.conf:/etc/nginx/nginx.conf:ro nginx:alpine`

#### 3.2 容器状态管理

* **查看容器** ：新版推荐 `docker container ls`，旧版 `docker ps`，默认显示运行中容器。扩展：`docker ps -a`查看所有容器（含停止状态）；`docker ps -q`仅显示容器ID（用于批量操作）。
* **启动/停止/重启容器** ：`docker start 容器名|ID`启动已停止容器；`docker stop 容器名|ID`优雅停止运行中容器；`docker kill 容器名|ID`强制终止容器；`docker restart 容器名|ID`重启容器。
* **删除容器** ：`docker rm 容器名|ID`，需先停止容器；强制删除运行中容器 `docker rm -f 容器名|ID`；批量删除所有已停止容器 `docker container prune`。

#### 3.3 容器交互与信息查询

* **进入运行中容器** ：`docker exec -it 容器名|ID /bin/bash`（bash终端），轻量镜像用 `sh`终端 `docker exec -it 容器名|ID sh`；非交互式执行单条命令 `docker exec 容器名|ID ls /app`。
* **查看容器日志** ：`docker logs 选项 容器名|ID`，-f实时跟踪日志，-t显示时间戳，--tail 100显示最后100行。示例：`docker logs -ft --tail 50 nginx-web`。
* **容器详情与资源监控** ：`docker inspect 容器名|ID`查看容器配置、网络、挂载等完整信息；`docker stats 容器名|ID`实时监控容器CPU、内存等资源占用；`docker port 容器名|ID`查看容器端口映射情况。

#### 3.4 容器数据操作

* **文件传输** ：容器与宿主机器之间复制文件，`docker cp 容器名|ID:/容器路径 宿主路径`（容器到宿主，如 `docker cp nginx-web:/var/log/nginx/access.log ./`）；`docker cp 宿主路径 容器名|ID:/容器路径`（宿主到容器）。
* **容器提交为镜像** ：`docker commit -m "提交说明" 容器名|ID 新镜像名:标签`，将容器当前状态保存为新镜像。示例：`docker commit -m "添加自定义配置" nginx-web my-nginx:v1`。

### 4. 网络管理命令

用于管理Docker网络，实现容器间通信或容器与外部网络的连接配置。

* **查看网络** ：`docker network ls`列出所有Docker网络；`docker network inspect 网络名`查看网络详细信息，包括连接的容器列表。
* **创建网络** ：`docker network create --driver 驱动类型 网络名`，默认驱动为bridge（桥接网络），适用于单机容器通信。示例：`docker network create my-network`。
* **容器连接网络** ：`docker network connect 网络名 容器名|ID`，将指定容器加入目标网络，实现跨网络通信。
* **容器断开网络** ：`docker network disconnect 网络名 容器名|ID`，将容器从指定网络中移除。
