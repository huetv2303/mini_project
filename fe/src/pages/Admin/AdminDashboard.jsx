import React from "react";
import { LayoutDashboard } from "lucide-react";
import AdminLayout from "../../components/layout/Admin/AdminLayout";

const AdminDashboard = () => {
  return (
    <AdminLayout>
      {/* Dashboard Content Here */}
      <div className="flex items-center justify-between mb-8 text-gray-900">
        <h1 className="text-3xl font-bold tracking-tight">
          Tổng quan hệ thống
        </h1>
        <div className="text-sm text-gray-500">
          P-React /{" "}
          <span className="text-indigo-600 font-medium font-semibold underline-offset-4 cursor-pointer hover:text-indigo-700 transition">
            Dashboard
          </span>
        </div>
      </div>
      {/* 
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Doanh thu",
            value: "45.2Mđ",
            trend: "+12.5%",
            color: "border-blue-500 text-blue-600",
          },
          {
            label: "Đơn hàng",
            value: "382",
            trend: "+8.2%",
            color: "border-green-500 text-green-600",
          },
          {
            label: "Người dùng",
            value: "1,204",
            trend: "+18.4%",
            color: "border-purple-500 text-purple-600",
          },
          {
            label: "Sản phẩm",
            value: "85",
            trend: "-2.4%",
            color: "border-orange-500 text-orange-600",
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className={`bg-white p-6 rounded-2xl shadow-sm border-b-4 ${stat.color} hover:shadow-md transition-shadow`}
          >
            <p className="text-sm font-medium text-gray-500">
              {stat.label}
            </p>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-bold text-gray-900">
                {stat.value}
              </p>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${stat.trend.startsWith("+") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div> */}

      {/* Content area placeholder */}
      <div className="mt-8 bg-white rounded-2xl shadow-sm p-8 min-h-[400px] border border-gray-100 flex flex-col items-center justify-center text-gray-400">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <LayoutDashboard className="h-8 w-8 text-gray-300" />
        </div>
        <p className="text-lg font-medium">Bắt đầu quản lý cửa hàng của bạn</p>
        <p className="text-sm">
          Chọn một mục trong sidebar để quản lý dữ liệu chi tiết.
        </p>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
