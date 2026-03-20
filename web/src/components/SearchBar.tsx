/**
 * 搜索组件
 */

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { searchMemories } from '@/lib/api';
import { SearchResult } from '@/types/api';

interface SearchBarProps {
  onResults: (results: SearchResult[]) => void;
  onLoading: (loading: boolean) => void;
}

export function SearchBar({ onResults, onLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      onLoading(true);
      const response = await searchMemories(query);
      onResults(response.results);
    } catch (error) {
      console.error('搜索失败:', error);
      alert('搜索失败');
      onResults([]);
    } finally {
      onLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    onResults([]);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <label htmlFor="search" className="sr-only">搜索记忆</label>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
          aria-hidden="true"
        />
        <input
          id="search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索记忆内容..."
          className="input pl-10 pr-10"
          aria-label="搜索记忆"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-md"
            aria-label="清除搜索"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>
      <button type="submit" className="btn btn-primary mt-3 w-full">
        搜索
      </button>
    </form>
  );
}
