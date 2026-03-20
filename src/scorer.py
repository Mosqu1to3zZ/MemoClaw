#!/usr/bin/env python3
"""
MemClaw 记忆价值评分引擎
Memory Value Scoring Engine

版本: v1.0
更新: 2026-03-20
"""

import math
import json
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional
from pathlib import Path


@dataclass
class Memory:
    """记忆数据模型"""
    content: str
    last_access: datetime = field(default_factory=datetime.now)
    access_count: int = 0
    memory_type: str = "text"  # structured, semi_structured, text, code, link
    tags: list[str] = field(default_factory=list)
    embedding: Optional[list[float]] = None
    created_at: datetime = field(default_factory=datetime.now)
    metadata: dict = field(default_factory=dict)


class MemoryScorer:
    """
    记忆价值评分器
    
    评分公式: score = frequency × recency × quality × weight × context
    """
    
    # 默认衰减系数 (λ)
    DEFAULT_DECAY_LAMBDA = 0.05
    
    # 类型权重
    TYPE_WEIGHTS = {
        "structured": 1.0,       # JSON/YAML 等结构化数据
        "semi_structured": 0.8,  # Markdown 表格等
        "code": 0.7,            # 代码片段
        "text": 0.5,            # 纯文本
        "link": 0.4,            # URL/链接
    }
    
    # 标签权重
    TAG_WEIGHTS = {
        "#核心": 1.0,
        "#重要": 0.7,
        "#临时": 0.3,
        "#参考": 0.2,
    }
    
    # 访问次数权重
    FREQUENCY_TABLE = {
        0: 0.1,
        1: 0.3,
        (2, 5): 0.5,
        (6, 10): 0.7,
        (11, 20): 0.85,
    }
    
    def __init__(self, decay_lambda: float = DEFAULT_DECAY_LAMBDA):
        self.decay_lambda = decay_lambda
    
    def calculate_score(self, memory: Memory, query_embedding: list[float] = None) -> float:
        """
        计算记忆价值得分
        
        Args:
            memory: 记忆对象
            query_embedding: 可选的查询向量，用于上下文相关性计算
            
        Returns:
            float: 记忆价值得分 (0-1)
        """
        # 1. 使用频率得分
        frequency = self._frequency_score(memory.access_count)
        
        # 2. 时间衰减得分
        recency = self._recency_score(memory.last_access)
        
        # 3. 信息质量得分
        quality = self._quality_score(memory.memory_type)
        
        # 4. 重要性权重
        weight = self._weight_score(memory.tags)
        
        # 5. 上下文相关性 (如果提供了查询向量)
        context = self._context_score(memory.embedding, query_embedding) if query_embedding else 0.5
        
        # 最终得分
        score = frequency * recency * quality * weight * context
        
        return round(score, 4)
    
    def _frequency_score(self, access_count: int) -> float:
        """计算使用频率得分"""
        if access_count == 0:
            return self.FREQUENCY_TABLE[0]
        elif access_count == 1:
            return self.FREQUENCY_TABLE[1]
        elif access_count <= 5:
            return self.FREQUENCY_TABLE[(2, 5)]
        elif access_count <= 10:
            return self.FREQUENCY_TABLE[(6, 10)]
        elif access_count <= 20:
            return self.FREQUENCY_TABLE[(11, 20)]
        else:
            return 1.0
    
    def _recency_score(self, last_access: datetime) -> float:
        """计算时间衰减得分"""
        days = (datetime.now() - last_access).days
        return math.exp(-self.decay_lambda * days)
    
    def _quality_score(self, memory_type: str) -> float:
        """计算信息质量得分"""
        return self.TYPE_WEIGHTS.get(memory_type, 0.5)
    
    def _weight_score(self, tags: list[str]) -> float:
        """计算重要性权重"""
        if not tags:
            return 0.5
        weights = [self.TAG_WEIGHTS.get(tag, 0.5) for tag in tags]
        return max(weights)  # 使用最高权重
    
    def _context_score(self, memory_embedding: Optional[list[float]], 
                       query_embedding: list[float]) -> float:
        """计算上下文相关性得分 (余弦相似度)"""
        if not memory_embedding or not query_embedding:
            return 0.5
        
        # 余弦相似度
        dot = sum(a * b for a, b in zip(memory_embedding, query_embedding))
        mag1 = sum(a * a for a in memory_embedding) ** 0.5
        mag2 = sum(b * b for b in query_embedding) ** 0.5
        
        if mag1 == 0 or mag2 == 0:
            return 0.5
        
        similarity = dot / (mag1 * mag2)
        return max(0, min(1, similarity))  # 归一化到 0-1
    
    def should_archive(self, score: float, days_below_threshold: int = 30) -> bool:
        """
        判断是否应该归档
        
        Args:
            score: 当前得分
            days_below_threshold: 低于阈值的天数
            
        Returns:
            bool: 是否应该归档
        """
        return score < 0.3 and days_below_threshold >= 30
    
    def get_action(self, score: float) -> str:
        """
        根据得分获取建议操作
        
        Args:
            score: 记忆得分
            
        Returns:
            str: 建议操作 (retain/observe/archive)
        """
        if score > 0.7:
            return "retain"  # 保留
        elif score >= 0.3:
            return "observe"  # 观察
        else:
            return "archive"  # 归档
    
    def batch_score(self, memories: list[Memory], 
                    query_embedding: list[float] = None) -> list[dict]:
        """
        批量评分
        
        Args:
            memories: 记忆列表
            query_embedding: 可选的查询向量
            
        Returns:
            list[dict]: 评分结果列表
        """
        results = []
        for memory in memories:
            score = self.calculate_score(memory, query_embedding)
            action = self.get_action(score)
            results.append({
                "memory": memory,
                "score": score,
                "action": action,
                "frequency": self._frequency_score(memory.access_count),
                "recency": self._recency_score(memory.last_access),
                "quality": self._quality_score(memory.memory_type),
                "weight": self._weight_score(memory.tags),
            })
        return sorted(results, key=lambda x: x["score"], reverse=True)


