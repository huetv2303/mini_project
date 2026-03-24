import React, { useMemo } from "react";
import { X, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export const checkBulkActionEligibility = (order, action, targetStatus) => {
  const terminalStates = [
    "delivered",
    "cancelled",
    "returned",
    "partially_returned",
  ];

  if (terminalStates.includes(order.status)) {
    return {
      valid: false,
      reason: "Đơn hàng đã chốt (Giao xong/Hủy/Trả hàng)",
    };
  }

  if (action === "cancel") {
    if (order.status === "shipped") {
      return { valid: false, reason: "Đơn hàng đang giao không thể hủy ngang" };
    }
  }

  if (action === "update_status") {
    if (order.status === "shipped" && targetStatus !== "delivered") {
      return {
        valid: false,
        reason: "Đơn đang giao chỉ có thể chuyển tiếp sang Đã hoàn thành",
      };
    }
  }

  return { valid: true, reason: "" };
};

const getStatusLabel = (status) => {
  const map = {
    pending: "Đặt hàng",
    processing: "Đang đóng gói",
    shipped: "Đang giao",
    delivered: "Đã hoàn thành",
    cancelled: "Đã hủy",
    returned: "Đã trả hàng",
    partially_returned: "Trả hàng một phần",
  };
  return map[status] || status;
};

const ConfirmBulkActionModal = ({
  isOpen,
  onClose,
  onConfirm,
  selectedOrders = [],
  action,
  targetStatus,
}) => {
  const [activeTab, setActiveTab] = React.useState("valid");

  const categories = useMemo(() => {
    const groups = {
      valid: [],
      shipped: [],
      delivered: [],
      cancelled: [],
      returned: [], // includes partially_returned
    };

    selectedOrders.forEach((order) => {
      const eligibility = checkBulkActionEligibility(
        order,
        action,
        targetStatus,
      );
      if (eligibility.valid) {
        groups.valid.push(order);
      } else {
        const status = order.status;
        if (status === "returned" || status === "partially_returned") {
          groups.returned.push({ order, reason: eligibility.reason });
        } else if (groups[status]) {
          groups[status].push({ order, reason: eligibility.reason });
        }
      }
    });

    return groups;
  }, [selectedOrders, action, targetStatus]);

  // Reset active tab when modal opens or selection changes
  React.useEffect(() => {
    if (isOpen) {
      if (categories.valid.length > 0) setActiveTab("valid");
      else if (categories.shipped.length > 0) setActiveTab("shipped");
      else if (categories.delivered.length > 0) setActiveTab("delivered");
      else if (categories.cancelled.length > 0) setActiveTab("cancelled");
      else if (categories.returned.length > 0) setActiveTab("returned");
    }
  }, [isOpen, categories.valid.length]);

  if (!isOpen) return null;

  const actionText =
    action === "cancel"
      ? "Hủy đơn hàng"
      : `Chuyển sang "${getStatusLabel(targetStatus)}"`;

  const tabs = [
    {
      id: "valid",
      label: "Hợp lệ",
      color: "emerald",
      count: categories.valid.length,
    },
    {
      id: "shipped",
      label: "Đang giao",
      color: "blue",
      count: categories.shipped.length,
    },
    {
      id: "delivered",
      label: "Đã hoàn thành",
      color: "rose",
      count: categories.delivered.length,
    },
    {
      id: "cancelled",
      label: "Đã hủy",
      color: "rose",
      count: categories.cancelled.length,
    },
    {
      id: "returned",
      label: "Đã trả hàng",
      color: "rose",
      count: categories.returned.length,
    },
  ].filter((tab) => tab.count > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Xác nhận Thao tác Hàng loạt
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Hành động:{" "}
              <span className="font-semibold text-blue-600">{actionText}</span>{" "}
              - Tổng {selectedOrders.length} đơn
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Header */}
        <div className="flex px-6 border-b border-gray-100 bg-white">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.id
                  ? `border-${tab.color === "emerald" ? "emerald" : tab.color}-500 text-${tab.color === "emerald" ? "emerald" : tab.color}-600`
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${
                  activeTab === tab.id
                    ? `bg-${tab.color === "emerald" ? "emerald" : tab.color}-100 text-${tab.color === "emerald" ? "emerald" : tab.color}-600`
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="p-0 min-h-[480px] overflow-y-auto custom-scrollbar flex-1 bg-gray-50/30">
          <ul className="divide-y divide-gray-100">
            {activeTab === "valid"
              ? categories.valid.map((order) => (
                  <li
                    key={order.id}
                    className="p-4 flex items-start gap-4 hover:bg-emerald-50/20 transition-colors bg-white"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[0.9rem] text-gray-900">
                          #{order.code}
                        </span>
                        <span className="text-[0.7rem] font-medium text-gray-500 border border-gray-200 px-2 py-0.5 rounded">
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <p className="text-[0.7rem] text-gray-500 mt-1">
                        {order.customer?.name} - {order.customer?.phone}
                      </p>
                    </div>
                  </li>
                ))
              : categories[activeTab].map(({ order, reason }) => (
                  <li
                    key={order.id}
                    className=" p-4 flex items-start gap-4 hover:bg-rose-50/20 transition-colors bg-white"
                  >
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[0.9rem] text-gray-900">
                          #{order.code}
                        </span>
                        <span className="text-[0.7rem] font-medium text-rose-500 border border-rose-100 bg-rose-50 px-2 py-0.5 rounded">
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <p className="text-[0.7rem] text-rose-600 mt-1">
                        {reason}
                      </p>
                      <p className="text-[0.6rem] text-gray-400 mt-0.5">
                        {order.customer?.name}
                      </p>
                    </div>
                  </li>
                ))}

            {/* Empty State */}
            {tabs.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-gray-500">Không có dữ liệu hiển thị</p>
              </div>
            )}
          </ul>
        </div>

        <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3 rounded-b-2xl shadow-inner">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => onConfirm(categories.valid.map((o) => o.id))}
            disabled={categories.valid.length === 0}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm flex items-center gap-2"
          >
            {categories.valid.length > 0 ? (
              <>Xác nhận thực hiện ({categories.valid.length} đơn)</>
            ) : (
              "Không có đơn hợp lệ"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmBulkActionModal;
