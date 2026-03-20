/**
 * 价值分析页面
 */

import { useState, useEffect } from 'react';
import { getValueScores, batchArchiveMemories } from '@/lib/api';
import { ValueScoresResponse } from '@/types/api';
import {
  BarChart3,
  Archive,
  AlertTriangle,
  TrendingUp,
  Clock,
  Tag,
  Weight,
  Loader2
} from 'lucide-react';

export default function Analysis() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ValueScoresResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    loadValueScores();
  }, []);

  async function loadValueScores() {
    try {
      setLoading(true);
      const response = await getValueScores();
      setData(response);
    } catch (error) {
      console.error('加载价值评分失败:', error);
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

  async function handleBatchArchive() {
    if (selectedIds.size === 0) return;

    try {
      setArchiving(true);
      await batchArchiveMemories(Array.from(selectedIds));
      setSelectedIds(new Set());
      await loadValueScores();
    } catch (error) {
      console.error('批量归档失败:', error);
    } finally {
      setArchiving(false);
    }
  }

  const recommendArchive = data?.memories.filter(m => m.scores.recommendArchive) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">加载中...</span>
      </div>
    );
  }

  return (
    <div className="container py-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary-600" />
          价值分析
        </h1>
        <p className="text-gray-600 mt-1">
          基于 4 个维度评估记忆价值，智能建议归档策略
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">总记忆数</div>
          <div className="text-2xl font-bold text-gray-900">{data?.total || 0}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            建议归档
          </div>
          <div className="text-2xl font-bold text-orange-600">{data?.recommendArchive || 0}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">平均综合评分</div>
          <div className="text-2xl font-bold text-primary-600">
            {Math.round(
              (data?.memories.reduce((sum, m) => sum + m.scores.composite, 0) || 0) /
                (data?.total || 1)
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">已选择</div>
          <div className="text-2xl font-bold text-primary-600">{selectedIds.size}</div>
        </div>
      </div>

      {/* 建议归档列表 */}
      {recommendArchive.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-bold text-gray-900">建议归档记忆</h2>
              <span className="text-sm text-gray-600">({recommendArchive.length} 条)</span>
            </div>
            <button
              onClick={() => setSelectedIds(new Set(recommendArchive.map(m => m.id)))}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              全选
            </button>
          </div>
          <div className="space-y-3">
            {recommendArchive.slice(0, 5).map((memory) => (
              <div
                key={memory.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedIds.has(memory.id)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleSelect(memory.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {memory.content}
                    </div>
                    <div className="flex flex-wrap gap-1">
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
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900 mb-1">
                      {memory.scores.composite}
                    </div>
                    <div className="text-xs text-gray-600">综合评分</div>
                  </div>
                </div>
              </div>
            ))}
            {recommendArchive.length > 5 && (
              <div className="text-center text-sm text-gray-600 pt-2">
                还有 {recommendArchive.length - 5} 条记忆建议归档
              </div>
            )}
          </div>
          {selectedIds.size > 0 && (
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={handleBatchArchive}
                disabled={archiving}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {archiving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    归档中...
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4" />
                    批量归档 {selectedIds.size} 条记忆
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 评分说明 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">评分维度说明</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              <span className="font-medium text-gray-900">频率评分 (30%)</span>
            </div>
            <p className="text-sm text-gray-600">
              基于记忆访问次数。访问次数越多，频率评分越高。
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-primary-600" />
              <span className="font-medium text-gray-900">时效性评分 (30%)</span>
            </div>
            <p className="text-sm text-gray-600">
              基于最后访问时间。最近访问的记忆评分更高。
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-5 w-5 text-primary-600" />
              <span className="font-medium text-gray-900">质量评分 (20%)</span>
            </div>
            <p className="text-sm text-gray-600">
              基于标签完整性。有标签的记忆评分更高。
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Weight className="h-5 w-5 text-primary-600" />
              <span className="font-medium text-gray-900">权重评分 (20%)</span>
            </div>
            <p className="text-sm text-gray-600">
              基于记忆类型。偏好和决策类型权重更高。
            </p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="font-medium text-gray-900">归档建议：</span>
            <span className="text-gray-600">
              综合评分低于 40 分的记忆建议归档，以节省存储空间。
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
