import React, { useState, useEffect } from "react";
import { Settings, Plus, X, ListPlus, Copy } from "lucide-react";
import ImageUpload from "../../../../components/common/ImageUpload";
import { ATTRIBUTE_SUGGESTIONS } from "../constants/AttributeSuggestions";

const getColorStyle = (val) => {
  const v = (val || "").toLowerCase();
  const map = {
    đỏ: "bg-red-50 text-red-600 border-red-200",
    xanh: "bg-blue-50 text-blue-600 border-blue-200",
    vàng: "bg-yellow-50 text-yellow-700 border-yellow-300",
    đen: "bg-gray-900 text-white border-gray-800",
    trắng: "bg-white text-gray-900 border-gray-300",
    xám: "bg-gray-100 text-gray-700 border-gray-300",
    tím: "bg-purple-50 text-purple-600 border-purple-200",
    hồng: "bg-pink-50 text-pink-600 border-pink-200",
    cam: "bg-orange-50 text-orange-600 border-orange-200",
    nâu: "bg-orange-950 text-white border-orange-900",
    "xanh lá": "bg-emerald-50 text-emerald-600 border-emerald-200",
  };
  const match = Object.keys(map).find((key) => v.includes(key));
  return match ? map[match] : "bg-gray-50 text-gray-600 border-gray-200";
};

