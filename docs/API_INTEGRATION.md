# MemClaw API 集成说明

本文档详细说明 MemClaw Web UI 与后端 API 的集成方式。

## 📡 API 概览

**基础 URL**: `http://localhost:3001/api`

**认证方式**: 当前版本无需认证（仅用于本地开发）

**响应格式**: JSON

## 🔌 API 端点

### 1. 统计信息 API

**端点**: `GET /stats`

**描述**: 获取记忆统计概览

**请求示例**:
```javascript
const stats = await fetch('/api/stats').then(r => r.json());
```

**响应示例**:
```json
{
  "total": 150,
  "compressed": 45,
  "active": 105,
  "tokenSaved": 22500,
  "compressionRate": "30.00%"
}
```

**字段说明**:
- `total`: 总记忆数
- `compressed`: 已压缩的记忆数
- `active`: 未压缩的记忆数
- `tokenSaved`: 节省的 Token 数量
- `compressionRate`: 压缩率百分比

**前端使用位置**:
- 仪表盘页面的统计卡片
- 实时更新统计信息

---

### 2. 记忆列表 API

**端点**: `GET /memories`

**描述**: 获取记忆列表，支持分页和过滤

**请求参数**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 20 | 每页数量 |
| type | string | 否 | - | 记忆类型 |
| compressed | boolean | 否 | - | 是否已压缩 |

**请求示例**:
```javascript
// 获取第一页，每页 10 条
const data = await fetch('/api/memories?page=1&limit=10')
  .then(r => r.json());

// 只获取日志类型的记忆
const logs = await fetch('/api/memories?type=log')
  .then(r => r.json());

// 只获取已压缩的记忆
const compressed = await fetch('/api/memories?compressed=true')
  .then(r => r.json());
```

**响应示例**:
```json
{
  "memories": [
    {
      "id": 1,
      "content": "这是一条记忆内容",
      "type": "log",
      "tags": ["工作", "重要"],
      "compressed": 0,
      "original_length": 150,
      "created_at": 1700000000,
      "last_access": 1700000000,
      "stats": {
        "access_count": 10,
        "last_access": 1700000000
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

**字段说明**:
- `memories`: 记忆数组
  - `id`: 记忆 ID
  - `content`: 记忆内容
  - `type`: 记忆类型（preference/decision/fact/log/summary）
  - `tags`: 标签数组
  - `compressed`: 是否已压缩（0/1）
  - `original_length`: 原始长度
  - `created_at`: 创建时间戳（秒）
  - `last_access`: 最后访问时间戳（秒）
  - `stats`: 统计信息
    - `access_count`: 访问次数
    - `last_access`: 最后访问时间戳
- `pagination`: 分页信息
  - `page`: 当前页码
  - `limit`: 每页数量
  - `total`: 总记录数
  - `totalPages`: 总页数

**前端使用位置**:
- 仪表盘页面的最近记忆列表
- 归档管理页面的记忆列表
- 记忆详情页面

---

### 3. 单条记忆 API

**端点**: `GET /memories/:id`

**描述**: 获取单条记忆的详细信息

**请求示例**:
```javascript
const memory = await fetch('/api/memories/123')
  .then(r => r.json());
```

**响应示例**:
```json
{
  "id": 123,
  "content": "这是一条记忆内容",
  "type": "preference",
  "tags": ["偏好", "重要"],
  "compressed": 0,
  "original_length": 200,
  "created_at": 1700000000,
  "last_access": 1700000000,
  "stats": {
    "access_count": 5,
    "last_access": 1700000000
  }
}
```

**错误响应**:
```json
{
  "error": "记忆不存在"
}
```

**前端使用位置**:
- 查看记忆详情
- 编辑记忆（未来功能）

---

### 4. 添加记忆 API

**端点**: `POST /memories`

**描述**: 添加新的记忆

**请求头**:
```
Content-Type: application/json
```

**请求体**:
```json
{
  "content": "记忆内容",
  "type": "log",
  "tags": ["tag1", "tag2"]
}
```

**字段说明**:
- `content` (string, 必填): 记忆内容
- `type` (string, 可选): 记忆类型，默认 "log"
- `tags` (array, 可选): 标签数组

**请求示例**:
```javascript
const response = await fetch('/api/memories', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    content: '这是一条新记忆',
    type: 'log',
    tags: ['工作', '重要']
  })
});

