import React from "react";
import { Info, Tag, ImageIcon } from "lucide-react";

const ProductFormTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "general", label: "Thông tin chung", icon: Info },
    { id: "attributes", label: "Thông số & Biến thể", icon: Tag },
    { id: "media", label: "Hình ảnh & Media", icon: ImageIcon },
  ];

  return (
    <div className="flex gap-2 p-1.5 bg-gray-100/50 backdrop-blur-md rounded-2xl w-fit mb-8 border border-white/50 shadow-inner">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? "bg-white text-black shadow-lg scale-105"
                : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
            }`}
          >
            <Icon
              className={`w-4 h-4 ${activeTab === tab.id ? "text-indigo-500" : ""}`}
            />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default ProductFormTabs;
