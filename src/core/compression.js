/**
 * MemClaw - 记忆压缩引擎
 * 基于30天未触发 + 频率衰减的智能压缩算法
 */

const DateTime = require('luxon');

class MemoryCompression {
  constructor(config = {}) {
    this.compressionThresholdDays = config.compressionThresholdDays || 30; // 30天未触发
    this.decayRate = config.decayRate || 0.9; // 每天衰减10%
    this.minImportance = config.minImportance || 0.5; // 最低重要性阈值
  }

  /**
   * 判断记忆是否应该压缩
   * @param {Object} memory - 记忆对象
   * @param {Object} stats - 访问统计
   * @returns {boolean}
   */
  shouldCompress(memory, stats) {
    const daysSinceLastAccess = this.getDaysSinceLastAccess(stats.lastAccess);
    const frequencyScore = this.calculateFrequencyScore(stats.accessCount, daysSinceLastAccess);
    const importanceScore = this.calculateImportance(memory, stats);

    // 核心判断逻辑
    return (
      daysSinceLastAccess >= this.compressionThresholdDays &&
      frequencyScore < this.minImportance &&
      importanceScore < this.minImportance
    );
  }

  /**
   * 计算频率分数
   * @param {number} accessCount - 访问次数
   * @param {number} daysSinceLastAccess - 距离上次访问天数
   * @returns {number} - 0-1之间的分数
   */
  calculateFrequencyScore(accessCount, daysSinceLastAccess) {
    // 衰减公式：score = count * (decayRate ^ days)
    const decay = Math.pow(this.decayRate, daysSinceLastAccess);
    const normalizedCount = Math.min(accessCount / 10, 1); // 归一化到0-1
    return normalizedCount * decay;
  }

  /**
   * 计算重要性分数
   * @param {Object} memory - 记忆内容
   * @param {Object} stats - 访问统计
   * @returns {number} - 0-1之间的分数
   */
  calculateImportance(memory, stats) {
    let score = 0;

    // 1. 长度权重（越短越重要）
    const lengthScore = Math.max(0, 1 - memory.content.length / 10000);
    score += lengthScore * 0.3;

    // 2. 类型权重
    const typeWeights = {
      'preference': 1.0,
      'decision': 0.9,
      'fact': 0.7,
      'log': 0.3,
      'summary': 0.5
    };
    score += (typeWeights[memory.type] || 0.5) * 0.4;

    // 3. 标签权重（有关键词则重要）
    if (memory.tags && memory.tags.length > 0) {
      score += Math.min(memory.tags.length / 5, 1) * 0.3;
    }

    return Math.min(score, 1);
  }

  /**
   * 计算距离上次访问的天数
   * @param {number} lastAccessTimestamp
   * @returns {number}
   */
  getDaysSinceLastAccess(lastAccessTimestamp) {
    const now = DateTime.now();
    const lastAccess = DateTime.fromMillis(lastAccessTimestamp);
    return Math.floor(now.diff(lastAccess, 'days').days);
  }

  /**
   * 压缩记忆内容
   * @param {Object} memory - 记忆对象
   * @returns {Object} - 压缩后的记忆
   */
  compressMemory(memory) {
    const { content } = memory;
    const originalLength = content.length;

    // 压缩策略：保留前50字符 + "..." + 后50字符
    const previewLength = 50;
    let compressedContent;

    if (originalLength <= 100) {
      compressedContent = content; // 太短不压缩
    } else {
      compressedContent =
        content.substring(0, previewLength) +
        '...' +
        content.substring(originalLength - previewLength);
    }

    return {
      ...memory,
      content: compressedContent,
      compressed: true,
      originalLength,
      compressedAt: Date.now()
    };
  }

  /**
   * 批量压缩记忆列表
   * @param {Array} memories - 记忆列表
   * @returns {Object} - {compressed, preserved}
   */
  compressBatch(memories) {
    const compressed = [];
    const preserved = [];

    for (const memory of memories) {
      if (this.shouldCompress(memory, memory.stats)) {
        compressed.push(this.compressMemory(memory));
      } else {
        preserved.push(memory);
      }
    }

    return { compressed, preserved };
  }
}

module.exports = MemoryCompression;
