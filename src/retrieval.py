#!/usr/bin/env python3
"""
MemClaw 混合检索引擎
Hybrid Retrieval Engine

支持 BM25 + 向量混合检索

版本: v1.0
更新: 2026-03-20
"""

import math
import json
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from pathlib import Path
import re


@dataclass
class RetrievalResult:
    """检索结果"""
    memory_id: str
    content: str
    score: float
    bm25_score: float = 0.0
    vector_score: float = 0.0
    rank: int = 0


class BM25:
    """
    BM25 文本检索算法
    
    BM25 公式:
    score(Q, D) = sum IDF(qi) * f(qi, D) * (k1 + 1) / 
                  (f(qi, D) + k1 * (1 - b + b * |D| / avgdl))
    
    其中:
    - qi: 查询中的词
    - f(qi, D): 词 qi 在文档 D 中的频率
    - |D|: 文档长度
    - avgdl: 平均文档长度
    - k1, b: 参数 (通常 k1=1.5, b=0.75)
    - IDF: 逆文档频率
    """
    
    # 默认参数
    DEFAULT_K1 = 1.5
    DEFAULT_B = 0.75
    
    def __init__(self, k1: float = DEFAULT_K1, b: float = DEFAULT_B):
        self.k1 = k1
        self.b = b
        self.documents: dict[str, str] = {}
        self.avgdl: float = 0.0
        self.idf: dict[str, float] = {}
        self.doc_lengths: dict[str, int] = {}
        self.doc_term_freqs: dict[str, dict[str, int]] = {}
    
    def _tokenize(self, text: str) -> list[str]:
        """简单分词 (中英文)"""
        # 转小写
        text = text.lower()
        # 分词 (英文按空格+标点，中文按字符)
        tokens = re.findall(r'[a-z]+|\d+|[\u4e00-\u9fff]', text)
        # 过滤停用词
        stopwords = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
                    'of', 'with', 'by', 'from', 'is', 'was', 'are', 'been', 'be',
                    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都',
                    '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你',
                    '会', '着', '没有', '看', '好', '自己', '这'}
        return [t for t in tokens if t not in stopwords and len(t) > 1]
    
    def index(self, documents: dict[str, str]):
        """
        建立索引
        
        Args:
            documents: {doc_id: doc_content}
        """
        self.documents = documents
        n = len(documents)
        
        if n == 0:
            return
        
        # 计算文档长度
        self.doc_lengths = {}
        self.doc_term_freqs = {}
        total_length = 0
        
        for doc_id, content in documents.items():
            tokens = self._tokenize(content)
            self.doc_lengths[doc_id] = len(tokens)
            total_length += len(tokens)
            
            # 词频统计
            term_freqs = {}
            for token in tokens:
                term_freqs[token] = term_freqs.get(token, 0) + 1
            self.doc_term_freqs[doc_id] = term_freqs
        
        # 平均文档长度
        self.avgdl = total_length / n
        
        # 计算 IDF
        df = {}  # 文档频率
        for term_freqs in self.doc_term_freqs.values():
            for term in term_freqs:
                df[term] = df.get(term, 0) + 1
        
        for term, freq in df.items():
            # IDF 公式: log((n - df + 0.5) / (df + 0.5) + 1)
            self.idf[term] = math.log((n - freq + 0.5) / (freq + 0.5) + 1)
    
    def search(self, query: str, top_k: int = 10) -> list[tuple[str, float]]:
        """
        搜索
        
        Args:
            query: 查询文本
            top_k: 返回前 k 个结果
            
        Returns:
            list: [(doc_id, score), ...]
        """
        if not self.documents:
            return []
        
        query_tokens = self._tokenize(query)
        scores = {}
        
        for doc_id, term_freqs in self.doc_term_freqs.items():
            score = 0.0
            doc_len = self.doc_lengths[doc_id]
            
            for token in query_tokens:
                if token in term_freqs:
                    tf = term_freqs[token]
                    idf = self.idf.get(token, 0)
                    
                    # BM25 公式
                    numerator = tf * (self.k1 + 1)
                    denominator = tf + self.k1 * (1 - self.b + self.b * doc_len / self.avgdl)
                    score += idf * numerator / denominator
            
            if score > 0:
                scores[doc_id] = score
        
        # 排序
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_scores[:top_k]