const result = await response.json();
// result: { id: 124, message: '记忆添加成功' }
```

**响应示例**:
```json
{
  "id": 124,
  "message": "记忆添加成功"
}
```

**错误响应**:
```json
{
  "error": "记忆内容不能为空"
}
```

**前端使用位置**:
- 仪表盘页面的"添加记忆"按钮
- 添加记忆对话框

---

### 5. 搜索记忆 API

**端点**: `POST /memories/search`

**描述**: 通过关键词搜索记忆（混合检索）

**请求头**:
```
Content-Type: application/json
```

**请求体**:
```json
{
  "query": "搜索关键词"
}
```

**请求示例**:
```javascript
const response = await fetch('/api/memories/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: '工作项目'
  })
});

const result = await response.json();
```

**响应示例**:
```json
{
  "results": [
    {
      "id": 1,
      "content": "完成工作项目的交付",
      "type": "log",
      "tags": ["工作"],
      "score": 0.95,
      "raw": {
        "vector": 0.90,
        "bm25": 0.05
      }
    },
    {
      "id": 5,
      "content": "项目会议记录",
      "type": "summary",
      "tags": ["工作", "会议"],
      "score": 0.87,
      "raw": {
        "vector": 0.82,
        "bm25": 0.05
      }
    }
  ]
}
```

**字段说明**:
- `results`: 搜索结果数组
  - `id`: 记忆 ID
  - `content`: 记忆内容
  - `type`: 记忆类型
  - `tags`: 标签数组
  - `score`: 相关性评分（0-1，越高越相关）
  - `raw`: 原始评分（调试用）
    - `vector`: 向量检索评分
    - `bm25`: BM25 评分

**错误响应**:
```json
{
  "error": "搜索关键词不能为空"
}
```

**前端使用位置**:
- 搜索页面的搜索功能
- 搜索结果展示

---

### 6. 压缩记忆 API

**端点**: `POST /compress`

**描述**: 执行记忆压缩（批量处理未压缩的记忆）

**请求示例**:
```javascript
const response = await fetch('/api/compress', {
  method: 'POST'
});

const result = await response.json();
```

**响应示例**:
```json
{
  "total": 100,
  "compressed": 30,
  "preserved": 70,
  "tokenSaved": 15000
}
```

**字段说明**:
- `total`: 总记忆数
- `compressed`: 实际压缩的记忆数
- `preserved`: 保留的记忆数
- `tokenSaved`: 节省的 Token 数量

**前端使用位置**:
- 仪表盘页面的"压缩记忆"按钮
- 压缩进度展示

---

### 7. 归档/解档 API

**端点**: `POST /memories/:id/archive`

**描述**: 将记忆标记为归档或解档

**请求头**:
```
Content-Type: application/json
```

**请求体**:
```json
{
  "archived": true
}
```

**字段说明**:
- `archived` (boolean): true=归档，false=解档

**请求示例**:
```javascript
// 归档记忆
const response = await fetch('/api/memories/123/archive', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ archived: true })
});

// 解档记忆
const response = await fetch('/api/memories/123/archive', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ archived: false })
});
```

**响应示例**:
```json
{
  "message": "记忆已归档"
}
```

**前端使用位置**:
- 记忆卡片的归档按钮
- 归档管理页面

---

### 8. 删除记忆 API

**端点**: `DELETE /memories/:id`

**描述**: 删除指定的记忆

**请求示例**:
```javascript
const response = await fetch('/api/memories/123', {
  method: 'DELETE'
});

