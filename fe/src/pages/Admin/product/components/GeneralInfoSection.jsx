import React from "react";
import { Package } from "lucide-react";
import SelectSearch from "../../../../components/common/SelectSearch";

const GeneralInfoSection = ({
  formData,
  setFormData,
  isEdit,
  hasVariants,
  variants,
  updateVariant,
  categories,
  suppliers,
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
    <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-100 shadow-lg shadow-black/5 space-y-8 transition-all hover:shadow-2xl hover:shadow-black/5">
      <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
        <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
          <Package className="w-5 h-5 text-indigo-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Thông tin định danh</h2>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-2">
          <label className="font-bold text-sm text-gray-700">
            Tên sản phẩm *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nhập tên sản phẩm..."
            className="w-full px-4 py-4 bg-gray-50/50 outline-none border border-gray-100 rounded-lg focus:border-black focus:bg-white transition-all text-sm  text-gray-900 shadow-sm"
          />
          <p className="text-[10px] text-gray-600 font-bold leading-relaxed italic">
            Hệ thống sẽ tự động tạo URL thân thiện (Slug) dựa trên tên sản phẩm
            của bạn.
          </p>
        </div>

        {isEdit && !hasVariants && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-gray-50/50 p-6 rounded-3xl border border-dashed border-gray-200">
            <div className="space-y-2">
              <label className="font-bold text-sm text-gray-700">Mã SKU</label>
              <input
                type="text"
                value={variants[0]?.sku}
                onChange={(e) => updateVariant(0, "sku", e.target.value)}
                placeholder="SKU sản phẩm..."
                className="w-full px-4 py-3 bg-white outline-none border border-gray-100 rounded-2xl focus:border-black transition-all text-sm font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="font-bold text-sm text-gray-700">
                Giá bán (VNĐ) *
              </label>
              <input
                type="text"
                value={formatPrice(variants[0]?.price)}
                onChange={(e) => onPriceChange(e, 0, "price")}
                placeholder="Giá bán..."
                className="w-full px-4 py-3 bg-white outline-none border border-gray-100 rounded-2xl focus:border-black transition-all text-sm font-bold text-emerald-600"
              />
            </div>
            <div className="space-y-2">
              <label className="font-bold text-sm text-gray-700">
                Giá niêm yết (VNĐ)
              </label>
              <input
                type="text"
                value={formatPrice(variants[0]?.compare_price)}
                onChange={(e) => onPriceChange(e, 0, "compare_price")}
                placeholder="Giá niêm yết..."
                className="w-full px-4 py-3 bg-white outline-none border border-gray-100 rounded-2xl focus:border-black transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="font-bold text-sm text-gray-700">
                Số lượng tồn kho *
              </label>
              <input
                type="number"
                value={variants[0]?.inventory?.quantity ?? 0}
                onChange={(e) =>
                  updateVariant(0, "inventory.quantity", e.target.value)
                }
                placeholder="0"
                className="w-full px-4 py-3 bg-white outline-none border border-gray-100 rounded-2xl focus:border-black transition-all text-sm font-bold text-indigo-600"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectSearch
            label="Danh mục sản phẩm"
            placeholder="Chọn phân loại"
            options={
              Array.isArray(categories)
                ? categories.map((c) => ({ value: c.id, label: c.name }))
                : []
            }
            value={formData.category_id}
            onChange={(v) => setFormData({ ...formData, category_id: v })}
          />
          <SelectSearch
            label="Nhà cung cấp"
            placeholder="Chọn đối tác"
            options={
              Array.isArray(suppliers)
                ? suppliers.map((s) => ({ value: s.id, label: s.name }))
                : []
            }
            value={formData.supplier_id}
            onChange={(v) => setFormData({ ...formData, supplier_id: v })}
          />
        </div>

        <div className="space-y-2">
          <label className="font-bold text-sm text-gray-700">Mô tả ngắn</label>
          <textarea
            rows="3"
            value={formData.short_description}
            onChange={(e) =>
              setFormData({ ...formData, short_description: e.target.value })
            }
            placeholder="Tóm tắt những điểm nổi bật nhất..."
            className="w-full px-6 py-4 bg-gray-50/50 outline-none border border-gray-100 rounded-lg focus:border-black focus:bg-white transition-all text-sm font-medium text-gray-600 resize-none shadow-sm"
          />
        </div>

        <div className="space-y-4">
          <label className="font-bold text-sm text-gray-700">
            Mô tả chi tiết
          </label>
          <textarea
            rows="6"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Thông số kỹ thuật, bảo hành, chi tiết cấu tạo..."
            className="w-full px-6 py-4 bg-gray-50/50 outline-none border border-gray-100 rounded-lg focus:border-black focus:bg-white transition-all text-sm font-medium text-gray-600 shadow-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default GeneralInfoSection;
