import React from "react";
import { Tag, Plus, X, Sparkles } from "lucide-react";
import { ATTRIBUTE_SUGGESTIONS } from "../constants/AttributeSuggestions";

const CommonAttributesSection = ({
  formData,
  updateAttribute,
  removeAttribute,
  handleAddAttribute,
  handleBatchAddAttributes,
}) => {
  const getColorStyle = (val) => {
    const v = val.toLowerCase();
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
    return match ? map[match] : "bg-blue-50 text-blue-600 border-blue-200";
  };

  const [currentTypingValues, setCurrentTypingValues] = React.useState({});
  const [activeCategory, setActiveCategory] = React.useState(null);

  const handleSuggestionClick = (category, val) => {
    const existingIndex = formData.attributes.findIndex(
      (a) => a.attribute_name === category && a.attribute_value === val,
    );

    if (existingIndex !== -1) {
      removeAttribute(existingIndex);
    } else {
      handleAddAttribute(null, {
        attribute_name: category,
        attribute_value: val,
      });
    }
  };

  const handleValueKeyDown = (e, attrIndex) => {
    if (e.key === "Enter") {
      const val = e.target.value.trim();
      if (val) {
        e.preventDefault();
        const attrName = formData.attributes[attrIndex].attribute_name;
        handleAddAttribute(null, {
          attribute_name: attrName,
          attribute_value: "",
        });

        setTimeout(() => {
          const allInputs = document.querySelectorAll(
            ".common-attr-value-input",
          );
          const lastInput = allInputs[allInputs.length - 1];
          if (lastInput) lastInput.focus();
        }, 0);
      }
    }
  };
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
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => handleAddAttribute()}
            className="text-[11px] px-4 py-2 text-gray-500 hover:text-gray-700 font-bold transition-all"
          >
            + Thêm thuộc tính
          </button>
        </div>
      </div>

      {/* Suggestions Bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 uppercase tracking-wider mr-2">
          <Sparkles className="w-3 h-3" /> Gợi ý:
        </div>
        {ATTRIBUTE_SUGGESTIONS.map((cat) => (
          <button
            key={cat.name}
            type="button"
            onClick={() =>
              setActiveCategory(activeCategory === cat.name ? null : cat.name)
            }
            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${activeCategory === cat.name ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "bg-white border-gray-100 text-gray-400 hover:border-indigo-200 hover:text-indigo-500"}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {activeCategory && (
        <div className="flex flex-wrap gap-1.5 p-3 bg-indigo-50/30 rounded-2xl border border-indigo-100/50 animate-in fade-in zoom-in-95 duration-200 mt-2">
          {ATTRIBUTE_SUGGESTIONS.find(
            (c) => c.name === activeCategory,
          )?.values.map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => handleSuggestionClick(activeCategory, val)}
              className="px-3 py-1.5 bg-white border border-indigo-100 rounded-xl text-[11px] font-medium text-indigo-600 hover:bg-indigo-500 hover:text-white hover:scale-105 active:scale-95 transition-all shadow-sm"
            >
              + {val}
            </button>
          ))}
        </div>
      )}

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
        <div className="flex flex-col gap-4">
          {Object.entries(
            formData.attributes.reduce((acc, curr, originalIdx) => {
              if (!acc[curr.attribute_name]) acc[curr.attribute_name] = [];
              acc[curr.attribute_name].push({ ...curr, originalIdx });
              return acc;
            }, {}),
          ).map(([attrName, groupItems], gIdx) => (
            <div
              key={gIdx}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full group hover:border-emerald-500 transition-all shadow-sm w-fit"
            >
              <input
                type="text"
                placeholder="Tên"
                value={attrName}
                onChange={(e) => {
                  groupItems.forEach((item) => {
                    updateAttribute(
                      item.originalIdx,
                      "attribute_name",
                      e.target.value,
                    );
                  });
                }}
                className="w-16 text-[13px] font-bold text-gray-500 bg-transparent outline-none border-r border-gray-100 pr-1.5 placeholder:font-normal"
              />
              <div className="flex flex-wrap items-center gap-1 min-w-[100px] max-w-[400px]">
                {groupItems.map((item, tIdx) => (
                  <span
                    key={tIdx}
                    className={`${getColorStyle(item.attribute_value)} px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide flex items-center gap-1.5 border transition-all shadow-sm hover:scale-105 group/tag`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                    {item.attribute_value}
                    <button
                      type="button"
                      onClick={() => removeAttribute(item.originalIdx)}
                      className="hover:text-red-500 opacity-0 group-hover/tag:opacity-100 transition-all font-bold"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={groupItems.length > 0 ? "" : "Giá trị"}
                  value={currentTypingValues[attrName] || ""}
                  onKeyDown={(e) => {
                    if (e.key === "," || e.key === "Enter") {
                      e.preventDefault();
                      if (currentTypingValues[attrName]) {
                        handleSuggestionClick(
                          attrName,
                          currentTypingValues[attrName],
                        );
                        setCurrentTypingValues({
                          ...currentTypingValues,
                          [attrName]: "",
                        });
                      }
                    } else if (
                      e.key === "Backspace" &&
                      !currentTypingValues[attrName] &&
                      groupItems.length > 0
                    ) {
                      removeAttribute(
                        groupItems[groupItems.length - 1].originalIdx,
                      );
                    }
                  }}
                  onChange={(e) =>
                    setCurrentTypingValues({
                      ...currentTypingValues,
                      [attrName]: e.target.value,
                    })
                  }
                  className="w-20 common-attr-value-input text-[13px] text-gray-800 bg-transparent outline-none placeholder:font-normal"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  groupItems.forEach((item) =>
                    removeAttribute(item.originalIdx),
                  );
                }}
                className="p-1 text-gray-400 hover:text-red-500 rounded-full transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => handleAddAttribute()}
            className="w-8 h-8 rounded-full border-2 border-dashed border-gray-100 text-gray-400 flex items-center justify-center hover:border-emerald-500 hover:text-emerald-500 transition-all active:scale-90"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CommonAttributesSection;
