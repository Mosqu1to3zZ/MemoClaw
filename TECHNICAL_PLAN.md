# MemClaw - 技术方案

**版本**: v1.0  
**制定时间**: 2026-03-20  
**目标上线**: 2026-04-02（Beta 版）

---

## 1. 系统架构

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    MemClaw 系统架构                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  Web UI      │───▶│  REST API    │───▶│  记忆引擎     │      │
│  │ - 仪表盘     │    │ - 统计接口    │    │ - 压缩引擎    │      │
│  │ - 检索界面   │    │ - 记忆管理    │    │ - 检索引擎    │      │
│  │ - 归档管理   │    │ - 搜索接口    │    │ - 价值评估    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │              │
│         ▼                   ▼                   ▼              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  数据存储层   │───▶│  缓存层       │───▶│  日志层       │      │
│  │ - SQLite     │    │ - Redis      │    │ - Winston    │      │
│  │ - 数据库     │    │ - 热数据     │    │ - 访问日志    │      │
│  │ - 索引优化   │    │ - 查询结果   │    │ - 操作审计    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 模块设计

#### 1.2.1 Web UI 层
- **统计仪表盘**:
  - 总记忆数、已压缩数、活跃数统计
  - Token 节省统计
  - 压缩率可视化（图表展示）
  - 最近记忆列表
  - 一键添加记忆
  - 手动执行压缩

- **记忆检索界面**:
  - 关键词搜索
  - 搜索结果实时显示
  - 匹配度评分展示
  - 记忆详情查看

- **价值评分分析**:
  - 频率评分（访问频率）
  - 时效性评分（最近访问时间）
  - 质量评分（标签完整性）
  - 综合评分计算
  - 归档建议（基于综合评分）

- **归档管理**:
  - 查看所有记忆（全部/已归档/未归档）
  - 手动归档/解档操作
  - 批量操作支持
  - 记忆删除功能

#### 1.2.2 REST API 层
- **统计接口**:
  - `GET /api/stats` - 获取统计信息
  - `GET /api/health` - 健康检查

- **记忆管理接口**:
  - `GET /api/memories` - 获取记忆列表
  - `GET /api/memories/:id` - 获取单条记忆
  - `POST /api/memories` - 添加记忆
  - `DELETE /api/memories/:id` - 删除记忆
  - `POST /api/memories/:id/archive` - 归档/解档记忆

- **搜索接口**:
  - `POST /api/memories/search` - 搜索记忆

- **压缩接口**:
  - `POST /api/compress` - 执行记忆压缩

#### 1.2.3 记忆引擎层
- **压缩引擎** (`MemoryCompression`):
  - 30天未触发检测
  - 频率衰减算法（每天衰减10%）
  - 重要性评分计算
  - 智能压缩策略（保留首尾 + 省略号）
  - 批量压缩支持

- **检索引擎** (`HybridRetrieval`):
  - BM25 检索（30%权重）
  - 向量检索（70%权重）
  - 混合评分融合
  - 候选集过滤
  - Top-K 返回

- **价值评估引擎**:
  - 频率评分（访问次数归一化）
  - 时效性评分（最近30天）
  - 质量评分（标签完整性）
  - 类型权重（preference > decision > fact > summary > log）
  - 综合评分计算

---

## 2. 技术栈

### 2.1 前端技术
- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **路由**: React Router DOM
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **图表**: Recharts
- **HTTP 客户端**: Axios

### 2.2 后端技术
- **运行时**: Node.js 16+
- **框架**: Express.js
- **数据库**: SQLite3
- **跨域**: CORS
- **时间处理**: Luxon
- **日志**: Winston

### 2.3 核心算法
- **压缩算法**: 30天未触发 + 频率衰减 + 重要性评分
- **检索算法**: BM25 (30%) + 向量 (70%) 混合检索
- **评分算法**: 频率 × 0.3 + 时效性 × 0.3 + 质量 × 0.2 + 权重 × 0.2

---

