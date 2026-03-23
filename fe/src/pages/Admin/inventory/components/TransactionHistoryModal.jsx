import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { fetchInventoryHistory } from "../../../../services/InventoryService";

const TransactionHistoryModal = ({ isOpen, onClose, product, variant }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && variant) {
      const loadHistory = async () => {
        setLoading(true);
        try {
          const res = await fetchInventoryHistory(variant.id);
          setHistory(res?.data || []);
        } catch (error) {
          console.error("Failed to load history", error);
        } finally {
          setLoading(false);
        }
      };
      loadHistory();
    }
  }, [isOpen, variant]);

  if (!isOpen || !product || !variant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Lịch sử giao dịch</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {/* Product Info Box */}
          <div className="bg-gray-50/80 rounded-lg p-5 mb-6">
            <h4 className="font-bold text-sm text-gray-900 mb-1 leading-tight">
              {product.name}
            </h4>
            <div className="text-sm text-gray-500">
              {variant?.color?.name || ""}{" "}
              {variant?.size?.name ? `/ ${variant?.size?.name}` : ""}
            </div>
          </div>

          {/* History Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    THỜI GIAN
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    LOẠI
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">
                    SL
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">
                    TRƯỚC
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">
                    SAU
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    GHI CHÚ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <span className="text-sm font-medium">
                        Đang tải biểu mẫu...
                      </span>
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      <span className="text-sm font-medium">
                        Chưa có giao dịch nào
                      </span>
                    </td>
                  </tr>
                ) : (
                  history.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-4 text-sm text-gray-600 font-medium whitespace-nowrap">
                        {new Date(record.created_at).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-4">
                        {(record.type === "out" || record.type === "adjustment") && record.quantity_change < 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider">
                            EXPORT
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                            IMPORT
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-sm font-bold ${record.quantity_change < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                           {record.quantity_change > 0 ? `+${record.quantity_change}` : record.quantity_change}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-gray-600 font-medium">
                        {record.quantity_before}
                      </td>
                      <td className="px-4 py-4 text-center text-sm font-bold text-gray-900">
                        {record.quantity_after}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {record.note || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistoryModal;
