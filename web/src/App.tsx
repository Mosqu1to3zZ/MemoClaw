/**
 * MemClaw Web UI 主应用
 */

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { getStats, getMemories, compressMemories } from './lib/api';
import { Stats, Memory, SearchResult } from './types/api';
import { StatCard } from './components/StatCard';
import { SearchBar } from './components/SearchBar';
import { MemoryCard } from './components/MemoryCard';
import { AddMemoryDialog } from './components/AddMemoryDialog';
import { ToastProvider } from './components/Toast';
import Analysis from './pages/Analysis';
import ArchivePage from './pages/Archive';
import {
  Brain,
  Search as SearchIcon,
  BarChart3,
  Archive,
  Plus,
  RefreshCw,
  Home
} from 'lucide-react';

// 导航组件
function Navigation() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: '仪表盘', icon: Home },
    { path: '/search', label: '搜索记忆', icon: SearchIcon },
    { path: '/analysis', label: '价值分析', icon: BarChart3 },
    { path: '/archive', label: '归档管理', icon: Archive },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40" role="navigation" aria-label="主导航">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" aria-label="MemClaw 首页">
            <Brain className="h-8 w-8 text-primary-600" aria-hidden="true" />
            <span className="text-xl font-bold text-gray-900">MemClaw</span>
          </Link>

          {/* 桌面导航 */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* 移动端菜单按钮 */}
          <button
            className="md:hidden p-2 hover:bg-gray-100 rounded-md"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="打开菜单"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* 移动端导航菜单 */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}

// 仪表盘页面
function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [compressing, setCompressing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, memoriesData] = await Promise.all([
        getStats(),
        getMemories({ limit: 10 }),
      ]);
      setStats(statsData);
      setMemories(memoriesData.memories);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const handleCompress = async () => {
    if (!confirm('确定要执行记忆压缩吗？此操作可能会影响记忆的可读性。')) return;

    try {
      setCompressing(true);
      await compressMemories();
      await loadData();
    } catch (error) {
      console.error('压缩失败:', error);
      alert('压缩失败');
    } finally {
      setCompressing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">仪表盘</h1>
          <p className="text-gray-600 mt-1">记忆统计概览</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setAddDialogOpen(true)}
            className="btn btn-primary"
            aria-label="添加新记忆"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            添加记忆
          </button>
          <button
            onClick={handleCompress}
            disabled={compressing || !stats || stats.compressed >= stats.total}
            className="btn btn-secondary"
            aria-label="压缩记忆"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${compressing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {compressing ? '压缩中...' : '压缩记忆'}
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="总记忆数"
            value={stats.total}
            icon={Brain}
            description="所有存储的记忆"
          />
          <StatCard
            title="活跃记忆"
            value={stats.active}
            icon={SearchIcon}
            description="未压缩的记忆"
          />
          <StatCard
            title="压缩记忆"
            value={stats.compressed}
            icon={Archive}
            description={`压缩率 ${stats.compressionRate}`}
          />
          <StatCard
            title="Token 节省"
            value={stats.tokenSaved.toLocaleString()}
            icon={BarChart3}
            description="节省的 Token 数量"
          />
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">最近记忆</h2>
        <div className="grid gap-4">
          {memories.length > 0 ? (
            memories.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                onUpdate={loadData}
              />
            ))
          ) : (
            <div className="card p-12 text-center text-gray-500">
              <p>暂无记忆记录</p>
              <button
                onClick={() => setAddDialogOpen(true)}
                className="btn btn-primary mt-4"
              >
                添加第一条记忆
              </button>
            </div>
          )}
        </div>
      </div>

      <AddMemoryDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}

// 搜索页面
function SearchPage() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">搜索记忆</h1>
        <p className="text-gray-600 mt-1">通过关键词检索记忆</p>
      </div>

      <div className="max-w-2xl">
        <SearchBar
          onResults={setResults}
          onLoading={setLoading}
        />
      </div>

      <div>
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" aria-hidden="true" />
            <p>搜索中...</p>
          </div>
        ) : results.length > 0 ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
              找到 {results.length} 条相关记忆
            </p>
            <div className="grid gap-4">
              {results.map((result) => (
                <div key={result.id} className="card p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                          匹配度: {(result.score * 100).toFixed(1)}%
                        </span>
                        <span className="text-xs text-gray-500">
                          {result.type}
                        </span>
                      </div>
                      <p className="text-gray-900">{result.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="card p-12 text-center text-gray-500">
            <SearchIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" aria-hidden="true" />
            <p>输入关键词开始搜索</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 主应用组件
function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="container py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/archive" element={<ArchivePage />} />
            </Routes>
          </main>
          <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
            <div className="container text-center text-sm text-gray-600">
              <p>MemClaw v1.0 - AI Memory Optimizer</p>
            </div>
          </footer>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
