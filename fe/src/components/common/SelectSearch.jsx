import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check, X } from "lucide-react";

/**
 * Reusable SelectSearch Component
 * @param {string} label - Tiêu đề của ô select
 * @param {Array} options - Danh sách tùy chọn: [{ value: any, label: string }]
 * @param {any} value - Giá trị hiện tại
 * @param {function} onChange - Callback khi chọn hoặc thay đổi
 * @param {string} placeholder - Nội dung hiển thị gợi ý
 */
const SelectSearch = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = "N/A",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Tìm label dựa trên value đã chọn
  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value),
  );

  // Lọc danh sách theo nội dung tìm kiếm
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Xử lý khi chọn 1 item
  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm(""); // Reset tìm kiếm
  };

  // Click ra ngoài để đóng menux
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClear = () => {
    onChange(null);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="flex flex-col space-y-2 relative" ref={dropdownRef}>
      {label && (
        <label className="text-sm font-semibold text-gray-700">{label}</label>
      )}

      {/* Ô hiển thị giá trị hiện tại */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between w-full px-4 py-3 border rounded-lg cursor-pointer transition-all outline-none
          ${isOpen ? "border-black ring-2 ring-black/5" : "border-gray-200 hover:border-gray-300 bg-white"}
        `}
      >
        <span
          className={`text-sm ${selectedOption ? "text-gray-900" : "text-gray-400"}`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-2">
          {value && (
            <X
              className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* Menu xổ xuống */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Ô input tìm kiếm */}
          <div className="p-3 border-b border-gray-50 flex items-center bg-gray-50/50">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              autoFocus
              className="w-full bg-transparent border-none outline-none text-sm placeholder:text-gray-400"
              placeholder="Tìm kiếm nhanh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <X
                className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={() => setSearchTerm("")}
              />
            )}
          </div>

          {/* Danh sách kết quả */}
          <div className="max-h-60 overflow-y-auto py-2">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className={`
                    flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors
                    ${String(option.value) === String(value) ? "bg-black text-white" : "text-gray-700 hover:bg-gray-50"}
                  `}
                >
                  <span>{option.label}</span>
                  {String(option.value) === String(value) && (
                    <Check className="w-4 h-4" />
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-gray-400 italic">
                Không tìm thấy kết quả phù hợp...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectSearch;