## 3. 核心功能实现

### 3.1 记忆压缩算法

```javascript
// 压缩判断逻辑
function shouldCompress(memory, stats) {
  const daysSinceLastAccess = getDaysSinceLastAccess(stats.lastAccess);
  const frequencyScore = calculateFrequencyScore(stats.accessCount, daysSinceLastAccess);
  const importanceScore = calculateImportance(memory, stats);

  return (
    daysSinceLastAccess >= 30 &&
    frequencyScore < 0.5 &&
    importanceScore < 0.5
  );
}

// 频率衰减算法
function calculateFrequencyScore(accessCount, daysSinceLastAccess) {
  const decay = Math.pow(0.9, daysSinceLastAccess);
  const normalizedCount = Math.min(accessCount / 10, 1);
  return normalizedCount * decay;
}

// 压缩策略
function compressMemory(memory) {
  const previewLength = 50;
  
  if (memory.content.length <= 100) {
    return memory; // 太短不压缩
  }
  
  return {
    ...memory,
    content: 
      memory.content.substring(0, previewLength) +
      '...' +
      memory.content.substring(memory.content.length - previewLength)
  };
}
```

### 3.2 混合检索算法

```javascript
// 混合检索主函数
async function hybridSearch(query, chunks) {
  const [vectorResults, bm25Results] = await Promise.all([
    vectorSearch(query, chunks),
    bm25Search(query, chunks)
  ]);

  // 合并结果集
  const allChunkIds = new Set([
    ...vectorResults.map(r => r.id),
    ...bm25Results.map(r => r.id)
  ]);

  // 计算综合得分
  const finalResults = [];
  for (const id of allChunkIds) {
    const vecScore = vectorResults.find(r => r.id === id)?.score || 0;
    const bm25Score = bm25Results.find(r => r.id ===id)?.score || 0;

    const normalizedBm25 = 1 / (1 + Math.max(0, bm25Score));
    const finalScore = vecScore * 0.7 + normalizedBm25 * 0.3;

    finalResults.push({ id, score, raw: { vector: vecScore, bm25: bm25Score } });
  }

  return finalResults
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
```

### 3.3 价值评分算法

```javascript
// 综合评分计算
function calculateValueScore(memory, stats) {
  const frequencyScore = calculateFrequencyScore(stats.access_count);
  const时效性Score = calculate时效性Score(stats.last_access);
  const qualityScore = calculateQualityScore(memory.tags);
  const typeWeight = getTypeWeight(memory.type);

  return (
    frequencyScore * 0.3 +
    时效性Score * 0.3 +
    qualityScore * 0.2 +
    typeWeight * 0.2
  );
}

// 归档建议
function shouldArchive(memory, stats) {
  const valueScore = calculateValueScore(memory, stats);
  return valueScore < 40; // 低于40分建议归档
}
```

---

## 4. 数据模型

### 4.1 记忆表
```sql
CREATE TABLE memories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'log',
  tags TEXT,
  compressed INTEGER DEFAULT 0,
  original_length INTEGER,
  compressed_at INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  last_access INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_type ON memories(type);
CREATE INDEX idx_compressed ON memories(compressed);
CREATE INDEX idx_created_at ON memories(created_at);
```

### 4.2 记忆统计表
```sql
CREATE TABLE memory_stats (
  memory_id INTEGER PRIMARY KEY,
  access_count INTEGER DEFAULT 1,
  last_access INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (memory_id) REFERENCES memories(id)
);

CREATE INDEX idx_last_access ON memory_stats(last_access);
CREATE INDEX idx_access_count ON memory_stats(access_count);
```

---

## 5. API 设计

### 5.1 统计接口
- `GET /api/stats` - 获取统计信息

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

### 5.2 记忆管理接口
- `GET /api/memories?page=1&limit=20&type=log&compressed=false` - 获取记忆列表
- `GET /api/memories/:id` - 获取单条记忆
- `POST /api/memories` - 添加记忆
- `DELETE /api/memories/:id` - 删除记忆
- `POST /api/memories/:id/archive` - 归档/解档记忆

