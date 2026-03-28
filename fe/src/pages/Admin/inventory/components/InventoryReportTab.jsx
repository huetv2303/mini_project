import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Boxes,
  Banknote,
  AlertTriangle,
  XCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Scale,
  RotateCcw,
} from "lucide-react";

import { fetchMonthlyReport } from "../../../../services/InventoryService";
import Pagination from "../../../../components/common/Pagination";
import toast from "react-hot-toast";
import { formatPrice } from "../../../../helper/helper";



const InventoryReportTab = () => {
  const currentDate = new Date();
  const [month, setMonth] = useState((currentDate.getMonth() + 1).toString());
  const [year, setYear] = useState(currentDate.getFullYear().toString());
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({
    totalVariants: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalImport: 0,
    totalExport: 0,
    totalAdjust: 0,
    totalReturn: 0,
  });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10,
  });

  const getReport = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetchMonthlyReport(month, year, page);
      const data = res?.data;

      setReportData(data?.items?.data || []);
      if (data?.summary) setSummary(data.summary);

      const meta = data?.items;
      if (meta) {
        setPagination({
          currentPage: meta.current_page,
          lastPage: meta.last_page,
          total: meta.total,
          perPage: meta.per_page,
        });
      }
    } catch (error) {
      toast.error("Lỗi khi tải báo cáo tháng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getReport(1);
  }, [month, year]);

  const handlePageChange = (newPage) => {
    getReport(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderStatus = (status) => {
    switch (status) {
      case "out_of_stock":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded bg-red-50 text-red-600 text-[10px] font-bold">
            Hết hàng
          </span>
        );
      case "low_stock":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded bg-yellow-50 text-yellow-600 text-[10px] font-bold">
            Sắp hết
          </span>
        );
      case "in_stock":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold">
            Còn hàng
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters & Export */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-600">
            Kỳ báo cáo:
          </span>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                Tháng {i + 1}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <button className="flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-sm">
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Xuất Excel
        </button>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">
              {summary.totalVariants}
            </div>
            <div className="text-xs font-medium text-gray-500 mt-0.5">
              Tổng biến thể
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">
              {formatPrice(summary.totalValue)}
            </div>
            <div className="text-xs font-medium text-gray-500 mt-0.5">
              Giá trị tồn kho
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">
              {summary.lowStockCount}
            </div>
            <div className="text-xs font-medium text-gray-500 mt-0.5">
              Sắp hết hàng
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">
              {summary.outOfStockCount}
            </div>
            <div className="text-xs font-medium text-gray-500 mt-0.5">
              Hết hàng
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Adjustments Cards */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4">
          Biến động trong tháng
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50/50 p-4 rounded-lg flex flex-col items-center justify-center py-6 text-center">
            <ArrowDownToLine className="w-5 h-5 text-emerald-500 mb-2" />
            <div className="text-lg font-bold text-emerald-600">
              +{summary.totalImport}
            </div>
            <div className="text-xs font-medium text-gray-500 mt-1">
              Nhập kho
            </div>
          </div>
          <div className="bg-gray-50/50 p-4 rounded-lg flex flex-col items-center justify-center py-6 text-center">
            <ArrowUpFromLine className="w-5 h-5 text-red-500 mb-2" />
            <div className="text-lg font-bold text-red-600">
              -{summary.totalExport}
            </div>
            <div className="text-xs font-medium text-gray-500 mt-1">
              Xuất kho
            </div>
          </div>
          <div className="bg-gray-50/50 p-4 rounded-lg flex flex-col items-center justify-center py-6 text-center">
            <Scale className="w-5 h-5 text-gray-500 mb-2" />
            <div className="text-lg font-bold text-gray-900">
              {summary.totalAdjust > 0
                ? `+${summary.totalAdjust}`
                : summary.totalAdjust}
            </div>
            <div className="text-xs font-medium text-gray-500 mt-1">
              Điều chỉnh
            </div>
          </div>
          <div className="bg-gray-50/50 p-4 rounded-lg flex flex-col items-center justify-center py-6 text-center">
            <RotateCcw className="w-5 h-5 text-blue-500 mb-2" />
            <div className="text-lg font-bold text-blue-600">
              +{summary.totalReturn}
            </div>
            <div className="text-xs font-medium text-gray-500 mt-1">
              Hoàn trả
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  SẢN PHẨM
                </th>
                <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  MÀU/SIZE/XUẤT XỨ
                </th>
                <th className="px-5 py-4 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  ĐẦU KỲ
                </th>
                <th className="px-5 py-4 text-center text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  NHẬP
                </th>
                <th className="px-5 py-4 text-center text-[10px] font-bold text-red-600 uppercase tracking-wider">
                  XUẤT
                </th>
                <th className="px-5 py-4 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Đ.CHỈNH
                </th>
                <th className="px-5 py-4 text-center text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                  HOÀN
                </th>
                <th className="px-5 py-4 text-center text-[10px] font-bold text-gray-900 uppercase tracking-wider">
                  CUỐI KỲ
                </th>
                <th className="px-5 py-4 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  TRẠNG THÁI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="10"
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Đang tải dữ liệu báo cáo...
                  </td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    Không có dữ liệu tồn kho.
                  </td>
                </tr>
              ) : (
                reportData.map((row) => (
                  <tr
                    key={row.sku}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-4 text-xs font-semibold text-gray-500">
                      {row.sku}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-gray-800 break-words max-w-[200px]">
                        {row.productName}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-600">
                      {row.variantDetails}
                    </td>
                    <td className="px-5 py-4 text-center text-sm font-medium text-gray-600">
                      {row.startStock}
                    </td>
                    <td className="px-5 py-4 text-center text-sm font-semibold text-emerald-500">
                      +{row.importQty}
                    </td>
                    <td className="px-5 py-4 text-center text-sm font-semibold text-red-500">
                      -{row.exportQty}
                    </td>
                    <td className="px-5 py-4 text-center text-sm font-medium text-gray-600">
                      {row.adjustQty}
                    </td>
                    <td className="px-5 py-4 text-center text-sm font-semibold text-blue-500">
                      +{row.returnQty}
                    </td>
                    <td className="px-5 py-4 text-center text-sm font-bold text-gray-900">
                      {row.endStock}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {renderStatus(row.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
          label="biến thể"
        />
      </div>
    </div>
  );
};

export default InventoryReportTab;
