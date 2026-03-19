import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

const AdminLayout = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Header - Full Width at Top */}
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Below Header */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
