# 网络资源搜索网站

基于SpringBoot + Java8 + MySQL + MyBatisPlus构建的网络资源搜索网站。

## 功能特性

- 🔍 智能搜索：支持关键词搜索，可按资源类型筛选
- 📱 响应式设计：适配桌面和移动设备
- 🎨 简洁美观：现代化的UI设计
- 📊 分页显示：支持大量数据的分页展示
- 🏷️ 标签系统：资源标签分类
- 📈 访问统计：记录资源查看次数
- 🗃️ 搜索历史：记录用户搜索行为

## 技术栈

- **后端**: SpringBoot 2.7.18 + Java8 + MyBatisPlus 3.5.3.1
- **前端**: Thymeleaf + HTML5 + CSS3
- **数据库**: MySQL 5.7+
- **连接池**: Druid
- **构建工具**: Maven

## 项目结构

```
src/main/java/com/websearch/
├── WebSearchApplication.java     # 启动类
├── controller/                   # 控制器层
│   └── SearchController.java
├── service/                      # 服务层
│   ├── WebResourceService.java
│   └── SearchHistoryService.java
├── mapper/                       # 数据访问层
│   ├── WebResourceMapper.java
│   └── SearchHistoryMapper.java
├── entity/                       # 实体类
│   ├── WebResource.java
│   └── SearchHistory.java
├── config/                       # 配置类
│   ├── MybatisPlusConfig.java
│   └── WebConfig.java
└── common/                       # 通用类
    ├── Result.java
    └── MyMetaObjectHandler.java

src/main/resources/
├── application.yml               # 应用配置
├── schema.sql                   # 数据库脚本
├── templates/                   # 模板文件
│   ├── index.html              # 首页
│   ├── search.html             # 搜索结果页
│   └── detail.html             # 详情页
└── static/
    └── css/
        └── style.css           # 样式文件
```

## 快速开始

### 1. 环境要求
- JDK 1.8+
- Maven 3.6+
- MySQL 5.7+

### 2. 数据库配置
```sql
-- 创建数据库
CREATE DATABASE web_search DEFAULT CHARACTER SET utf8mb4;

-- 执行数据库脚本
mysql -u root -p web_search < src/main/resources/schema.sql
```

### 3. 修改配置文件
编辑 `src/main/resources/application.yml`，修改数据库连接信息：
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/web_search?...
    username: your_username
    password: your_password
```

### 4. 启动应用
```bash
mvn spring-boot:run
```

### 5. 访问应用
打开浏览器访问: http://localhost:8080

## 使用说明

### 基本搜索
1. 在首页输入搜索关键词
2. 选择资源类型（可选）
3. 点击搜索按钮

### 资源类型
- 百度网盘 (baidu)
- 阿里云盘 (aliyun)
- 夸克网盘 (quark)
- 天翼云盘 (tianyi)
- UC网盘 (uc)
- 移动云盘 (mobile)
- 115网盘 (115)
- PikPak (pikpak)
- 迅雷 (xunlei)
- 123网盘 (123)
- 磁力链接 (magnet)
- 电驴链接 (ed2k)

### API接口
- GET `/search` - 搜索页面
- GET `/detail/{id}` - 资源详情
- POST `/api/search` - 搜索API接口

## 数据库设计

### web_resource表
- 存储网络资源信息
- 支持全文索引
- 包含资源类型、大小、来源等信息

### search_history表
- 记录用户搜索历史
- 用于分析和优化搜索体验

## 开发指南

### 添加新的资源类型
1. 修改数据库表添加新类型
2. 更新前端页面选项
3. 在WebResource实体类中添加对应常量

### 自定义搜索逻辑
1. 在WebResourceMapper中添加新的查询方法
2. 在WebResourceService中实现业务逻辑
3. 在SearchController中添加接口

### 优化建议
- 添加缓存机制提高性能
- 实现用户认证和权限管理
- 添加资源评分和评论功能
- 集成第三方搜索API

## 许可证
仅供学习交流使用。