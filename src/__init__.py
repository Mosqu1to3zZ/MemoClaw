#!/usr/bin/env python3
"""
MemClaw - Agent 记忆优化服务
Memory Optimization Service for AI Agents

版本: v1.0
更新: 2026-03-20

功能:
- 记忆价值评分
- 混合检索 (BM25 + 向量)
- 自动归档与压缩
- 记忆命中率分析
"""

from .scorer import Memory, MemoryScorer, MemoryManager
from .retrieval import HybridRetrieval, RetrievalResult

__version__ = "1.0.0"
__all__ = [
    "Memory",
    "MemoryScorer", 
    "MemoryManager",
    "HybridRetrieval",
    "RetrievalResult",
]


class MemClaw:
    """
    MemClaw 主类
    
    整合评分、检索、管理的统一接口
    """
    
    def __init__(self, data_path: str = "./data/memories.json"):
        self.manager = MemoryManager(data_path)
        self.retrieval = HybridRetrieval(bm25_weight=0.3, vector_weight=0.7)
        self._refresh_index()
    
    def _refresh_index(self):
        """刷新检索索引"""
        documents = {mid: m.content for mid, m in self.manager.memories.items()}
        embeddings = {mid: m.embedding for mid, m in self.manager.memories.items() 
                     if m.embedding}
        self.retrieval.index(documents, embeddings)
    
    def add(self, memory_id: str, content: str, 
            memory_type: str = "text", 
            tags: list[str] = None,
            embedding: list[float] = None) -> Memory:
        """添加记忆"""
        memory = self.manager.add_memory(memory_id, content, memory_type, tags)
        if embedding:
            memory.embedding = embedding
        self._refresh_index()
        return memory
    
    def search(self, query: str, query_embedding: list[float] = None,
               top_k: int = 10) -> list[RetrievalResult]:
        """搜索记忆"""
        return self.retrieval.search(query, query_embedding, top_k)
    
    def score(self, memory_id: str, 
              query_embedding: list[float] = None) -> Optional[float]:
        """获取记忆得分"""
        return self.manager.get_score(memory_id, query_embedding)
    
    def access(self, memory_id: str):
        """访问记忆 (增加计数)"""
        self.manager.access_memory(memory_id)
        self._refresh_index()
    
    def analyze(self) -> dict:
        """分析记忆状态"""
        scores = self.manager.get_all_scores()
        
        if not scores:
            return {
                "total": 0,
                "avg_score": 0,
                "high_value": 0,
                "low_value": 0,
                "to_archive": 0,
            }
        
        score_values = [s["score"] for s in scores]
        to_archive = self.manager.get_memories_to_archive()
        
        return {
            "total": len(scores),
            "avg_score": sum(score_values) / len(score_values),
            "high_value": sum(1 for s in score_values if s > 0.7),
            "medium_value": sum(1 for s in score_values if 0.3 <= s <= 0.7),
            "low_value": sum(1 for s in score_values if s < 0.3),
            "to_archive": len(to_archive),
        }
    
    def optimize(self, dry_run: bool = True) -> dict:
        """
        优化记忆
        
        Args:
            dry_run: True 则只返回建议，不执行
            
        Returns:
            dict: 优化建议或结果
        """
        analysis = self.analyze()
        
        if dry_run:
            to_archive = self.manager.get_memories_to_archive()
            return {
                "action": "建议归档",
                "count": len(to_archive),
                "memory_ids": [mid for mid, _ in to_archive],
                "analysis": analysis,
            }
        
        # TODO: 实现实际的归档逻辑
        return {"action": "执行归档", "analysis": analysis}


# 便捷函数
def create_app(data_path: str = "./data/memories.json") -> MemClaw:
    """创建 MemClaw 应用"""
    return MemClaw(data_path)
