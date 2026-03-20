/**
 * MemClaw API 客户端
 */

import { Stats, Memory, MemoriesResponse, SearchResponse, CompressResult, ValueScoresResponse, BatchOperationResult } from '@/types/api';

const API_BASE_URL = '/api';

/**
 * API 响应包装器
 */
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }

  return response.json();
}

/**
 * 获取统计信息
 */
export async function getStats(): Promise<Stats> {
  return request<Stats>('/stats');
}

/**
 * 获取记忆列表
 */
export async function getMemories(params?: {
  page?: number;
  limit?: number;
  type?: string;
  compressed?: boolean;
}): Promise<MemoriesResponse> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.type) queryParams.append('type', params.type);
  if (params?.compressed !== undefined) queryParams.append('compressed', params.compressed.toString());

  return request<MemoriesResponse>(`/memories?${queryParams.toString()}`);
}

/**
 * 获取单条记忆详情
 */
export async function getMemory(id: number): Promise<Memory> {
  return request<Memory>(`/memories/${id}`);
}

/**
 * 添加记忆
 */
export async function addMemory(data: {
  content: string;
  type?: string;
  tags?: string[];
}): Promise<{ id: number; message: string }> {
  return request<{ id: number; message: string }>('/memories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 搜索记忆
 */
export async function searchMemories(query: string): Promise<SearchResponse> {
  return request<SearchResponse>('/memories/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

/**
 * 压缩记忆
 */
export async function compressMemories(): Promise<CompressResult> {
  return request<CompressResult>('/compress', {
    method: 'POST',
  });
}

/**
 * 归档/解档记忆
 */
export async function archiveMemory(id: number, archived: boolean): Promise<{ message: string }> {
  return request<{ message: string }>(`/memories/${id}/archive`, {
    method: 'POST',
    body: JSON.stringify({ archived }),
  });
}

/**
 * 批量归档记忆
 */
export async function batchArchiveMemories(ids: number[]): Promise<BatchOperationResult> {
  return request<BatchOperationResult>('/memories/batch-archive', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

/**
 * 批量解档记忆
 */
export async function batchUnarchiveMemories(ids: number[]): Promise<BatchOperationResult> {
  return request<BatchOperationResult>('/memories/batch-unarchive', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

/**
 * 获取价值评分
 */
export async function getValueScores(): Promise<ValueScoresResponse> {
  return request<ValueScoresResponse>('/memories/value-scores');
}

/**
 * 删除记忆
 */
export async function deleteMemory(id: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/memories/${id}`, {
    method: 'DELETE',
  });
}