### 5.3 搜索接口
- `POST /api/memories/search` - 搜索记忆

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

### 5.4 压缩接口
- `POST /api/compress` - 执行记忆压缩

响应：
```json
{
  "total": 100,
  "compressed": 30,
  "preserved": 70,
  "tokenSaved": 15000
}
```

---

## 6. 部署方案

### 6.1 开发环境
- Node.js 16+ / Linux
- SQLite 本地数据库
- 环境变量配置

### 6.2 生产环境
- **服务器**: 阿里云/腾讯云 2C4G
- **数据库**: SQLite + Redis 缓存
- **端口**: 3001（避免与系统服务冲突）
- **日志**: Winston + ELK Stack

### 6.3 部署命令
```bash
# 安装依赖
cd memclaw/server
npm install

cd ../web
npm install
npm run build

# 启动服务
cd ../server
npm start

# PM2 部署
pm2 start ecosystem.config.js
pm2 save
```

---

## 7. 性能优化

### 7.1 性能目标
- API 响应时间：< 50ms
- 搜索响应时间：< 200ms
- 压缩处理：< 5s / 1000 条记忆
- 并发支持：500 TPS

### 7.2 优化策略
- **缓存优化**:
  - Redis 缓存统计信息（5分钟）
  - 搜索结果缓存（1分钟）
  - 热记忆缓存（30分钟）

- **查询优化**:
  - 数据库索引优化
  - 分页查询
  - 批量操作

- **前端优化**:
  - 代码分割和懒加载
  - 图片优化
  - Gzip 压缩
  - 浏览器缓存

---

## 8. 安全考虑

### 8.1 数据安全
- 用户数据加密存储（敏感信息脱敏）
- API 请求签名验证
- 访问日志记录

### 8.2 API 安全
- CORS 配置
- 请求限流控制
- SQL 注入防护（参数化查询）
- XSS 防护（输入验证）

---

## 9. 测试策略

### 9.1 单元测试
- 核心算法覆盖 > 80%
- Mock 数据测试
- 边界条件测试

### 9.2 集成测试
- 端到端流程测试
- 压力测试：500 并发
- 回归测试

### 9.3 用户验收测试
- 真实使用场景测试
- 界面易用性测试
- 性能测试

---

## 10. 上线检查清单

- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试通过
- [ ] 性能测试达标
- [ ] 安全审计通过
- [ ] 文档完整
- [ ] 用户使用手册
- [ ] 监控告警配置
- [ ] 数据备份恢复测试

---

## 11. 风险与应对

| 风险 | 可能性 | 影响 | 应对措施 |
|-----|-------|------|---------|
| 压缩误删重要记忆 | 中 | 高 | 重要记忆白名单 + 人工确认 |
| 搜索准确度不足 | 中 | 中 | 多模型融合 + 用户反馈优化 |
| SQLite 性能瓶颈 | 中 | 中 | Redis 缓存 + 索引优化 |
| 用户接受度低 | 高 | 高 | 免费试用 + 快速迭代 |

---

## 12. 技术难点与解决方案

### 12.1 压缩算法优化
**难点**: 如何准确判断哪些记忆应该压缩

**解决方案**:
- 多维度评分（频率、时效性、质量、类型）
- 频率衰减算法
- 重要记忆白名单
- 用户手动调整

### 12.2 混合检索优化
**难点**: BM25 和向量检索的权重平衡

**解决方案**:
- AB 测试不同权重
- 用户反馈自动调整
- 查询类型自适应
- 候选集过滤

### 12.3 价值评估准确性
**难点**: 如何准确评估记忆的价值

**解决方案**:
- 多维度评分模型
- 用户行为学习
- 归档建议反馈
- 人工标注数据

---

*技术方案版本: v1.0*  
*最后更新: 2026-03-20*  
*技术负责人: 小蚊*
