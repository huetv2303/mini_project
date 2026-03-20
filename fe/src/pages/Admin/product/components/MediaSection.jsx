import React from "react";
import ImageUpload from "../../../../components/common/ImageUpload";

const MediaSection = ({
  featureImage,
  setFeatureImage,
  galleryImages,
  setGalleryImages,
  showLabel = true,
}) => {
  return (
    <div className="space-y-8">
      {/* <ImageUpload
        label={showLabel ? "Ảnh đại diện (Bìa)" : ""}
        images={featureImage}
        setImages={setFeatureImage}
        multiple={false}
        width="w-40"
        height="h-40"
      /> */}
      <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-xl shadow-black/5">
        <ImageUpload
          label={showLabel ? "Thư viện ảnh khác" : ""}
          images={galleryImages}
          setImages={setGalleryImages}
          multiple={true}
        />
        <p className="mt-4 text-[10px] text-gray-400 italic">
          Bạn có thể chọn nhiều ảnh để làm bộ sưu tập.
        </p>
      </div>
    </div>
  );
};

export default MediaSection;
