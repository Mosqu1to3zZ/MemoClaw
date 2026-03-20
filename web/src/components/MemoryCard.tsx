/**
 * 记忆卡片组件
 */

import { Memory, MemoryType } from '@/types/api';
import { formatTimestamp, getRelativeTime, truncateText } from '@/lib/utils';
import { Archive, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { archiveMemory, deleteMemory } from '@/lib/api';

interface MemoryCardProps {
  memory: Memory;
  onUpdate?: () => void;
}

const typeColors: Record<MemoryType, string> = {
  preference: 'bg-purple-100 text-purple-800',
  decision: 'bg-blue-100 text-blue-800',
  fact: 'bg-green-100 text-green-800',
  log: 'bg-gray-100 text-gray-800',
  summary: 'bg-yellow-100 text-yellow-800',
};

const typeLabels: Record<MemoryType, string> = {
  preference: '偏好',
  decision: '决策',
  fact: '事实',
  log: '日志',
  summary: '摘要',
};

export function MemoryCard({ memory, onUpdate }: MemoryCardProps) {
  const [loading, setLoading] = useState(false);

  const handleArchive = async () => {
    try {
      setLoading(true);
      await archiveMemory(memory.id, !memory.compressed);
      onUpdate?.();
    } catch (error) {
      console.error('归档失败:', error);
      alert('归档失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这条记忆吗？')) return;

    try {
      setLoading(true);
      await deleteMemory(memory.id);
      onUpdate?.();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[memory.type]}`}>
              {typeLabels[memory.type]}
            </span>
            {memory.compressed && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-800">
                已归档
              </span>
            )}
            {memory.tags.length > 0 && (
              <span className="text-xs text-gray-500">
                {memory.tags.map(tag => `#${tag}`).join(' ')}
              </span>
            )}
          </div>

          <p className="text-gray-900 mb-3 line-clamp-3">
            {memory.compressed
              ? memory.content
              : truncateText(memory.content, 200)}
          </p>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span title="访问次数">👁 {memory.stats.access_count}</span>
            <span title="最后访问">{getRelativeTime(memory.last_access)}</span>
            <span>{formatTimestamp(memory.created_at)}</span>
            {memory.original_length > 0 && (
              <span>{memory.original_length} tokens</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleArchive}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title={memory.compressed ? '解档' : '归档'}
            aria-label={memory.compressed ? '解档记忆' : '归档记忆'}
          >
            <Archive className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="p-2 hover:bg-red-50 rounded-md transition-colors"
            title="删除"
            aria-label="删除记忆"
          >
            <Trash2 className="h-5 w-5 text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
