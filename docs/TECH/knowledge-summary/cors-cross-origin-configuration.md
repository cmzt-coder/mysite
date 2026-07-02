# CORS跨域配置

本文聚焦“跨域是什么、是谁在拦截、如何用 CORS 正确解决”，并补充 JSONP、代理转发、Nginx 反向代理等常见替代方案的适用场景与对比。

## 什么是跨域

跨域（Cross-Origin）是指：浏览器页面发起请求的目标地址，与当前页面的“源（Origin）”不一致。

### 同源策略判定标准

浏览器同源策略（Same-Origin Policy, SOP）判定一个请求是否同源，取决于以下三要素是否同时一致：

- 协议（scheme）：`http` / `https`
- 域名（host）：`example.com`
- 端口（port）：`80` / `443` / `8080`

任意一个不同，即触发跨域。

示例：

- `https://a.com` → `https://a.com/api`：不跨域（三要素一致）
- `https://a.com` → `http://a.com/api`：跨域（协议不同）
- `https://a.com` → `https://b.com/api`：跨域（域名不同）
- `https://a.com` → `https://a.com:8443/api`：跨域（端口不同）

### 常见跨域场景

- 前端开发时：`http://localhost:5173` 调用后端 `http://localhost:8080`
- 线上分离部署：`https://www.example.com` 调用 API：`https://api.example.com`
- 多环境：`https://staging.example.com` 调用 `https://api.example.com`

## 跨域请求是谁在拦截

跨域的“拦截主体”是浏览器，而不是服务器。

- 浏览器通过同源策略保护用户数据：避免恶意站点在用户已登录的情况下，借助浏览器自动携带的 Cookie/凭证去读取另一个站点的数据。
- 服务器通常照常接收并处理请求，但浏览器会在“读取响应结果”这一步做安全检查：不满足 CORS 规则则不把响应内容交给 JS（你会在控制台看到 CORS 报错）。

一句话理解：服务器可能已经返回了数据，但浏览器不让你的页面脚本拿到数据。

## 简单请求与预检请求（Preflight）

跨域请求并不都一样，浏览器会区分“简单请求”和“需要预检的复杂请求”。

### 简单请求

满足以下条件通常会被判定为简单请求（只发一次实际请求）：

- 方法是 `GET` / `HEAD` / `POST`
- 仅使用“安全的请求头”（如 `Accept`、`Content-Type` 等，且 `Content-Type` 通常是 `application/x-www-form-urlencoded`、`multipart/form-data`、`text/plain`）

### 预检请求（OPTIONS）

当请求不满足简单请求条件时，浏览器会先发一个 `OPTIONS` 请求进行预检，询问服务器是否允许：

- 是否允许该 Origin
- 是否允许该方法（PUT/DELETE 等）
- 是否允许自定义请求头（例如 `Authorization`、`X-Token`）

只有预检通过，浏览器才会发送真正的业务请求。

## 解决方案一：CORS（推荐）

CORS（Cross-Origin Resource Sharing）是浏览器与服务器约定的一套标准：服务器通过返回特定响应头，声明哪些跨域访问是被允许的。

### 关键响应头解释

- `Access-Control-Allow-Origin`
  - 允许的源。可以是具体 Origin（推荐），或 `*`（不推荐用于携带凭证的场景）
- `Access-Control-Allow-Methods`
  - 允许的方法，例如 `GET,POST,PUT,DELETE,OPTIONS`
- `Access-Control-Allow-Headers`
  - 允许的自定义请求头，例如 `Authorization, Content-Type`
- `Access-Control-Allow-Credentials`
  - 是否允许携带凭证（Cookie/Authorization 等）。若为 `true`，则 `Allow-Origin` 不能为 `*`
- `Access-Control-Max-Age`
  - 预检结果缓存秒数，减少 OPTIONS 次数

### 最小可用配置（通用原则）

