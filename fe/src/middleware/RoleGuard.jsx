import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AlertTriangle, Loader2 } from "lucide-react";

/**
 * Middleware để kiểm tra quyền của người dùng.
 * @param {string} permission - Mã quyền (ví dụ: 'admin.manage')
 */
const RoleGuard = ({ children, permission }) => {
  const { user, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="max-w-md w-full bg-red-500/10 border border-red-500/20 p-8 rounded-3xl text-center backdrop-blur-xl">
          <div className="bg-red-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="text-red-500 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Truy cập bị từ chối
          </h2>
          <p className="text-slate-400 mb-8">
            Bạn không có quyền <strong>({permission})</strong> để truy cập khu
            vực này.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default RoleGuard;
