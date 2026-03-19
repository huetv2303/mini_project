import React from "react";
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Tag,
  Package,
  Users,
  MessageSquare,
  Copyright,
  Warehouse,
  Ticket,
  Calendar,
  Palette,
  Gauge,
} from "lucide-react";

const SidebarItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center px-6 py-3 text-sm font-medium transition-all duration-200 group ${
        isActive
          ? "bg-green-50 text-green-600 border-l-4 border-green-500"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent"
      }`
    }
  >
    <Icon
      className={`mr-4 h-5 w-5 flex-shrink-0 transition-colors duration-200 ${"group-hover:text-gray-600"}`}
    />
    <span>{label}</span>
  </NavLink>
);

const SectionTitle = ({ title }) => (
  <div className="px-6 py-4">
    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
      {title}
    </h3>
  </div>
);

const Sidebar = () => {
  return (
    <div className="flex flex-col w-64 h-full bg-white border-r border-gray-200 shadow-sm overflow-y-auto scrollbar scrollbar-thumb-gray-500">
      <nav className="flex-1 mt-4">
        <SidebarItem
          to="/admin/dashboard"
          icon={LayoutDashboard}
          label="Tổng quan"
        />

        <SectionTitle title="QUẢN LÝ" />
        <div className="space-y-1">
          <SidebarItem
            to="/admin/orders"
            icon={ShoppingCart}
            label="Đơn hàng"
          />
          <SidebarItem to="/admin/categories" icon={Tag} label="Danh mục" />
          <SidebarItem to="/admin/products" icon={Package} label="Sản phẩm" />
          <SidebarItem to="/admin/users" icon={Users} label="Người dùng" />
          <SidebarItem
            to="/admin/reviews"
            icon={MessageSquare}
            label="Bình luận & Đánh giá"
          />
          <SidebarItem
            to="/admin/brands"
            icon={Copyright}
            label="Thương hiệu"
          />
          <SidebarItem
            to="/admin/warehouse"
            icon={Warehouse}
            label="Quản lý kho"
          />
        </div>

        {/* Promotion Section */}
        <SectionTitle title="KHUYẾN MÃI" />
        <div className="space-y-1">
          <SidebarItem to="/admin/coupons" icon={Ticket} label="Mã giảm giá" />
          <SidebarItem to="/admin/events" icon={Calendar} label="Sự kiện" />
        </div>

        {/* Product Attributes Section */}
        <SectionTitle title="THUỘC TÍNH SẢN PHẨM" />
        <div className="space-y-1 pb-8">
          <SidebarItem to="/admin/colors" icon={Palette} label="Màu sắc" />
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
