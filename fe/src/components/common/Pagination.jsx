import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Pagination Component
 * @param {Object} pagination - { currentPage, lastPage, total, perPage }
 * @param {Function} onPageChange - Callback function when page changes
 * @param {string} label - Label for total items (default: "sản phẩm")
 */
const Pagination = ({
  pagination,
  onPageChange,
  itemsPerPage,
  setItemsPerPage,
  label = "sản phẩm",
}) => {
  const { currentPage, lastPage, total } = pagination;

  if (total === 0) return null;

  const renderPageButtons = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(lastPage, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`min-w-[36px] h-9 rounded-xl text-sm font-bold transition-all ${
            currentPage === i
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 active:scale-95"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95"
          }`}
        >
          {i}
        </button>,
      );
    }

    // Add ellipses if needed
    if (startPage > 1) {
      if (startPage > 2)
        pages.unshift(
          <span key="start-dots" className="px-1 text-slate-400">
            ...
          </span>,
        );
      pages.unshift(
        <button
          key={1}
          onClick={() => onPageChange(1)}
          className="min-w-[36px] h-9 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95"
        >
          1
        </button>,
      );
    }

    if (endPage < lastPage) {
      if (endPage < lastPage - 1)
        pages.push(
          <span key="end-dots" className="px-1 text-slate-400">
            ...
          </span>,
        );
      pages.push(
        <button
          key={lastPage}
          onClick={() => onPageChange(lastPage)}
          className="min-w-[36px] h-9 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95"
        >
          {lastPage}
        </button>,
      );
    }

    return pages;
  };

  return (
    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm text-slate-500 font-medium">
          Hiển thị {(currentPage - 1) * pagination.perPage + 1} đến{" "}
          {Math.min(currentPage * pagination.perPage, pagination.total)} trên
          tổng {pagination.total} {label}
        </span>
        {setItemsPerPage && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 font-medium">Hiển thị</span>
            <select
              value={itemsPerPage || pagination.perPage || 15}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-600 transition-all cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-slate-500 font-medium">kết quả</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">{renderPageButtons()}</div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === lastPage}
          className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
