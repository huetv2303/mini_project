import React from "react";
import { Layers } from "lucide-react";
import toast from "react-hot-toast";

const ProductVariantToggle = ({
  hasVariants,
  setHasVariants,
  variants,
  handleAddVariant,
}) => {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-xl shadow-black/5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
          <Layers className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Nhiều phiên bản (Biến thể)?
          </h3>
          <p className="text-xs text-gray-400 font-medium">
            Sản phẩm có nhiều màu sắc, kích thước khác nhau.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          if (hasVariants && variants.length >= 2) {
            toast.error(
              "Vui lòng xóa các biến thể dư thừa trước khi tắt chế độ này",
            );
            return;
          }
          setHasVariants(!hasVariants);
          if (!hasVariants && variants.length === 0) handleAddVariant();
        }}
        className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors focus:outline-none ${hasVariants ? "bg-emerald-500" : "bg-gray-200"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hasVariants ? "translate-x-5" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
};

export default ProductVariantToggle;
