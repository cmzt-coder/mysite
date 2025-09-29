# Node.js Express 框架入门

## 简介

Express.js 是 Node.js 最流行的 Web 应用框架，它提供了一套简洁而灵活的特性来开发 Web 和移动应用。Express 是一个最小化且灵活的框架，为 Web 和移动应用提供了一系列强大的功能。

## 目录

- [环境准备](#环境准备)
- [快速开始](#快速开始)
- [路由系统](#路由系统)
- [中间件](#中间件)
- [模板引擎](#模板引擎)
- [错误处理](#错误处理)
- [数据库集成](#数据库集成)
- [身份验证](#身份验证)
- [文件上传](#文件上传)
- [API 设计](#api-设计)
- [测试](#测试)
- [部署](#部署)
- [最佳实践](#最佳实践)

## 环境准备

### 安装 Node.js

确保你的系统已安装 Node.js（建议使用 LTS 版本）：

```bash
# 检查 Node.js 版本
node --version

# 检查 npm 版本
npm --version
```

### 创建项目

```bash
# 创建项目目录
mkdir my-express-app
cd my-express-app

# 初始化 package.json
npm init -y

# 安装 Express
npm install express

# 安装开发依赖
npm install --save-dev nodemon
```

## 快速开始

### 基础服务器

创建 `app.js` 文件：

```javascript
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// 基础路由
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
```

### 项目结构

```
my-express-app/
├── app.js                 // 主应用文件
├── package.json
├── routes/                // 路由文件
│   ├── index.js
│   ├── users.js
│   └── api.js
├── middleware/            // 中间件
│   ├── auth.js
│   └── logger.js
├── models/                // 数据模型
│   └── User.js
├── controllers/           // 控制器
│   └── userController.js
├── config/                // 配置文件
│   └── database.js
├── public/                // 静态文件
│   ├── css/
│   ├── js/
│   └── images/
└── views/                 // 视图模板
    └── index.ejs
```

## 路由系统

### 基础路由

```javascript
const express = require('express');
const app = express();

// GET 请求
app.get('/users', (req, res) => {
  res.json({ message: 'Get all users' });
});

// POST 请求
app.post('/users', (req, res) => {
  res.json({ message: 'Create user' });
});

// PUT 请求
app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  res.json({ message: `Update user ${id}` });
});

// DELETE 请求
app.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  res.json({ message: `Delete user ${id}` });
});
```

### 路由参数

```javascript
// 路径参数
app.get('/users/:id', (req, res) => {
  const { id } = req.params;
  res.json({ userId: id });
});

// 查询参数
app.get('/search', (req, res) => {
  const { q, page, limit } = req.query;
  res.json({ query: q, page, limit });
});

// 多个参数
app.get('/users/:userId/posts/:postId', (req, res) => {
  const { userId, postId } = req.params;
  res.json({ userId, postId });
});
```

### 路由模块化

创建 `routes/users.js`：

```javascript
const express = require('express');
const router = express.Router();

// 中间件，适用于此路由器的所有请求
router.use((req, res, next) => {
  console.log('Time:', Date.now());
  next();
});

// 定义路由
router.get('/', (req, res) => {
  res.json({ message: 'Users home page' });
});

router.get('/:id', (req, res) => {
  res.json({ message: `User ${req.params.id}` });
});

module.exports = router;
```

在主应用中使用：

```javascript
const userRoutes = require('./routes/users');
app.use('/users', userRoutes);
```

## 中间件

### 内置中间件

```javascript
const express = require('express');
const path = require('path');
const app = express();

// 解析 JSON 请求体
app.use(express.json());

// 解析 URL 编码的请求体
app.use(express.urlencoded({ extended: true }));

// 提供静态文件
app.use(express.static(path.join(__dirname, 'public')));
```

### 第三方中间件

```javascript
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

// 安全头部
app.use(helmet());

// CORS 支持
app.use(cors());

// 日志记录
app.use(morgan('combined'));
```

### 自定义中间件

```javascript
// 日志中间件
const logger = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
};

// 身份验证中间件
const authenticate = (req, res, next) => {
  const token = req.header('Authorization');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }
  
  try {
    // 验证 token 逻辑
    req.user = { id: 1, name: 'John' }; // 模拟用户信息
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// 使用中间件
app.use(logger);
app.use('/api/protected', authenticate);
```

## 模板引擎

### 使用 EJS

```bash
npm install ejs
```

```javascript
// 设置模板引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 渲染模板
app.get('/profile', (req, res) => {
  const user = {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30
  };
  
  res.render('profile', { user, title: 'User Profile' });
});
```

创建 `views/profile.ejs`：

```html
<!DOCTYPE html>
<html>
<head>
  <title><%= title %></title>
</head>
<body>
  <h1>Welcome, <%= user.name %>!</h1>
  <p>Email: <%= user.email %></p>
  <p>Age: <%= user.age %></p>
</body>
</html>
```

## 错误处理

### 基础错误处理

```javascript
// 404 处理
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    error: {
      message,
      status,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});
```

### 自定义错误类

```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// 使用自定义错误
app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
});
```

## 数据库集成

### 使用 MongoDB (Mongoose)

```bash
npm install mongoose
```

```javascript
const mongoose = require('mongoose');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/myapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// 定义模型
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// 使用模型
app.post('/users', async (req, res, next) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

app.get('/users', async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    next(error);
  }
});
```

### 使用 MySQL (Sequelize)

```bash
npm install sequelize mysql2
```

```javascript
const { Sequelize, DataTypes } = require('sequelize');

// 创建连接
const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'mysql'
});

// 定义模型
const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
});

// 同步数据库
sequelize.sync();
```

## 身份验证

### JWT 认证

```bash
npm install jsonwebtoken bcryptjs
```

```javascript
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 注册
app.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // 创建用户
    const user = new User({
      name,
      email,
      password: hashedPassword
    });
    
    await user.save();
    
    // 生成 JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    next(error);
  }
});

// 登录
app.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // 生成 JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    next(error);
  }
});
```

## 文件上传

### 使用 Multer

```bash
npm install multer
```

```javascript
const multer = require('multer');
const path = require('path');

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件过滤
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// 单文件上传
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  res.json({
    message: 'File uploaded successfully',
    file: {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size
    }
  });
});

// 多文件上传
app.post('/upload-multiple', upload.array('images', 5), (req, res) => {
  res.json({
    message: 'Files uploaded successfully',
    files: req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size
    }))
  });
});
```

## API 设计

### RESTful API 示例

```javascript
const express = require('express');
const router = express.Router();

// GET /api/users - 获取所有用户
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    const query = search ? { name: { $regex: search, $options: 'i' } } : {};
    
    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id - 获取单个用户
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// POST /api/users - 创建用户
router.post('/', async (req, res, next) => {
  try {
    const user = new User(req.body);
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id - 更新用户
router.put('/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:id - 删除用户
router.delete('/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

## 测试

### 使用 Jest 和 Supertest

```bash
npm install --save-dev jest supertest
```

```javascript
// tests/app.test.js
const request = require('supertest');
const app = require('../app');

describe('User API', () => {
  test('GET /api/users should return users list', async () => {
    const response = await request(app)
      .get('/api/users')
      .expect(200);
    
    expect(response.body).toHaveProperty('users');
    expect(Array.isArray(response.body.users)).toBe(true);
  });
  
  test('POST /api/users should create a new user', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };
    
    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201);
    
    expect(response.body).toHaveProperty('name', userData.name);
    expect(response.body).toHaveProperty('email', userData.email);
    expect(response.body).not.toHaveProperty('password');
  });
});
```

## 部署

### 使用 PM2

```bash
npm install -g pm2
```

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'my-express-app',
    script: './app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    }
  }]
};
```

```bash
# 启动应用
pm2 start ecosystem.config.js --env production

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启应用
pm2 restart my-express-app
```

### Docker 部署

创建 `Dockerfile`：

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

USER node

CMD ["node", "app.js"]
```

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
    depends_on:
      - db
    
  db:
    image: mongo:4.4
    volumes:
      - mongo_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password

volumes:
  mongo_data:
```

## 最佳实践

### 1. 项目结构
- 使用模块化的项目结构
- 分离路由、控制器和服务层
- 使用配置文件管理环境变量

### 2. 安全性
- 使用 Helmet.js 设置安全头部
- 实施输入验证和清理
- 使用 HTTPS
- 实施速率限制

### 3. 性能优化
- 使用压缩中间件
- 实施缓存策略
- 使用连接池
- 监控应用性能

### 4. 错误处理
- 实施全局错误处理
- 使用适当的 HTTP 状态码
- 记录错误日志
- 不要暴露敏感信息

### 5. 代码质量
- 使用 ESLint 和 Prettier
- 编写单元测试和集成测试
- 使用 TypeScript（可选）
- 遵循 RESTful API 设计原则

---

*最后更新时间：2024年*