import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { User, Key, LogOut, ChevronDown, Menu } from "lucide-react";
import { Link } from "react-router-dom";

const Header = ({ toggleSidebar }) => {
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-[#1a1a1a] shadow-sm border-b border-white/5 z-50">
      <div className="mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-16 md:h-20">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl lg:hidden transition-all duration-300"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-shrink-0">
              <span className=" md:text-xl sm:text-sm text-white font-black uppercase tracking-[3px] border-l-4 border-indigo-500 pl-4">
                Bảng điều khiển
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-3 focus:outline-none group px-3 py-2 rounded-full hover:bg-white/5 transition-all duration-200"
              >
                <div className="relative">
                  <img
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-gray-700 group-hover:ring-gray-500 transition-all"
                    src={
                      user?.avatar ||
                      "https://ui-avatars.com/api/?name=" + user?.name
                    }
                    alt={user?.name}
                  />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-white group-hover:text-gray-200 transition-all">
                    {user?.name}
                  </p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 py-2 z-50 transform origin-top-right transition-all duration-200">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Tài khoản
                    </p>
                    <p className="text-sm font-bold text-gray-900 truncate mt-1">
                      {user?.name}
                    </p>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/admin/profile"
                      className="group flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <User className="mr-3 h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                      <span className="font-medium">Thông tin cá nhân</span>
                    </Link>
                    <Link
                      to="/admin/change-password"
                      className="group flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <Key className="mr-3 h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                      <span className="font-medium">Đổi mật khẩu</span>
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 py-1">
                    <button
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                      className="group flex w-full items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="mr-3 h-5 w-5 text-red-500 transition-colors" />
                      <span className="font-bold">Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
