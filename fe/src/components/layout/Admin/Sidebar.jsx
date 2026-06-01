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
  RotateCcw,
  Truck,
  Percent,
  CreditCard,
  Gift,
  MessageSquare,
  UserCheck,
  Shield,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";

const SidebarItem = ({ to, icon: Icon, label, show = true }) => {
  if (!show) return null;
  return (
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
      <span className="font-semibold text-[11px]">{label}</span>
    </NavLink>
  );
};

const SectionTitle = ({ title, show = true }) => {
  if (!show) return null;
  return (
    <div className="px-6 py-6 pb-2">
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
        {title}
      </h3>
    </div>
  );
};

const Sidebar = () => {
  const { user, hasPermission } = useAuth();
  const isAdmin = user?.role?.code === "admin";

  return (
    <div className="flex flex-col h-full bg-white scrollbar-none">
      {/* Sidebar Branding (Optional Header inside sidebar) */}
      <div className="hidden lg:flex items-center justify-center p-8 border-b border-gray-50">
        <span className="text-xl font-bold text-gray-900 tracking-wider">
          {isAdmin ? "ADMIN" : "STAFF"}
        </span>
      </div>

      <nav className="flex-1 py-4">
        <SidebarItem
          to="/admin/dashboard"
          icon={LayoutDashboard}
          label="Tổng quan"
        />

        <SectionTitle
          title="Hệ thống"
          show={
            hasPermission("orders.view") ||
            hasPermission("categories.view") ||
            hasPermission("suppliers.view") ||
            hasPermission("products.view") ||
            hasPermission("inventory.manage") ||
            hasPermission("reviews.manage") ||
            hasPermission("admin.manage") ||
            isAdmin
          }
        />
        <div className="space-y-1">
          <SidebarItem
            to="/admin/orders"
            icon={ShoppingCart}
            label="Đơn hàng"
            show={hasPermission("orders.view")}
          />
          <SidebarItem
            to="/admin/order-returns"
            icon={RotateCcw}
            label="Trả hàng"
            show={hasPermission("orders.view")}
          />
          <SidebarItem
            to="/admin/categories"
            icon={Tag}
            label="Danh mục"
            show={hasPermission("categories.view")}
          />
          <SidebarItem
            to="/admin/suppliers"
            icon={Copyright}
            label="Nhà cung cấp"
            show={hasPermission("suppliers.view")}
          />
          <SidebarItem
            to="/admin/products"
            icon={Package}
            label="Sản phẩm"
            show={hasPermission("products.view")}
          />
          <SidebarItem
            to="/admin/inventory"
            icon={Warehouse}
            label="Quản lý kho"
            show={hasPermission("inventory.manage")}
          />
          <SidebarItem
            to="/admin/reviews"
            icon={MessageSquare}
            label="Đánh giá"
            show={hasPermission("reviews.manage")}
          />
          <SidebarItem
            to="/admin/support"
            icon={MessageSquare}
            label="Tư vấn Chat"
            show={hasPermission("support.manage")}
          />

          <SectionTitle
            title="Mở rộng"
            show={
              isAdmin ||
              hasPermission("admin.manage") ||
              hasPermission("users.view") ||
              hasPermission("staff.manage")
            }
          />
          <SidebarItem
            to="/admin/promotions"
            icon={Gift}
            label="Khuyến mại"
            show={isAdmin || hasPermission("admin.manage")}
          />
          <SidebarItem
            to="/admin/customers"
            icon={Users}
            label="Khách hàng"
            show={hasPermission("users.view")}
          />
          <SidebarItem
            to="/admin/staff"
            icon={UserCheck}
            label="Nhân viên"
            show={hasPermission("staff.manage")}
          />
          <SidebarItem
            to="/admin/permissions"
            icon={Shield}
            label="Phân quyền"
            show={isAdmin}
          />

          <SectionTitle
            title="Cấu hình"
            show={isAdmin || hasPermission("admin.manage")}
          />
          <SidebarItem
            to="/admin/shipping-methods"
            icon={Truck}
            label="Vận chuyển"
            show={isAdmin || hasPermission("admin.manage")}
          />
          <SidebarItem
            to="/admin/tax-rates"
            icon={Percent}
            label="Thuế"
            show={isAdmin || hasPermission("admin.manage")}
          />
          <SidebarItem
            to="/admin/payment-methods"
            icon={CreditCard}
            label="Thanh toán"
            show={isAdmin || hasPermission("admin.manage")}
          />
        </div>
      </nav>

      {/* Sidebar Footer info */}
      <div className="p-6 border-t border-gray-50 text-center">
        <p className="text-[9px] font-bold text-gray-300 uppercase ">
          S-Admin Version 3.2
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
