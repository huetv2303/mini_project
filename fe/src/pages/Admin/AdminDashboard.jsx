import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  LayoutDashboard,
  ShieldCheck,
  Users,
  Settings,
} from "lucide-react";

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-bold tracking-widest uppercase text-xs">
              <ShieldCheck size={16} />
              Admin Portal
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Bảng Điều Khiển Quản Trị
            </h1>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 w-fit px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all font-semibold"
          >
            <ArrowLeft size={18} />
            Về trang chủ
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-8 bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/20 rounded-3xl backdrop-blur-3xl group hover:border-purple-500/40 transition-all">
            <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="text-purple-400" />
            </div>
            <div className="text-3xl font-bold mb-1">1,248</div>
            <div className="text-slate-400 text-sm font-medium">Người dùng</div>
          </div>

          <div className="p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-3xl group hover:border-blue-500/40 transition-all">
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <LayoutDashboard className="text-blue-400" />
            </div>
            <div className="text-3xl font-bold mb-1">45</div>
            <div className="text-slate-400 text-sm font-medium">
              Danh mục sản phẩm
            </div>
          </div>

          <div className="p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-3xl group hover:border-pink-500/40 transition-all">
            <div className="w-12 h-12 bg-pink-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Settings className="text-pink-400" />
            </div>
            <div className="text-3xl font-bold mb-1">99%</div>
            <div className="text-slate-400 text-sm font-medium">
              Tốc độ kết nối
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-3xl">
          <p className="text-slate-400 text-lg leading-relaxed font-medium">
            Khu vực này hiện tại chỉ dành cho người dùng có quyền{" "}
            <span className="text-white font-mono bg-white/10 px-2 py-1 rounded border border-white/10">
              quản trị hệ thống
            </span>
            . Bạn có thể xây dựng thêm các tính năng như quản trị người dùng,
            quản trị vai trò hoặc quản lý dữ liệu tại đây.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