1. 明确列出允许的 Origin（不要在生产环境无脑 `*`）
2. 放行 `OPTIONS` 预检请求
3. 允许你实际会用到的方法与请求头
4. 若前端需要携带 Cookie（会话登录），必须同时配置：
   - 前端：`fetch(..., { credentials: 'include' })`
   - 后端：`Access-Control-Allow-Credentials: true` 且 `Allow-Origin` 指定具体 Origin

### Spring Boot（Spring MVC）示例

#### 方式一：全局 CORS 配置

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:5173", "https://www.example.com")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("Authorization", "Content-Type")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

适用：项目统一的跨域策略。

#### 方式二：按接口标注

```java
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DemoController {
    @CrossOrigin(origins = "http://localhost:5173")
    @GetMapping("/api/demo")
    public String demo() {
        return "ok";
    }
}
```

适用：仅少数接口需要跨域。

### Node.js（Express）示例

```js
import express from 'express'
import cors from 'cors'

const app = express()

app.use(cors({
  origin: ['http://localhost:5173', 'https://www.example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true
}))

app.get('/api/demo', (req, res) => res.json({ ok: true }))
app.listen(8080)
```

### 常见踩坑与排错

- 携带 Cookie 时仍报错：
  - 后端必须返回 `Access-Control-Allow-Credentials: true`
  - `Access-Control-Allow-Origin` 不能是 `*`，必须是具体 Origin
- 自定义 Header（如 `Authorization`）导致预检失败：
  - 需要在 `Access-Control-Allow-Headers` 中包含该 header
- 预检请求被 401/403 拦截：
  - 需要放行 `OPTIONS`，或在鉴权中对 `OPTIONS` 特判放行

## 解决方案二：JSONP（不推荐但常见于历史系统）

JSONP 本质是利用 `<script src>` 不受同源限制的特性，只支持 `GET`，并且存在安全风险。

适用：老系统、只读接口、无法改后端 CORS 且只能 GET 的场景。

基本思路：

1. 前端创建 `script` 标签并传 `callback` 参数
2. 服务端返回可执行 JS：`callback({ ...data })`

缺点：

- 只能 GET
- 不支持自定义请求头/状态码语义
- 安全风险更高

## 解决方案三：开发代理（本地开发最常用）

适用：本地开发阶段，希望前端通过同源路径访问后端，避免频繁改后端 CORS。

典型方式：前端 dev server 代理 `/api` 到后端。

示例（仅说明思路）：

- 浏览器请求：`http://localhost:5173/api/users`
- dev server 转发到：`http://localhost:8080/api/users`

优点：开发体验好，不影响生产环境。

## 解决方案四：Nginx 反向代理（生产常用）

适用：线上希望在同一域名下暴露前端与后端路径，彻底规避跨域；或作为多服务聚合入口。

示例：

- 前端：`https://www.example.com/`
- API：`https://www.example.com/api/`（由 Nginx 转发到后端）

```nginx
server {
    listen 80;
    server_name www.example.com;

    location / {
        root /var/www/site;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

优点：

- 前端与后端对浏览器来说同源
- 易于统一鉴权、限流、日志等网关能力

缺点：

- 需要额外的运维配置
- 需要规划好路径前缀与转发规则

## 方案对比与选择建议

- CORS（推荐）
  - 适用：前后端分离、API 对多端开放
  - 限制：需要后端正确配置响应头（含预检与凭证）
- JSONP（不推荐）
  - 适用：历史系统、只读接口、仅 GET
  - 限制：只能 GET，安全性较差
- 开发代理（开发期推荐）
  - 适用：本地联调、快速避免跨域报错
  - 限制：仅用于开发环境
- Nginx 反向代理（生产期推荐）
  - 适用：希望彻底同源、统一入口/网关治理
  - 限制：需要运维配置与路径规划

## 校验清单

- 技术栏目侧边栏存在「知识汇总」入口，可进入 [知识汇总首页](index.md)
- 「CORS跨域配置」可通过侧边栏访问，并可独立打开：`/TECH/knowledge-summary/cors-cross-origin-configuration/`（实际 URL 以站点 `use_directory_urls` 配置为准）
- 构建校验：`python -m mkdocs build --strict` 无新增 warning/error
