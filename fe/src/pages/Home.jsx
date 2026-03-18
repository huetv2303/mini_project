import React from "react";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
      <div className="max-w-4xl w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="space-y-4">
          <h1 className="text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 tracking-tight drop-shadow-2xl">
            CHÀO MỪNG
            <p className="text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 tracking-tight drop-shadow-2xl">
              {user?.name?.toUpperCase()}
            </p>
          </h1>
          <p className="text-xl text-slate-400 font-medium">
            Bạn đã đăng nhập thành công vào hệ thống.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6">
          <button
            onClick={logout}
            className="group relative px-8 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 rounded-2xl transition-all duration-300 font-bold overflow-hidden"
          >
            <span className="relative z-10">Đăng xuất</span>
            <div className="absolute inset-0 bg-red-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </button>

          {user?.role?.code === "admin" && (
            <a
              href="/admin"
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl transition-all duration-300 font-bold shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-1"
            >
              Trang Quản Trị
            </a>
          )}
        </div>

        <div className="pt-12 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h3 className="text-purple-400 font-bold mb-2">Tên người dùng</h3>
            <p className="text-slate-300">{user?.name}</p>
          </div>
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h3 className="text-blue-400 font-bold mb-2">Email</h3>
            <p className="text-slate-300">{user?.email}</p>
          </div>
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h3 className="text-pink-400 font-bold mb-2">Vai trò</h3>
            <p className="text-slate-300">
              {user?.role?.name || "Chưa có vai trò"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