class MemoryManager:
    """记忆管理器 - 整合评分、存储、检索"""
    
    def __init__(self, storage_path: str = "./data/memories.json"):
        self.storage_path = Path(storage_path)
        self.scorer = MemoryScorer()
        self.memories: dict[str, Memory] = {}
        self._load()
    
    def _load(self):
        """从磁盘加载记忆"""
        if self.storage_path.exists():
            with open(self.storage_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for mid, mdata in data.items():
                    self.memories[mid] = Memory(
                        content=mdata["content"],
                        last_access=datetime.fromisoformat(mdata["last_access"]),
                        access_count=mdata.get("access_count", 0),
                        memory_type=mdata.get("memory_type", "text"),
                        tags=mdata.get("tags", []),
                        embedding=mdata.get("embedding"),
                        created_at=datetime.fromisoformat(mdata.get("created_at", datetime.now().isoformat())),
                    )
    
    def _save(self):
        """保存记忆到磁盘"""
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        data = {
            mid: {
                "content": m.content,
                "last_access": m.last_access.isoformat(),
                "access_count": m.access_count,
                "memory_type": m.memory_type,
                "tags": m.tags,
                "embedding": m.embedding,
                "created_at": m.created_at.isoformat(),
            }
            for mid, m in self.memories.items()
        }
        with open(self.storage_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def add_memory(self, memory_id: str, content: str, 
                   memory_type: str = "text", tags: list[str] = None) -> Memory:
        """添加新记忆"""
        memory = Memory(
            content=content,
            memory_type=memory_type,
            tags=tags or [],
        )
        self.memories[memory_id] = memory
        self._save()
        return memory
    
    def access_memory(self, memory_id: str):
        """访问记忆 (更新访问时间和计数)"""
        if memory_id in self.memories:
            self.memories[memory_id].access_count += 1
            self.memories[memory_id].last_access = datetime.now()
            self._save()
    
    def get_score(self, memory_id: str, query_embedding: list[float] = None) -> Optional[float]:
        """获取记忆得分"""
        if memory_id not in self.memories:
            return None
        return self.scorer.calculate_score(self.memories[memory_id], query_embedding)
    
    def get_all_scores(self, query_embedding: list[float] = None) -> list[dict]:
        """获取所有记忆的得分"""
        return self.scorer.batch_score(list(self.memories.values()), query_embedding)
    
    def get_memories_to_archive(self) -> list[tuple[str, float]]:
        """获取应该归档的记忆"""
        to_archive = []
        for mid, memory in self.memories.items():
            score = self.scorer.calculate_score(memory)
            if score < 0.3:
                # 计算低于阈值的天数
                days = (datetime.now() - memory.last_access).days
                if days >= 30:
                    to_archive.append((mid, score))
        return sorted(to_archive, key=lambda x: x[1])


# ============ CLI 接口 ============

def main():
    """CLI 入口"""
    import argparse
    
    parser = argparse.ArgumentParser(description="MemClaw 记忆价值评分工具")
    parser.add_argument("command", choices=["score", "list", "archive", "stats"],
                       help="命令")
    parser.add_argument("--id", help="记忆 ID")
    parser.add_argument("--content", help="记忆内容")
    parser.add_argument("--type", default="text", choices=["structured", "semi_structured", "text", "code", "link"],
                       help="记忆类型")
    parser.add_argument("--tags", help="标签 (逗号分隔)")
    parser.add_argument("--path", default="./data/memories.json", help="数据路径")
    
    args = parser.parse_args()
    manager = MemoryManager(args.path)
    
    if args.command == "score":
        if args.id:
            score = manager.get_score(args.id)
            print(f"记忆 {args.id} 得分: {score}")
        elif args.content:
            memory = Memory(content=args.content, memory_type=args.type,
                          tags=args.tags.split(",") if args.tags else [])
            scorer = MemoryScorer()
            score = scorer.calculate_score(memory)
            print(f"新记忆得分: {score}")
            print(f"建议操作: {scorer.get_action(score)}")
    
    elif args.command == "list":
        results = manager.get_all_scores()
        print(f"\n共 {len(results)} 条记忆:\n")
        for r in results[:10]:
            m = r["memory"]
            print(f"  [{r['score']:.2f}] {m.content[:50]}...")
            print(f"    类型: {m.memory_type}, 访问: {m.access_count}次, 标签: {m.tags}")
    
    elif args.command == "archive":
        to_archive = manager.get_memories_to_archive()
        print(f"\n建议归档 {len(to_archive)} 条记忆:\n")
        for mid, score in to_archive:
            print(f"  [{score:.2f}] {mid}")
    
    elif args.command == "stats":
        results = manager.get_all_scores()
        scores = [r["score"] for r in results]
        if scores:
            avg = sum(scores) / len(scores)
            high = sum(1 for s in scores if s > 0.7)
            low = sum(1 for s in scores if s < 0.3)
            print(f"\n📊 记忆统计:")
            print(f"  总数: {len(scores)}")
            print(f"  平均分: {avg:.2f}")
            print(f"  高价值 (>0.7): {high}")
            print(f"  低价值 (<0.3): {low}")


if __name__ == "__main__":
    main()
