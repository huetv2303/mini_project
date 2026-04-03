import React from "react";
import { Loader2, Truck, CheckCircle, XCircle, RotateCcw, Clock } from "lucide-react";

export const getOrderStatusStyle = (status) => {
  switch (status) {
    case "pending":
      return {
        bg: "bg-amber-50",
        text: "text-amber-600",
        border: "border-amber-100",
        icon: <Clock className="w-3 h-3 mr-1" />,
        label: "Chờ xử lý",
      };
    case "processing":
      return {
        bg: "bg-blue-50",
        text: "text-blue-600",
        border: "border-blue-100",
        icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" />,
        label: "Đang đóng gói",
      };
    case "shipped":
      return {
        bg: "bg-indigo-50",
        text: "text-indigo-600",
        border: "border-indigo-100",
        icon: <Truck className="w-3 h-3 mr-1" />,
        label: "Đang giao",
      };
    case "delivered":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        border: "border-emerald-100",
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
        label: "Đã giao",
      };
    case "cancelled":
      return {
        bg: "bg-rose-50",
        text: "text-rose-600",
        border: "border-rose-100",
        icon: <XCircle className="w-3 h-3 mr-1" />,
        label: "Đã hủy",
      };
    case "returned":
      return {
        bg: "bg-purple-50",
        text: "text-purple-600",
        border: "border-purple-100",
        icon: <RotateCcw className="w-3 h-3 mr-1" />,
        label: "Đã trả hàng",
      };
    case "partially_returned":
      return {
        bg: "bg-pink-50",
        text: "text-pink-600",
        border: "border-pink-100",
        icon: <RotateCcw className="w-3 h-3 mr-1" />,
        label: "Trả hàng một phần",
      };
    default:
      return {
        bg: "bg-gray-50",
        text: "text-gray-600",
        border: "border-gray-100",
        icon: null,
        label: status,
      };
  }
};

export const getPaymentStatusStyle = (status) => {
  switch (status) {
    case "paid":
      return {
        bg: "bg-emerald-50 text-emerald-600 border-emerald-100",
        dot: "bg-emerald-500",
        label: "Đã thanh toán",
      };
    case "unpaid":
      return {
        bg: "bg-rose-50 text-rose-600 border-rose-100",
        dot: "bg-rose-500",
        label: "Chưa thanh toán",
      };
    case "partially_paid":
      return {
        bg: "bg-amber-50 text-amber-600 border-amber-100",
        dot: "bg-amber-500",
        label: "Thanh toán 1 phần",
      };
    case "refunded":
      return {
        bg: "bg-blue-50 text-blue-600 border-blue-100",
        dot: "bg-blue-500",
        label: "Đã hoàn tiền",
      };
    case "partially_refunded":
      return {
        bg: "bg-indigo-50 text-indigo-600 border-indigo-100",
        dot: "bg-indigo-500",
        label: "Hoàn tiền 1 phần",
      };
    default:
      return {
        bg: "bg-gray-50 text-gray-600 border-gray-100",
        dot: "bg-gray-400",
        label: status,
      };
  }
};

export const getReturnStatusTag = (status) => {
  switch (status) {
    case "returning":
      return {
        label: "Đang trả hàng",
        bg: "bg-amber-50",
        text: "text-amber-600",
        border: "border-amber-100",
      };
    case "completed":
      return {
        label: "Lưu trữ",
        bg: "bg-gray-50",
        text: "text-gray-600",
        border: "border-gray-100",
      };
    case "cancelled":
      return {
        label: "Đã hủy",
        bg: "bg-rose-50",
        text: "text-rose-600",
        border: "border-rose-100",
      };
    default:
      return {
        label: status,
        bg: "bg-gray-50",
        text: "text-gray-600",
        border: "border-gray-100",
      };
  }
};

export const getReceiveStatusTag = (status) => {
  switch (status) {
    case "pending":
      return {
        label: "Chưa nhận hàng",
        bg: "bg-amber-50",
        text: "text-amber-600",
        border: "border-amber-100",
      };
    case "received":
      return {
        label: "Đã nhận hàng",
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        border: "border-emerald-100",
      };
    default:
      return {
        label: status,
        bg: "bg-gray-50",
        text: "text-gray-600",
        border: "border-gray-100",
      };
  }
};

export const getRefundStatusTag = (status) => {
  switch (status) {
    case "pending":
      return {
        label: "Chưa hoàn tiền",
        bg: "bg-amber-50",
        text: "text-amber-600",
        border: "border-amber-100",
      };
    case "refunded":
      return {
        label: "Đã hoàn tiền",
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        border: "border-emerald-100",
      };
    case "not_needed":
      return {
        label: "Không cần hoàn tiền",
        bg: "bg-gray-50",
        text: "text-gray-600",
        border: "border-gray-100",
      };
    default:
      return {
        label: status,
        bg: "bg-gray-50",
        text: "text-gray-600",
        border: "border-gray-100",
      };
  }
};

export const getOrderSourceStyle = (source) => {
  switch (source) {
    case "web":
      return {
        bg: "bg-blue-50",
        text: "text-blue-600",
        border: "border-blue-100",
        label: "Website",
      };
    case "pos":
      return {
        bg: "bg-purple-50",
        text: "text-purple-600",
        border: "border-purple-100",
        label: "Tại quầy (POS)",
      };
    default:
      return {
        bg: "bg-gray-50",
        text: "text-gray-600",
        border: "border-gray-100",
        label: source,
      };
  }
};

export const OrderStatusBadge = ({ status, className = "" }) => {
  const style = getOrderStatusStyle(status);
  return (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-2 ${style.text.replace("text-", "bg-")}`}
      ></span>
      {style.label}
    </div>
  );
};

export const PaymentStatusBadge = ({ status, className = "" }) => {
  const pStyle = getPaymentStatusStyle(status);
  return (
    <div
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${pStyle.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${pStyle.dot}`}></span>
      {pStyle.label}
    </div>
  );
};

export const OrderSourceBadge = ({ source, className = "" }) => {
  const style = getOrderSourceStyle(source);
  return (
    <div
      className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      {style.label}
    </div>
  );
};

export const ReturnStatusBadge = ({ status, className = "" }) => {
  const tag = getReturnStatusTag(status);
  return (
    <div
      className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${tag.bg} ${tag.text} ${tag.border} ${className}`}
    >
      {tag.label}
    </div>
  );
};

export const ReceiveStatusBadge = ({ status, className = "" }) => {
  const tag = getReceiveStatusTag(status);
  return (
    <div
      className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${tag.bg} ${tag.text} ${tag.border} ${className}`}
    >
      {tag.label}
    </div>
  );
};

export const RefundStatusBadge = ({ status, className = "" }) => {
  const tag = getRefundStatusTag(status);
  return (
    <div
      className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${tag.bg} ${tag.text} ${tag.border} ${className}`}
    >
      {tag.label}
    </div>
  );
};
