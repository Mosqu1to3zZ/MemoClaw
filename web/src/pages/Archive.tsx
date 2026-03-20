/**
 * 归档管理页面
 */

import { useState, useEffect } from 'react';
import { getMemories, batchArchiveMemories, batchUnarchiveMemories, deleteMemory } from '@/lib/api';
import { Memory } from '@/types/api';
import {
  Archive,
  ArchiveRestore,
  Trash2,
  RefreshCw,
  Check,
  Loader2,
  Filter
} from 'lucide-react';

export default function ArchivePage() {
  const [loading, setLoading] = useState(true);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<'all' | 'archived' | 'active'>('all');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadMemories();
  }, [filter]);

  async function loadMemories() {
    try {
      setLoading(true);
      const response = await getMemories({
        page: 1,
        limit: 1000,
        compressed: filter === 'all' ? undefined : filter === 'archived'
      });
      setMemories(response.memories);
    } catch (error) {
      console.error('加载记忆失败:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id: number) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  }

  function toggleSelectAll() {
    if (selectedIds.size === memories.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(memories.map(m => m.id)));
    }
  }

  async function handleBatchArchive() {
    if (selectedIds.size === 0) return;

    const targetFilter = filter === 'archived' ? 'unarchive' : 'archive';

    try {
      setProcessing(true);
      if (targetFilter === 'archive') {
        await batchArchiveMemories(Array.from(selectedIds));
      } else {
        await batchUnarchiveMemories(Array.from(selectedIds));
      }
      setSelectedIds(new Set());
      await loadMemories();
    } catch (error) {
      console.error('批量操作失败:', error);
    } finally {
      setProcessing(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('确定要删除这条记忆吗？')) return;

    try {
      await deleteMemory(id);
      await loadMemories();
    } catch (error) {
      console.error('删除失败:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">加载中...</span>
      </div>
    );
  }

  const archivedCount = memories.filter(m => m.compressed === 1).length;
  const activeCount = memories.length - archivedCount;

  return (
    <div className="container py-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Archive className="h-6 w-6 text-primary-600" />
          归档管理
        </h1>
        <p className="text-gray-600 mt-1">
          管理归档和活跃记忆，批量操作提升效率
        </p>
      </div>

      {/* 统计和筛选 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">总记忆数</div>
          <div className="text-2xl font-bold text-gray-900">{memories.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">已归档</div>
          <div className="text-2xl font-bold text-orange-600">{archivedCount}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">活跃记忆</div>
          <div className="text-2xl font-bold text-green-600">{activeCount}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">已选择</div>
          <div className="text-2xl font-bold text-primary-600">{selectedIds.size}</div>
        </div>
      </div>

      {/* 筛选和操作栏 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">全部记忆</option>
              <option value="archived">已归档</option>
              <option value="active">活跃记忆</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="text-sm px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {selectedIds.size === memories.length ? '取消全选' : '全选'}
            </button>
            {selectedIds.size > 0 && (
              <>
                <button
                  onClick={handleBatchArchive}
                  disabled={processing}
                  className="flex items-center gap-2 text-sm px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      处理中...
                    </>
                  ) : filter === 'archived' ? (
                    <>
                      <ArchiveRestore className="h-4 w-4" />
                      批量解档
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4" />
                      批量归档
                    </>
                  )}
                </button>
              </>
            )}
            <button
              onClick={loadMemories}
              className="flex items-center gap-2 text-sm px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              刷新
            </button>
          </div>
        </div>
      </div>

      {/* 记忆列表 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {memories.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <Archive className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>暂无记忆</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {memories.map((memory) => (
              <div
                key={memory.id}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedIds.has(memory.id)
                    ? 'bg-primary-50'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => toggleSelect(memory.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {selectedIds.has(memory.id) ? (
                        <Check className="h-5 w-5 text-primary-600" />
                      ) : (
                        <div className="h-5 w-5 border-2 border-gray-300 rounded" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-900 mb-2 line-clamp-2">
                        {memory.content}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {memory.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {memory.type}
                        </span>
                        {memory.compressed === 1 ? (
                          <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded flex items-center gap-1">
                            <Archive className="h-3 w-3" />
                            已归档
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            活跃
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        创建时间: {new Date(memory.created_at * 1000).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(memory.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    aria-label="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
