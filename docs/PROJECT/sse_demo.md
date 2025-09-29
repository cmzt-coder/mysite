# SSE Demo - Server-Sent Events 演示项目

这是一个基于Spring Boot和Server-Sent Events (SSE)技术实现实时消息推送的演示项目。该项目展示了如何使用SSE技术在服务器和浏览器之间建立单向实时通信连接，实现服务器主动向客户端推送消息的功能。

## 功能特点

- **实时消息推送**：服务器定时向所有连接的客户端推送消息
- **多客户端支持**：支持多个客户端同时连接和接收消息
- **自动重连机制**：客户端在网络中断或服务器重启后自动重新连接
- **连接状态管理**：实时显示连接状态和消息接收情况
- **优雅关闭**：页面关闭时自动断开连接，释放资源

## 技术栈

### 后端技术
- Java 8
- Spring Boot 2.7.18
- Spring Web MVC (SSE支持)
- Thymeleaf 模板引擎
- Maven 构建工具

### 前端技术
- HTML5
- CSS3
- JavaScript (原生EventSource API)

## 系统架构

```
┌─────────────────┐    HTTP/SSE     ┌─────────────────┐
│                 │ ──────────────> │                 │
│   Web Browser   │                 │  Spring Boot    │
│   (Frontend)    │ <────────────── │   (Backend)     │
│                 │   EventSource   │                 │
└─────────────────┘                 └─────────────────┘
        │                                     │
        │                                     │
        ▼                                     ▼
┌─────────────────┐                 ┌─────────────────┐
│   JavaScript    │                 │  SseController  │
│   EventSource   │                 │  @Scheduled     │
│     API         │                 │   Task Runner   │
└─────────────────┘                 └─────────────────┘
```

## 快速开始

### 环境要求
- Java 8 或更高版本
- Maven 3.6+

### 运行项目

1. 克隆或下载项目源代码
2. 进入项目根目录
3. 使用Maven编译并运行项目：
   ```bash
   mvn spring-boot:run
   ```
4. 打开浏览器访问：http://localhost:8081

### 打包部署

1. 打包项目：
   ```bash
   mvn clean package
   ```
2. 运行打包后的JAR文件：
   ```bash
   java -jar target/sse-demo-1.0.0.jar
   ```

## 使用说明

### 页面功能
项目启动后，访问主页可以看到以下功能区域：

1. **连接状态显示**：显示当前与服务器的连接状态（未连接/连接中/已连接/连接错误）
2. **控制按钮**：
   - 连接：手动建立SSE连接
   - 断开连接：手动断开SSE连接
   - 清空消息：清除已接收到的消息列表
3. **消息显示区域**：展示从服务器接收到的所有消息，按时间顺序排列

### 自动行为
- 页面加载完成后会自动建立SSE连接
- 服务器每5秒向所有连接的客户端推送一条消息
- 当连接断开时，客户端会每隔3秒尝试重新连接
- 页面关闭前会自动断开SSE连接

## 核心代码说明

### 后端实现 (SseController.java)

```java
@GetMapping(value = "/sse", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
@ResponseBody
public SseEmitter subscribe() {
    // 创建SseEmitter实例，设置超时时间
    SseEmitter emitter = new SseEmitter(30 * 60 * 1000L);
    
    // 将emitter添加到连接列表中
    emitters.add(emitter);
    
    // 注册各种事件回调
    emitter.onCompletion(() -> emitters.remove(emitter));
    emitter.onTimeout(() -> emitters.remove(emitter));
    emitter.onError((throwable) -> emitters.remove(emitter));
    
    return emitter;
}
```

### 前端实现 (index.html)

```javascript
// 建立SSE连接
function connect() {
    eventSource = new EventSource('/sse');
    
    // 连接成功事件
    eventSource.onopen = function(event) {
        console.log('SSE连接已建立');
    };
    
    // 接收消息事件
    eventSource.onmessage = function(event) {
        console.log('收到消息:', event.data);
    };
    
    // 连接错误事件
    eventSource.onerror = function(event) {
        console.error('SSE连接错误:', event);
    };
}
```

## 配置说明

项目的主要配置项在 `application.properties` 文件中：

```properties
# 服务器端口
server.port=8081

# SSE消息推送间隔（毫秒）
sse.message.interval=5000

# Thymeleaf配置
spring.thymeleaf.cache=false
```

可以通过修改 `sse.message.interval` 来调整服务器推送消息的时间间隔。

## 应用场景

该技术可以应用于以下场景：
- 实时通知系统
- 系统状态监控
- 股票价格推送
- 新闻资讯推送
- 在线聊天室（服务端推送）
- 服务器日志实时显示

## 浏览器兼容性

SSE技术在现代浏览器中有良好的支持：
- Chrome 6+
- Firefox 6+
- Safari 5+
- Edge 12+
- 不支持 Internet Explorer

## 项目结构

```
src/
├── main/
│   ├── java/com/example/
│   │   ├── controller/
│   │   │   └── SseController.java  # SSE控制器
│   │   └── App.java                # Spring Boot主应用类
│   └── resources/
│       ├── templates/
│       │   └── index.html          # 前端页面
│       └── application.properties   # 配置文件
└── pom.xml                         # Maven配置文件
```

## 扩展建议

1. **安全性增强**：
   - 添加身份验证和授权机制
   - 对SSE端点进行访问控制

2. **集群支持**：
   - 使用Redis等中间件共享连接信息
   - 实现负载均衡场景下的连接管理

3. **消息定制化**：
   - 根据用户身份推送个性化消息
   - 支持不同类型的消息分类

4. **性能优化**：
   - 实现连接心跳检测机制
   - 添加连接数限制防止资源耗尽

## 许可证

本项目仅供学习和参考使用。

## 联系方式

如有问题或建议，欢迎提交Issue或Pull Request。