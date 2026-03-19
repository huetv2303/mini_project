import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Tag,
  Package,
  Users,
  Copyright,
  Warehouse,
} from "lucide-react";

const SidebarItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center px-6 py-4 text-sm font-bold transition-all duration-300 group ${
        isActive
          ? "bg-indigo-50 text-indigo-600 border-r-4 border-indigo-500"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 border-r-4 border-transparent"
      }`
    }
  >
    <Icon
      className={`mr-4 h-5 w-5 flex-shrink-0 transition-colors duration-200`}
    />
    <span className="uppercase tracking-widest text-[10px]">{label}</span>
  </NavLink>
);

const SectionTitle = ({ title }) => (
  <div className="px-6 py-6 pb-2">
    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">
      {title}
    </h3>
  </div>
);

const Sidebar = () => {
  return (
    <div className="flex flex-col h-full bg-white scrollbar-none">
      {/* Sidebar Branding (Optional Header inside sidebar) */}
      <div className="hidden lg:flex items-center justify-center p-8 border-b border-gray-50">
        <span className="text-xl font-black text-gray-900 uppercase tracking-widest border-b-2 border-black">Admin</span>
      </div>

      <nav className="flex-1 py-4">
        <SidebarItem
          to="/admin/dashboard"
          icon={LayoutDashboard}
          label="Tổng quan"
        />

        <SectionTitle title="Hệ thống" />
        <div className="space-y-1">
          <SidebarItem
            to="/admin/orders"
            icon={ShoppingCart}
            label="Đơn hàng"
          />
          <SidebarItem to="/admin/categories" icon={Tag} label="Danh mục" />
          <SidebarItem
            to="/admin/suppliers"
            icon={Copyright}
            label="Nhà cung cấp"
          />
          <SidebarItem to="/admin/products" icon={Package} label="Sản phẩm" />
          <SidebarItem to="/admin/users" icon={Users} label="Người dùng" />
          
          <SidebarItem
            to="/admin/warehouse"
            icon={Warehouse}
            label="Quản lý kho"
          />
        </div>
      </nav>
      
      {/* Sidebar Footer info */}
      <div className="p-6 border-t border-gray-50 text-center">
         <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">S-Admin Version 3.2</p>
      </div>
    </div>
  );
};

export default Sidebar;
