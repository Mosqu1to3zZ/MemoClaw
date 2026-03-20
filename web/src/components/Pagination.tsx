/**
 * 分页组件
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages: (number | string)[] = [];

  // 总是显示第一页
  pages.push(1);

  // 计算中间页码
  if (totalPages > 1) {
    if (totalPages <= 5) {
      for (let i = 2; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(2, 3, 4, '...');
      } else if (currentPage >= totalPages - 2) {
        pages.push('...', totalPages - 3, totalPages - 2, totalPages - 1);
      } else {
        pages.push('...', currentPage - 1, currentPage, currentPage + 1, '...');
      }
      pages.push(totalPages);
    }
  }

  return (
    <nav
      className="flex items-center justify-center gap-2 mt-6"
      aria-label="分页导航"
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="上一页"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((page, index) => (
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={`btn ${
              currentPage === page
                ? 'btn-primary'
                : 'btn-outline'
            }`}
            aria-current={currentPage === page ? 'page' : undefined}
            aria-label={`第 ${page} 页`}
          >
            {page}
          </button>
        )
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="下一页"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
