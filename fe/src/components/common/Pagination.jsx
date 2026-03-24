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

  if (lastPage <= 1) return null;

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
          className={`min-w-[36px] h-9 rounded-lg text-sm font-semibold transition-all ${
            currentPage === i
              ? "bg-emerald-500 text-white shadow-sm"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
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
          <span key="start-dots" className="px-1 text-gray-400">
            ...
          </span>,
        );
      pages.unshift(
        <button
          key={1}
          onClick={() => onPageChange(1)}
          className="min-w-[36px] h-9 rounded-lg text-sm font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          1
        </button>,
      );
    }

    if (endPage < lastPage) {
      if (endPage < lastPage - 1)
        pages.push(
          <span key="end-dots" className="px-1 text-gray-400">
            ...
          </span>,
        );
      pages.push(
        <button
          key={lastPage}
          onClick={() => onPageChange(lastPage)}
          className="min-w-[36px] h-9 rounded-lg text-sm font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          {lastPage}
        </button>,
      );
    }

    return pages;
  };

  return (
    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200  flex justify-between">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">
          Hiển thị {(currentPage - 1) * pagination.perPage + 1} đến{" "}
          {Math.min(currentPage * pagination.perPage, pagination.total)} trên
          tổng {pagination.total}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Hiển thị</span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-500">Kết quả</span>
        </div>
      </div>

      <div className="flex items-center gap-2 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">{renderPageButtons()}</div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === lastPage}
          className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
