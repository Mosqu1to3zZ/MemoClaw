# MemClaw Web UI

AI 记忆优化服务的 Web 管理界面

## 📋 功能特性

### 1. 记忆统计仪表盘
- 总记忆数、已压缩数、活跃数统计
- Token 节省统计
- 压缩率可视化
- 最近记忆列表
- 一键添加记忆
- 手动执行压缩

### 2. 记忆检索界面
- 关键词搜索
- 搜索结果实时显示
- 匹配度评分展示
- 记忆详情查看

### 3. 价值评分分析
- 频率评分（访问频率）
- 时效性评分（最近访问时间）
- 质量评分（标签完整性）
- 综合评分计算
- 归档建议（基于综合评分）

### 4. 归档管理
- 查看所有记忆（全部/已归档/未归档）
- 手动归档/解档操作
- 批量操作支持
- 记忆删除功能

## 🛠 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **路由**: React Router DOM
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **图表**: Recharts
- **HTTP 客户端**: Axios

### 后端
- **服务器**: Express.js
- **数据库**: SQLite3
- **跨域**: CORS
- **记忆引擎**: MemClaw Core

## 📦 安装

### 前置要求
- Node.js >= 16.x
- npm >= 8.x

### 安装步骤

1. **克隆项目**
```bash
cd /workspace/projects/workspace/memclaw
```

2. **安装后端依赖**
```bash
cd server
npm install
```

3. **安装前端依赖**
```bash
cd ../web
npm install
```

4. **构建前端**
```bash
npm run build
```

## 🚀 运行

### 启动服务

```bash
# 在项目根目录
cd /workspace/projects/workspace/memclaw

# 启动服务器
cd server
npm start
```

### 访问地址

- **Web UI**: http://localhost:3001
- **API Base**: http://localhost:3001/api

### 开发模式

```bash
# 前端开发模式
cd web
npm run dev

# 后端开发模式（在另一个终端）
cd server
npm run dev
```

## 📖 API 文档

### 统计信息
```http
GET /api/stats
```

响应：
```json
{
  "total": 100,
  "compressed": 30,
  "active": 70,
  "tokenSaved": 15000,
  "compressionRate": "25.5%"
}
```

### 获取记忆列表
```http
GET /api/memories?page=1&limit=20&type=log&compressed=false
```

查询参数：
- `page`: 页码（默认 1）
- `limit`: 每页数量（默认 20）
- `type`: 记忆类型（preference/decision/fact/log/summary）
- `compressed`: 是否已压缩（true/false）

响应：
```json
{
  "memories": [
    {
      "id": 1,
      "content": "记忆内容",
      "type": "log",
      "tags": ["tag1", "tag2"],
      "compressed": 0,
      "original_length": 100,
      "created_at": 1700000000,
      "last_access": 1700000000,
      "stats": {
        "access_count": 5,
        "last_access": 1700000000
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 获取单条记忆
```http
GET /api/memories/:id
```

### 添加记忆
```http
POST /api/memories
Content-Type: application/json

{
  "content": "记忆内容",
  "type": "log",
  "tags": ["tag1", "tag2"]
}
```

### 搜索记忆
```http
POST /api/memories/search
Content-Type: application/json

{
  "query": "搜索关键词"
}
```

响应：
```json
{
  "results": [
    {
      "id": 1,
      "content": "记忆内容",
      "type": "log",
      "tags": ["tag1"],
      "score": 0.95,
      "raw": {
        "vector": 0.90,
        "bm25": 0.05
      }
    }
  ]
}
```

### 压缩记忆
```http
POST /api/compress
```

响应：
```json
{
  "total": 100,
  "compressed": 30,
  "preserved": 70,
  "tokenSaved": 15000
}
```

### 归档/解档记忆
```http
POST /api/memories/:id/archive
Content-Type: application/json

{
  "archived": true
}
```

### 删除记忆
```http
DELETE /api/memories/:id
```

### 健康检查
```http
GET /api/health
```

## 🎨 记忆类型

- **preference**: 偏好
- **decision**: 决策
- **fact**: 事实
- **log**: 日志
- **summary**: 摘要

## 📊 价值评分算法

综合评分 = 频率 × 0.3 + 时效性 × 0.3 + 质量 × 0.2 + 权重 × 0.2

- **频率**: 基于访问次数（最高 10 次 = 100%）
- **时效性**: 基于最后访问时间（30 天内 = 100%）
- **质量**: 是否有标签（有 = 80%，无 = 50%）
- **权重**: 记忆类型权重（preference/decision = 1.2，其他 = 1.0）

归档建议：
- 综合评分 < 40: 建议归档
- 综合评分 ≥ 40: 保留

## ♿ 无障碍功能

- 键盘导航完整支持
- ARIA 标签规范
- 语义化 HTML 结构
- 屏幕阅读器友好
- 高对比度支持
- WCAG 2.1 AA 合规

## 🚀 性能优化

- 代码分割和懒加载
- 图片优化
- CSS 压缩
- Gzip 压缩
- 浏览器缓存
- 预加载关键资源

## 📁 项目结构

```
memclaw/
├── src/              # 核心引擎
│   ├── index.js      # MemClaw 主类
│   ├── cli.js        # CLI 工具
│   ├── core/         # 核心模块
│   │   ├── compression.js  # 记忆压缩
│   │   └── retrieval.js     # 混合检索
│   └── tests/        # 测试文件
├── server/           # 后端服务器
│   ├── server.js     # Express 服务器
│   └── package.json
├── web/              # 前端应用
│   ├── src/
│   │   ├── components/   # React 组件
│   │   │   ├── StatCard.tsx
│   │   │   ├── MemoryCard.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── AddMemoryDialog.tsx
│   │   │   └── Pagination.tsx
│   │   ├── lib/          # 工具库
│   │   │   ├── api.ts    # API 客户端
│   │   │   └── utils.ts  # 工具函数
│   │   ├── types/        # TypeScript 类型
│   │   │   └── api.ts
│   │   ├── App.tsx       # 主应用
│   │   └── main.tsx      # 入口文件
│   ├── dist/             # 构建输出
│   └── package.json
└── README.md
```

## 🔧 配置

### 端口配置

在 `server/server.js` 中修改端口：

```javascript
const PORT = process.env.PORT || 3001;
```

### 数据库路径

默认数据库位置：`server/memories.db`

## 🐛 故障排除

### 前端构建失败

```bash
# 清理缓存
rm -rf node_modules dist package-lock.json
npm install
npm run build
```

### 服务器启动失败

```bash
# 检查端口占用
lsof -i :3001

# 修改端口
PORT=3002 npm start
```

### 数据库错误

```bash
# 删除数据库重新初始化
rm server/memories.db
npm start
```

## 📝 开发笔记

### 添加新页面

1. 在 `web/src/pages/` 创建新组件
2. 在 `web/src/App.tsx` 中添加路由
3. 在导航栏中添加链接

### 添加新 API

1. 在 `server/server.js` 中添加路由
2. 在 `web/src/lib/api.ts` 中添加客户端函数
3. 在 `web/src/types/api.ts` 中添加类型定义

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- React 团队
- Vite 团队
- Tailwind CSS 团队
- Lucide Icons

---

**MemClaw v1.0** - 让 Agent 记得更准、更聪明
