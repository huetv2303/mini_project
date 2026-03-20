import React from "react";
import { Settings, Plus, X } from "lucide-react";
import ImageUpload from "../../../../components/common/ImageUpload";

const VariantsSection = ({
  hasVariants,
  variants,
  updateVariant,
  removeVariant,
  handleAddVariant,
  handleAddAttribute,
  updateAttribute,
  removeAttribute,
}) => {
  const formatPrice = (val) => {
    if (val === null || val === undefined || val === "") return "";
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const onPriceChange = (e, idx, field) => {
    const rawValue = e.target.value.replace(/,/g, "");
    if (!isNaN(rawValue) || rawValue === "") {
      updateVariant(idx, field, rawValue);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-100 shadow-xl shadow-black/5 space-y-8">
      <div className="flex items-center justify-between border-b border-gray-50 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-indigo-500" />
          </div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">
            {hasVariants ? "Cấu hình Biến thể" : "Giá & Kho hàng"}
          </h2>
        </div>
        {hasVariants && (
          <button
            type="button"
            onClick={handleAddVariant}
            className="p-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-all active:scale-95 shadow-lg"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-6">
        {variants.map((variant, idx) => (
          <div
            key={idx}
            className="p-4 rounded-lg border border-gray-100 bg-gray-50/30 space-y-8 relative overflow-hidden group transition-all hover:bg-white hover:shadow-2xl"
          >
            {variants.length > 1 && (
              <button
                type="button"
                onClick={() => removeVariant(idx)}
                className="absolute top-4 right-4 p-2.5 bg-white text-gray-400 hover:text-red-500 rounded-xl shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-32">
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-widest mb-2 block">
                  Ảnh riêng
                </label>
                <ImageUpload
                  images={variant.image}
                  setImages={(img) => updateVariant(idx, "image", img)}
                  multiple={false}
                  width="w-40"
                  height="h-40"
                  className="!p-0 !min-h-[128px] !rounded-2xl"
                />
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="font-bold text-xs text-gray-700">
                    Tên phân loại *
                  </label>
                  <input
                    type="text"
                    required
                    value={variant.name}
                    onChange={(e) => updateVariant(idx, "name", e.target.value)}
                    placeholder="Tên"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-xs focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-sm text-gray-700">
                    Mã SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={variant.sku}
                    onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                    placeholder="VD: LAP-001"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-xs focus:border-emerald-500 outline-none uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-sm text-gray-700">
                    Số lượng tồn kho
                  </label>
                  <input
                    type="number"
                    value={variant?.inventory.quantity}
                    onChange={(e) =>
                      updateVariant(idx, "inventory.quantity", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-xs focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-sm text-gray-700">
                    Giá bán (VND) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formatPrice(variant.price)}
                    onChange={(e) => onPriceChange(e, idx, "price")}
                    placeholder="Giá bán..."
                    className="w-full px-4 py-3 bg-white border  rounded-lg text-sm  outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-sm text-gray-700">
                    Giá niêm yết / Nhập
                  </label>
                  <input
                    type="text"
                    value={formatPrice(variant.compare_price)}
                    onChange={(e) => onPriceChange(e, idx, "compare_price")}
                    placeholder="Giá gốc..."
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-sm text-gray-700">
                    Cảnh báo hết hàng
                  </label>
                  <input
                    type="number"
                    value={variant.inventory.min_quantity}
                    onChange={(e) =>
                      updateVariant(
                        idx,
                        "inventory.min_quantity",
                        e.target.value,
                      )
                    }
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>
            </div>
            {hasVariants && (
              <div className="pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] text-gray-600 font-medium italic">
                    Biến thể riêng
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleAddAttribute(idx)}
                    className="text-xs p-1 rounded-lg text-white bg-black active:scale-95 transition-all shadow-md"
                  >
                    + Thêm thuộc tính
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {variant.attributes.map((vAttr, vIdx) => (
                    <div
                      key={vIdx}
                      className="flex items-center gap-2 p-2 bg-white border border-gray-100 rounded-lg relative group shadow-sm hover:border-emerald-200 transition-all"
                    >
                      <input
                        type="text"
                        placeholder="Tên"
                        value={vAttr.attribute_name}
                        onChange={(e) =>
                          updateAttribute(
                            vIdx,
                            "attribute_name",
                            e.target.value,
                            idx,
                          )
                        }
                        className="w-1/3 text-[1rem] outline-none border-b border-transparent focus:border-emerald-500"
                      />
                      <input
                        type="text"
                        placeholder="Giá trị"
                        value={vAttr.attribute_value}
                        onChange={(e) =>
                          updateAttribute(
                            vIdx,
                            "attribute_value",
                            e.target.value,
                            idx,
                          )
                        }
                        className="w-2/3 text-[1rem] outline-none border-b border-transparent focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeAttribute(vIdx, idx)}
                        className="absolute -top-2 -right-2 p-1.5 bg-white text-gray-400 hover:text-red-500 rounded-full shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VariantsSection;
