import React, { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { X } from "lucide-react";

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden relative">
      {/* Header - Nhận hàm toggle để mở menu di động */}
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Overlay mờ khi mở Sidebar trên di động */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar Container */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out bg-white border-r border-gray-200
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            w-64 h-full flex flex-col shadow-2xl lg:shadow-none
          `}
        >
          {/* Nút đóng nhanh trên di động */}
          <div className="flex items-center justify-between p-6 lg:hidden border-b border-gray-100">
            <span className="font-bold text-gray-900 text-sm">Menu</span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <Sidebar />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent bg-gray-100">
          <div className="max-w-7xl w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
