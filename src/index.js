/**
 * MemClaw - 记忆优化引擎
 * 主入口文件
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { MemoryCompression } = require('./core/compression');
const { HybridRetrieval } = require('./core/retrieval');
const chalk = require('chalk');

class MemClaw {
  constructor(dbPath = './memories.db') {
    this.dbPath = path.resolve(dbPath);
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('数据库连接失败:', err);
      } else {
        console.log(chalk.green('✓ 数据库连接成功'));
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
    const { type = 'log', tags = [] } = options;
    
    this.db.serialize(() => {
      this.db.run(
        'INSERT INTO memories (content, type, tags, original_length) VALUES (?, ?, ?, ?)',
        [content, type, JSON.stringify(tags), content.length],
        function(err) {
          if (err) {
            callback(err);
            return;
          }
          
          const memoryId = this.lastID;
          
          // 初始化统计
          this.db.run(
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
