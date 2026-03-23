import React from "react";
import { Tag, Plus, X } from "lucide-react";

const CommonAttributesSection = ({
  formData,
  updateAttribute,
  removeAttribute,
  handleAddAttribute,
}) => {
  return (
    <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-100 shadow-lg shadow-black/5 space-y-8">
      <div className="flex items-center justify-between border-b border-gray-50 ">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
            <Tag className="w-5 h-5 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Thông số kỹ thuật (Cố định)
          </h2>
        </div>
        <button
          type="button"
          onClick={() => handleAddAttribute()}
          className="flex items-center md:text-base text-xs gap-2 px-4 py-2 text-sm bg-black text-white rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-lg"
        >
          <Plus className="w-4 h-4" /> Thêm thông số
        </button>
      </div>
      <p className="text-[10px] text-gray-600 font-medium italic">
        * Đây là những đặc tính chung của sản phẩm không đổi giữa các phiên bản.
      </p>

      {formData.attributes.length === 0 ? (
        <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-3xl">
          <p className="text-sm text-gray-400 italic">
            Chưa có thông số kỹ thuật nào.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formData.attributes.map((attr, idx) => (
            <div
              key={idx}
              className="p-2 bg-gray-50 rounded-2xl relative group shadow-lg"
            >
              <div className="flex gap-2 w-full">
                <input
                  type="text"
                  placeholder="Tên"
                  value={attr.attribute_name}
                  onChange={(e) =>
                    updateAttribute(idx, "attribute_name", e.target.value)
                  }
                  className="p-1 w-2/5 text-[1rem] outline-none border-b border-transparent focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Giá trị"
                  value={attr.attribute_value}
                  onChange={(e) =>
                    updateAttribute(idx, "attribute_value", e.target.value)
                  }
                  className="p-1 w-3/5 text-[1rem] outline-none border-b border-transparent focus:border-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={() => removeAttribute(idx)}
                className="absolute top-2 right-2 z-20 p-2 bg-white text-gray-400 hover:text-red-500 rounded-xl shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommonAttributesSection;
