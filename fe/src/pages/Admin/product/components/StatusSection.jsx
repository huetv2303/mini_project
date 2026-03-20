import React from "react";
import { Settings } from "lucide-react";

const StatusSection = ({ formData, setFormData }) => {
  return (
    <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-100 shadow-xl shadow-black/5 space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
        <Settings className="w-5 h-5 text-gray-400" />
        <h3 className="text-sm font-bold text-gray-900">Thiết lập hiển thị</h3>
      </div>
      <div className="space-y-4">
        <label className="font-bold text-sm text-gray-700">
          Trạng thái phát hành
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, status: "active" })}
            className={`py-4 rounded-lg text-xs font-bold transition-all ${formData.status === "active" ? "bg-green-500 text-white shadow-lg shadow-emerald-200" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
          >
            Đang bán
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, status: "inactive" })}
            className={`py-4 rounded-lg text-xs font-bold transition-all ${formData.status === "inactive" ? "bg-red-500 text-white shadow-lg shadow-red-200" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
          >
            Ngừng bán
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusSection;
