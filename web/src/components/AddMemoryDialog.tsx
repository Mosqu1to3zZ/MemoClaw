/**
 * 添加记忆对话框组件
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { addMemory } from '@/lib/api';
import { MemoryType } from '@/types/api';

interface AddMemoryDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddMemoryDialog({ open, onClose, onSuccess }: AddMemoryDialogProps) {
  const [content, setContent] = useState('');
  const [type, setType] = useState<MemoryType>('log');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setLoading(true);
      await addMemory({
        content: content.trim(),
        type,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
      });
      onSuccess();
      onClose();
      setContent('');
      setTags('');
    } catch (error) {
      console.error('添加失败:', error);
      alert('添加失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 id="dialog-title" className="text-xl font-semibold text-gray-900">
            添加新记忆
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="关闭"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              记忆内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="input resize-none"
              placeholder="输入记忆内容..."
              required
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              记忆类型
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as MemoryType)}
              className="input"
            >
              <option value="preference">偏好</option>
              <option value="decision">决策</option>
              <option value="fact">事实</option>
              <option value="log">日志</option>
              <option value="summary">摘要</option>
            </select>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              标签（用逗号分隔）
            </label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input"
              placeholder="例如：工作, 重要, 待办"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !content.trim()}
            >
              {loading ? '添加中...' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
