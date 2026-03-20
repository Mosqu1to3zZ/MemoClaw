/**
 * MemClaw API Server
 * Express.js REST API 服务
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const MemClaw = require('../src/index.js');

const app = express();
const PORT = process.env.PORT || 3001;
const memclaw = new MemClaw(path.join(__dirname, '../memories.db'));

// 等待数据库连接完成
function waitForDatabaseReady() {
  return new Promise((resolve) => {
    const checkReady = () => {
      if (memclaw.ready) {
        resolve();
      } else {
        setTimeout(checkReady, 100);
      }
    };
    checkReady();
  });
}

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../web/dist')));

// 错误处理中间件
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 错误处理
app.use((err, req, res, next) => {
  console.error('API 错误:', err);
  res.status(500).json({ error: err.message || '服务器错误' });
});

// API 路由

/**
 * 获取统计信息
 * GET /api/stats
 */
app.get('/api/stats', asyncHandler(async (req, res) => {
  const stats = await new Promise((resolve, reject) => {
    memclaw.getStats((err, stats) => {
      if (err) reject(err);
      else resolve(stats);
    });
  });
  res.json(stats);
}));

/**
 * 获取记忆列表
 * GET /api/memories
 */
app.get('/api/memories', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, compressed } = req.query;

  const memories = await new Promise((resolve, reject) => {
    memclaw.getAllMemories((err, memories) => {
      if (err) reject(err);
      else resolve(memories);
    });
  });

  // 过滤
  let filtered = memories;
  if (type) {
    filtered = filtered.filter(m => m.type === type);
  }
  if (compressed !== undefined) {
    filtered = filtered.filter(m => m.compressed === (compressed === 'true' ? 1 : 0));
  }

  // 排序
  filtered.sort((a, b) => b.created_at - a.created_at);

  // 分页
  const offset = (page - 1) * limit;
  const paginated = filtered.slice(offset, offset + parseInt(limit));

  // 获取统计信息
  const memoryStats = await new Promise((resolve, reject) => {
    memclaw.db.all(
      'SELECT memory_id, access_count, last_access FROM memory_stats',
      [],
      (err, stats) => {
        if (err) reject(err);
        else resolve(stats);
      }
    );
  });

  const statsMap = new Map();
  memoryStats.forEach(stat => {
    statsMap.set(stat.memory_id, stat);
  });

  // 合并数据
  const enrichedMemories = paginated.map(memory => ({
    ...memory,
    tags: memory.tags ? JSON.parse(memory.tags) : [],
    stats: statsMap.get(memory.id) || { access_count: 0, last_access: memory.last_access }
  }));

  res.json({
    memories: enrichedMemories,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit)
    }
  });
}));

/**
 * 获取价值评分
 * GET /api/memories/value-scores
 */
app.get('/api/memories/value-scores', asyncHandler(async (req, res) => {
  const scoredMemories = await new Promise((resolve, reject) => {
    memclaw.getValueScores((err, memories) => {
      if (err) reject(err);
      else resolve(memories);
    });
  });

  res.json({
    memories: scoredMemories,
    total: scoredMemories.length,
    recommendArchive: scoredMemories.filter(m => m.scores.recommendArchive).length
  });
}));

/**
 * 获取单条记忆
 * GET /api/memories/:id
 */
app.get('/api/memories/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const memory = await new Promise((resolve, reject) => {
    memclaw.getMemory(parseInt(id), (err, memory) => {
      if (err) reject(err);
      else resolve(memory);
    });
  });

  if (!memory) {
    return res.status(404).json({ error: '记忆不存在' });
  }

  // 获取统计信息
  const stats = await new Promise((resolve, reject) => {
    memclaw.db.get(
      'SELECT access_count, last_access FROM memory_stats WHERE memory_id = ?',
      [parseInt(id)],
      (err, stats) => {
        if (err) reject(err);
        else resolve(stats);
      }
    );
  });

  res.json({
    ...memory,
    tags: memory.tags ? JSON.parse(memory.tags) : [],
    stats: stats || { access_count: 0, last_access: memory.last_access }
  });
}));