const formatPrice = (val) => {
  if (val === null || val === undefined || val === "") return "";
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const VariantsSection = ({
  hasVariants,
  variants = [],
  updateVariant,
  removeVariant,
  productOptions = [],
  handleOptionsChange,
  handleBulkApply,
}) => {
  const [bulkData, setBulkData] = useState({
    price: "",
    compare_price: "",
    quantity: "",
    sku_prefix: "",
  });

  const [activeTyping, setActiveTyping] = useState({});

  const onPriceChange = (e, idx, field) => {
    const rawValue = e.target.value.replace(/,/g, "");
    if (!isNaN(rawValue) || rawValue === "") {
      updateVariant(idx, field, rawValue);
    }
  };

  const handleBulkChange = (e, field) => {
    let rawValue = e.target.value;
    if (field === "price" || field === "compare_price") {
      rawValue = rawValue.replace(/,/g, "");
      if (isNaN(rawValue)) return;
    }
    setBulkData({ ...bulkData, [field]: rawValue });
  };

  const onBulkApplyClick = () => {
    handleBulkApply(bulkData);
    setBulkData({ price: "", compare_price: "", quantity: "", sku_prefix: "" });
  };

  const addOption = () => {
    handleOptionsChange([...productOptions, { name: "", values: [] }]);
  };

  const updateOptionName = (idx, name) => {
    const newOptions = [...productOptions];
    newOptions[idx].name = name;
    handleOptionsChange(newOptions);
  };

  const removeOption = (idx) => {
    const newOptions = productOptions.filter((_, i) => i !== idx);
    handleOptionsChange(newOptions);
  };

  const handleValueKeyDown = (e, optIdx) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      const val = (activeTyping[optIdx] || "").trim();
      if (val) {
        const newOptions = [...productOptions];
        if (!newOptions[optIdx].values.includes(val)) {
          newOptions[optIdx].values.push(val);
          handleOptionsChange(newOptions);
        }
        setActiveTyping({ ...activeTyping, [optIdx]: "" });
      }
    }
  };

  const removeOptionValue = (optIdx, valIdx) => {
    const newOptions = [...productOptions];
    newOptions[optIdx].values.splice(valIdx, 1);
    handleOptionsChange(newOptions);
  };

  if (!hasVariants) {
    if (!variants || variants.length === 0) return null;
    const variant = variants[0];
    return (
      <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-100 shadow-xl shadow-black/5 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
          <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-indigo-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 uppercase">
            Giá & Kho hàng
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="font-bold text-sm text-gray-700">Mã SKU *</label>
            <input
              type="text"
              required
              value={variant.sku}
              onChange={(e) => updateVariant(0, "sku", e.target.value)}
              placeholder="VD: LAP-001"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-xs focus:border-emerald-500 outline-none uppercase"
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
              onChange={(e) => onPriceChange(e, 0, "price")}
              placeholder="Giá bán..."
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="font-bold text-sm text-gray-700">
              Giá niêm yết
            </label>
            <input
              type="text"
              value={formatPrice(variant.compare_price)}
              onChange={(e) => onPriceChange(e, 0, "compare_price")}
              placeholder="Giá gốc..."
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="font-bold text-sm text-gray-700">
              Số lượng tồn kho
            </label>
            <input
              type="number"
              value={
                variant?.inventory?.quantity !== undefined
                  ? variant.inventory.quantity
                  : ""
              }
              onChange={(e) =>
                updateVariant(0, "inventory.quantity", e.target.value)
              }
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-xs focus:border-emerald-500 outline-none"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-100 shadow-xl shadow-black/5 space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-gray-50 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-indigo-500" />
          </div>
          <h2 className="text-xl font-black text-gray-900 uppercase">
            Cấu hình Biến thể
          </h2>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-gray-800 text-sm">
          Thiết lập tuỳ chọn (Options)
        </h3>
        {(productOptions || []).map((opt, optIdx) => (
          <div
            key={optIdx}
            className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 relative group transition-all"
          >
            <button
              type="button"
              onClick={() => removeOption(optIdx)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center w-full pr-8">
              <div className="w-full md:w-1/4">
                <input
                  type="text"
                  placeholder="VD: Size/Color"
                  value={opt.name}
                  onChange={(e) => updateOptionName(optIdx, e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none "
                />
              </div>
              <div className="w-full md:w-3/4 flex flex-wrap gap-2 items-center bg-white border border-gray-200 rounded-lg p-2 min-h-[46px]">
                {opt.values.map((val, valIdx) => (
                  <span
                    key={valIdx}
                    className={`${getColorStyle(
                      val,
                    )} px-2.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 border shadow-sm`}
                  >
                    {val}
                    <button
                      type="button"
                      onClick={() => removeOptionValue(optIdx, valIdx)}
                      className="hover:text-red-500 ml-1 bg-white/50 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={
                    opt.values.length === 0
                      ? "Nhập M, L rồi bấm phẩy (,)"
                      : "..."
                  }
                  value={activeTyping[optIdx] || ""}
                  onChange={(e) =>
                    setActiveTyping({
                      ...activeTyping,
                      [optIdx]: e.target.value,
                    })
                  }
                  onKeyDown={(e) => handleValueKeyDown(e, optIdx)}
                  className="flex-1 min-w-[200px] outline-none text-sm px-2 text-gray-700 bg-transparent"
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addOption}
          className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-all px-4 py-3 border border-dashed border-indigo-200 rounded-lg bg-indigo-50/50 hover:bg-indigo-50 w-full justify-center"
        >
          <Plus className="w-4 h-4" /> Thêm tuỳ chọn khác
        </button>
      </div>

      {variants?.length > 0 &&
        productOptions?.filter((o) => o.name && o.values.length > 0).length >
          0 && <hr className="border-gray-100" />}

      {variants?.length > 0 &&
        productOptions?.filter((o) => o.name && o.values.length > 0).length >
          0 && (
          <div className="bg-indigo-50/40 border border-indigo-100 p-4 shrink-0 rounded-xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm">
              <ListPlus className="w-4 h-4" /> Cập nhật hàng loạt cho biến thể
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Tiền tố SKU (VD: SP)"
                  value={bulkData.sku_prefix}
                  onChange={(e) => handleBulkChange(e, "sku_prefix")}
                  className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-lg outline-none uppercase bg-white focus:border-indigo-400 focus:shadow-sm"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Giá bán..."
                  value={formatPrice(bulkData.price)}
                  onChange={(e) => handleBulkChange(e, "price")}
                  className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-lg outline-none bg-white focus:border-indigo-400 focus:shadow-sm"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Giá niêm yết..."
                  value={formatPrice(bulkData.compare_price)}
                  onChange={(e) => handleBulkChange(e, "compare_price")}
                  className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-lg outline-none bg-white focus:border-indigo-400 focus:shadow-sm"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Tồn kho chung..."
                  value={bulkData.quantity}
                  onChange={(e) => handleBulkChange(e, "quantity")}
                  className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-lg outline-none bg-white focus:border-indigo-400 focus:shadow-sm"
                />
              </div>
              <button
                type="button"
                onClick={onBulkApplyClick}
                className="bg-indigo-600 text-white text-xs  rounded-lg px-4 py-2 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
              >
                <Copy className="w-4 h-4 shrink-0" />{" "}
                <span className="hidden md:inline">Áp dụng số đông</span>
                <span className="md:hidden">Áp dụng</span>
              </button>
            </div>
          </div>
        )}

      {variants?.length > 0 &&
        productOptions?.filter((o) => o.name && o.values.length > 0).length >
          0 && (
          <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-sm">
            <table className="w-full text-left text-sm bg-white min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 font-bold text-gray-500 text-xs w-48 uppercase">
                    Mẫu biến thể
                  </th>
                  <th className="px-4 py-3 font-bold text-gray-500 text-xs w-32 uppercase">
                    Mã SKU
                  </th>
                  <th className="px-4 py-3 font-bold text-gray-500 text-xs w-28 uppercase">
                    Tồn kho
                  </th>
                  <th className="px-4 py-3 font-bold text-gray-500 text-xs uppercase">
                    Bán & Niêm yết (VND)
                  </th>
                  <th className="px-4 py-3 font-bold text-gray-500 text-xs w-28 text-center uppercase">
                    Hình ảnh
                  </th>
                  <th className="px-4 py-3 font-bold text-gray-500 text-xs w-16 text-center uppercase">
                    Xóa
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {variants.map((v, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="font-bold text-gray-800 text-xs mb-1.5">
                        {v.name}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {v.attributes?.map((attr, aIdx) => (
                          <span
                            key={aIdx}
                            className={`${getColorStyle(attr.attribute_value)} px-1.5 py-0.5 rounded text-[10px] font-bold border`}
                          >
                            {attr.attribute_value}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        type="text"
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-indigo-500 uppercase font-medium"
                        placeholder="VD: SP-01"
                        value={v.sku}
                        onChange={(e) =>
                          updateVariant(idx, "sku", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        type="number"
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-indigo-500 font-bold text-gray-700"
                        placeholder="0"
                        value={
                          v?.inventory?.quantity !== undefined
                            ? v.inventory.quantity
                            : ""
                        }
                        onChange={(e) =>
                          updateVariant(
                            idx,
                            "inventory.quantity",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-500 font-bold text-emerald-600 placeholder:font-normal placeholder:text-gray-300"
                          placeholder="Giá bán..."
                          value={formatPrice(v.price)}
                          onChange={(e) => onPriceChange(e, idx, "price")}
                        />
                        <input
                          type="text"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[11px] outline-none focus:border-gray-400 text-gray-400 placeholder:text-gray-300"
                          placeholder="Giá niêm yết..."
                          value={formatPrice(v.compare_price)}
                          onChange={(e) =>
                            onPriceChange(e, idx, "compare_price")
                          }
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-center flex justify-center">
                      <ImageUpload
                        images={v.image}
                        setImages={(img) => updateVariant(idx, "image", img)}
                        multiple={false}
                        width="w-14"
                        height="h-14"
                        className="!p-0 !min-h-[56px] !rounded-lg block mx-auto shrink-0 border border-gray-200"
                      />
                    </td>
                    <td className="px-4 py-3 align-middle text-center">
                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all mx-auto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
};

export default VariantsSection;
