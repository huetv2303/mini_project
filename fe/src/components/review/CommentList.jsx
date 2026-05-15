import React from 'react';
import StarRating from './StarRating';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const CommentList = ({ comments }) => {
  if (!comments || comments.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <p className="text-gray-500">Chưa có đánh giá nào cho sản phẩm này.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div key={comment.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {comment.user.avatar ? (
                  <img src={comment.user.avatar} alt={comment.user.name} className="w-full h-full object-cover" />
                ) : (
                  comment.user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{comment.user.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating rating={comment.rating} size={14} />
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-400">
                    {format(new Date(comment.created_at), 'dd MMM yyyy', { locale: vi })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-gray-700 leading-relaxed italic">
            "{comment.content}"
          </div>
          
          {comment.admin_reply && (
            <div className="mt-4 ml-8 p-4 bg-gray-50 border-l-4 border-indigo-500 rounded-r-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Phản hồi từ quản trị viên
                </span>
                <span className="text-[10px] text-gray-400">
                  {format(new Date(comment.replied_at), 'dd/MM/yyyy', { locale: vi })}
                </span>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed">
                {comment.admin_reply}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CommentList;
