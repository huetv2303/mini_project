import React, { useRef } from "react";
import { Plus, X, Image as ImageIcon } from "lucide-react";

const ImageUpload = ({ label, images, setImages, multiple = false }) => {
  const fileInputRef = useRef(null);

  // Xử lý khi chọn file
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (multiple) {
      const newImages = files.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setImages((prev) =>
        Array.isArray(prev) ? [...prev, ...newImages] : [...newImages],
      );
    } else {
      // Chế độ 1 ảnh: Ghi đè
      const file = files[0];
      setImages({
        file,
        preview: URL.createObjectURL(file),
      });
    }
    e.target.value = "";
  };

  // Xóa ảnh
  const removeImage = (index) => {
    if (multiple) {
      setImages((prev) => {
        if (!Array.isArray(prev)) return [];
        const updated = [...prev];
        URL.revokeObjectURL(updated[index].preview);
        updated.splice(index, 1);
        return updated;
      });
    } else {
      URL.revokeObjectURL(images.preview);
      setImages(null);
    }
  };

  const triggerInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">{label}</h2>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple={multiple}
        accept="image/*"
        className="hidden"
      />

      {/* Grid hiển thị ảnh */}
      <div className="flex flex-wrap gap-4">
        {/* Render danh sách ảnh đã chọn */}
        {multiple
          ? Array.isArray(images) &&
            images.map((img, index) => (
              <div
                key={index}
                className="relative group w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-gray-100 shadow-sm"
              >
                <img
                  src={img.preview}
                  alt={`preview-${index}`}
                  className="w-full h-full object-cover"
                />
                {/* Overlay cho ảnh đầu tiên (Ảnh đại diện) */}
                {index === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] py-1 text-center font-medium">
                    Ảnh đại diện
                  </div>
                )}
                {/* Nút xóa */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 bg-white/90 backdrop-blur-sm text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))
          : images && (
              <div className="relative group w-full aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <img
                  src={images.preview}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage()}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm text-red-500 rounded-full hover:bg-white transition-all shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

        {/* Nút thêm ảnh (Chỉ hiện nếu multiple hoặc chưa có ảnh single) */}
        {(multiple || !images) && (
          <button
            type="button"
            onClick={triggerInput}
            className={`
              flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/10 transition-all group/btn
              ${multiple ? "w-24 h-24 sm:w-28 sm:h-28" : "w-80 h-80"}
            `}
          >
            <Plus className="w-6 h-6 text-gray-400 group-hover/btn:text-blue-500 transition-colors" />
            {!multiple && (
              <div className="mt-2 text-center px-4">
                <p className="text-xs font-medium text-gray-500">
                  <span className="text-blue-600">Tải từ thiết bị</span>
                </p>
              </div>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
