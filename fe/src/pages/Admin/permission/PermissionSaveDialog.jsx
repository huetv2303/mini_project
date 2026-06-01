import React from "react";
import { createPortal } from "react-dom";
import { usePermissionStore } from "./permissionStore";
import {
  X,
  CheckCircle,
  ShieldAlert,
  ArrowRight,
  UserMinus,
  UserPlus,
} from "lucide-react";

export default function PermissionSaveDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) {
  const { modules, initialModules } = usePermissionStore();

  if (!isOpen) return null;

  // Tính toán sự khác biệt giữa state hiện tại và ban đầu
  const differences = [];

  initialModules.forEach((initialMod) => {
    initialMod.permissions.forEach((initialPerm) => {
      const currentMod = modules.find(
        (m) => m.group_name === initialMod.group_name,
      );
      const currentPerm = currentMod?.permissions.find(
        (p) => p.id === initialPerm.id,
      );

      // Tìm những Admin/Staff bị gỡ quyền
      initialPerm.assigned_users.forEach((user) => {
        const isStillAssigned = currentPerm?.assigned_users.some(
          (u) => u.id === user.id,
        );
        if (!isStillAssigned) {
          differences.push({
            type: "remove",
            userName: user.name,
            email: user.email,
            roleCode: user.role_code || "staff",
            permissionName: initialPerm.name,
            permissionCode: initialPerm.code,
            groupName: initialMod.group_name,
          });
        }
      });

      // Tìm những Admin/Staff được thêm quyền mới
      currentPerm?.assigned_users.forEach((user) => {
        const wasAssigned = initialPerm.assigned_users.some(
          (u) => u.id === user.id,
        );
        if (!wasAssigned) {
          differences.push({
            type: "add",
            userName: user.name,
            email: user.email,
            roleCode: user.role_code || "staff",
            permissionName: initialPerm.name,
            permissionCode: initialPerm.code,
            groupName: initialMod.group_name,
          });
        }
      });
    });
  });

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Box */}
      <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all border border-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Xác nhận thay đổi phân quyền
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Vui lòng rà soát kỹ danh sách thay đổi quyền bên dưới
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content (Scrollable list of differences) */}
        <div className="flex-1 overflow-y-auto py-6 pr-1 space-y-4 max-h-[50vh]">
          {differences.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Không phát hiện thay đổi nào so với dữ liệu gốc.
            </div>
          ) : (
            <div className="space-y-3">
              {differences.map((diff, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all ${
                    diff.type === "add"
                      ? "bg-emerald-50/40 border-emerald-100/80 text-emerald-950"
                      : "bg-rose-50/40 border-rose-100/80 text-rose-950"
                  }`}
                >
                  <div
                    className={`mt-0.5 p-1.5 rounded-lg ${
                      diff.type === "add"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {diff.type === "add" ? (
                      <UserPlus size={16} />
                    ) : (
                      <UserMinus size={16} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800 text-sm">
                        {diff.userName}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ({diff.email})
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          diff.roleCode === "admin" || diff.roleCode === "staff"
                            ? "bg-blue-600 text-white"
                            : "bg-orange-600 text-white"
                        }`}
                      >
                        {diff.roleCode === "staff" ? "Nhân viên" : "Quản trị"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 flex-wrap">
                      <span className="font-medium text-slate-600">
                        {diff.groupName}
                      </span>
                      <ArrowRight size={12} className="text-slate-400" />
                      <span className="text-slate-700 font-semibold">
                        {diff.permissionName}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-mono">
                        {diff.permissionCode}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        diff.type === "add"
                          ? "bg-emerald-100/70 text-emerald-800"
                          : "bg-rose-100/70 text-rose-800"
                      }`}
                    >
                      {diff.type === "add" ? "+ Thêm mới" : "- Thu hồi"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || differences.length === 0}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle size={16} />
            )}
            Lưu và Cập Nhật
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