const result = await response.json();
```

**响应示例**:
```json
{
  "message": "记忆已删除"
}
```

**前端使用位置**:
- 记忆卡片的删除按钮
- 批量删除功能（未来）

---

### 9. 健康检查 API

**端点**: `GET /health`

**描述**: 检查服务器健康状态

**请求示例**:
```javascript
const health = await fetch('/api/health')
  .then(r => r.json());
```

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2024-03-20T08:30:00.000Z"
}
```

**前端使用位置**:
- 连接状态检查
- 服务可用性监控

---

## 🔧 前端 API 客户端

### 使用方式

```typescript
import { getStats, getMemories, addMemory, searchMemories } from '@/lib/api';

// 获取统计信息
const stats = await getStats();

// 获取记忆列表
const memories = await getMemories({ page: 1, limit: 20 });

// 添加记忆
await addMemory({
  content: '新记忆',
  type: 'log',
  tags: ['tag1']
});

// 搜索记忆
const results = await searchMemories('关键词');
```

### 错误处理

```typescript
import { getStats } from '@/lib/api';

try {
  const stats = await getStats();
  console.log('统计信息:', stats);
} catch (error) {
  console.error('API 请求失败:', error);
  // 显示错误提示给用户
}
```

### TypeScript 类型定义

所有 API 都有完整的 TypeScript 类型定义：

```typescript
import type { Stats, Memory, SearchResult, CompressResult } from '@/types/api';

// 使用类型
const stats: Stats = await getStats();
const memories: Memory[] = (await getMemories()).memories;
const results: SearchResult[] = (await searchMemories('query')).results;
```

---

## 🔄 数据流示例

### 添加记忆流程

```
用户点击"添加记忆"
  ↓
打开 AddMemoryDialog 组件
  ↓
用户填写表单（内容、类型、标签）
  ↓
点击"添加"按钮
  ↓
调用 addMemory API
  ↓
POST /api/memories
  ↓
后端保存到数据库
  ↓
返回 { id, message }
  ↓
前端刷新记忆列表
  ↓
关闭对话框
  ↓
显示成功提示
```

### 搜索记忆流程

```
用户输入关键词
  ↓
点击"搜索"按钮
  ↓
调用 searchMemories API
  ↓
POST /api/memories/search
  ↓
后端执行混合检索（向量 + BM25）
  ↓
返回搜索结果数组
  ↓
前端展示搜索结果
  ↓
显示匹配度评分
```

---

## 🚀 性能优化

### 1. 请求缓存

```typescript
import { useMemo } from 'react';

const stats = useMemo(() => {
  return getStats();
}, [dependency]);
```

### 2. 请求去重

```typescript
let currentRequest: Promise<any> | null = null;

async function getMemoriesWithDedupe() {
  if (currentRequest) {
    return currentRequest;
  }

  currentRequest = getMemories();
  currentRequest.finally(() => {
    currentRequest = null;
  });

  return currentRequest;
}
```

### 3. 批量请求

```typescript
// 使用 Promise.all 并行请求
const [stats, memories] = await Promise.all([
  getStats(),
  getMemories({ limit: 10 })
]);
```

---

## 🐛 调试技巧

### 1. 查看网络请求

打开浏览器开发者工具 → Network 标签 → 查看 API 请求

### 2. 查看响应数据

```typescript
const response = await fetch('/api/stats');
console.log('原始响应:', response);
const data = await response.json();
console.log('解析数据:', data);
```

### 3. 模拟 API 错误

```typescript
// 在 server.js 中临时添加错误
app.get('/api/stats', (req, res) => {
  // 模拟错误
  res.status(500).json({ error: '测试错误' });
});
```

---

## 📝 最佳实践

1. **错误处理**: 始终使用 try-catch 包裹 API 调用
2. **加载状态**: 显示加载指示器，提升用户体验
3. **用户反馈**: API 成功/失败时显示提示信息
4. **数据验证**: 发送前验证数据格式
5. **类型安全**: 使用 TypeScript 类型定义
6. **请求超时**: 设置合理的超时时间

---

**MemClaw API 集成说明 v1.0**
