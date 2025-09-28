# Canal 在 Spring Boot 环境下的 MySQL 数据同步集成指南

## 1. 引言与 Canal 基础概述

### 1.1 Canal 简介与核心原理

Canal 是阿里巴巴开源的一款基于 MySQL 数据库增量日志解析的高性能数据同步系统，其英文含义为 "管道" 或 "沟渠"，形象地表达了其在数据传输中的作用。Canal 的核心工作原理是通过模拟 MySQL 从库（slave）的交互协议，伪装成 MySQL slave 向 MySQL 主库（master）发送 dump 协议，从而获取并解析主库的二进制日志（binlog）[(2)](https://blog.csdn.net/Fireworkit/article/details/148475855)。

具体而言，Canal 的工作流程包括三个关键步骤：首先，Canal 模拟 MySQL slave 的身份向 master 发送 dump 请求；其次，MySQL master 收到请求后开始推送 binary log 给 Canal；最后，Canal 解析接收到的二进制日志对象（原始为 byte 流），将其转换为结构化的数据变更事件。这种机制最早源于阿里巴巴解决杭州与美国双机房之间的数据同步需求，从 2010 年开始，业务逐步尝试通过数据库日志解析获取增量变更进行同步，由此衍生出了大量的数据库增量订阅和消费业务。

Canal 主要支持的 MySQL 版本包括 5.1.x、5.5.x、5.6.x、5.7.x 和 8.0.x，能够精确捕获数据库的每一行变更，确保数据的一致性和实时性[(144)](https://www.cnblogs.com/jingzh/p/18856421)。基于日志增量订阅和消费的业务场景非常广泛，包括数据库镜像、数据库实时备份、索引构建和实时维护（如拆分异构索引、倒排索引等）、业务缓存刷新以及带业务逻辑的增量数据处理等。

### 1.2 Canal 架构组件与工作机制

Canal 的整体架构采用 Server-Instance 模式设计，主要由 Canal Server 和 Canal Instance 两个核心组件构成。

**Canal Server**代表一个 Canal 运行实例，通常对应于一个 JVM 进程。它负责管理和运行整个 Canal 服务，处理数据源的接入、数据解析、过滤和存储等任务。Canal Server 支持集群化部署，通过 Zookeeper 来管理集群状态和配置信息，集群中的每个 Canal Server 实例都可以并行工作，共同处理数据同步任务，从而提高系统的吞吐量和容错能力。

**Canal Instance**对应于一个数据队列，负责从特定数据源（如 MySQL）读取变更数据并将其推送到下游消费者。每个 Instance 独立运行，管理特定的数据库连接和数据流。Canal Instance 主要由四个核心组件构成：



1. **EventParser**：负责数据源接入，模拟从主数据库（master）到从数据库（slave）的协议交互，并解析从数据库获取的变更数据。它通过模拟 MySQL slave 的交互协议，伪装成 MySQL slave 向 MySQL master 发送 dump 协议，从而接收并解析 master 的 binary log。

2. **EventSink**：作为 Parser 和 Store 之间的连接器，负责数据的过滤、加工和分发。它可以根据配置对数据进行处理，如去除敏感信息、格式化数据等，并决定数据是否推送到下游消费者。

3. **EventStore**：用于暂存 "尚未消费" 的 events 的存储队列，默认基于内存的阻塞队列实现。它负责将数据持久化存储，维护已消费的数据记录，以支持增量订阅和历史数据的查询。

4. **MetaManager**：负责增量订阅和消费信息的管理。它维护着每个 Instance 的状态信息，如已消费的位置、订阅信息等，以确保数据的准确性和一致性。

在实际运行中，Canal Instance 的配置信息可以在运行时进行动态调整，如数据源连接信息、数据过滤规则等。这种动态性使得 Canal 能够更好地适应不同的业务场景和需求变化。

### 1.3 技术选型考量与优势分析

在数据同步技术选型中，Canal 相比其他工具具有显著优势。与 Maxwell 相比，Canal 可自定义数据格式，而 Maxwell 只支持 JSON 格式；但 Maxwell 支持数据断点续传和 bootstrap 功能，可以直接引导出完整的历史数据用于初始化，而 Canal 只能抓取最新数据，对已存在的历史数据没有处理能力，缺乏 bootstrap 功能[(30)](https://blog.csdn.net/csdn_lan/article/details/129301794)。

与 Debezium 相比，Debezium 支持多种数据库，而 Canal 和 Maxwell 主要针对 MySQL。在资源占用方面，Canal 较低（单节点小于 512MB 内存），而 Debezium 中等（单节点约 1GB 内存），因此轻量场景更适合选择 Canal[(26)](https://blog.csdn.net/gitblog_00620/article/details/151303952)。

Canal 的核心优势主要体现在以下几个方面：

**实时性高**：基于 binlog 的增量同步机制，能够在毫秒级内完成数据同步，延迟可控制在 1 秒内，且不侵入业务代码[(144)](https://www.cnblogs.com/jingzh/p/18856421)。

**性能卓越**：Canal 1.1.x 版本进行了整体性能测试和优化，性能提升了 150%，原生支持 Prometheus 监控、Kafka 消息投递、阿里云 RDS 的 binlog 订阅，以及 Docker 镜像部署。

**架构灵活**：支持多种部署模式，包括单机模式、基于 Zookeeper 的高可用集群模式，以及结合 Kafka/RocketMQ 的分布式模式。Canal 还支持动态扩展与缩容，以及故障自动转移等功能，进一步提高了系统的可靠性和稳定性。

**生态完善**：Canal 特别设计了 client-server 模式，交互协议使用 Protobuf 3.0，client 端可采用不同语言实现不同的消费逻辑。目前已支持 Java、C#、Go、PHP、Python、Rust 和 Node.js 等多种编程语言的客户端实现。

**使用便捷**：与 Spring Boot 集成简单，通过引入相应的依赖库即可快速实现数据同步功能，特别适合 Java 技术栈的项目使用。

## 2. 部署环境准备与 MySQL 配置

### 2.1 系统环境要求与软件依赖

在部署 Canal 之前，需要确保系统环境满足以下要求：

**操作系统**：Canal 是纯 Java 开发的应用，支持 Windows、Linux 和 MacOS 等多种操作系统，推荐使用 Linux 环境以获得更好的性能和稳定性[(53)](https://blog.csdn.net/worldchinalee/article/details/83545956)。

**Java 环境**：必须安装 JDK 1.8 或以上版本，这是 Canal 运行的基础环境要求。如果使用低于 1.8 版本的 JDK，启动 Canal 时会报错无法正常运行[(52)](https://blog.csdn.net/xuejia2s/article/details/89431413)。

**MySQL 版本**：Canal 支持的 MySQL 版本包括 5.1.x、5.5.x、5.6.x、5.7.x 和 8.0.x。在实际应用中，建议使用 5.7 及以上版本以获得更好的兼容性和性能表现[(53)](https://blog.csdn.net/worldchinalee/article/details/83545956)。

**硬件配置**：根据实际业务需求和数据量大小，建议生产环境的配置如下：



* CPU：至少 4 核，推荐 8 核或以上

* 内存：至少 8GB，推荐 16GB 或以上

* 磁盘：至少 100GB 可用空间，推荐使用 SSD 存储以提高 IO 性能

**网络环境**：确保 Canal 服务器与 MySQL 数据库服务器之间的网络连接稳定，网络延迟应控制在较低水平（建议小于 1ms），带宽应满足数据传输需求[(160)](https://wenku.csdn.net/answer/55b1m3yw30)。

### 2.2 MySQL 配置调整与优化

为了使 Canal 能够正常工作，需要对 MySQL 进行相应的配置调整：

#### 2.2.1 开启 binlog 日志功能

首先需要在 MySQL 配置文件（my.cnf 或 my.ini）中开启 binlog 功能。编辑配置文件，在 \[mysqld] 区块下添加以下配置：



```
log-bin=mysql-bin  # 开启binlog功能

binlog-format=ROW  # 设置binlog格式为ROW模式

server\_id=1        # 配置MySQL replication需要的server ID，不要与Canal的slaveId重复
```

其中，`binlog-format=ROW`是 Canal 支持的格式，因为 ROW 模式能够记录每一行数据的具体变化，包括修改前和修改后的值，这对于数据同步非常重要[(107)](https://www.cnblogs.com/xd502djj/p/18789380)。

修改配置文件后，需要重启 MySQL 服务使配置生效。可以使用以下命令检查 binlog 是否已正确开启：



```
SHOW VARIABLES LIKE 'log\_bin';

SHOW VARIABLES LIKE 'binlog\_format';

SHOW VARIABLES LIKE 'server\_id';
```

#### 2.2.2 设置 binlog 相关参数

除了基本的 binlog 配置外，还需要设置一些相关参数以优化性能和安全性：



```
expire\_logs\_days=7          # 设置binlog过期时间为7天

binlog\_row\_image=FULL        # 记录完整的行数据

binlog-ignore-db=mysql      # 忽略mysql系统库的binlog记录

lower\_case\_table\_names=1     # 表名存储为小写，比较时不区分大小写

default\_authentication\_plugin=mysql\_native\_password  # 使用传统的密码认证方式
```

其中，`expire_logs_days`参数设置 binlog 文件的过期时间，避免 binlog 文件过多占用磁盘空间。`binlog_row_image=FULL`确保记录完整的行数据，这对于数据同步的准确性至关重要。

#### 2.2.3 创建 Canal 专用用户并授权

为了保证数据库安全，建议为 Canal 创建专用的数据库用户，并授予必要的权限：



```
CREATE USER 'canal'@'%' IDENTIFIED BY 'canal123';  # 创建canal用户，密码为canal123

GRANT SELECT, REPLICATION SLAVE, REPLICATION CLIENT ON \*.\* TO 'canal'@'%';  # 授予必要的权限

FLUSH PRIVILEGES;  # 刷新权限
```

这里为 Canal 用户授予了三个关键权限：



* **SELECT 权限**：用于查询数据库表结构和数据

* **REPLICATION SLAVE 权限**：用于从主库拉取 binlog 日志

* **REPLICATION CLIENT 权限**：用于查询主从复制状态信息

需要注意的是，如果 MySQL 启用了密码策略，密码设置不能过于简单，否则会出现以下错误：



```
ERROR 1819 (HY000): Your password does not satisfy the current policy requirements
```

如果遇到此问题，需要设置更复杂的密码或调整 MySQL 的密码策略配置。

### 2.3 网络环境与安全配置

在部署 Canal 时，网络环境的配置至关重要，需要确保以下几点：

**端口开放**：



* MySQL 数据库端口：默认 3306，需要确保 Canal 服务器能够访问此端口

* Canal Server 端口：默认 11111，需要在防火墙中开放此端口以供客户端连接

* Canal Admin 端口：默认 11110（如果启用 Admin 功能）

* Canal metrics 端口：默认 11112（用于 Prometheus 监控）

**防火墙配置**：如果服务器启用了防火墙，需要添加相应的规则允许上述端口的访问。在 Linux 系统中，可以使用 iptables 或 firewalld 工具进行配置。例如，使用 firewalld 开放端口的命令如下：



```
firewall-cmd --zone=public --add-port=11111/tcp --permanent

firewall-cmd --zone=public --add-port=11110/tcp --permanent

firewall-cmd --zone=public --add-port=11112/tcp --permanent

firewall-cmd --reload
```

需要注意的是，某些特殊网络环境下，Canal 的出站连接可能不限制在临时端口范围内，可能使用较低范围的端口，这可能导致防火墙规则阻止返回的 ACK 数据包。如果遇到网络连接问题，需要检查防火墙规则是否正确配置[(173)](https://github.com/rancher/rke2/issues/5867)。

**时间同步**：为了确保数据同步的准确性，建议在 Canal 服务器和 MySQL 数据库服务器上启用 NTP（网络时间协议）进行时间同步。因为 delay 指标的准确度依赖于 master 与 canal server 间的时间同步，当 binlog execTime 超过 canal server 当前时间戳时，delay 会显示为 0。

**安全加固**：



* 建议将 Canal 部署在独立的服务器上，与数据库服务器分离

* 使用专用的数据库用户，避免使用 root 等超级用户

* 限制 Canal 服务器的网络访问权限，只允许必要的连接

* 定期审查数据库访问日志，监控异常访问行为

## 3. Canal Server 部署与配置

### 3.1 下载安装与目录结构

#### 3.1.1 版本选择与下载

Canal 的最新稳定版本是 1.1.8（发布于 2025 年 1 月 16 日），该版本在性能和稳定性方面都有显著提升。你可以从 Canal 的官方 GitHub 发布页面下载相应的安装包：[https://github.com/alibaba/canal/releases](https://github.com/alibaba/canal/releases)[(14)](https://mygit.osfipin.com/repository/7587038)。

下载时需要注意选择适合你操作系统的版本。通常建议下载`canal.deployer-1.1.8.tar.gz`（Linux 版本）或`canal.deployer-1.1.8.zip`（Windows 版本）。

使用 wget 命令下载最新版本（以 Linux 为例）：



```
wget https://github.com/alibaba/canal/releases/download/canal-1.1.8/canal.deployer-1.1.8.tar.gz
```

#### 3.1.2 解压安装与目录说明

下载完成后，需要解压安装包并进行相应的配置：

**Linux 系统安装步骤**：



1. 创建安装目录：



```
mkdir /opt/canal

cd /opt/canal
```



1. 解压安装包：



```
tar zxvf /path/to/canal.deployer-1.1.8.tar.gz
```



1. 进入 Canal 目录：



```
cd canal.deployer-1.1.8
```

**Windows 系统安装步骤**：



1. 创建安装目录（例如 D:\canal）

2. 解压下载的 ZIP 文件到该目录

3. 通过命令提示符或 PowerShell 进入安装目录

解压完成后，Canal 的目录结构如下：



```
canal.deployer-1.1.8/

├── bin/                  # 启动脚本目录

├── conf/                 # 配置文件目录

│   ├── canal.properties   # 全局配置文件

│   ├── example/          # 示例instance配置目录

│   │   └── instance.properties

│   └── logback.xml       # 日志配置文件

├── lib/                  # 依赖库目录

├── logs/                 # 日志文件目录

└── plugin/               # 插件目录
```

其中，`conf/canal.properties`是全局配置文件，`conf/example/instance.properties`是示例 instance 的配置文件。如果需要配置多个数据源，需要在`conf`目录下创建相应的 instance 目录并配置对应的`instance.properties`文件[(87)](https://blog.csdn.net/weixin_40803011/article/details/121420818)。

### 3.2 核心配置文件详解

#### 3.2.1 canal.properties 全局配置

`canal.properties`是 Canal 的全局配置文件，包含了 Canal Server 的基本配置信息。以下是主要配置参数的说明：



```
\# Canal基本配置

canal.id=1                   # 每个Canal Server实例的唯一标识

canal.ip=                   # Canal Server绑定的本地IP地址，如果不配置，默认选择一个本机IP

canal.port=11111            # Canal Server提供socket服务的端口

canal.metrics.pull.port=11112 # 监控指标拉取端口，用于Prometheus监控

canal.zkServers=            # Canal Server连接Zookeeper集群的地址（集群模式需要）

\# Canal运行模式配置

canal.serverMode=tcp         # 可选值：tcp, kafka, RocketMQ

canal.withoutNetty=false     # 是否禁用Netty，一般不需要修改

\# Canal Admin配置（如果启用Admin功能）

canal.admin.port=11110       # Canal Admin端口

canal.admin.user=admin       # 管理员用户名

canal.admin.passwd=4ACFE3202A5FF5CF467898FC58AAB1D615029441  # 管理员密码（SHA-1加密）

\# 实例配置

canal.destinations=example   # 指定实例名，多个实例用逗号分隔

canal.instance.global.spring.xml=classpath:spring/default-instance.xml

\# 内存配置

canal.instance.memory.buffer.size=16384    # 内存缓冲区大小，必须是2的幂

canal.instance.memory.buffer.memunit=1024  # 内存单元大小，默认1KB

canal.instance.memory.batch.mode=MEMSIZE   # 内存批次模式：MEMSIZE或ITEMSIZE

\# 数据持久化配置

canal.file.data.dir=\${canal.conf.dir}       # 数据存储目录

canal.file.flush.period=1000                # 数据刷新周期（毫秒）

\# 心跳检测配置

canal.instance.detecting.enable=false       # 是否开启心跳检测

canal.instance.detecting.sql=select 1       # 心跳检测SQL语句

canal.instance.detecting.interval.time=3    # 心跳检测间隔（秒）

canal.instance.detecting.retry.threshold=3  # 心跳检测失败重试次数
```

其中，`canal.destinations`参数指定了要启动的 instance 名称，多个 instance 用逗号分隔。例如，如果要监控两个数据库，可以配置为`canal.destinations=db1,db2`，然后在`conf`目录下创建`db1`和`db2`两个目录，并分别配置各自的`instance.properties`文件[(87)](https://blog.csdn.net/weixin_40803011/article/details/121420818)。

#### 3.2.2 instance.properties 实例配置

`instance.properties`是每个 instance 的具体配置文件，包含了连接 MySQL 数据库和数据解析的相关配置。以下是主要配置参数的说明：



```
\# 基本配置

canal.instance.mysql.slaveId=1234            # 必须配置，不能与MySQL的server\_id重复

canal.instance.master.address=127.0.0.1:3306  # MySQL主库地址和端口

canal.instance.dbUsername=canal              # 数据库用户名

canal.instance.dbPassword=canal              # 数据库密码

canal.instance.defaultDatabaseName=          # 默认数据库名

canal.instance.connectionCharset=UTF-8       # 连接字符集

\# 过滤配置

canal.instance.filter.regex=.\*\\\\..\*          # 表过滤正则表达式

canal.instance.filter.black.regex=           # 黑名单过滤正则表达式

\# 解析配置

canal.instance.parser.parallel=false         # 是否开启并行解析

canal.instance.parser.parallelThreadSize=16  # 并行解析线程数（仅当parallel=true时有效）

canal.instance.parser.direct=false           # 是否直接解析（不建议修改）

\# 数据存储配置

canal.instance.tsdb.enable=true              # 是否启用TSDB存储

canal.instance.tsdb.dir=./conf/\${canal.instance.destination}  # TSDB存储目录

canal.instance.tsdb.flushInterval=60000      # TSDB刷新间隔（毫秒）

\# 消费配置

canal.instance.consumer.concurrency=1         # 消费者并发数

canal.instance.auto.scan=false               # 是否自动扫描表结构

canal.instance.auto.scan.interval=5          # 自动扫描间隔（秒）

\# 其他配置

canal.instance.mysql.cdc=false               # 是否启用MySQL CDC功能（5.7+版本支持）

canal.instance.mysql.tidb=false              # 是否使用TiDB模式

canal.instance.mysql.packetSize=1024         # MySQL数据包大小（字节）
```

**表过滤规则说明**：

`canal.instance.filter.regex`参数用于配置表过滤规则，支持正则表达式匹配。常用的规则示例：



* `.*\\..*`：匹配所有库的所有表

* `test\\..*`：匹配 test 库的所有表

* `test\\.user`：匹配 test 库的 user 表

* `test\\..*,demo\\..*`：匹配 test 库和 demo 库的所有表

* `test\\.user,test\\.order`：匹配 test 库的 user 表和 order 表

`canal.instance.filter.black.regex`参数用于配置黑名单规则，匹配的表将被排除。如果表既满足过滤规则又满足黑名单规则，将被排除。

需要特别注意的是，如果在配置文件中配置了过滤规则，就不应该在代码中调用`CanalConnector.subscribe()`方法，否则配置文件中的过滤配置会被覆盖[(102)](https://blog.csdn.net/qq_40096897/article/details/121754412)。

### 3.3 多 instance 配置与集群部署

#### 3.3.1 配置多个数据源

如果需要监控多个 MySQL 数据库或同一个数据库的不同部分，可以通过配置多个 instance 来实现。具体步骤如下：



1. **修改全局配置文件**：编辑`canal.properties`，在`canal.destinations`参数中指定多个 instance 名称，用逗号分隔：



```
canal.destinations=db1,db2,db3
```



1. **创建 instance 目录**：在`conf`目录下创建与 instance 名称对应的目录，例如`db1`、`db2`、`db3`。

2. **配置 instance 文件**：在每个 instance 目录下创建`instance.properties`文件，并配置相应的数据库连接信息和过滤规则。

例如，配置`db1`实例监控`test`数据库的`user`表：



```
canal.instance.mysql.slaveId=1001

canal.instance.master.address=192.168.1.100:3306

canal.instance.dbUsername=canal

canal.instance.dbPassword=canal

canal.instance.defaultDatabaseName=test

canal.instance.filter.regex=test\\\\.user
```

配置`db2`实例监控`demo`数据库的所有表：



```
canal.instance.mysql.slaveId=1002

canal.instance.master.address=192.168.1.101:3306

canal.instance.dbUsername=canal

canal.instance.dbPassword=canal

canal.instance.defaultDatabaseName=demo

canal.instance.filter.regex=demo\\\\..\*
```

#### 3.3.2 基于 Zookeeper 的高可用集群

Canal 支持基于 Zookeeper 的高可用集群部署，通过 Zookeeper 实现主备切换和负载均衡。集群部署的架构图如下：



```
+----------------+          +----------------+

\|    Canal A     |          |    Canal B     |

\|  (Active)      |          |  (Standby)     |

+----------------+          +----------------+

&#x20;     \|   ^                  |   ^

&#x20;     \|   |                  |   |

+-----+---+-----------------+---+-----+

\|                Zookeeper Cluster                |

\|   (3 nodes: ZK1, ZK2, ZK3)                     |

+------------------------------------------------+
```

集群部署的关键配置步骤：



1. **部署 Zookeeper 集群**：

* 部署至少 3 个 Zookeeper 节点

* 确保 Zookeeper 版本在 3.4.6 以上

* 配置 Zookeeper 集群间的通信

1. **配置 Canal Server**：

   在每个 Canal Server 的`canal.properties`中添加 Zookeeper 配置：



```
canal.zkServers=zk1:2181,zk2:2181,zk3:2181

canal.serverMode=kafka  # 建议使用消息队列模式
```



1. **配置 instance**：

   在 instance 配置文件中添加集群相关配置：



```
canal.instance.global.spring.xml=classpath:spring/zk-instance.xml
```



1. **启动集群**：

* 依次启动所有 Canal Server 节点

* 通过 Zookeeper 选举机制，只有一个节点会成为 Active 状态

* 其他节点处于 Standby 状态，等待 Active 节点故障时接管

集群模式的工作原理：



* Canal Server 启动时会向 Zookeeper 注册，尝试创建临时节点

* 通过 Zookeeper 的选举机制选出主节点（Active）

* 主节点负责处理客户端连接和数据分发

* 从节点（Standby）监听主节点状态，主节点故障时自动接管

* 客户端连接时会查询 Zookeeper 获取当前 Active 节点地址

#### 3.3.3 负载均衡与故障转移

在集群环境下，Canal 支持多种负载均衡策略：



1. **轮询策略（Round Robin）**：



```
canal.instance.loadbalance.strategy=round\_robin
```

轮询策略将不同的 instance 均匀分配到各个 Canal Server 节点上，适合数据量分布均匀的场景。



1. **权重策略（Weighted）**：



```
canal.instance.loadbalance.strategy=weighted

canal.instance.loadbalance.weight=10  # 设置权重值
```

权重策略根据配置的权重值分配 instance，可以根据节点性能设置不同的权重。



1. **一致性哈希策略（Consistent Hashing）**：



```
canal.instance.loadbalance.strategy=consistent\_hashing
```

一致性哈希策略根据表名的哈希值分配到固定的节点，适合需要保证相同表数据在同一节点处理的场景。

故障转移机制：



* 当 Active 节点故障时，Zookeeper 会检测到节点消失

* Zookeeper 触发选举机制，从 Standby 节点中选出新的 Active 节点

* 新的 Active 节点接管故障节点的所有 instance

* 客户端会自动重连到新的 Active 节点

* 整个故障转移过程通常在几秒内完成

### 3.4 启动运行与状态检查

#### 3.4.1 启动命令与参数

启动 Canal 的命令因操作系统而异：

**Linux 系统启动命令**：



```
sh bin/startup.sh
```

**Windows 系统启动命令**：



```
bin\startup.bat
```

启动脚本支持以下参数：



* `start`：启动 Canal 服务（默认）

* `stop`：停止 Canal 服务

* `restart`：重启 Canal 服务

* `status`：查看服务状态

例如，查看服务状态：



```
sh bin/status.sh
```

#### 3.4.2 日志文件与监控

Canal 的日志文件存放在`logs`目录下，主要包括：



1. **canal.log**：Canal Server 的主要日志文件

2. **example.log**：example 实例的日志文件（根据 instance 名称命名）

3. **canal\_gc.log**：JVM 垃圾回收日志

4. **canal\_stderr.log**：标准错误输出日志

查看实时日志：



```
tail -f logs/canal.log

tail -f logs/example.log
```

在启动过程中，如果出现内存不足的错误，可以通过修改`bin/``startup.sh`文件中的 JVM 参数来调整内存配置。例如：



```
JAVA\_OPTS="-server -Xms512m -Xmx512m -Xmn256m -XX:SurvivorRatio=2"
```

#### 3.4.3 常见启动问题处理



1. **端口占用问题**：

   如果启动时报错端口已被占用，可以通过以下命令查看占用端口的进程：



```
lsof -i :11111
```

然后杀死对应的进程或修改 Canal 的端口配置。



1. **连接数据库失败**：

* 检查 MySQL 服务是否正常运行

* 检查`instance.properties`中的数据库连接信息是否正确

* 检查网络连接是否正常

* 检查 MySQL 用户权限是否正确

1. **binlog 解析错误**：

* 确保 MySQL 的 binlog 格式为 ROW 模式

* 检查 MySQL 的 server\_id 与 Canal 的 slaveId 是否重复

* 检查 binlog 是否已开启

1. **内存不足**：

* 增加服务器内存

* 调整 JVM 内存参数

* 减少 instance 数量或降低并发度

1. **配置文件错误**：

* 检查配置文件格式是否正确

* 检查参数名称是否正确

* 确保所有必填参数都已配置

## 4. Spring Boot 集成开发指南

### 4.1 项目依赖配置

在 Spring Boot 项目中集成 Canal，首先需要在`pom.xml`文件中添加相应的依赖。根据 Spring Boot 版本的不同，依赖配置略有差异：

#### 4.1.1 Maven 依赖配置

**Spring Boot 2.x 版本依赖配置**：



```
\<dependencies>

&#x20;   \<!-- Spring Boot Web Starter（如果需要Web功能） -->

&#x20;   \<dependency>

&#x20;       \<groupId>org.springframework.boot\</groupId>

&#x20;       \<artifactId>spring-boot-starter-web\</artifactId>

&#x20;   \</dependency>

&#x20;  &#x20;

&#x20;   \<!-- Canal客户端依赖 -->

&#x20;   \<dependency>

&#x20;       \<groupId>com.alibaba.otter\</groupId>

&#x20;       \<artifactId>canal.client\</artifactId>

&#x20;       \<version>1.1.7\</version>

&#x20;       \<exclusions>

&#x20;           \<!-- 排除冲突的日志依赖 -->

&#x20;           \<exclusion>

&#x20;               \<groupId>ch.qos.logback\</groupId>

&#x20;               \<artifactId>logback-core\</artifactId>

&#x20;           \</exclusion>

&#x20;           \<exclusion>

&#x20;               \<groupId>ch.qos.logback\</groupId>

&#x20;               \<artifactId>logback-classic\</artifactId>

&#x20;           \</exclusion>

&#x20;       \</exclusions>

&#x20;   \</dependency>

&#x20;  &#x20;

&#x20;   \<!-- Canal协议依赖（可选，根据需要添加） -->

&#x20;   \<dependency>

&#x20;       \<groupId>com.alibaba.otter\</groupId>

&#x20;       \<artifactId>canal.protocol\</artifactId>

&#x20;       \<version>1.1.7\</version>

&#x20;   \</dependency>

&#x20;  &#x20;

&#x20;   \<!-- 如果需要使用Spring的AOP功能（如事务处理） -->

&#x20;   \<dependency>

&#x20;       \<groupId>org.springframework.boot\</groupId>

&#x20;       \<artifactId>spring-boot-starter-aop\</artifactId>

&#x20;   \</dependency>

&#x20;  &#x20;

&#x20;   \<!-- 如果需要使用Redis等缓存（根据业务需求） -->

&#x20;   \<dependency>

&#x20;       \<groupId>org.springframework.boot\</groupId>

&#x20;       \<artifactId>spring-boot-starter-data-redis\</artifactId>

&#x20;   \</dependency>

\</dependencies>
```

**Spring Boot 3.x 版本依赖配置**：



```
\<dependencies>

&#x20;   \<!-- Spring Boot Web Starter（如果需要Web功能） -->

&#x20;   \<dependency>

&#x20;       \<groupId>org.springframework.boot\</groupId>

&#x20;       \<artifactId>spring-boot-starter-web\</artifactId>

&#x20;   \</dependency>

&#x20;  &#x20;

&#x20;   \<!-- Canal客户端依赖（适用于Spring Boot 3.x） -->

&#x20;   \<dependency>

&#x20;       \<groupId>com.alibaba.otter\</groupId>

&#x20;       \<artifactId>canal.client\</artifactId>

&#x20;       \<version>1.1.7\</version>

&#x20;       \<exclusions>

&#x20;           \<!-- 排除冲突的日志依赖 -->

&#x20;           \<exclusion>

&#x20;               \<groupId>ch.qos.logback\</groupId>

&#x20;               \<artifactId>logback-core\</artifactId>

&#x20;           \</exclusion>

&#x20;           \<exclusion>

&#x20;               \<groupId>ch.qos.logback\</groupId>

&#x20;               \<artifactId>logback-classic\</artifactId>

&#x20;           \</exclusion>

&#x20;       \</exclusions>

&#x20;   \</dependency>

&#x20;  &#x20;

&#x20;   \<!-- Spring Boot 3.x需要添加的额外依赖 -->

&#x20;   \<dependency>

&#x20;       \<groupId>org.springframework.boot\</groupId>

&#x20;       \<artifactId>spring-boot-starter-log4j2\</artifactId>

&#x20;   \</dependency>

\</dependencies>
```

需要注意的是，Canal 客户端的日志依赖可能与 Spring Boot 的默认日志框架产生冲突，因此需要通过`<exclusions>`标签排除冲突的日志依赖[(102)](https://blog.csdn.net/qq_40096897/article/details/121754412)。

#### 4.1.2 版本兼容性说明

Canal 与 Spring Boot 的兼容性情况如下：



1. **Spring Boot 2.x 版本**：

* 支持 Canal 1.1.7 及以上版本

* 推荐使用 Spring Boot 2.3.x 以上版本以获得更好的兼容性

1. **Spring Boot 3.x 版本**：

* 支持 Canal 1.1.7 及以上版本

* 需要额外添加 log4j2 依赖以避免日志冲突

1. **Canal 版本要求**：

* 最低要求 Canal 1.1.4 版本（需要 Canal Server 提供面向 Admin 的动态运维管理接口）

* 推荐使用 Canal 1.1.7 或 1.1.8 版本以获得最佳性能和稳定性

1. **JDK 版本要求**：

* Spring Boot 2.x：需要 JDK 8 或以上版本

* Spring Boot 3.x：需要 JDK 17 或以上版本

### 4.2 Canal 客户端配置与连接

#### 4.2.1 配置文件设置

在 Spring Boot 项目中，可以通过`application.properties`或`application.yml`文件配置 Canal 连接信息。推荐使用`application.yml`以获得更好的可读性：



```
canal:

&#x20; \# Canal Server连接配置

&#x20; server:

&#x20;   host: 127.0.0.1      # Canal Server主机地址

&#x20;   port: 11111          # Canal Server端口

&#x20;   destination: example  # instance名称

&#x20;  &#x20;

&#x20; \# 认证信息（如果启用了认证）

&#x20; username:             # 用户名（默认为空）

&#x20; password:             # 密码（默认为空）

&#x20;&#x20;

&#x20; \# 连接池配置

&#x20; pool:

&#x20;   max-active: 10       # 最大活跃连接数

&#x20;   max-idle: 5          # 最大空闲连接数

&#x20;   min-idle: 1          # 最小空闲连接数

&#x20;   timeout: 30000       # 连接超时时间（毫秒）

&#x20;  &#x20;

&#x20; \# 订阅配置

&#x20; subscribe: ".\*\\\\..\*"   # 订阅所有表的变更事件

&#x20; filter-regex:          # 表过滤正则表达式（可选）

&#x20; black-regex:           # 黑名单正则表达式（可选）
```

如果需要配置多个 Canal Server（集群模式），可以使用以下配置：



```
canal:

&#x20; server:

&#x20;   cluster:

&#x20;     \- host: 192.168.1.100

&#x20;       port: 11111

&#x20;     \- host: 192.168.1.101

&#x20;       port: 11111

&#x20;     \- host: 192.168.1.102

&#x20;       port: 11111

&#x20;   destination: example
```

#### 4.2.2 连接工厂与配置类

创建 Canal 连接工厂和配置类，用于管理 Canal 客户端连接：



```
import com.alibaba.otter.canal.client.CanalConnector;

import com.alibaba.otter.canal.client.CanalConnectors;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;

import org.springframework.boot.context.properties.EnableConfigurationProperties;

import org.springframework.context.annotation.Bean;

import org.springframework.context.annotation.Configuration;

import java.net.InetSocketAddress;

import java.util.List;

@Configuration

@EnableConfigurationProperties(CanalProperties.class)

public class CanalConfig {

&#x20;   @Autowired

&#x20;   private CanalProperties canalProperties;

&#x20;   @Bean

&#x20;   @ConditionalOnMissingBean

&#x20;   public CanalConnector canalConnector() {

&#x20;       CanalConnector connector;

&#x20;      &#x20;

&#x20;       // 判断是否为集群配置

&#x20;       if (canalProperties.getServer().getCluster() != null && !canalProperties.getServer().getCluster().isEmpty()) {

&#x20;           List\<InetSocketAddress> addresses = canalProperties.getServer().getCluster().stream()

&#x20;                   .map(server -> new InetSocketAddress(server.getHost(), server.getPort()))

&#x20;                   .toList();

&#x20;           connector = CanalConnectors.newClusterConnector(addresses,&#x20;

&#x20;                   canalProperties.getServer().getDestination(),

&#x20;                   canalProperties.getUsername(),

&#x20;                   canalProperties.getPassword());

&#x20;       } else {

&#x20;           connector = CanalConnectors.newSingleConnector(

&#x20;                   new InetSocketAddress(canalProperties.getServer().getHost(), canalProperties.getServer().getPort()),

&#x20;                   canalProperties.getServer().getDestination(),

&#x20;                   canalProperties.getUsername(),

&#x20;                   canalProperties.getPassword());

&#x20;       }

&#x20;      &#x20;

&#x20;       // 配置连接池参数

&#x20;       connector.setConnectTimeout(canalProperties.getPool().getTimeout());

&#x20;       connector.setSoTimeout(canalProperties.getPool().getTimeout());

&#x20;      &#x20;

&#x20;       return connector;

&#x20;   }

}
```

创建`CanalProperties`配置类，用于读取配置文件：



```
import org.springframework.boot.context.properties.ConfigurationProperties;

import org.springframework.stereotype.Component;

import java.util.List;

@Component

@ConfigurationProperties(prefix = "canal")

public class CanalProperties {

&#x20;   private String username;

&#x20;   private String password;

&#x20;   private CanalServerProperties server;

&#x20;   private CanalPoolProperties pool;

&#x20;   private String subscribe;

&#x20;   private String filterRegex;

&#x20;   private String blackRegex;

&#x20;   // getters and setters

}

class CanalServerProperties {

&#x20;   private String host;

&#x20;   private int port;

&#x20;   private String destination;

&#x20;   private List\<CanalClusterServer> cluster;

&#x20;   // getters and setters

}

class CanalClusterServer {

&#x20;   private String host;

&#x20;   private int port;

&#x20;   // getters and setters

}

class CanalPoolProperties {

&#x20;   private int maxActive;

&#x20;   private int maxIdle;

&#x20;   private int minIdle;

&#x20;   private int timeout;

&#x20;   // getters and setters

}
```

### 4.3 数据监听器与事件处理

#### 4.3.1 基础监听器实现

创建 Canal 数据监听器，实现对数据库变更事件的监听和处理：



```
import com.alibaba.otter.canal.client.CanalConnector;

import com.alibaba.otter.canal.protocol.CanalEntry;

import com.alibaba.otter.canal.protocol.Message;

import org.slf4j.Logger;

import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.boot.CommandLineRunner;

import org.springframework.stereotype.Component;

import java.util.List;

@Component

public class CanalDataListener implements CommandLineRunner {

&#x20;   private static final Logger logger = LoggerFactory.getLogger(CanalDataListener.class);

&#x20;  &#x20;

&#x20;   @Autowired

&#x20;   private CanalConnector canalConnector;

&#x20;  &#x20;

&#x20;   @Autowired

&#x20;   private CanalProperties canalProperties;

&#x20;  &#x20;

&#x20;   private static final int BATCH\_SIZE = 1000;  // 每次拉取的事件数量

&#x20;  &#x20;

&#x20;   @Override

&#x20;   public void run(String... args) throws Exception {

&#x20;       // 连接Canal Server

&#x20;       canalConnector.connect();

&#x20;      &#x20;

&#x20;       // 订阅数据变更事件

&#x20;       if (canalProperties.getSubscribe() != null && !canalProperties.getSubscribe().isEmpty()) {

&#x20;           canalConnector.subscribe(canalProperties.getSubscribe());

&#x20;       } else {

&#x20;           canalConnector.subscribe(".\*\\\\..\*");  // 默认订阅所有表

&#x20;       }

&#x20;      &#x20;

&#x20;       // 回滚到最新的位置

&#x20;       canalConnector.rollback();

&#x20;      &#x20;

&#x20;       logger.info("Canal客户端已连接，开始监听数据变更...");

&#x20;      &#x20;

&#x20;       while (true) {

&#x20;           // 获取数据变更事件

&#x20;           Message message = canalConnector.getWithoutAck(BATCH\_SIZE);

&#x20;           long batchId = message.getId();

&#x20;          &#x20;

&#x20;           if (batchId == -1 || message.getEntries().isEmpty()) {

&#x20;               try {

&#x20;                   Thread.sleep(1000);

&#x20;               } catch (InterruptedException e) {

&#x20;                   logger.error("线程睡眠被中断", e);

&#x20;               }

&#x20;               continue;

&#x20;           }

&#x20;          &#x20;

&#x20;           // 处理数据变更事件

&#x20;           processEntries(message.getEntries());

&#x20;          &#x20;

&#x20;           // 确认消费成功

&#x20;           canalConnector.ack(batchId);

&#x20;       }

&#x20;   }

&#x20;  &#x20;

&#x20;   private void processEntries(List\<CanalEntry.Entry> entries) {

&#x20;       for (CanalEntry.Entry entry : entries) {

&#x20;           if (entry.getEntryType() == CanalEntry.EntryType.TRANSACTIONBEGIN ||&#x20;

&#x20;               entry.getEntryType() == CanalEntry.EntryType.TRANSACTIONEND) {

&#x20;               continue;

&#x20;           }

&#x20;          &#x20;

&#x20;           try {

&#x20;               CanalEntry.RowChange rowChange = CanalEntry.RowChange.parseFrom(entry.getStoreValue());

&#x20;               CanalEntry.EventType eventType = rowChange.getEventType();

&#x20;              &#x20;

&#x20;               logger.info("================> 收到数据变更事件: {}", eventType);

&#x20;               logger.info("数据库: {}，表: {}", entry.getHeader().getSchemaName(), entry.getHeader().getTableName());

&#x20;              &#x20;

&#x20;               for (CanalEntry.RowData rowData : rowChange.getRowDatasList()) {

&#x20;                   if (eventType == CanalEntry.EventType.INSERT) {

&#x20;                       handleInsert(rowData.getAfterColumnsList());

&#x20;                   } else if (eventType == CanalEntry.EventType.UPDATE) {

&#x20;                       handleUpdate(rowData.getBeforeColumnsList(), rowData.getAfterColumnsList());

&#x20;                   } else if (eventType == CanalEntry.EventType.DELETE) {

&#x20;                       handleDelete(rowData.getBeforeColumnsList());

&#x20;                   }

&#x20;               }

&#x20;           } catch (Exception e) {

&#x20;               logger.error("解析数据变更事件失败", e);

&#x20;           }

&#x20;       }

&#x20;   }

&#x20;  &#x20;

&#x20;   private void handleInsert(List\<CanalEntry.Column> columns) {

&#x20;       logger.info("插入操作: ");

&#x20;       for (CanalEntry.Column column : columns) {

&#x20;           logger.info("  {} = {} (是否更新: {})", column.getName(), column.getValue(), column.getUpdated());

&#x20;       }

&#x20;   }

&#x20;  &#x20;

&#x20;   private void handleUpdate(List\<CanalEntry.Column> beforeColumns, List\<CanalEntry.Column> afterColumns) {

&#x20;       logger.info("更新操作: ");

&#x20;       logger.info("更新前: ");

&#x20;       for (CanalEntry.Column column : beforeColumns) {

&#x20;           logger.info("  {} = {} (是否更新: {})", column.getName(), column.getValue(), column.getUpdated());

&#x20;       }

&#x20;       logger.info("更新后: ");

&#x20;       for (CanalEntry.Column column : afterColumns) {

&#x20;           logger.info("  {} = {} (是否更新: {})", column.getName(), column.getValue(), column.getUpdated());

&#x20;       }

&#x20;   }

&#x20;  &#x20;

&#x20;   private void handleDelete(List\<CanalEntry.Column> columns) {

&#x20;       logger.info("删除操作: ");

&#x20;       for (CanalEntry.Column column : columns) {

&#x20;           logger.info("  {} = {} (是否更新: {})", column.getName(), column.getValue(), column.getUpdated());

&#x20;       }

&#x20;   }

}
```

#### 4.3.2 事务处理与确认机制

Canal 的事务处理和确认机制非常重要，关系到数据同步的可靠性：



1. **事务边界识别**：

   Canal 通过`TRANSACTIONBEGIN`和`TRANSACTIONEND`事件标识事务边界。在处理数据时，应该忽略这两种事件类型，只处理`ROW_DATA`类型的事件。

2. **ACK 确认机制**：

* `getWithoutAck(int batchSize)`：获取指定数量的数据，但不自动确认

* `ack(long batchId)`：确认指定批次的数据已成功处理

* `rollback(long batchId)`：回滚指定批次的数据，让 Canal 重新发送

1. **异常处理策略**：

* 如果处理过程中发生异常，应该记录错误日志，但不要回滚，避免重复处理

* 使用`ack(batchId)`确认已处理的数据，即使部分数据处理失败

* 对于失败的数据，应该记录到错误队列或日志中，后续进行补偿处理

1. **幂等性设计**：

   由于网络问题或系统故障，可能会收到重复的事件。因此，在设计数据处理逻辑时，应该确保操作具有幂等性，避免重复处理导致的数据不一致。

#### 4.3.3 多线程消费与并发控制

为了提高数据处理性能，可以使用多线程并发消费：



```
import org.springframework.scheduling.annotation.Async;

import org.springframework.stereotype.Component;

import java.util.List;

import java.util.concurrent.ExecutorService;

import java.util.concurrent.Executors;

@Component

public class CanalMultiThreadConsumer {

&#x20;   private static final int THREAD\_POOL\_SIZE = 10;  // 线程池大小

&#x20;   private final ExecutorService executorService = Executors.newFixedThreadPool(THREAD\_POOL\_SIZE);

&#x20;  &#x20;

&#x20;   @Async

&#x20;   public void process(List\<CanalEntry.Entry> entries) {

&#x20;       executorService.submit(() -> {

&#x20;           for (CanalEntry.Entry entry : entries) {

&#x20;               // 处理单个entry

&#x20;               processEntry(entry);

&#x20;           }

&#x20;       });

&#x20;   }

&#x20;  &#x20;

&#x20;   private void processEntry(CanalEntry.Entry entry) {

&#x20;       // 处理数据变更事件的逻辑

&#x20;   }

}
```

在监听器中使用多线程消费：



```
// 在CanalDataListener中

private final CanalMultiThreadConsumer consumer;

@Autowired

public CanalDataListener(CanalMultiThreadConsumer consumer) {

&#x20;   this.consumer = consumer;

}

private void processEntries(List\<CanalEntry.Entry> entries) {

&#x20;   consumer.process(entries);

}
```

需要注意的是，使用多线程时要考虑以下几点：



* 线程池大小应该根据服务器性能和业务需求合理配置

* 确保线程安全，避免共享变量的并发问题

* 处理过程中要捕获异常，避免线程终止

* 对于需要保证顺序的业务（如同一订单的状态变更），应该使用单线程处理

### 4.4 集成实战案例

#### 4.4.1 MySQL 到 Redis 缓存同步

实现 MySQL 数据变更自动同步到 Redis 缓存的案例：



```
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.data.redis.core.RedisTemplate;

import org.springframework.stereotype.Component;

import java.util.List;

import java.util.Map;

import java.util.stream.Collectors;

@Component

public class MysqlToRedisSyncService {

&#x20;   @Autowired

&#x20;   private RedisTemplate\<String, String> redisTemplate;

&#x20;  &#x20;

&#x20;   public void handleInsert(List\<CanalEntry.Column> columns) {

&#x20;       Map\<String, String> data = columns.stream()

&#x20;               .collect(Collectors.toMap(CanalEntry.Column::getName, CanalEntry.Column::getValue));

&#x20;      &#x20;

&#x20;       String id = data.get("id");

&#x20;       if (id != null) {

&#x20;           String key = "user:" + id;

&#x20;           String value = data.toString();  // 可以序列化为JSON

&#x20;           redisTemplate.opsForValue().set(key, value);

&#x20;       }

&#x20;   }

&#x20;  &#x20;

&#x20;   public void handleUpdate(List\<CanalEntry.Column> beforeColumns, List\<CanalEntry.Column> afterColumns) {

&#x20;       Map\<String, String> afterData = afterColumns.stream()

&#x20;               .collect(Collectors.toMap(CanalEntry.Column::getName, CanalEntry.Column::getValue));

&#x20;      &#x20;

&#x20;       String id = afterData.get("id");

&#x20;       if (id != null) {

&#x20;           String key = "user:" + id;

&#x20;           String value = afterData.toString();

&#x20;           redisTemplate.opsForValue().set(key, value);

&#x20;       }

&#x20;   }

&#x20;  &#x20;

&#x20;   public void handleDelete(List\<CanalEntry.Column> columns) {

&#x20;       Map\<String, String> data = columns.stream()

&#x20;               .collect(Collectors.toMap(CanalEntry.Column::getName, CanalEntry.Column::getValue));

&#x20;      &#x20;

&#x20;       String id = data.get("id");

&#x20;       if (id != null) {

&#x20;           String key = "user:" + id;

&#x20;           redisTemplate.delete(key);

&#x20;       }

&#x20;   }

}
```

在监听器中调用同步服务：



```
// 在CanalDataListener中

@Autowired

private MysqlToRedisSyncService syncService;

private void handleInsert(List\<CanalEntry.Column> columns) {

&#x20;   syncService.handleInsert(columns);

}

private void handleUpdate(List\<CanalEntry.Column> beforeColumns, List\<CanalEntry.Column> afterColumns) {

&#x20;   syncService.handleUpdate(beforeColumns, afterColumns);

}

private void handleDelete(List\<CanalEntry.Column> columns) {

&#x20;   syncService.handleDelete(columns);

}
```

#### 4.4.2 数据过滤与转换

实现数据过滤和转换的案例，只同步特定表和字段：



```
import org.springframework.stereotype.Component;

import java.util.List;

import java.util.stream.Collectors;

@Component

public class DataFilterAndTransformService {

&#x20;   public boolean shouldSync(String schema, String table) {

&#x20;       // 只同步test库的user表

&#x20;       return "test".equals(schema) && "user".equals(table);

&#x20;   }

&#x20;  &#x20;

&#x20;   public List\<CanalEntry.Column> filterColumns(List\<CanalEntry.Column> columns) {

&#x20;       // 只保留id、name、email字段

&#x20;       return columns.stream()

&#x20;               .filter(c -> "id".equals(c.getName()) || "name".equals(c.getName()) || "email".equals(c.getName()))

&#x20;               .collect(Collectors.toList());

&#x20;   }

&#x20;  &#x20;

&#x20;   public void transformData(List\<CanalEntry.Column> columns) {

&#x20;       // 数据转换示例：将name字段转为大写

&#x20;       columns.forEach(c -> {

&#x20;           if ("name".equals(c.getName())) {

&#x20;               c.setValue(c.getValue().toUpperCase());

&#x20;           }

&#x20;       });

&#x20;   }

}
```

在监听器中使用过滤和转换服务：



```
// 在CanalDataListener中

@Autowired

private DataFilterAndTransformService filterService;

private void processEntries(List\<CanalEntry.Entry> entries) {

&#x20;   for (CanalEntry.Entry entry : entries) {

&#x20;       String schema = entry.getHeader().getSchemaName();

&#x20;       String table = entry.getHeader().getTableName();

&#x20;      &#x20;

&#x20;       if (!filterService.shouldSync(schema, table)) {

&#x20;           continue;

&#x20;       }

&#x20;      &#x20;

&#x20;       try {

&#x20;           CanalEntry.RowChange rowChange = CanalEntry.RowChange.parseFrom(entry.getStoreValue());

&#x20;          &#x20;

&#x20;           // 过滤和转换列

&#x20;           for (CanalEntry.RowData rowData : rowChange.getRowDatasList()) {

&#x20;               rowData.setAfterColumnsList(filterService.filterColumns(rowData.getAfterColumnsList()));

&#x20;               rowData.setBeforeColumnsList(filterService.filterColumns(rowData.getBeforeColumnsList()));

&#x20;               filterService.transformData(rowData.getAfterColumnsList());

&#x20;           }

&#x20;          &#x20;

&#x20;           // 处理过滤后的数据

&#x20;           handleRowChange(entry, rowChange);

&#x20;       } catch (Exception e) {

&#x20;           logger.error("解析数据变更事件失败", e);

&#x20;       }

&#x20;   }

}
```

## 5. 数据同步功能实现与优化

### 5.1 数据同步规则设计

在设计数据同步规则时，需要考虑以下几个方面：

#### 5.1.1 表级过滤规则

通过正则表达式配置表级过滤规则，可以精确控制需要同步的表：

**全库全表同步**：



```
canal.instance.filter.regex=.\*\\\\..\*
```

**指定库全表同步**：



```
canal.instance.filter.regex=test\\\\..\*    # 同步test库的所有表
```

**指定表同步**：



```
canal.instance.filter.regex=test\\\\.user  # 只同步test库的user表
```

**多表同步**（用逗号分隔）：



```
canal.instance.filter.regex=test\\\\.user,test\\\\.order,demo\\\\.product
```

**排除特定表**（使用黑名单）：



```
canal.instance.filter.regex=.\*\\\\..\*

canal.instance.filter.black.regex=test\\\\.log\_.\*  # 排除test库所有以log\_开头的表
```

#### 5.1.2 字段级过滤与映射

在实际应用中，可能只需要同步部分字段或进行字段映射：



```
public class FieldFilterAndMapper {

&#x20;   public Map\<String, String> filterAndMapColumns(List\<CanalEntry.Column> columns) {

&#x20;       Map\<String, String> result = new HashMap<>();

&#x20;      &#x20;

&#x20;       for (CanalEntry.Column column : columns) {

&#x20;           String columnName = column.getName();

&#x20;           String value = column.getValue();

&#x20;          &#x20;

&#x20;           // 字段过滤：只保留需要的字段

&#x20;           if ("id".equals(columnName) || "name".equals(columnName) || "email".equals(columnName)) {

&#x20;               // 字段映射：可以重命名字段

&#x20;               String mappedName = columnName;

&#x20;               if ("email".equals(columnName)) {

&#x20;                   mappedName = "user\_email";  // 将email映射为user\_email

&#x20;               }

&#x20;              &#x20;

&#x20;               result.put(mappedName, value);

&#x20;           }

&#x20;       }

&#x20;      &#x20;

&#x20;       return result;

&#x20;   }

}
```

#### 5.1.3 数据转换规则

数据转换是数据同步中的重要环节，包括：



1. **类型转换**：

* 将 MySQL 的 datetime 类型转换为 Java 的 Date 对象

* 将 MySQL 的 decimal 类型转换为 Java 的 BigDecimal

* 将枚举类型转换为对应的数值或字符串

1. **格式转换**：

* 将日期格式从 "yyyy-MM-dd HH:mm:ss" 转换为其他格式

* 将 JSON 字符串转换为对象

* 将特定编码的数据进行解码

1. **业务规则转换**：

* 根据业务规则计算新的字段值

* 对敏感信息进行脱敏处理

* 对数据进行校验和清洗

### 5.2 增量数据处理策略

#### 5.2.1 增量同步机制

Canal 的增量同步基于 binlog 的增量订阅，具有以下特点：



1. **实时性**：基于 binlog 的增量同步，延迟可控制在毫秒级到秒级[(144)](https://www.cnblogs.com/jingzh/p/18856421)。

2. **精确性**：能够精确捕获每一行数据的变更，包括：

* INSERT 操作：记录新增的完整行数据

* UPDATE 操作：记录变更前后的行数据

* DELETE 操作：记录删除前的行数据

1. **断点续传**：Canal 会记录已消费的 binlog 位置，当服务重启后可以从断点继续同步，不会丢失数据。

2. **事务完整性**：Canal 能够保证事务的完整性，一个事务中的所有变更要么全部同步，要么全部不同步。

#### 5.2.2 数据一致性保障

确保数据一致性是数据同步的核心要求，Canal 通过以下机制保障数据一致性：



1. **ACK 确认机制**：

* 客户端必须显式调用`ack(batchId)`确认数据已成功处理

* 如果未收到 ACK，Canal 会重新发送数据

* 确保至少一次（at least once）的投递语义

1. **幂等性设计**：

* 由于网络问题可能导致重复投递，消费端必须实现幂等性

* 通过业务主键去重

* 使用唯一 ID 标识每一次操作

1. **事务边界保证**：

* 严格按照事务顺序处理数据变更

* 确保同一事务的所有操作在消费端按顺序执行

* 支持事务回滚（通过`rollback`方法）

1. **数据校验机制**：

* 在同步过程中进行数据校验

* 定期进行全量数据比对

* 记录数据校验结果，及时发现不一致

#### 5.2.3 异常处理与重试机制

在数据同步过程中，可能遇到各种异常情况，需要完善的异常处理机制：



1. **重试策略**：



```
public class RetryPolicy {

&#x20;   private static final int MAX\_RETRIES = 3;  // 最大重试次数

&#x20;   private static final int INITIAL\_DELAY = 1000;  // 初始延迟（毫秒）

&#x20;   private static final int MULTIPLIER = 2;  // 延迟倍数

&#x20;  &#x20;

&#x20;   public int getRetryCount(String batchId) {

&#x20;       // 可以根据batchId从缓存或数据库中获取重试次数

&#x20;       return 0;

&#x20;   }

&#x20;  &#x20;

&#x20;   public long getRetryDelay(int retryCount) {

&#x20;       return INITIAL\_DELAY \* (int) Math.pow(MULTIPLIER, retryCount);

&#x20;   }

}
```



1. **异常分类处理**：

* **瞬时异常**（如网络波动）：自动重试

* **永久性异常**（如数据格式错误）：记录错误，不再重试

* **业务异常**（如数据校验失败）：根据配置决定是否重试

1. **错误队列**：

* 将处理失败的数据放入错误队列

* 提供错误数据查看和重试界面

* 支持批量重试和手动处理

1. **补偿机制**：

* 对于无法自动处理的错误，提供补偿接口

* 通过定时任务扫描错误队列

* 支持数据回滚和重新同步

### 5.3 性能优化策略

#### 5.3.1 批量处理优化

通过批量处理可以显著提高数据同步性能：



1. **调整批量大小**：



```
canal.instance.batch.size=1000    # 每次拉取的事件数量

canal.instance.fetch.size=5000    # 网络传输批次大小
```



1. **批量写入优化**：

* 使用 JDBC 批量更新

* 使用 ORM 框架的批量操作

* 批量写入缓存或消息队列

1. **异步处理**：

* 将数据处理与 ACK 确认分离

* 使用线程池异步处理数据

* 批量确认，减少网络交互

#### 5.3.2 并行处理优化

通过并行处理提高系统吞吐量：



1. **开启并行解析**：



```
canal.instance.parser.parallel=true

canal.instance.parser.parallelThreadSize=16  # 根据CPU核心数配置
```



1. **多 Instance 并行**：

* 将不同的表分配到不同的 instance

* 每个 instance 独立处理，互不影响

* 适用于表数据量差异较大的场景

1. **多线程消费**：

* 使用线程池并发处理数据

* 每个线程处理独立的表或分区

* 注意保证同一业务数据的顺序性

#### 5.3.3 缓存与预加载优化

通过缓存和预加载减少重复操作：



1. **表结构缓存**：

* 缓存表字段信息，避免重复查询

* 缓存字段类型映射关系

* 定期刷新缓存

1. **数据字典缓存**：

* 缓存枚举值映射关系

* 缓存代码表数据

* 使用本地缓存或分布式缓存

1. **预加载策略**：

* 预加载常用数据

* 异步加载关联数据

* 使用懒加载减少内存占用

#### 5.3.4 网络与 IO 优化

优化网络和 IO 操作对性能提升至关重要：



1. **连接池优化**：



```
canal:

&#x20; pool:

&#x20;   max-active: 20

&#x20;   max-idle: 10

&#x20;   min-idle: 5

&#x20;   timeout: 30000
```



1. **网络参数优化**：

* 调整 TCP 缓冲区大小

* 设置合理的超时时间

* 使用长连接减少连接建立开销

1. **批大小优化**：

* 根据网络带宽调整批大小

* 根据目标系统处理能力调整

* 通过监控动态调整

1. **压缩优化**：

* 对传输数据进行压缩

* 使用 snappy 或 gzip 压缩算法

* 权衡压缩 CPU 开销与网络带宽

### 5.4 监控告警体系建设

建立完善的监控告警体系是保障数据同步服务稳定运行的关键：

#### 5.4.1 关键监控指标

需要监控的关键指标包括：



1. **连接状态监控**：

* Canal 客户端连接状态

* 连接池使用情况

* 重连次数和成功率

1. **性能指标监控**：

* TPS（每秒处理事务数）

* 延迟（从数据库变更到消费端接收的时间）

* 吞吐量（每秒处理的数据量）

* 内存使用情况

* CPU 使用率

1. **数据指标监控**：

* 已同步的记录数

* 同步失败的记录数

* 积压的事件数

* 不同操作类型的分布

1. **错误指标监控**：

* 各类异常的发生次数

* 错误处理成功率

* 重试次数统计

#### 5.4.2 告警规则设置

基于监控指标设置合理的告警规则：



1. **连接异常告警**：

* 当连接失败次数超过 5 次 / 分钟时触发告警

* 当连接池使用率超过 80% 时触发告警

* 当重连次数超过 10 次 / 小时时触发告警

1. **性能异常告警**：

* 当延迟超过 5 秒时触发警告，超过 10 秒时触发严重告警

* 当 TPS 低于正常水平的 50% 时触发告警

* 当内存使用率超过 80% 时触发警告，超过 90% 时触发严重告警

1. **数据异常告警**：

* 当同步失败率超过 5% 时触发告警

* 当积压事件数超过 1000 时触发警告，超过 10000 时触发严重告警

* 当某张表连续 10 分钟无数据同步时触发告警

1. **错误告警**：

* 当出现未捕获的异常时立即告警

* 当特定错误（如主键冲突）频繁发生时告警

* 当重试次数达到上限时告警

#### 5.4.3 监控工具集成

可以使用以下工具构建监控体系：



1. **Prometheus 监控**：

* 启用 Canal 的 Prometheus 监控功能

* 配置 Prometheus 采集 Canal 指标

* 使用 Grafana 展示监控面板

1. **Spring Boot Actuator**：

* 启用 Spring Boot 的健康检查

* 自定义健康指示器

* 通过 HTTP 端点暴露监控信息

1. **日志监控**：

* 使用 ELK Stack 收集和分析日志

* 设置日志告警规则

* 实现异常日志的自动告警

1. **自定义监控**：

* 使用 Micrometer 集成多种监控系统

* 实现业务指标的自定义监控

* 提供统一的监控 API 接口

## 6. 常见问题诊断与解决方案

### 6.1 连接与配置问题

#### 6.1.1 连接失败问题

连接失败是最常见的问题之一，可能的原因和解决方案如下：



1. **Canal Server 未启动**：

* 现象：`Caused by: ``java.net``.ConnectException: Connection refused`

* 解决：检查 Canal Server 是否已启动，端口是否正确

1. **网络连接问题**：

* 现象：连接超时或无法建立连接

* 解决：


  * 检查网络连通性（使用 ping 命令）

  * 检查防火墙是否开放了 11111 端口

  * 检查是否有网络策略限制

1. **认证失败**：

* 现象：`Authentication failed`

* 解决：


  * 检查用户名和密码是否正确

  * 检查 Canal Server 是否启用了认证

  * 检查密码是否正确加密

1. **instance 不存在**：

* 现象：`No such instance: example`

* 解决：


  * 检查`canal.destinations`配置是否正确

  * 检查 instance 目录是否存在

  * 检查 instance 配置文件是否正确

#### 6.1.2 配置错误处理

配置错误可能导致各种异常：



1. **配置文件格式错误**：

* 现象：启动时报错，提示配置文件解析失败

* 解决：


  * 使用配置验证工具检查格式

  * 确保所有必填参数都已配置

  * 注意参数名称的大小写

1. **端口冲突**：

* 现象：Canal Server 启动失败，端口已被占用

* 解决：


  * 使用`netstat -tlnp`查看端口占用情况

  * 修改 Canal 的端口配置

  * 停止占用端口的进程

1. **编码问题**：

* 现象：数据乱码或解析错误

* 解决：


  * 确保`connectionCharset`配置正确

  * 检查 MySQL 数据库的字符集设置

  * 统一使用 UTF-8 编码

1. **过滤规则错误**：

* 现象：无法接收到预期的表数据

* 解决：


  * 检查`filter.regex`配置是否正确

  * 避免在代码中调用`subscribe`方法

  * 使用简单的正则表达式进行测试

### 6.2 数据解析与同步问题

#### 6.2.1 数据解析错误

数据解析错误可能导致数据丢失或格式错误：



1. **binlog 格式不匹配**：

* 现象：解析时出现`Unsupported binlog event type`

* 解决：


  * 确保 MySQL 的 binlog 格式为 ROW

  * 检查 MySQL 版本是否支持

  * 升级 Canal 版本以支持新的 binlog 格式

1. **数据类型不匹配**：

* 现象：解析后的数据类型错误

* 解决：


  * 检查 Canal 对数据类型的支持

  * 实现自定义的数据类型转换器

  * 升级 Canal 版本以获得更好的类型支持

1. **时区问题**：

* 现象：时间字段显示错误

* 解决：


  * 统一配置时区（如`Asia/Shanghai`）

  * 在配置中指定时区参数

  * 对时间字段进行显式转换

1. **大对象处理**：

* 现象：`BLOB`或`TEXT`类型数据解析失败

* 解决：


  * 调整 MySQL 的数据包大小

  * 分块处理大对象数据

  * 使用流式处理避免内存溢出

#### 6.2.2 数据一致性问题

数据一致性问题是数据同步中的核心问题：



1. **数据重复**：

* 现象：消费端收到重复的数据

* 解决：


  * 实现幂等性处理逻辑

  * 使用唯一 ID 进行去重

  * 检查 ACK 机制是否正常工作

1. **数据丢失**：

* 现象：部分数据未被同步

* 解决：


  * 检查是否有解析错误

  * 检查 ACK 确认机制

  * 检查是否有事务回滚

  * 启用详细日志记录

1. **顺序错误**：

* 现象：数据变更顺序与数据库不一致

* 解决：


  * 确保使用单线程处理同一事务

  * 检查是否正确处理了事务边界

  * 避免使用多线程处理有顺序要求的数据

1. **部分更新**：

* 现象：只同步了部分字段

* 解决：


  * 检查字段映射配置

  * 确保没有过滤掉需要的字段

  * 检查数据转换逻辑

### 6.3 性能与稳定性问题

#### 6.3.1 性能瓶颈分析

性能问题可能出现在多个环节：



1. **CPU 使用率过高**：

* 现象：服务器 CPU 使用率超过 80%

* 解决：


  * 检查是否开启了并行解析

  * 调整线程池大小

  * 优化数据处理逻辑

  * 增加服务器 CPU 资源

1. **内存溢出**：

* 现象：频繁出现`OutOfMemoryError`

* 解决：


  * 增加 JVM 内存

  * 优化内存使用，及时释放对象

  * 调整批量处理大小

  * 检查是否有内存泄漏

1. **网络带宽不足**：

* 现象：同步延迟高，吞吐量低

* 解决：


  * 优化批大小，减少网络传输次数

  * 使用数据压缩

  * 升级网络带宽

  * 增加 Canal Server 节点

1. **数据库压力大**：

* 现象：MySQL 负载过高

* 解决：


  * 优化 MySQL 查询

  * 增加 MySQL 从库

  * 使用异步方式减少直接查询

  * 调整 binlog 相关参数

#### 6.3.2 高可用与故障恢复

确保系统的高可用性和故障恢复能力：



1. **单点故障**：

* 现象：Canal Server 宕机导致服务中断

* 解决：


  * 部署 Canal 集群

  * 使用 Zookeeper 实现自动故障转移

  * 配置主备模式

1. **数据恢复**：

* 现象：需要恢复历史数据

* 解决：


  * 定期备份 binlog 文件

  * 记录消费位点信息

  * 实现断点续传功能

  * 提供全量同步接口

1. **监控告警失效**：

* 现象：系统出现问题但未收到告警

* 解决：


  * 确保监控指标正确采集

  * 设置合理的告警阈值

  * 验证告警通知渠道

  * 实现告警自愈机制

1. **配置丢失**：

* 现象：配置文件损坏或丢失

* 解决：


  * 使用版本控制系统管理配置

  * 定期备份配置文件

  * 实现配置热更新

  * 提供配置校验功能

## 7. 最佳实践与总结

### 7.1 部署最佳实践

基于实际项目经验，以下是 Canal 部署的最佳实践：



1. **环境隔离**：

* 生产环境、测试环境、开发环境应完全隔离

* 使用不同的 Canal Server 实例

* 配置独立的数据库用户和权限

1. **资源配置建议**：

* CPU：生产环境建议 8 核或以上

* 内存：建议 16GB 或以上（根据数据量调整）

* 磁盘：使用 SSD 存储，至少 100GB 可用空间

* 网络：带宽应满足峰值数据传输需求

1. **安全配置**：

* 使用专用的数据库用户，权限最小化

* 定期更换密码

* 启用 SSL 连接（如果网络环境不安全）

* 限制 IP 访问，只允许必要的连接

1. **备份策略**：

* 定期备份 Canal 配置文件

* 备份 binlog 文件（根据保留策略）

* 备份监控数据和日志

* 实现自动备份和异地容灾

1. **版本管理**：

* 使用稳定版本，避免使用 SNAPSHOT 版本

* 定期更新到最新稳定版本

* 保留回滚能力

* 测试新版本后再上线

### 7.2 性能调优建议

根据性能测试和实际应用经验，以下是性能调优建议：



1. **参数优化**：



```
\# Canal配置优化

canal.instance.parser.parallel=true

canal.instance.parser.parallelThreadSize=16  # CPU核心数 \* 2

canal.instance.batch.size=1000

canal.instance.fetch.size=5000

canal.instance.memory.buffer.size=32768  # 32KB

\# 网络优化

canal.instance.network.receiveBufferSize=16384

canal.instance.network.sendBufferSize=16384

\# 存储优化

canal.instance.tsdb.enable=true

canal.instance.tsdb.dir=/data/canal/tsdb
```



1. **架构优化**：

* 使用 "Canal + 消息队列 + 批量写入" 模式

* 部署 Canal 集群提高并发能力

* 使用多 Instance 并行处理不同业务

* 实现读写分离，减少主库压力

1. **代码优化**：

* 实现高效的数据转换逻辑

* 使用批量操作减少数据库交互

* 合理使用缓存

* 优化异常处理，避免频繁日志输出

1. **监控优化**：

* 监控关键性能指标

* 设置合理的告警阈值

* 定期进行性能分析

* 根据监控结果持续优化

### 7.3 未来发展趋势

Canal 作为阿里巴巴开源的数据同步工具，未来的发展趋势包括：



1. **功能增强**：

* 支持更多数据库类型（如 PostgreSQL、Oracle）

* 增强数据转换和映射功能

* 提供更多的消息队列集成选项

* 支持云原生部署

1. **性能提升**：

* 优化内存管理，减少 GC 开销

* 提高并行处理能力

* 支持向量化解析

* 集成更高效的压缩算法

1. **生态完善**：

* 提供更多的 Spring Boot Starter

* 增强与其他中间件的集成

* 完善文档和示例代码

* 建立活跃的社区支持

1. **智能化运维**：

* 自动性能调优

* 智能故障诊断

* 自适应负载均衡

* 预测性维护

### 7.4 总结

通过本指南的详细介绍，我们全面了解了 Canal 在 Spring Boot 环境下的集成部署和使用方法。Canal 作为一款成熟的 MySQL 数据同步工具，具有以下核心优势：

**技术成熟度高**：Canal 已经在阿里巴巴内部大规模使用多年，经过了充分的生产环境验证，具有很高的稳定性和可靠性。

**集成简单便捷**：通过 Spring Boot Starter 可以快速集成，配置简单，开发门槛低。

**性能表现优异**：基于 binlog 的增量同步机制，延迟低，吞吐量高，能够满足大多数业务场景的需求。

**扩展性强**：支持多种部署模式、多种消息队列集成、多种编程语言客户端，具有很强的扩展性。

**社区支持活跃**：作为开源项目，Canal 拥有活跃的社区，能够及时获得技术支持和版本更新。

在实际应用中，需要根据具体的业务需求和技术环境，合理配置和使用 Canal。建议从简单场景开始，逐步扩展到复杂业务，在实践中不断优化和完善。

最后，希望本指南能够帮助你顺利完成 Canal 的部署和集成，实现高效可靠的数据同步功能。在使用过程中，要注重监控和日志记录，及时发现和解决问题，确保数据同步服务的稳定运行。

**参考资料&#x20;**

\[1] Canal核心架构设计及相关技术原理分析\_canal架构-CSDN博客[ https://blog.csdn.net/huxian1234/article/details/144541575](https://blog.csdn.net/huxian1234/article/details/144541575)

\[2] Canal详解\_canal工作原理-CSDN博客[ https://blog.csdn.net/Fireworkit/article/details/148475855](https://blog.csdn.net/Fireworkit/article/details/148475855)

\[3] MySQL数据同步之Canal讲解 - 上善若泪 - 博客园[ https://www.cnblogs.com/jingzh/p/18856421](https://www.cnblogs.com/jingzh/p/18856421)

\[4] Canal同步MySQL增量数据在现在的系统开发中，为了提高查询效率 , 以及搜索的精准度, 会大量的使用 redis - 掘金[ https://juejin.cn/post/7472562730626465842](https://juejin.cn/post/7472562730626465842)

\[5] cola架构学习 canal架构\_mob6454cc6ff2b9的技术博客\_51CTO博客[ https://blog.51cto.com/u\_16099267/11758951](https://blog.51cto.com/u_16099267/11758951)

\[6] 深入浅出阿里数据同步神器:Canal原理+配置+实战全网最全解析!-阿里云开发者社区[ https://developer.aliyun.com/article/1179561](https://developer.aliyun.com/article/1179561)

\[7] 大数据-263 实时数仓 - Canal 工作原理 工作流程 MySQL Binglog基本介绍\_51CTO博客\_大数据实时数仓架构[ https://blog.51cto.com/wuzikang/13029092](https://blog.51cto.com/wuzikang/13029092)

\[8] Canal解析MySQL Binlog原理与应用-CSDN博客[ https://blog.csdn.net/weixin\_43846235/article/details/150350342](https://blog.csdn.net/weixin_43846235/article/details/150350342)

\[9] 阿里巴巴开源数据库中间件 Canal - 茄子\_2008 - 博客园[ https://www.cnblogs.com/xd502djj/p/18789380](https://www.cnblogs.com/xd502djj/p/18789380)

\[10] 基于 canal 实现 Mysql Binlog 订阅和解析-腾讯云开发者社区-腾讯云[ https://cloud.tencent.com/developer/article/2529857](https://cloud.tencent.com/developer/article/2529857)

\[11] Canal入门-阿里云开发者社区[ https://developer.aliyun.com/article/1481731](https://developer.aliyun.com/article/1481731)

\[12] 如何通过canal等工具实现MySQL到其他数据源的实时同步?-mysql教程-PHP中文网[ https://m.php.cn/faq/1510982.html](https://m.php.cn/faq/1510982.html)

\[13] \[Release-1.32] - Update to flannel v0.26.701 and canal v3.30.0-build2025051500 #8254[ https://github.com/rancher/rke2/issues/8254](https://github.com/rancher/rke2/issues/8254)

\[14] canal alibaba - MyGit[ https://mygit.osfipin.com/repository/7587038](https://mygit.osfipin.com/repository/7587038)

\[15] Canal下载、部署和入门(详细)-CSDN博客[ https://blog.csdn.net/qq\_23845083/article/details/131834011](https://blog.csdn.net/qq_23845083/article/details/131834011)

\[16] RKE2项目中Flannel和Canal组件版本升级分析 - GitCode博客[ https://blog.gitcode.com/9a553f7caa4312396792c55442d8380f.html](https://blog.gitcode.com/9a553f7caa4312396792c55442d8380f.html)

\[17] alibaba/canal[ https://github.com/alibaba/canal](https://github.com/alibaba/canal)

\[18] MySQL 增量数据同步利器 Canal 1.1.7 环境搭建流程\_canal1.1.7-CSDN博客[ https://blog.csdn.net/lssffy/article/details/146767854](https://blog.csdn.net/lssffy/article/details/146767854)

\[19] 3.4.1.0 | CloudCanal of ClouGence[ https://m.clougence.com/cc-doc/releaseNote/rn-cloudcanal-3-4-1-0](https://m.clougence.com/cc-doc/releaseNote/rn-cloudcanal-3-4-1-0)

\[20] 3.2.1.0 | CloudCanal of ClouGence[ https://www.clougence.com/cc-doc/releaseNote/rn-cloudcanal-3-2-1-0](https://www.clougence.com/cc-doc/releaseNote/rn-cloudcanal-3-2-1-0)

\[21] Canal1.1.5版本发布:性能优化与新特性 - CSDN文库[ https://wenku.csdn.net/doc/1wfzjg6gza](https://wenku.csdn.net/doc/1wfzjg6gza)

\[22] Canal BinlogChange(mysql5.6)-CSDN博客[ https://blog.csdn.net/iteye\_7245/article/details/82486342](https://blog.csdn.net/iteye_7245/article/details/82486342)

\[23] MySQL Cannal Kafka数据采集\_cannal是啥-CSDN博客[ https://blog.csdn.net/weixin\_38231448/article/details/113605582](https://blog.csdn.net/weixin_38231448/article/details/113605582)

\[24] Canal项目版本选择指南:1.1.7与1.1.8-SNAPSHOT对比分析 - GitCode博客[ https://blog.gitcode.com/5262e058addfd414520eef82abdf081f.html](https://blog.gitcode.com/5262e058addfd414520eef82abdf081f.html)

\[25] MySQL Binlog 实时采集全解析:Flink CDC、Canal、Debezium 对比与选型指南-CSDN博客[ https://blog.csdn.net/weixin\_44519124/article/details/150385147](https://blog.csdn.net/weixin_44519124/article/details/150385147)

\[26] Jeesite数据同步工具深度解析:Canal与Debezium架构对比与实战指南-CSDN博客[ https://blog.csdn.net/gitblog\_00620/article/details/151303952](https://blog.csdn.net/gitblog_00620/article/details/151303952)

\[27] 实时数据同步之Maxwell和Canal-CSDN博客[ https://blog.csdn.net/lemon\_tt/article/details/137791162](https://blog.csdn.net/lemon_tt/article/details/137791162)

\[28] 数据同步工具之FlinkCDC/Canal/Debezium对比-腾讯云开发者社区-腾讯云[ https://cloud.tencent.com/developer/article/1897501?areaSource=106000.1](https://cloud.tencent.com/developer/article/1897501?areaSource=106000.1)

\[29] Maxwell - 增量数据同步工具(1)-阿里云开发者社区[ https://developer.aliyun.com/article/1532368](https://developer.aliyun.com/article/1532368)

\[30] 数据同步工具的研究(实时)\_数据库实时同步工具-CSDN博客[ https://blog.csdn.net/csdn\_lan/article/details/129301794](https://blog.csdn.net/csdn_lan/article/details/129301794)

\[31] 6大主流MySQL数据同步工具全方位性能测评!选对解决你工作中80%的问题!-CSDN博客[ https://blog.csdn.net/yuanziok/article/details/148289690](https://blog.csdn.net/yuanziok/article/details/148289690)

\[32] 【Java】Springboot中Canal实现Mysql数据实时同步到es(Elasticsearch)\_canal同步数据到es-CSDN博客[ https://blog.csdn.net/weixin\_43219644/article/details/144539713](https://blog.csdn.net/weixin_43219644/article/details/144539713)

\[33] 数据同步工具对比:Canal、DataX与Flink CDC\_datax canal-CSDN博客[ https://blog.csdn.net/wangyantao111/article/details/149001327](https://blog.csdn.net/wangyantao111/article/details/149001327)

\[34] 实时数据库选型指南:Kafka Connect vs Debezium vs Canal 的深度测评\_debezium和canal对比-CSDN博客[ https://blog.csdn.net/2503\_92849275/article/details/149760344](https://blog.csdn.net/2503_92849275/article/details/149760344)

\[35] 高并发场景下MySQL与ES/Redis数据同步实战指南:主流方案深度剖析与选型建议\_redis同步数据从mysql到es-CSDN博客[ https://blog.csdn.net/Zyw907155124/article/details/133084794](https://blog.csdn.net/Zyw907155124/article/details/133084794)

\[36] 实时数据同步方案-CSDN博客[ https://blog.csdn.net/weixin\_30915951/article/details/99754509](https://blog.csdn.net/weixin_30915951/article/details/99754509)

\[37] 如何通过canal等工具实现MySQL到其他数据源的实时同步?-mysql教程-PHP中文网[ https://m.php.cn/faq/1510982.html](https://m.php.cn/faq/1510982.html)

\[38] springboot2 + Canal1.1.7 可自动重连\_springboot + canal.client 1.1.7-CSDN博客[ https://blog.csdn.net/lontten/article/details/142967433](https://blog.csdn.net/lontten/article/details/142967433)

\[39] Spring Boot 3.4.3 集成 Canal 1.1.7 实现 MySQL 实时同步数据到 Redis\_spring boot 使用 canal 同步数据到redis-CSDN博客[ https://blog.csdn.net/lssffy/article/details/146767793](https://blog.csdn.net/lssffy/article/details/146767793)

\[40] canal支持spring4或spring5吗?\_问答-阿里云开发者社区[ https://developer.aliyun.com/ask/508270](https://developer.aliyun.com/ask/508270)

\[41] Canal 实战 | 第一篇:SpringBoot 整合 Canal + RabbitMQ 实现监听 MySQL 数据库同步更新 Redis 缓存 - 有来技术 - 博客园[ https://www.cnblogs.com/haoxianrui/p/15522538.html](https://www.cnblogs.com/haoxianrui/p/15522538.html)

\[42] Springboot2.3.x整合Canal\_springboot canal-CSDN博客[ https://blog.csdn.net/leilei1366615/article/details/108819651](https://blog.csdn.net/leilei1366615/article/details/108819651)

\[43] spring-canal/canal-spring-boot-starter[ https://github.com/spring-canal/canal-spring-boot-starter](https://github.com/spring-canal/canal-spring-boot-starter)

\[44] 实战!Spring Boot 整合 阿里开源中间件 Canal 实现数据增量同步!-阿里云开发者社区[ https://developer.aliyun.com/article/1201118](https://developer.aliyun.com/article/1201118)

\[45] Canal集群部署踩坑实录:从单点到分布式架构-CSDN博客[ https://blog.csdn.net/gitblog\_00371/article/details/151329937](https://blog.csdn.net/gitblog_00371/article/details/151329937)

\[46] 大数据-265 实时数仓 - Canal 部署安装 启动服务 常见问题解决\_51CTO博客\_大数据实时数仓架构[ https://blog.51cto.com/wuzikang/13029091](https://blog.51cto.com/wuzikang/13029091)

\[47] Cannal高可用核心原理分析-CSDN博客[ https://blog.csdn.net/huxian1234/article/details/144051042](https://blog.csdn.net/huxian1234/article/details/144051042)

\[48] Cannal核心架构设计和核心技术原理分析-CSDN博客[ https://blog.csdn.net/huxian1234/article/details/144050262](https://blog.csdn.net/huxian1234/article/details/144050262)

\[49] (五)、canal学习笔记之高可用部署\_canal高可用-CSDN博客[ https://blog.csdn.net/u014226353/article/details/142722609](https://blog.csdn.net/u014226353/article/details/142722609)

\[50] Canal高可用集群搭建过程-CSDN博客[ https://blog.csdn.net/weixin\_43564627/article/details/115380236](https://blog.csdn.net/weixin_43564627/article/details/115380236)

\[51] canal集群搭建的完整步骤 - CSDN文库[ https://wenku.csdn.net/answer/2vxf1zrrf4](https://wenku.csdn.net/answer/2vxf1zrrf4)

\[52] 数据同步工具--Canal\_canal prometheus-CSDN博客[ https://blog.csdn.net/xuejia2s/article/details/89431413](https://blog.csdn.net/xuejia2s/article/details/89431413)

\[53] Canal使用文档\_canal官网文档-CSDN博客[ https://blog.csdn.net/worldchinalee/article/details/83545956](https://blog.csdn.net/worldchinalee/article/details/83545956)

\[54] MySQL数据同步之Canal讲解 - 上善若泪 - 博客园[ https://www.cnblogs.com/jingzh/p/18856421](https://www.cnblogs.com/jingzh/p/18856421)

\[55] linux 安装 canal 的详细步骤 - 实践 - ljbguanli - 博客园[ https://www.cnblogs.com/ljbguanli/p/18994564](https://www.cnblogs.com/ljbguanli/p/18994564)

\[56] 大数据-265 实时数仓 - Canal 部署安装 启动服务 常见问题解决\_51CTO博客\_大数据实时数仓架构[ https://blog.51cto.com/wuzikang/13029091](https://blog.51cto.com/wuzikang/13029091)

\[57] Cannl 数据同步-ES篇-CSDN博客[ https://blog.csdn.net/qq\_47422213/article/details/146242229](https://blog.csdn.net/qq_47422213/article/details/146242229)

\[58] Canal 和 MySQL 配置指南\_canal 配置-CSDN博客[ https://blog.csdn.net/weixin\_53860667/article/details/142827993](https://blog.csdn.net/weixin_53860667/article/details/142827993)

\[59] Canal简介及配置说明\_canal 端口-CSDN博客[ https://blog.csdn.net/s13554341560b/article/details/77747809](https://blog.csdn.net/s13554341560b/article/details/77747809)

\[60] 阿里巴巴开源数据库中间件 Canal - 茄子\_2008 - 博客园[ https://www.cnblogs.com/xd502djj/p/18789380](https://www.cnblogs.com/xd502djj/p/18789380)

\[61] docker(二十七)docker部署CanalDocker插件部署继续，今儿是数据同步框架:canal 一:配置m - 掘金[ https://juejin.cn/post/7533171294176460826](https://juejin.cn/post/7533171294176460826)

\[62] mysqlcollate策略[ https://blog.51cto.com/u\_16099256/11989047](https://blog.51cto.com/u_16099256/11989047)

\[63] Canal的安装与部署\_canal-deployer-1.1.4.windows.zip-CSDN博客[ https://blog.csdn.net/qq\_29116427/article/details/106498040](https://blog.csdn.net/qq_29116427/article/details/106498040)

\[64] Canal详解-CSDN博客[ https://blog.csdn.net/qq\_41432730/article/details/121674571](https://blog.csdn.net/qq_41432730/article/details/121674571)

\[65] Canal 和 MySQL 配置指南\_canal 配置-CSDN博客[ https://blog.csdn.net/weixin\_53860667/article/details/142827993](https://blog.csdn.net/weixin_53860667/article/details/142827993)

\[66] canal 使用详解\_canal使用-CSDN博客[ https://blog.csdn.net/zhouzhiwengang/article/details/128900318](https://blog.csdn.net/zhouzhiwengang/article/details/128900318)

\[67] MySQL数据同步之Canal讲解 - 上善若泪 - 博客园[ https://www.cnblogs.com/jingzh/p/18856421](https://www.cnblogs.com/jingzh/p/18856421)

\[68] 阿里巴巴开源数据库中间件 Canal - 茄子\_2008 - 博客园[ https://www.cnblogs.com/xd502djj/p/18789380](https://www.cnblogs.com/xd502djj/p/18789380)

\[69] docker(二十七)docker部署CanalDocker插件部署继续，今儿是数据同步框架:canal 一:配置m - 掘金[ https://juejin.cn/post/7533171294176460826](https://juejin.cn/post/7533171294176460826)

\[70] Spring Boot + Canal 实现数据库实时监控 - 编程好6激活码[ https://jihuo.bianchenghao6.com/ji-huo-bi-ji/26849.html](https://jihuo.bianchenghao6.com/ji-huo-bi-ji/26849.html)

\[71] Canal 1.1.7的安装-CSDN博客[ https://blog.csdn.net/dufuyun5/article/details/149650142](https://blog.csdn.net/dufuyun5/article/details/149650142)

\[72] canal--canal+MQ-CSDN博客[ https://blog.csdn.net/feiying0canglang/article/details/105605995](https://blog.csdn.net/feiying0canglang/article/details/105605995)

\[73] java整合Canal实现数据库监听(附完整的踩坑总结)\_java canal-CSDN博客[ https://blog.csdn.net/2301\_77516476/article/details/138012688](https://blog.csdn.net/2301_77516476/article/details/138012688)

\[74] Linux下宝塔Canal解决Mysql和Redis数据同步问题\_宝塔数据库同步-CSDN博客[ https://blog.csdn.net/qq\_33215204/article/details/133235834](https://blog.csdn.net/qq_33215204/article/details/133235834)

\[75] Canal系列:Canal Server的安装部署\_canal server 配置-CSDN博客[ https://blog.csdn.net/a498420237/article/details/125553708](https://blog.csdn.net/a498420237/article/details/125553708)

\[76] canal+zookeeper+mysql高可用配置\_canal高可用搭建-CSDN博客[ https://blog.csdn.net/weixin\_41047933/article/details/85293002](https://blog.csdn.net/weixin_41047933/article/details/85293002)

\[77] docker(二十七)docker部署CanalDocker插件部署继续，今儿是数据同步框架:canal 一:配置m - 掘金[ https://juejin.cn/post/7533171294176460826](https://juejin.cn/post/7533171294176460826)

\[78] Canal 实战指南\_TechEnthusiast的技术博客\_51CTO博客[ https://blog.51cto.com/jiemei/9601111](https://blog.51cto.com/jiemei/9601111)

\[79] 轻松上手，Docker一键安装Canal-Server:数据同步新体验 - 云原生实践[ https://www.oryoy.com/news/qing-song-shang-shou-docker-yi-jian-an-zhuang-canal-server-shu-ju-tong-bu-xin-ti-yan.html](https://www.oryoy.com/news/qing-song-shang-shou-docker-yi-jian-an-zhuang-canal-server-shu-ju-tong-bu-xin-ti-yan.html)

\[80] 使用 Spring Boot 和 Canal 实现 MySQL 数据库同步\_windows canal+mysql+springboot-CSDN博客[ https://blog.csdn.net/qq\_32430463/article/details/145686880](https://blog.csdn.net/qq_32430463/article/details/145686880)

\[81] canal配置文件参数解释[ https://blog.csdn.net/xiaolong\_4\_2/article/details/85071112](https://blog.csdn.net/xiaolong_4_2/article/details/85071112)

\[82] MySQL数据同步之Canal讲解 - 上善若泪 - 博客园[ https://www.cnblogs.com/jingzh/p/18856421](https://www.cnblogs.com/jingzh/p/18856421)

\[83] canal的总结一\_canal.metrics.pull.port-CSDN博客[ https://blog.csdn.net/weixin\_42154485/article/details/145710356](https://blog.csdn.net/weixin_42154485/article/details/145710356)

\[84] canal总结二\_canal instance有什么用-CSDN博客[ https://blog.csdn.net/weixin\_42154485/article/details/145710564](https://blog.csdn.net/weixin_42154485/article/details/145710564)

\[85] canal配置mysql mgr集群\_Canal-Admin 集群环境配置及踩坑实录-CSDN博客[ https://blog.csdn.net/weixin\_35731493/article/details/113306553](https://blog.csdn.net/weixin_35731493/article/details/113306553)

\[86] Canal作为一款高效、可靠的数据同步工具，凭借其基于MySQL binlog的增量同步机制，在数据同步领域展现了强大的应用价值-阿里云开发者社区[ https://developer.aliyun.com/article/1603244](https://developer.aliyun.com/article/1603244)

\[87] canal怎样监听多个数据库\_canal监听多个数据库-CSDN博客[ https://blog.csdn.net/weixin\_40803011/article/details/121420818](https://blog.csdn.net/weixin_40803011/article/details/121420818)

\[88] 【Canal配置全攻略】:多源数据库同步设置一步到位 - CSDN文库[ https://wenku.csdn.net/column/v124tana6d](https://wenku.csdn.net/column/v124tana6d)

\[89] Canal-adapter实时增量同步Mysql数据到Doris\_canal doris-CSDN博客[ https://blog.csdn.net/weixin\_43914798/article/details/123418573](https://blog.csdn.net/weixin_43914798/article/details/123418573)

\[90] Canal学习(1)Canal环境搭建以及多数据库配置和Java代码整合Canal\_canal 多实例指定线上数据库-CSDN博客[ https://blog.csdn.net/leeue/article/details/105835180](https://blog.csdn.net/leeue/article/details/105835180)

\[91] 使用canal.deployer-1.1.7和canal.adapter-1.1.7实现mysql多数据源数据同步一个目标库-CSDN博客[ https://blog.csdn.net/zsj777/article/details/142217521](https://blog.csdn.net/zsj777/article/details/142217521)

\[92] canal同步mysql，监听单实例，多实例配置 - \_\_Yoon - 博客园[ https://www.cnblogs.com/hankyoon/p/18372338#commentform](https://www.cnblogs.com/hankyoon/p/18372338#commentform)

\[93] canal-client 如何多开 - CSDN文库[ https://wenku.csdn.net/answer/5fh9jryn97](https://wenku.csdn.net/answer/5fh9jryn97)

\[94] canaldockercompose部署:一键启动完整集群[ https://blog.csdn.net/gitblog\_00209/article/details/151336313](https://blog.csdn.net/gitblog_00209/article/details/151336313)

\[95] canal集群搭建的完整步骤 - CSDN文库[ https://wenku.csdn.net/answer/2vxf1zrrf4](https://wenku.csdn.net/answer/2vxf1zrrf4)

\[96] (五)、canal学习笔记之高可用部署\_canal高可用-CSDN博客[ https://blog.csdn.net/u014226353/article/details/142722609](https://blog.csdn.net/u014226353/article/details/142722609)

\[97] canal集群部署与java接入\_canel的稳定性测试-CSDN博客[ https://blog.csdn.net/fuqianming/article/details/108075539](https://blog.csdn.net/fuqianming/article/details/108075539)

\[98] canal集群部署-CSDN博客[ https://blog.csdn.net/bxp1321/article/details/146218386](https://blog.csdn.net/bxp1321/article/details/146218386)

\[99] canal+zookeeper+mysql高可用配置\_canal高可用搭建-CSDN博客[ https://blog.csdn.net/weixin\_41047933/article/details/85293002](https://blog.csdn.net/weixin_41047933/article/details/85293002)

\[100] canal系列—HA模式配置\_canal 假死-CSDN博客[ https://blog.csdn.net/u012758088/article/details/78793259](https://blog.csdn.net/u012758088/article/details/78793259)

\[101] Canal 核心概念及安装与使用\_com.canal.android.canal-CSDN博客[ https://blog.csdn.net/2301\_78858041/article/details/147265085](https://blog.csdn.net/2301_78858041/article/details/147265085)

\[102] Springboot -- 整合Canal实现数据库更改的实时监听\_springboot监听canal-CSDN博客[ https://blog.csdn.net/qq\_40096897/article/details/121754412](https://blog.csdn.net/qq_40096897/article/details/121754412)

\[103] SpringBoot整合Canal+RabbitMQ监听数据变更详解\_java\_脚本之家[ https://www.jb51.net/program/333303s8k.htm](https://www.jb51.net/program/333303s8k.htm)

\[104] Spring Boot3中使用阿里Canal实现MySQL与ElasticSearch的数据同步\_从程序员到架构师[ http://m.toutiao.com/group/7522785188159324718/?upstream\_biz=doubao](http://m.toutiao.com/group/7522785188159324718/?upstream_biz=doubao)

\[105] springboot 整合 yapi\_mob64ca13f937ae的技术博客\_51CTO博客[ https://blog.51cto.com/u\_16213587/12300824](https://blog.51cto.com/u_16213587/12300824)

\[106] Canal 结合spring boot项目开发 -阿里云开发者社区[ https://developer.aliyun.com/article/1574108](https://developer.aliyun.com/article/1574108)

\[107] 阿里巴巴开源数据库中间件 Canal - 茄子\_2008 - 博客园[ https://www.cnblogs.com/xd502djj/p/18789380](https://www.cnblogs.com/xd502djj/p/18789380)

\[108] Canal监听 - CSDN文库[ https://wenku.csdn.net/answer/4p8udbcko8](https://wenku.csdn.net/answer/4p8udbcko8)

\[109] java如何使用canal - CSDN文库[ https://wenku.csdn.net/answer/1i0n44h58d](https://wenku.csdn.net/answer/1i0n44h58d)

\[110] 如何实现数据实时同步到 ES?八年 Java 开发的实战方案(从业务到代码)三年前做电商商品搜索时，运营反馈 “新上架的 - 掘金[ https://juejin.cn/post/7541987330548908083](https://juejin.cn/post/7541987330548908083)

\[111] java监听mysql数据表变化 - CSDN文库[ https://wenku.csdn.net/answer/64c9f3r066](https://wenku.csdn.net/answer/64c9f3r066)

\[112] Canal客户端监听数据库-CSDN博客[ https://blog.csdn.net/milk\_yan/article/details/144421528](https://blog.csdn.net/milk_yan/article/details/144421528)

\[113] 基于Canal的MySQL实时事件处理系统:设计与实现深度解析\_canal cpu 调度全景图-CSDN博客[ https://blog.csdn.net/qq\_23030337/article/details/148365409](https://blog.csdn.net/qq_23030337/article/details/148365409)

\[114] canal的使用--日志增量订阅& 消费-CSDN博客[ https://blog.csdn.net/weixin\_33937499/article/details/92380372](https://blog.csdn.net/weixin_33937499/article/details/92380372)

\[115] Kafka与Canal集成时数据一致性如何保障?\_编程语言-CSDN问答[ https://ask.csdn.net/questions/8484005](https://ask.csdn.net/questions/8484005)

\[116] Redis7\_13 高阶篇 第四章 Canal实现Redis与Mysql双写一致性\_canal 如何解决 双写一致性-CSDN博客[ https://blog.csdn.net/qq\_33168558/article/details/139903332](https://blog.csdn.net/qq_33168558/article/details/139903332)

\[117] Canal原理\_canal server 启动过一段时间后不再dump-CSDN博客[ https://blog.csdn.net/wuxintdrh/article/details/113625522](https://blog.csdn.net/wuxintdrh/article/details/113625522)

\[118] 深入浅出阿里数据同步神器:Canal原理+配置+实战全网最全解析!-阿里云开发者社区[ https://developer.aliyun.com/article/1179561](https://developer.aliyun.com/article/1179561)

\[119] cola架构实战 canal架构\_mob64ca14101b2f的技术博客\_51CTO博客[ https://blog.51cto.com/u\_16213683/6973055](https://blog.51cto.com/u_16213683/6973055)

\[120] 从崩溃到自愈:canal数据同步重试机制深度剖析[ https://blog.csdn.net/gitblog\_00490/article/details/151338829](https://blog.csdn.net/gitblog_00490/article/details/151338829)

\[121] canal如何保证es和oceanbase数据一致性 - CSDN文库[ https://wenku.csdn.net/answer/2ztyc4ancx](https://wenku.csdn.net/answer/2ztyc4ancx)

\[122] canal怎么保证数据一致性 - 网站那些事[ http://www.wangzhanshi.com/55183.html](http://www.wangzhanshi.com/55183.html)

\[123] 缓存和数据库一致性-易微帮[ https://www.ewbang.com/community/article/details/997902293.html](https://www.ewbang.com/community/article/details/997902293.html)

\[124] Canal将MySQL数据同步到Elasticsearch怎么保证数据一致性 – PingCode[ https://docs.pingcode.com/ask/32566.html](https://docs.pingcode.com/ask/32566.html)

\[125] Spring Boot3中使用阿里Canal实现MySQL与ElasticSearch的数据同步\_从程序员到架构师[ http://m.toutiao.com/group/7522785188159324718/?upstream\_biz=doubao](http://m.toutiao.com/group/7522785188159324718/?upstream_biz=doubao)

\[126] Canal同步延迟和数据丢失优化方案\_canal同步数据延迟怎么办-CSDN博客[ https://blog.csdn.net/lindonglian/article/details/146458591](https://blog.csdn.net/lindonglian/article/details/146458591)

\[127] 高并发系统下的canal数据同步实战:从架构设计到性能调优[ https://blog.csdn.net/Yangyuanwang/article/details/148745504](https://blog.csdn.net/Yangyuanwang/article/details/148745504)

\[128] 如何优化Canal的配置文件处理同步特别慢的问题 - CSDN文库[ https://wenku.csdn.net/answer/2ywvj9xcp8](https://wenku.csdn.net/answer/2ywvj9xcp8)

\[129] 深入解析Canal项目中batchSize与syncBatchSize的配置原理 - GitCode博客[ https://blog.gitcode.com/ab0a78bf1ef696cf97b9302928975406.html](https://blog.gitcode.com/ab0a78bf1ef696cf97b9302928975406.html)

\[130] 后端-超过1万条数据更新导致canal异常，选什么解决方案?[ https://www.xnip.cn/wenda/394535.html](https://www.xnip.cn/wenda/394535.html)

\[131] 数据通过canal 同步es，存在延迟问题，解决方案-EW帮帮网[ https://www.ewbang.com/community/article/details/1000147715.html](https://www.ewbang.com/community/article/details/1000147715.html)

\[132] 全量同步elasticsearch方案之canal[ https://blog.csdn.net/zlt2000/article/details/115291950](https://blog.csdn.net/zlt2000/article/details/115291950)

\[133] Canal如何实现数据格式转换与同步?\_编程语言-CSDN问答[ https://ask.csdn.net/questions/8516275](https://ask.csdn.net/questions/8516275)

\[134] canal的数据过滤与变换技巧 - CSDN文库[ https://wenku.csdn.net/column/75ypb1mtw3](https://wenku.csdn.net/column/75ypb1mtw3)

\[135] Canal格式的使用方法和类型映射\_实时计算 Flink版(Flink)-阿里云帮助中心[ https://help.aliyun.com/zh/flink/canal](https://help.aliyun.com/zh/flink/canal)

\[136] 基于Canal、MySQL8、ES6实现数据ETL和父子文档关联搜索\_canel es6-CSDN博客[ https://blog.csdn.net/xingkong6648/article/details/104644481](https://blog.csdn.net/xingkong6648/article/details/104644481)

\[137] 使用Canal同步MySQL数据到表格存储\_表格存储(Tablestore)-阿里云帮助中心[ https://help.aliyun.com/zh/tablestore/use-cases/synchronize-data-from-mysql-using-canal](https://help.aliyun.com/zh/tablestore/use-cases/synchronize-data-from-mysql-using-canal)

\[138] canal 历史数据如何处理\_简化ETL工作，编写一个Canal胶水层-CSDN博客[ https://blog.csdn.net/weixin\_39986435/article/details/111682894](https://blog.csdn.net/weixin_39986435/article/details/111682894)

\[139] 从数据孤岛到实时互联:Canal 驱动的系统间数据同步实战指南-CSDN博客[ https://blog.csdn.net/jam\_yin/article/details/150536549](https://blog.csdn.net/jam_yin/article/details/150536549)

\[140] Canal结合RocketMQ实现高可用时，如何保证消息不丢失且顺序一致?\_编程语言-CSDN问答[ https://ask.csdn.net/questions/8217949](https://ask.csdn.net/questions/8217949)

\[141] canal如何保证es和oceanbase数据一致性 - CSDN文库[ https://wenku.csdn.net/answer/2ztyc4ancx](https://wenku.csdn.net/answer/2ztyc4ancx)

\[142] Sync ES是如何保证mysql中与es中的数据是一致的呢?\_问答-阿里云开发者社区[ https://developer.aliyun.com/ask/507861](https://developer.aliyun.com/ask/507861)

\[143] 使用 Canal 监听 MySQL Binlog 日志实现最终一致性\_监听mysql binlog-CSDN博客[ https://blog.csdn.net/laodanqiu/article/details/144483823](https://blog.csdn.net/laodanqiu/article/details/144483823)

\[144] MySQL数据同步之Canal讲解 - 上善若泪 - 博客园[ https://www.cnblogs.com/jingzh/p/18856421](https://www.cnblogs.com/jingzh/p/18856421)

\[145] canal如何解决缓存一致性问题的\_canal实现缓存一致性-CSDN博客[ https://blog.csdn.net/2301\_80100731/article/details/136326822](https://blog.csdn.net/2301_80100731/article/details/136326822)

\[146] 【Canal监控与告警】:保障数据同步稳定性的最佳实践 - CSDN文库[ https://wenku.csdn.net/column/75nfam9bdd](https://wenku.csdn.net/column/75nfam9bdd)

\[147] 数据同步中间件之——canal\_数据同步中间件canal-CSDN博客[ https://blog.csdn.net/robert789654/article/details/105950255](https://blog.csdn.net/robert789654/article/details/105950255)

\[148] Canal 监控策略 - CSDN文库[ https://wenku.csdn.net/answer/6dpbi6hxxa](https://wenku.csdn.net/answer/6dpbi6hxxa)

\[149] canal 告警 规则\_word文档在线阅读与下载\_文档网[ https://m.wendangwang.com/doc/c9beca57a278a3ad26924242321744b2ed20ecc1/2](https://m.wendangwang.com/doc/c9beca57a278a3ad26924242321744b2ed20ecc1/2)

\[150] canal的监控与性能调优 - CSDN文库[ https://wenku.csdn.net/column/35gracfh7d](https://wenku.csdn.net/column/35gracfh7d)

\[151] 阿里canal监控和性能调优 - CSDN文库[ https://wenku.csdn.net/column/8c0oisxj9e](https://wenku.csdn.net/column/8c0oisxj9e)

\[152] canal数据同步工具介绍与应用\_metahistorydao-CSDN博客[ https://blog.csdn.net/yhm\_mm/article/details/141254862](https://blog.csdn.net/yhm_mm/article/details/141254862)

\[153] 【亲测免费】 阿里巴巴Canal项目常见问题解决方案-CSDN博客[ https://blog.csdn.net/gitblog\_09491/article/details/142230109](https://blog.csdn.net/gitblog_09491/article/details/142230109)

\[154] \*\*CanalClientException常见成因及解决方案解析\*\*\_编程语言-CSDN问答[ https://ask.csdn.net/questions/8477938](https://ask.csdn.net/questions/8477938)

\[155] canal连接数据库失败 - CSDN文库[ https://wenku.csdn.net/answer/1tyr10ojep](https://wenku.csdn.net/answer/1tyr10ojep)

\[156] 【canal】基于docker部署、与mysql连接的过程报错及解决\_docker部署canal-CSDN博客[ https://blog.csdn.net/m0\_56620906/article/details/144156995](https://blog.csdn.net/m0_56620906/article/details/144156995)

\[157] Canal连接RabbitMQ常见问题排查与解决方案 - GitCode博客[ https://blog.gitcode.com/24f9e0c10e205b88ad9fe63566421c08.html](https://blog.gitcode.com/24f9e0c10e205b88ad9fe63566421c08.html)

\[158] 【开源实战】Canal部署常见问题:重复解析/Filter失效/消费落后\_subscribedataproto.dmlevent dmlevt = entry.geteven-CSDN博客[ https://blog.csdn.net/qqxx6661/article/details/106696229](https://blog.csdn.net/qqxx6661/article/details/106696229)

\[159] 【Canal故障排除手册】:常见问题秒解决与解决之道 - CSDN文库[ https://wenku.csdn.net/column/4p5mtzuvw4](https://wenku.csdn.net/column/4p5mtzuvw4)

\[160] canal同步数据延迟怎么办 - CSDN文库[ https://wenku.csdn.net/answer/55b1m3yw30](https://wenku.csdn.net/answer/55b1m3yw30)

\[161] 数据通过canal 同步es，存在延迟问题，解决方案\_canal同步数据延迟怎么办-CSDN博客[ https://blog.csdn.net/C18298182575/article/details/145084704](https://blog.csdn.net/C18298182575/article/details/145084704)

\[162] 增量同步延迟高[ https://www.clougence.com/cc-doc/faq/solve\_incre\_task\_delay/](https://www.clougence.com/cc-doc/faq/solve_incre_task_delay/)

\[163] canal存量数据同步延迟如何优化?[ https://ask.csdn.net/questions/8770536](https://ask.csdn.net/questions/8770536)

\[164] 如何优化Canal的配置文件处理同步特别慢的问题 - CSDN文库[ https://wenku.csdn.net/answer/2ywvj9xcp8](https://wenku.csdn.net/answer/2ywvj9xcp8)

\[165] Canal同步延迟和数据丢失优化方案\_canal同步数据延迟怎么办-CSDN博客[ https://blog.csdn.net/lindonglian/article/details/146458591](https://blog.csdn.net/lindonglian/article/details/146458591)

\[166] 揭秘 canal:兼容哪些 MySQL 版本，迁移无忧选择指南 - 云原生实践[ https://www.oryoy.com/news/jie-mi-canal-jian-rong-na-xie-mysql-ban-ben-qian-yi-wu-you-xuan-ze-zhi-nan.html](https://www.oryoy.com/news/jie-mi-canal-jian-rong-na-xie-mysql-ban-ben-qian-yi-wu-you-xuan-ze-zhi-nan.html)

\[167] Canal多数据源同步中的序列化问题解析与解决方案 - GitCode博客[ https://blog.gitcode.com/b3311d8ebfa8e6cea33440f7f95f0936.html](https://blog.gitcode.com/b3311d8ebfa8e6cea33440f7f95f0936.html)

\[168] mysql5.7的数据怎么兼容mysql8.0 - CSDN文库[ https://wenku.csdn.net/answer/7mccuzu1q0](https://wenku.csdn.net/answer/7mccuzu1q0)

\[169] java mysql 异常 8.0 5.7 - CSDN文库[ https://wenku.csdn.net/answer/32hzw4y1sb](https://wenku.csdn.net/answer/32hzw4y1sb)

\[170] mysql 版本 57 和 8 兼容吗\_mob64ca12d74a10的技术博客\_51CTO博客[ https://blog.51cto.com/u\_16213328/11704863](https://blog.51cto.com/u_16213328/11704863)

\[171] MySQL如何升级到最新版本(5.7到8.0迁移注意事项)-mysql教程-PHP中文网[ https://m.php.cn/faq/1451890.html](https://m.php.cn/faq/1451890.html)

\[172] 5.7升级8.0更新之前的需要了解的事项 - 屠魔的少年 - 博客园[ https://www.cnblogs.com/l10n/p/18940619](https://www.cnblogs.com/l10n/p/18940619)

\[173] Canal uses non ephemeral ports on outgoing connections #5867[ https://github.com/rancher/rke2/issues/5867](https://github.com/rancher/rke2/issues/5867)

\[174] 0138.C CloudCanal社区版中防火墙相关问题及ORACLE到StarRocks同步问题处理记录 - 墨天轮[ https://www.modb.pro/db/335572](https://www.modb.pro/db/335572)

\[175] 【Canal配置全攻略】:多源数据库同步设置一步到位 - CSDN文库[ https://wenku.csdn.net/column/v124tana6d](https://wenku.csdn.net/column/v124tana6d)

\[176] Rancher 2.0部署过程中常见问题分析与解决\_文化 & 方法\_Rancher\_InfoQ精选文章[ https://www.infoq.cn/article/kj6eb3pa5od996rffdhr](https://www.infoq.cn/article/kj6eb3pa5od996rffdhr)

\[177] 防火墙规则配置错误导致的网络问题排查\_tcp47984-CSDN博客[ https://blog.csdn.net/2409\_89014517/article/details/144605283](https://blog.csdn.net/2409_89014517/article/details/144605283)

\[178] Opening Ports with firewalld[ https://ranchermanager.docs.rancher.com/v2.10/how-to-guides/advanced-user-guides/open-ports-with-firewalld](https://ranchermanager.docs.rancher.com/v2.10/how-to-guides/advanced-user-guides/open-ports-with-firewalld)

\[179] Canal启动成功，但日志看没有权限，而mysql端看是有给canal权限的，怎么办? | 无疑 官方网站 | nacos、dubbo 、arthas报错处理 | 阿里开源 | 无疑[ https://answer.opensource.alibaba.com/docs/canal/question-history-15384](https://answer.opensource.alibaba.com/docs/canal/question-history-15384)

\[180] 配置任务 Grafana 监控面板 | CloudCanal of ClouGence[ https://m.clougence.com/cc-doc/productOP/platform/add\_job\_grafana\_dashbord](https://m.clougence.com/cc-doc/productOP/platform/add_job_grafana_dashbord)

\[181] Prometheus QuickStart[ https://github.com/alibaba/canal/wiki/Prometheus-QuickStart](https://github.com/alibaba/canal/wiki/Prometheus-QuickStart)

\[182] Prometheus与Grafana配合监控Canal性能:部署与实践指南 - CSDN文库[ https://wenku.csdn.net/doc/3rogpjhe2a](https://wenku.csdn.net/doc/3rogpjhe2a)

\[183] Using Prometheus in Grafana[ https://grafana.com/docs/grafana/v4.3/features/datasources/prometheus/](https://grafana.com/docs/grafana/v4.3/features/datasources/prometheus/)

\[184] 【监控】Prometheus+Grafana 构建可视化监控\_prometheus+grafana+skywalking-CSDN博客[ https://blog.csdn.net/Nanki\_/article/details/148204272](https://blog.csdn.net/Nanki_/article/details/148204272)

\[185] 构建微服务监控系统:Prometheus 与 Grafana 实战指南\_prometheus+grafana实战-CSDN博客[ https://blog.csdn.net/mmc123125/article/details/145843495](https://blog.csdn.net/mmc123125/article/details/145843495)

\[186] 使用 Prometheus + Grafana 监控 Canal[ http://m.blog.itpub.net/70041328/viewspace-3037568/](http://m.blog.itpub.net/70041328/viewspace-3037568/)

\[187] Canal性能优化必读:终结单点瓶颈的实用策略 - CSDN文库[ https://wenku.csdn.net/column/2hw64ze24j](https://wenku.csdn.net/column/2hw64ze24j)

\[188] 【性能瓶颈分析】:Canal在大规模系统中的性能解决方案 - CSDN文库[ https://wenku.csdn.net/column/1f9sad316d](https://wenku.csdn.net/column/1f9sad316d)

\[189] 【架构优化技术】:Canal单点性能瓶颈的终极解决方法 - CSDN文库[ https://wenku.csdn.net/column/83y9guoex3](https://wenku.csdn.net/column/83y9guoex3)

\[190] 【Canal故障排除手册】:常见问题秒解决与解决之道 - CSDN文库[ https://wenku.csdn.net/column/4p5mtzuvw4](https://wenku.csdn.net/column/4p5mtzuvw4)

\[191] 应对高并发挑战:Canal性能调优手册 - CSDN文库[ https://wenku.csdn.net/column/39vwgpo3kp](https://wenku.csdn.net/column/39vwgpo3kp)

\[192] 【架构调整魔法】:提升Canal单点性能的实用技巧 - CSDN文库[ https://wenku.csdn.net/column/4m360r061y](https://wenku.csdn.net/column/4m360r061y)

\[193] 【性能优化实战】:从Canal单点问题到分布式性能提升 - CSDN文库[ https://wenku.csdn.net/column/xywwumm3yv](https://wenku.csdn.net/column/xywwumm3yv)

\[194] canal集群搭建的完整步骤 - CSDN文库[ https://wenku.csdn.net/answer/2vxf1zrrf4](https://wenku.csdn.net/answer/2vxf1zrrf4)

\[195] (3)Canal高可用集群\_canal集群-CSDN博客[ https://blog.csdn.net/wzk153/article/details/145475489](https://blog.csdn.net/wzk153/article/details/145475489)

\[196] rancher chat仓库不可用 无法集群工具\_mob64ca13f87273的技术博客\_51CTO博客[ https://blog.51cto.com/u\_16213584/12418545](https://blog.51cto.com/u_16213584/12418545)

\[197] COLA架构有用吗\_卡哇伊的技术博客\_51CTO博客[ https://blog.51cto.com/u\_92655/12249241](https://blog.51cto.com/u_92655/12249241)

\[198] canal+zookeeper+mysql高可用配置\_canal高可用搭建-CSDN博客[ https://blog.csdn.net/weixin\_41047933/article/details/85293002](https://blog.csdn.net/weixin_41047933/article/details/85293002)

\[199] Canal Admin 高可用集群使用教程-CSDN博客[ https://blog.csdn.net/cr7258/article/details/120347060](https://blog.csdn.net/cr7258/article/details/120347060)

\[200] Canal之HA高可用\_canal ha分为哪两部分?各自有什么作用-CSDN博客[ https://blog.csdn.net/q18729096963/article/details/114952933](https://blog.csdn.net/q18729096963/article/details/114952933)

\[201] Canal元数据备份与恢复策略:保障分布式数据同步的可靠性-CSDN博客[ https://blog.csdn.net/gitblog\_00669/article/details/151337519](https://blog.csdn.net/gitblog_00669/article/details/151337519)

\[202] 实现canal监控binlog日志再通过消息队列异步处理\_binlog为mixed模式下canal能工作吗-CSDN博客[ https://blog.csdn.net/qq\_44845473/article/details/144491758](https://blog.csdn.net/qq_44845473/article/details/144491758)

\[203] 探秘Canal:实时数据库同步利器-CSDN博客[ https://blog.csdn.net/gitblog\_00054/article/details/138149413](https://blog.csdn.net/gitblog_00054/article/details/138149413)

\[204] Canal 扩展篇(阿里开源用于数据同步备份，监控表和表字段(日志))-EW帮帮网[ https://www.ewbang.com/community/article/details/1000094376.html](https://www.ewbang.com/community/article/details/1000094376.html)

\[205] bind\_exporter监控指标\_mob64ca13fe62db的技术博客\_51CTO博客[ https://blog.51cto.com/u\_16213608/11425685](https://blog.51cto.com/u_16213608/11425685)

\[206] 可视化 MySQL binlog 监听方案前言 为什么需要可视化的 MySQL binlog 监听方案? 当公司刚起步的 - 掘金[ https://juejin.cn/post/7539193228789284879](https://juejin.cn/post/7539193228789284879)

> （注：文档部分内容可能由 AI 生成）