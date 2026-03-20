/**
 * MemClaw API 类型定义
 */

export interface Memory {
  id: number;
  content: string;
  type: MemoryType;
  tags: string[];
  compressed: number;
  original_length: number;
  created_at: number;
  last_access: number;
  stats: MemoryStats;
}

export interface MemoryStats {
  access_count: number;
  last_access: number;
}

export type MemoryType = 'preference' | 'decision' | 'fact' | 'log' | 'summary';

export interface Stats {
  total: number;
  compressed: number;
  active: number;
  tokenSaved: number;
  compressionRate: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MemoriesResponse {
  memories: Memory[];
  pagination: Pagination;
}

export interface SearchResult {
  id: number;
  content: string;
  type: MemoryType;
  tags: string[];
  score: number;
  raw?: {
    vector: number;
    bm25: number;
  };
}

export interface SearchResponse {
  results: SearchResult[];
}

export interface CompressResult {
  total: number;
  compressed: number;
  preserved: number;
  tokenSaved: number;
}

export interface ValueScore {
  frequency: number;
  recency: number;
  quality: number;
  overall: number;
  recommendation: 'archive' | 'preserve';
}
