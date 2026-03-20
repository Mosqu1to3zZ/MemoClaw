/**
 * MemClaw - 混合检索引擎
 * BM25 (30%) + 向量 (70%) 混合检索
 */

class HybridRetrieval {
  constructor(config = {}) {
    this.vectorWeight = config.vectorWeight || 0.7; // 向量权重
    this.bm25Weight = config.bm25Weight || 0.3; // BM25权重
    this.topK = config.topK || 5; // 返回结果数
    this.candidateMultiplier = config.candidateMultiplier || 4; // 候选倍数
  }

  /**
   * 混合检索主函数
   * @param {string} query - 查询文本
   * @param {Array} chunks - 文本块列表
   * @returns {Array} - 排序后的结果
   */
  async hybridSearch(query, chunks) {
    // 1. 并行执行向量检索和BM25检索
    const [vectorResults, bm25Results] = await Promise.all([
      this.vectorSearch(query, chunks),
      this.bm25Search(query, chunks)
    ]);

    // 2. 合并结果集（取并集）
    const allChunkIds = new Set([
      ...vectorResults.map(r => r.id),
      ...bm25Results.map(r => r.id)
    ]);

    // 3. 计算综合得分
    const finalResults = [];
    for (const id of allChunkIds) {
      const vecScore = vectorResults.find(r => r.id === id)?.score || 0;
      const bm25Score = bm25Results.find(r => r.id === id)?.score || 0;

      // BM25分数归一化（越小越好转成越大越好）
      const normalizedBm25 = 1 / (1 + Math.max(0, bm25Score));

      // 加权融合
      const finalScore = vecScore * this.vectorWeight + normalizedBm25 * this.bm25Weight;

      finalResults.push({
        id,
        score: finalScore,
        raw: {
          vector: vecScore,
          bm25: bm25Score
        }
      });
    }

    // 4. 排序并返回Top-K
    return finalResults
      .sort((a, b) => b.score - a.score)
      .slice(0, this.topK);
  }

  /**
   * 向量检索
   * @param {string} query - 查询文本
   * @param {Array} chunks - 文本块列表
   * @returns {Array} - 检索结果
   */
  async vectorSearch(query, chunks) {
    // 简化版：使用TF-IDF模拟向量相似度
    const queryTerms = this.tokenize(query);
    const results = [];

    for (const chunk of chunks) {
      const chunkTerms = this.tokenize(chunk.content);
      const similarity = this.calculateSimilarity(queryTerms, chunkTerms);

      if (similarity > 0) {
        results.push({
          id: chunk.id,
          score: similarity,
          content: chunk.content
        });
      }
    }

    // 返回前 candidateMultiplier * topK 个候选
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, this.topK * this.candidateMultiplier);
  }

  /**
   * BM25检索
   * @param {string} query - 查询文本
   * @param {Array} chunks - 文本块列表
   * @returns {Array} - 检索结果
   */
  async bm25Search(query, chunks) {
    const queryTerms = this.tokenize(query);
    const results = [];

    for (const chunk of chunks) {
      const chunkTerms = this.tokenize(chunk.content);
      const bm25Score = this.calculateBM25(queryTerms, chunkTerms);

      if (bm25Score > 0) {
        results.push({
          id: chunk.id,
          score: bm25Score,
          content: chunk.content
        });
      }
    }

    return results
      .sort((a, b) => a.score - b.score) // BM25越小越好
      .slice(0, this.topK * this.candidateMultiplier);
  }

  /**
   * 分词
   * @param {string} text
   * @returns {Array}
   */
  tokenize(text) {
    // 简单分词：按空格和标点分割
    return text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 0);
  }

  /**
   * 计算余弦相似度（简化版）
   * @param {Array} terms1
   * @param {Array} terms2
   * @returns {number}
   */
  calculateSimilarity(terms1, terms2) {
    const set1 = new Set(terms1);
    const set2 = new Set(terms2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));

    if (intersection.size === 0) return 0;

    // Jaccard相似度
    return intersection.size / (set1.size + set2.size - intersection.size);
  }

  /**
   * 计算BM25分数
   * @param {Array} queryTerms
   * @param {Array} chunkTerms
   * @returns {number}
   */
  calculateBM25(queryTerms, chunkTerms) {
    const k1 = 1.2;
    const b = 0.75;
    const avgDocLength = 100; // 假设平均文档长度

    const chunkLength = chunkTerms.length;
    let score = 0;

    for (const term of queryTerms) {
      const tf = this.countOccurrences(term, chunkTerms);
      if (tf === 0) continue;

      const idf = Math.log(1 + 1 / (tf + 1)); // 简化IDF
      const docLength = (chunkLength / avgDocLength) * b;

      score += idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + docLength));
    }

    return score;
  }

  /**
   * 计算词频
   * @param {string} term
   * @param {Array} terms
   * @returns {number}
   */
  countOccurrences(term, terms) {
    return terms.filter(t => t === term).length;
  }
}

module.exports = HybridRetrieval;
