import React from "react";
import Modal from "../../../../components/common/Modal";
import { formatPrice } from "../../../../helper/helper";

const PromotionModal = ({ isOpen, onClose, promotions = [], onSelect }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chọn chương trình khuyến mại"
      size="xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-2">
        {promotions && promotions.length > 0 ? (
          promotions.map((item) => (
            <div
              key={item.promotion.id}
              className={`relative flex flex-col p-5 bg-white border-2 border-dashed rounded-lg transition-all group overflow-hidden ${
                item.is_eligible
                  ? "border-gray-100 hover:border-indigo-200"
                  : "border-gray-100 opacity-60 grayscale-[0.5]"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div
                  className={`px-2 py-1 rounded-lg text-[12px] font-bold uppercase tracking-wider ${
                    item.is_eligible
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {item.promotion.type === "percent"
                    ? `Giảm ${item.promotion.value}%`
                    : `Giảm ${formatPrice(item.promotion.value)}`}
                </div>
                {item.is_eligible ? (
                  <button
                    onClick={() => onSelect(item.promotion)}
                    className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20"
                  >
                    Áp dụng
                  </button>
                ) : (
                  <span className="px-3 py-1.5 bg-gray-100 text-gray-400 text-[10px] font-bold rounded-lg cursor-not-allowed">
                    Chưa đủ ĐK
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">
                  {item.promotion.name}
                </h4>
                <div className="text-[10px] text-gray-500 mb-2">
                  {item.promotion.starts_at || item.promotion.expires_at ? (
                    <>
                      <span className="font-medium">Hạn dùng:</span>{" "}
                      {item.promotion.starts_at
                        ? new Date(item.promotion.starts_at).toLocaleDateString(
                            "vi-VN",
                          )
                        : "..."}
                      {" - "}
                      {item.promotion.expires_at
                        ? new Date(
                            item.promotion.expires_at,
                          ).toLocaleDateString("vi-VN")
                        : "vô thời hạn"}
                    </>
                  ) : (
                    "Không giới hạn thời gian"
                  )}
                </div>
              </div>

              <p className="text-[13px] text-gray-800 font-medium mb-3">
                Mã:{" "}
                <span
                  className={`font-bold ${item.is_eligible ? "text-indigo-500" : "text-gray-400"}`}
                >
                  {item.promotion.code}
                </span>
              </p>

              {!item.is_eligible && (
                <div className="mb-3 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-lg">
                  <p className="text-[10px] font-bold text-rose-600 leading-tight">
                    {item.reason}
                  </p>
                </div>
              )}

              <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between mb-2">
                <span className="text-[13px] font-medium text-gray-800">
                  {item.is_eligible ? "Giảm tối đa:" : "Mức giảm dự kiến:"}
                </span>
                <span
                  className={`text-sm font-black ${item.is_eligible ? "text-rose-500" : "text-gray-400"}`}
                >
                  -{formatPrice(item.discount_amount)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  {item.promotion.min_order_amount && (
                    <span className="text-xs text-gray-500">
                      Đơn tối thiểu:{" "}
                      {formatPrice(item.promotion.min_order_amount)}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {item.promotion.usage_limit
                    ? `Còn lại: ${item.promotion.usage_limit - item.promotion.used_count}`
                    : "Không giới hạn"}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-10 text-center">
            <p className="text-gray-500">Không có khuyến mại nào phù hợp</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PromotionModal;
