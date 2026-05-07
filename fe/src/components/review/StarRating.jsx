import React from 'react';
import { Star } from 'lucide-react';

/**
 * Component hiển thị sao đánh giá.
 * Hỗ trợ hiển thị sao lẻ (ví dụ 4.8 sao) bằng cách sử dụng overlay.
 */
const StarRating = ({ rating, interactive = false, onRatingChange, size = 16 }) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex gap-1">
      {stars.map((i) => {
        // Tính toán độ lấp đầy cho ngôi sao thứ i (0 to 100)
        let fillPercentage = 0;
        if (i <= rating) {
          fillPercentage = 100;
        } else if (i - 1 < rating) {
          fillPercentage = (rating - (i - 1)) * 100;
        }

        return (
          <div
            key={i}
            className={`relative ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => interactive && onRatingChange && onRatingChange(i)}
          >
            {/* Sao nền (Màu xám nhạt) */}
            <Star 
              size={size} 
              className="text-gray-300" 
              strokeWidth={1.5}
            />
            
            {/* Sao lấp đầy (Màu vàng) - Cắt theo tỉ lệ fillPercentage */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${fillPercentage}%` }}
            >
              <div style={{ width: size }}>
                <Star 
                  size={size} 
                  className="text-yellow-400 fill-yellow-400" 
                  strokeWidth={1.5}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StarRating;