/**
 * 添加记忆
 * POST /api/memories
 */
app.post('/api/memories', asyncHandler(async (req, res) => {
  const { content, type = 'log', tags = [] } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: '记忆内容不能为空' });
  }

  const id = await new Promise((resolve, reject) => {
    memclaw.addMemory(content.trim(), { type, tags }, (err, id) => {
      if (err) reject(err);
      else resolve(id);
    });
  });

  res.status(201).json({ id, message: '记忆添加成功' });
}));

/**
 * 搜索记忆
 * POST /api/memories/search
 */
app.post('/api/memories/search', asyncHandler(async (req, res) => {
  const { query } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: '搜索关键词不能为空' });
  }

  const results = await new Promise((resolve, reject) => {
    memclaw.searchMemories(query.trim(), (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  // 获取原始数据的 tags
  const enrichedResults = await Promise.all(results.map(async (result) => {
    const memory = await new Promise((resolve, reject) => {
      memclaw.db.get(
        'SELECT tags FROM memories WHERE id = ?',
        [result.id],
        (err, memory) => {
          if (err) reject(err);
          else resolve(memory);
        }
      );
    });

    return {
      ...result,
      tags: memory?.tags ? JSON.parse(memory.tags) : []
    };
  }));

  res.json({ results: enrichedResults });
}));

/**
 * 压缩记忆
 * POST /api/compress
 */
app.post('/api/compress', asyncHandler(async (req, res) => {
  const result = await new Promise((resolve, reject) => {
    memclaw.compressMemories((err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

  res.json(result);
}));

/**
 * 归档/解档记忆
 * POST /api/memories/:id/archive
 */
app.post('/api/memories/:id/archive', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { archived } = req.body;

  await new Promise((resolve, reject) => {
    memclaw.db.run(
      'UPDATE memories SET compressed = ? WHERE id = ?',
      [archived ? 1 : 0, parseInt(id)],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });

  res.json({ message: archived ? '记忆已归档' : '记忆已解档' });
}));

/**
 * 删除记忆
 * DELETE /api/memories/:id
 */
app.delete('/api/memories/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 删除记忆
  await new Promise((resolve, reject) => {
    memclaw.db.run(
      'DELETE FROM memories WHERE id = ?',
      [parseInt(id)],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });

  // 删除统计
  await new Promise((resolve, reject) => {
    memclaw.db.run(
      'DELETE FROM memory_stats WHERE memory_id = ?',
      [parseInt(id)],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });

  res.json({ message: '记忆已删除' });
}));

/**
 * 批量归档记忆
 * POST /api/memories/batch-archive
 */
app.post('/api/memories/batch-archive', asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: '记忆 ID 列表不能为空' });
  }

  const result = await new Promise((resolve, reject) => {
    memclaw.batchArchiveMemories(ids, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

  res.json(result);
}));

/**
 * 批量解档记忆
 * POST /api/memories/batch-unarchive
 */
app.post('/api/memories/batch-unarchive', asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: '记忆 ID 列表不能为空' });
  }

  const result = await new Promise((resolve, reject) => {
    memclaw.batchUnarchiveMemories(ids, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

  res.json(result);
}));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 静态文件服务（SPA）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/dist/index.html'));
});

// 启动服务器（等待数据库准备好）
(async () => {
  try {
    await waitForDatabaseReady();
    
    app.listen(PORT, () => {
      console.log(`\n🚀 MemClaw API Server 启动成功!`);
      console.log(`📍 API 地址: http://localhost:${PORT}/api`);
      console.log(`🌐 Web UI: http://localhost:${PORT}`);
      console.log(`\n按 Ctrl+C 停止服务器\n`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
})();

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  memclaw.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n正在关闭服务器...');
  memclaw.close();
  process.exit(0);
});

module.exports = app;
