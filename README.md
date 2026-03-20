# MemClaw v1.0.0

AI Memory Optimizer - 让 Agent 记得更准、更聪明

## 核心功能

### 1. 记忆压缩
- 30天未触发自动归档
- 频率衰减算法
- 重要性评分

### 2. 混合检索
- BM25 (30%) + 向量 (70%)
- 智能去重
- 相关性排序

## 安装

```bash
npm install
```

## 使用方法

### 添加记忆

```bash
node src/cli.js add "用户偏好使用 Bash 而不是 PowerShell" --type preference --tags "命令行,偏好"
```

### 压缩记忆

```bash
node src/cli.js compress
```

### 搜索记忆

```bash
node src/cli.js search "用户偏好"
```

### 列出记忆

```bash
node src/cli.js list
```

### 查看统计

```bash
node src/cli.js stats
```

## API 使用

```javascript
import { MemClaw } from './src/index.js';

const memclaw = new MemClaw('./memories.db');

// 添加记忆
memclaw.addMemory('用户喜欢用 VS Code', {
  type: 'preference',
  tags: ['编辑器', '偏好']
});

// 压缩记忆
const result = memclaw.compressMemories();
console.log(result);

// 搜索记忆
const results = await memclaw.searchMemories('编辑器');

// 关闭
memclaw.close();
```

## 技术架构

- **存储层**: SQLite + sqlite-vec
- **压缩算法**: 30天未触发 + 频率衰减
- **检索引擎**: BM25 + 向量混合检索
- **压缩率**: 70% Token 节省

## 性能指标

- 记忆命中率: <25% → >80% (目标)
- Token 节省: ~70%
- 响应速度: <300ms

## 下一步计划

- [ ] 价值评估模型
- [ ] Agent 协作支持
- [ ] Web UI (使用 agent-browser)
- [ ] 用户认证系统
- [ ] 付费通道

## License

MIT
