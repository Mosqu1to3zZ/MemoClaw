# MemClaw 记忆价值评分算法

**版本**: v1.0  
**更新时间**: 2026-03-20  
**状态**: 🔄 开发中

---

## 1. 算法概述

MemClaw 记忆价值评分算法用于评估每条记忆的价值，帮助识别重要信息并进行智能压缩/归档。

### 1.1 核心公式

```
记忆价值得分 = frequency × recency × quality × weight × context
```

---

## 2. 参数详解

### 2.1 frequency - 使用频率

| 使用次数 | 得分 |
|---------|------|
| 0 次 | 0.1 |
| 1 次 | 0.3 |
| 2-5 次 | 0.5 |
| 6-10 次 | 0.7 |
| 11-20 次 | 0.85 |
| > 20 次 | 1.0 |

### 2.2 recency - 时间衰减

采用指数衰减模型：

```
recency = e^(-λ × days_since_last_access)

其中：
- days_since_last_access: 距离上次访问的天数
- λ: 衰减系数 (默认 0.05)
```

| 天数 | 得分 |
|-----|------|
| 0 | 1.0 |
| 7 | 0.70 |
| 14 | 0.49 |
| 30 | 0.22 |
| 60 | 0.05 |
| 90 | 0.01 |

### 2.3 quality - 信息质量

| 类型 | 得分 | 说明 |
|-----|------|------|
| 结构化数据 (JSON/YAML) | 1.0 | 可直接解析 |
| 半结构化 (Markdown 表格) | 0.8 | 部分结构 |
| 纯文本 | 0.5 | 无结构 |
| 代码片段 | 0.7 | 有一定格式 |
| URL/链接 | 0.4 | 需外部获取 |

### 2.4 weight - 重要性权重

| 标记 | 得分 | 说明 |
|-----|------|------|
| #核心 | 1.0 | 永久保留 |
| #重要 | 0.7 | 长期保留 |
| #临时 | 0.3 | 可归档 |
| #参考 | 0.2 | 低价值 |

### 2.5 context - 上下文相关性

基于当前任务的上下文匹配度：

```
context = similarity(query_embedding, memory_embedding)

使用余弦相似度计算，范围 0-1
```

---

## 3. 决策规则

### 3.1 归档阈值

| 得分范围 | 动作 | 说明 |
|---------|------|------|
| > 0.7 | 保留 | 高价值记忆 |
| 0.3 - 0.7 | 观察 | 继续监控 |
| < 0.3 | 归档 | 低价值，可清理 |

### 3.2 触发条件

- 每次检索时更新 `last_access` 时间戳
- 每周批量计算所有记忆的价值得分
- 得分 < 0.3 连续 30 天则标记为可归档

---

## 4. 实现代码

```python
import math
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import Optional

@dataclass
class Memory:
    content: str
    last_access: datetime
    access_count: int
    memory_type: str  # structured, semi_structured, text, code, link
    tags: list[str]
    embedding: Optional[list[float]] = None

class MemoryScorer:
    def __init__(self, decay_lambda: float = 0.05):
        self.decay_lambda = decay_lambda
        self.type_weights = {
            "structured": 1.0,
            "semi_structured": 0.8,
            "text": 0.5,
            "code": 0.7,
            "link": 0.4
        }
        self.tag_weights = {
            "#核心": 1.0,
            "#重要": 0.7,
            "#临时": 0.3,
            "#参考": 0.2
        }
    
    def calculate_score(self, memory: Memory, query_embedding: list[float] = None) -> float:
        # 1. Frequency score
        frequency = self._frequency_score(memory.access_count)
        
        # 2. Recency score
        recency = self._recency_score(memory.last_access)
        
        # 3. Quality score
        quality = self._quality_score(memory.memory_type)
        
        # 4. Weight score
        weight = self._weight_score(memory.tags)
        
        # 5. Context score (if query provided)
        context = self._context_score(memory.embedding, query_embedding) if query_embedding else 0.5
        
        # Final score
        score = frequency * recency * quality * weight * context
        
        return round(score, 3)
    
    def _frequency_score(self, access_count: int) -> float:
        if access_count == 0:
            return 0.1
        elif access_count == 1:
            return 0.3
        elif access_count <= 5:
            return 0.5
        elif access_count <= 10:
            return 0.7
        elif access_count <= 20:
            return 0.85
        else:
            return 1.0
    
    def _recency_score(self, last_access: datetime) -> float:
        days = (datetime.now() - last_access).days
        return math.exp(-self.decay_lambda * days)
    
    def _quality_score(self, memory_type: str) -> float:
        return self.type_weights.get(memory_type, 0.5)
    
    def _weight_score(self, tags: list[str]) -> float:
        if not tags:
            return 0.5
        weights = [self.tag_weights.get(tag, 0.5) for tag in tags]
        return max(weights)  # Use the highest weight
    
    def _context_score(self, memory_embedding: list[float], query_embedding: list[float]) -> float:
        if not memory_embedding or not query_embedding:
            return 0.5
        
        # Cosine similarity
        dot = sum(a * b for a, b in zip(memory_embedding, query_embedding))
        mag1 = sum(a * a for a in memory_embedding) ** 0.5
        mag2 = sum(b * b for b in query_embedding) ** 0.5
        
        if mag1 == 0 or mag2 == 0:
            return 0.5
        
        return dot / (mag1 * mag2)
    
    def should_archive(self, score: float, days_below_threshold: int) -> bool:
        return score < 0.3 and days_below_threshold >= 30
```

---

## 5. 性能优化

### 5.1 批量计算

- 每周日凌晨 3:00 执行全量计算
- 增量更新：每次检索时实时更新 `last_access` 和 `access_count`

### 5.2 缓存策略

- 使用 Redis 缓存最近 1000 条记忆的得分
- TTL: 1 小时

---

## 6. 测试用例

| 输入 | 预期输出 | 说明 |
|-----|---------|------|
| access_count=15, last_access=今天, type=structured, tags=["#核心"] | > 0.8 | 高价值记忆 |
| access_count=0, last_access=90天前, type=text, tags=[] | < 0.1 | 低价值记忆 |
| access_count=5, last_access=7天前, type=code, tags=["#重要"] | 0.3-0.5 | 中等价值 |

---

## 7. 待优化项

- [ ] 添加用户反馈权重（用户标记"重要"得分更高）
- [ ] 支持自定义权重配置
- [ ] 添加时间衰减系数的自适应调整
- [ ] 优化向量相似度计算性能

---

*文档版本: 1.0*  
*最后更新: 2026-03-20*
