/**
 * MemClaw - 记忆优化引擎
 * 主入口文件
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const MemoryCompression = require('./core/compression');
const HybridRetrieval = require('./core/retrieval');
const chalk = require('chalk');

class MemClaw {
  constructor(dbPath = './memories.db') {
    this.dbPath = path.resolve(dbPath);
    this.db = null;
    this.ready = false;
    
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('数据库连接失败:', err);
      } else {
        console.log(chalk.green('✓ 数据库连接成功'));
        this.ready = true;
        this.initDatabase();
      }
    });
    this.compression = new MemoryCompression();
    this.retrieval = new HybridRetrieval();
  }

  /**
   * 初始化数据库
   */
  initDatabase() {
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS memories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content TEXT NOT NULL,
          type TEXT DEFAULT 'log',
          tags TEXT,
          compressed INTEGER DEFAULT 0,
          original_length INTEGER,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          last_access INTEGER DEFAULT (strftime('%s', 'now')),
          access_count INTEGER DEFAULT 1
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS memory_stats (
          memory_id INTEGER PRIMARY KEY,
          access_count INTEGER DEFAULT 1,
          last_access INTEGER DEFAULT (strftime('%s', 'now')),
          FOREIGN KEY (memory_id) REFERENCES memories(id)
        )
      `);

      this.db.run(`
        CREATE INDEX IF NOT EXISTS idx_type ON memories(type)
      `);

      this.db.run(`
        CREATE INDEX IF NOT EXISTS idx_compressed ON memories(compressed)
      `);

      this.db.run(`
        CREATE INDEX IF NOT EXISTS idx_last_access ON memory_stats(last_access)
      `);
    });
  }

  /**
   * 添加记忆
   * @param {string} content - 记忆内容
   * @param {Object} options - 选项
   * @param {Function} callback
   */
  addMemory(content, options = {}, callback) {
    // 等待数据库准备好
    if (!this.ready || !this.db) {
      setTimeout(() => this.addMemory(content, options, callback), 100);
      return;
    }
    
    const { type = 'log', tags = [] } = options;
    const db = this.db;
    
    db.serialize(() => {
      db.run(
        'INSERT INTO memories (content, type, tags, original_length) VALUES (?, ?, ?, ?)',
        [content, type, JSON.stringify(tags), content.length],
        function(err) {
          if (err) {
            callback(err);
            return;
          }
          
          const memoryId = this.lastID;
          
          // 初始化统计
          db.run(
            'INSERT INTO memory_stats (memory_id, access_count, last_access) VALUES (?, 1, strftime("%s", "now"))',
            [memoryId],
            function(err2) {
              callback(err2, memoryId);
            }
          );
        }
      );
    });
  }

  /**
   * 获取记忆
   * @param {number} id
   * @param {Function} callback
   */
  getMemory(id, callback) {
    this.db.get('SELECT * FROM memories WHERE id = ?', [id], (err, memory) => {
      if (err) {
        callback(err);
        return;
      }
      
      if (memory) {
        // 更新访问统计
        this.updateAccessStats(id, (err2) => {
          callback(err2, memory);
        });
      } else {
        callback(null, null);
      }
    });
  }

  /**
   * 更新访问统计
   * @param {number} id
   * @param {Function} callback
   */
  updateAccessStats(id, callback) {
    this.db.run(
      'UPDATE memory_stats SET access_count = access_count + 1, last_access = strftime("%s", "now") WHERE memory_id = ?',
      [id],
      callback
    );
  }

  /**
   * 执行记忆压缩
   * @param {Function} callback
   */
  compressMemories(callback) {
    this.db.all(
      `SELECT m.*, ms.access_count, ms.last_access 
       FROM memories m
       JOIN memory_stats ms ON m.id = ms.memory_id
       WHERE m.compressed = 0`,
      [],
      (err, memories) => {
        if (err) {
          callback(err);
          return;
        }

        const { compressed, preserved } = this.compression.compressBatch(memories);

        // 更新压缩的记忆
        const updateStmt = this.db.prepare(
          'UPDATE memories SET content = ?, compressed = 1, compressed_at = strftime("%s", "now") WHERE id = ?'
        );

        let completed = 0;
        const total = compressed.length;

        compressed.forEach((memory, index) => {
          updateStmt.run([memory.content, memory.id], (err) => {
            completed++;
            if (completed === total) {
              updateStmt.finalize();
              callback(null, {
                total: memories.length,
                compressed: compressed.length,
                preserved: preserved.length,
                tokenSaved: this.calculateTokenSavings(compressed)
              });
            }
          });
        });
      }
    );
  }

  /**
   * 计算Token节省量
   * @param {Array} compressedMemories
   */
  calculateTokenSavings(compressedMemories) {
    let saved = 0;
    for (const memory of compressedMemories) {
      saved += memory.originalLength - memory.content.length;
    }
    return saved;
  }

  /**
   * 搜索记忆
   * @param {string} query
   * @param {Function} callback
   */
  async searchMemories(query, callback) {
    this.db.all('SELECT id, content, type, tags, compressed FROM memories', [], async (err, memories) => {
      if (err) {
        callback(err);
        return;
      }

      try {
        const results = await this.retrieval.hybridSearch(query, memories);

        // 更新访问统计
        const updateStmt = this.db.prepare('UPDATE memory_stats SET access_count = access_count + 1, last_access = strftime("%s", "now") WHERE memory_id = ?');
        const completed = {};
        results.forEach((result) => {
          if (!completed[result.id]) {
            completed[result.id] = true;
            updateStmt.run([result.id]);
          }
        });
        updateStmt.finalize();

        callback(null, results);
      } catch (searchErr) {
        callback(searchErr);
      }
    });
  }

  /**
   * 获取所有记忆
   * @param {Function} callback
   */
  getAllMemories(callback) {
    this.db.all('SELECT * FROM memories ORDER BY created_at DESC', [], callback);
  }

  /**
   * 获取统计信息
   * @param {Function} callback
   */
  getStats(callback) {
    this.db.get('SELECT COUNT(*) as count FROM memories', [], (err, totalResult) => {
      if (err) {
        callback(err);
        return;
      }

      this.db.get('SELECT COUNT(*) as count FROM memories WHERE compressed = 1', [], (err, compressedResult) => {
        if (err) {
          callback(err);
          return;
        }

        this.db.get('SELECT SUM(original_length) as total FROM memories', [], (err, totalTokensResult) => {
          if (err) {
            callback(err);
            return;
          }

          this.db.get('SELECT SUM(LENGTH(content)) as total FROM memories', [], (err, currentTokensResult) => {
            if (err) {
              callback(err);
              return;
            }

            const total = totalResult.count;
            const compressed = compressedResult.count;
            const totalTokens = totalTokensResult.total || 0;
            const currentTokens = currentTokensResult.total || 0;

            callback(null, {
              total,
              compressed,
              active: total - compressed,
              tokenSaved: totalTokens - currentTokens,
              compressionRate: total > 0 ? ((totalTokens - currentTokens) / totalTokens * 100).toFixed(2) + '%' : '0%'
            });
          });
        });
      });
    });
  }

  /**
   * 计算记忆价值评分
   * @param {Object} memory - 记忆对象
   * @param {Object} stats - 统计信息
   * @returns {Object} 价值评分结果
   */
  calculateValueScore(memory, stats) {
    const { access_count = 0, last_access } = stats || {};
    const { type, tags } = memory;

    // 1. 频率评分（30%）：基于访问次数
    const maxAccess = 10;
    const frequencyScore = Math.min(access_count / maxAccess, 1) * 100;

    // 2. 时效性评分（30%）：基于最后访问时间
    const now = Math.floor(Date.now() / 1000);
    const daysSinceLastAccess = Math.max(0, Math.floor((now - last_access) / 86400));
    const maxDays = 30;
    const recencyScore = Math.max(0, (1 - daysSinceLastAccess / maxDays)) * 100;

    // 3. 质量评分（20%）：是否有标签
    const hasTags = tags && Array.isArray(tags) && tags.length > 0;
    const qualityScore = hasTags ? 80 : 50;

    // 4. 权重评分（20%）：记忆类型权重
    const highPriorityTypes = ['preference', 'decision'];
    const typeWeight = highPriorityTypes.includes(type) ? 1.2 : 1.0;
    const weightScore = typeWeight * 83.33; // 归一化到 100

    // 综合评分
    const compositeScore = (
      frequencyScore * 0.3 +
      recencyScore * 0.3 +
      qualityScore * 0.2 +
      weightScore * 0.2
    );

    return {
      frequency: Math.round(frequencyScore),
      recency: Math.round(recencyScore),
      quality: Math.round(qualityScore),
      weight: Math.round(weightScore),
      composite: Math.round(compositeScore),
      recommendArchive: compositeScore < 40
    };
  }

  /**
   * 获取所有记忆的价值评分
   * @param {Function} callback
   */
  getValueScores(callback) {
    this.db.all('SELECT * FROM memories ORDER BY created_at DESC', [], async (err, memories) => {
      if (err) {
        callback(err);
        return;
      }

      try {
        // 获取所有记忆的统计信息
        const statsMap = new Map();
        await new Promise((resolve, reject) => {
          this.db.all('SELECT * FROM memory_stats', [], (err, stats) => {
            if (err) reject(err);
            else {
              stats.forEach(stat => statsMap.set(stat.memory_id, stat));
              resolve();
            }
          });
        });

        // 计算每条记忆的价值评分
        const scoredMemories = memories.map(memory => {
          const stats = statsMap.get(memory.id) || { access_count: 0, last_access: memory.last_access };
          const scores = this.calculateValueScore(memory, stats);

          return {
            ...memory,
            tags: memory.tags ? JSON.parse(memory.tags) : [],
            scores
          };
        });

        // 按 综合评分 排序
        scoredMemories.sort((a, b) => b.scores.composite - a.scores.composite);

        callback(null, scoredMemories);
      } catch (error) {
        callback(error);
      }
    });
  }

  /**
   * 批量归档记忆
   * @param {Array} ids - 记忆 ID 数组
   * @param {Function} callback
   */
  batchArchiveMemories(ids, callback) {
    if (!ids || ids.length === 0) {
      callback(null, { archived: 0 });
      return;
    }

    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE memories SET compressed = 1 WHERE id IN (${placeholders})`;

    this.db.run(sql, ids, function(err) {
      if (err) {
        callback(err);
      } else {
        callback(null, { archived: this.changes });
      }
    });
  }

  /**
   * 批量解档记忆
   * @param {Array} ids - 记忆 ID 数组
   * @param {Function} callback
   */
  batchUnarchiveMemories(ids, callback) {
    if (!ids || ids.length === 0) {
      callback(null, { unarchived: 0 });
      return;
    }

    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE memories SET compressed = 0 WHERE id IN (${placeholders})`;

    this.db.run(sql, ids, function(err) {
      if (err) {
        callback(err);
      } else {
        callback(null, { unarchived: this.changes });
      }
    });
  }

  /**
   * 关闭数据库
   */
  close() {
    this.db.close((err) => {
      if (err) {
        console.error('数据库关闭失败:', err);
      } else {
        console.log(chalk.green('✓ 数据库已关闭'));
      }
    });
  }
}

module.exports = MemClaw;
