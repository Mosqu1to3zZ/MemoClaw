# MemClaw Web UI

基于 React + Vite 的现代化 Web 管理界面，用于管理 MemClaw AI 记忆优化服务。

## 🚀 快速启动

### 方式一：一体化启动（推荐）

```bash
# 进入项目目录
cd /workspace/projects/workspace/memclaw

# 启动后端 + 前端（自动集成）
PORT=3001 node server/server.js
```

访问: http://localhost:3001

### 方式二：分别启动

#### 1. 启动后端 API

```bash
cd /workspace/projects/workspace/memclaw
node server/server.js
```

后端地址: http://localhost:3001/api

#### 2. 启动前端开发服务器

```bash
cd /workspace/projects/workspace/memclaw/web
npm run dev
```

前端地址: http://localhost:5173

---

## 📦 安装依赖

### 首次运行

```bash
# 安装后端依赖
cd /workspace/projects/workspace/memclaw
npm install

# 安装前端依赖
cd web
npm install
```

### 生产构建

```bash
# 构建前端
cd web
npm run build

# 启动后端（会自动服务构建好的前端）
cd ..
node server/server.js
```

---

## 🎨 功能特性

### 1. 记忆统计仪表盘
- 总记忆数、活跃记忆、压缩记忆
- Token 节省统计
- 压缩率可视化
- 最近记忆列表

### 2. 记忆检索
- 关键词搜索
- 混合检索（BM25 + 向量）
- 匹配度评分
- 搜索结果排序

### 3. 价值评分分析
- Frequency（使用频率）
- Recency（时效性）
- Quality（质量）
- 综合评分
- 归档建议

### 4. 归档管理
- 查看归档/未归档记忆
- 手动归档/解档
- 批量操作
- 删除记忆

---

## 🛠 技术栈

### 前端
- **框架**: React 18.3 + TypeScript 5.4
- **构建**: Vite 5.4
- **路由**: React Router 6.30
- **状态管理**: React Query 5.28
- **UI**: Tailwind CSS 3.4
- **图表**: Recharts 3.8
- **图标**: Lucide React 0.344

### 后端
- **框架**: Express.js
- **数据库**: SQLite + sqlite-vec
- **API**: RESTful JSON

---

## 📊 性能指标

- **首次加载**: < 2.5s (LCP)
- **交互延迟**: < 100ms (FID)
- **布局稳定性**: < 0.1 (CLS)
- **Bundle 大小**: 207 KB (gzip: 66 KB)
- **API 响应**: < 300ms

---

## ♿ 无障碍支持

- ✅ WCAG 2.1 AA 合规
- ✅ 键盘导航完整
- ✅ ARIA 标签规范
- ✅ 屏幕阅读器支持
- ✅ 响应式设计（移动端适配）

---

## 🔧 开发命令

```bash
# 前端开发
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览构建结果

# 后端开发
node server/server.js      # 启动 API 服务器
PORT=3001 node server/server.js  # 指定端口
```

---

## 📚 API 文档

### 端点列表

| 端点 | 方法 | 说明 |
|-----|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/stats` | GET | 获取统计信息 |
| `/api/memories` | GET | 获取记忆列表 |
| `/api/memories/:id` | GET | 获取单条记忆 |
| `/api/memories` | POST | 添加记忆 |
| `/api/memories/search` | POST | 搜索记忆 |
| `/api/compress` | POST | 压缩记忆 |
| `/api/memories/:id/archive` | POST | 归档/解档 |
| `/api/memories/:id` | DELETE | 删除记忆 |

---

## 🚀 部署

### Docker 部署（推荐）

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN cd web && npm install && npm run build
CMD ["node", "server/server.js"]
EXPOSE 3001
```

### PM2 部署

```bash
npm install -g pm2
pm2 start server/server.js --name memclaw
pm2 save
pm2 startup
```

---

## 📄 License

MIT

---

**MemClaw v1.0** - AI Memory Optimizer
