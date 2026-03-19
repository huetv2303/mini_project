import React from "react";
import { AlertTriangle, X } from "lucide-react";

/**
 * ConfirmModal Component
 * @param {boolean} isOpen - Trạng thái mở/đóng
 * @param {function} onClose - Hàm đóng modal
 * @param {function} onConfirm - Hàm thực hiện khi nhấn Xác nhận
 * @param {string} title - Tiêu đề thông báo
 * @param {string} message - Nội dung chi tiết
 * @param {string} type - Loại modal: 'danger' (đỏ) hoặc 'warning' (vàng)
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận hành động",
  message = "Bạn có chắc chắn muốn thực hiện việc này?",
  type = "danger",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop mờ nền */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          {/* Icon Header */}
          <div
            className={`
            w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto
            ${type === "danger" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"}
          `}
          >
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              {message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95 translate-y-0"
            >
              Hủy bỏ
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`
                flex-1 px-6 py-4 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95
                ${type === "danger" ? "bg-black hover:bg-black/80 shadow-black/10" : "bg-black hover:bg-black/90 shadow-black/10"}
              `}
            >
              Xác nhận
            </button>
          </div>
        </div>

        {/* Nút X đóng nhanh */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ConfirmModal;