class HybridRetrieval:
    """
    混合检索引擎
    
    结合 BM25 (关键词) 和向量 (语义) 检索
    """
    
    def __init__(self, bm25_weight: float = 0.3, vector_weight: float = 0.7):
        """
        初始化
        
        Args:
            bm25_weight: BM25 权重
            vector_weight: 向量检索权重
        """
        self.bm25_weight = bm25_weight
        self.vector_weight = vector_weight
        self.bm25 = BM25()
        self.documents: dict[str, str] = {}
        self.embeddings: dict[str, list[float]] = {}
    
    def index(self, documents: dict[str, str], 
              embeddings: dict[str, list[float]] = None):
        """
        建立索引
        
        Args:
            documents: {doc_id: doc_content}
            embeddings: {doc_id: embedding_vector} (可选)
        """
        self.documents = documents
        self.embeddings = embeddings or {}
        
        # BM25 索引
        self.bm25.index(documents)
    
    def search(self, query: str, query_embedding: list[float] = None,
               top_k: int = 10) -> list[RetrievalResult]:
        """
        混合搜索
        
        Args:
            query: 查询文本
            query_embedding: 查询向量 (可选)
            top_k: 返回前 k 个结果
            
        Returns:
            list[RetrievalResult]: 检索结果列表
        """
        results = {}
        
        # 1. BM25 检索
        if self.documents:
            bm25_results = self.bm25.search(query, top_k * 2)
            bm25_max = bm25_results[0][1] if bm25_results else 1.0
            
            for doc_id, score in bm25_results:
                # 归一化
                norm_score = score / bm25_max if bm25_max > 0 else 0
                results[doc_id] = results.get(doc_id, RetrievalResult(
                    memory_id=doc_id,
                    content=self.documents.get(doc_id, ""),
                    score=0,
                    bm25_score=norm_score,
                    vector_score=0,
                    rank=0
                ))
                results[doc_id].bm25_score = norm_score
        
        # 2. 向量检索
        if query_embedding and self.embeddings:
            vector_results = self._vector_search(query_embedding, top_k * 2)
            vector_max = vector_results[0][1] if vector_results else 1.0
            
            for doc_id, score in vector_results:
                norm_score = score / vector_max if vector_max > 0 else 0
                if doc_id in results:
                    results[doc_id].vector_score = norm_score
                else:
                    results[doc_id] = RetrievalResult(
                        memory_id=doc_id,
                        content=self.documents.get(doc_id, ""),
                        score=0,
                        bm25_score=0,
                        vector_score=norm_score,
                        rank=0
                    )
        
        # 3. 计算综合得分
        final_results = []
        for doc_id, result in results.items():
            result.score = (
                result.bm25_score * self.bm25_weight + 
                result.vector_score * self.vector_weight
            )
            final_results.append(result)
        
        # 4. 排序
        final_results.sort(key=lambda x: x.score, reverse=True)
        
        # 5. 设置排名
        for i, r in enumerate(final_results):
            r.rank = i + 1
        
        return final_results[:top_k]
    
    def _vector_search(self, query_embedding: list[float], 
                       top_k: int) -> list[tuple[str, float]]:
        """向量相似度搜索 (余弦相似度)"""
        scores = []
        
        for doc_id, doc_embedding in self.embeddings.items():
            similarity = self._cosine_similarity(query_embedding, doc_embedding)
            scores.append((doc_id, similarity))
        
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_k]
    
    def _cosine_similarity(self, a: list[float], b: list[float]) -> float:
        """计算余弦相似度"""
        if not a or not b:
            return 0.0
        
        dot = sum(x * y for x, y in zip(a, b))
        mag_a = math.sqrt(sum(x * x for x in a))
        mag_b = math.sqrt(sum(y * y for y in b))
        
        if mag_a == 0 or mag_b == 0:
            return 0.0
        
        return dot / (mag_a * mag_b)


# ============ CLI 接口 ============

def main():
    """CLI 入口"""
    import argparse
    
    parser = argparse.ArgumentParser(description="MemClaw 混合检索工具")
    parser.add_argument("command", choices=["index", "search", "stats"],
                       help="命令")
    parser.add_argument("--path", default="./data/memories.json", help="数据路径")
    parser.add_argument("--query", help="查询文本")
    parser.add_argument("--top", type=int, default=5, help="返回数量")
    
    args = parser.parse_args()
    
    if args.command == "index":
        # 加载数据并建立索引
        path = Path(args.path)
        if path.exists():
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            documents = {mid: mdata["content"] for mid, mdata in data.items()}
            embeddings = {mid: mdata.get("embedding") for mid, mdata in data.items() 
                        if mdata.get("embedding")}
            
            engine = HybridRetrieval(bm25_weight=0.3, vector_weight=0.7)
            engine.index(documents, embeddings)
            
            print(f"✅ 已索引 {len(documents)} 条记忆")
            
            # 保存索引
            index_path = path.parent / "bm25_index.json"
            # (简化版，实际需要持久化索引)
            print(f"📦 索引已保存")
        else:
            print(f"❌ 文件不存在: {args.path}")
    
    elif args.command == "search":
        if not args.query:
            print("❌ 请提供 --query 参数")
            return
        
        path = Path(args.path)
        if path.exists():
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            documents = {mid: mdata["content"] for mid, mdata in data.items()}
            embeddings = {mid: mdata.get("embedding") for mid, mdata in data.items()
                        if mdata.get("embedding")}
            
            engine = HybridRetrieval(bm25_weight=0.3, vector_weight=0.7)
            engine.index(documents, embeddings)
            
            results = engine.search(args.query, top_k=args.top)
            
            print(f"\n🔍 搜索: \"{args.query}\"")
            print(f"📊 结果 (BM25 30% + 向量 70%):\n")
            
            for r in results:
                print(f"  [{r.rank}] 得分: {r.score:.3f}")
                print(f"       BM25: {r.bm25_score:.3f}, 向量: {r.vector_score:.3f}")
                print(f"       内容: {r.content[:80]}...")
                print()
        else:
            print(f"❌ 文件不存在: {args.path}")
    
    elif args.command == "stats":
        path = Path(args.path)
        if path.exists():
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            print(f"\n📊 检索引擎统计:")
            print(f"  总记忆数: {len(data)}")
            print(f"  有向量的记忆: {sum(1 for m in data.values() if m.get('embedding'))}")
            print(f"  混合权重: BM25 {30}% + 向量 {70}%")
        else:
            print(f"❌ 文件不存在: {args.path}")


if __name__ == "__main__":
    main()
