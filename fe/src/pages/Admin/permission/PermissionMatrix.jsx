import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePermissionStore } from "./permissionStore";
import api from "../../../api/axios";
import PermissionSaveDialog from "./PermissionSaveDialog";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";
import {
  ShieldCheck,
  Search,
  Plus,
  X,
  RotateCcw,
  Save,
  User,
  SearchCode,
  Shield,
  Users,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

export default function PermissionMatrix() {
  const {
    modules,
    isDirty,
    isLoading,
    setPermissions,
    addAdminToPermission,
    removeAdminFromPermission,
    resetChanges,
    setLoading,
  } = usePermissionStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPermission, setSelectedPermission] = useState(null); // Lưu thông tin permission đang được chọn để add user
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Danh sách toàn bộ admin/staff dùng cho bộ lọc gán quyền
  const [adminsList, setAdminsList] = useState([]);
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 1. Fetch dữ liệu ma trận quyền từ API
  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const response = await api.get("/permissions/all");
      if (response.data?.status === "success") {
        setPermissions(response.data.data);
      }
    } catch (error) {
      toast.error(
        "Lỗi khi tải ma trận phân quyền: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch danh sách Staff phục vụ cho việc chọn thành viên (Admin đã mặc định có toàn bộ quyền)
  const fetchAdmins = async () => {
    try {
      const response = await api.get("/users");
      // Chỉ lấy các tài khoản có vai trò là "staff" để gán quyền
      const allUsers = response.data?.data || response.data || [];
      const staffOnly = allUsers.filter((u) => {
        const rCode = u.role?.code || u.role_code || "";
        return rCode === "staff";
      });
      setAdminsList(staffOnly);
    } catch (error) {
      console.error("Lỗi khi tải danh sách nhân viên: ", error);
    }
  };

  useEffect(() => {
    fetchMatrix();
    fetchAdmins();
  }, []);

  // 3. Xử lý lưu thay đổi lên DB
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Chuẩn bị payload dạng [{ permission_id: number, user_ids: number[] }] từ Zustand Store
      const payload = [];
      modules.forEach((mod) => {
        mod.permissions.forEach((perm) => {
          payload.push({
            permission_id: perm.id,
            user_ids: perm.assigned_users.map((u) => u.id),
          });
        });
      });

      const response = await api.post("/permissions/assign-users", {
        assignments: payload,
      });

      if (response.data?.status === "success") {
        toast.success("Cập nhật phân quyền thành viên thành công!");
        setIsConfirmOpen(false);
        // Reset lại initial state của store để cập nhật isDirty = false
        setPermissions(modules);
      }
    } catch (error) {
      toast.error(
        "Gặp lỗi khi lưu phân quyền: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Lọc các Module và Quyền theo ô Tìm Kiếm
  const filteredModules = modules
    .map((mod) => {
      const matchedPerms = mod.permissions.filter(
        (perm) =>
          perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          perm.code.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      return { ...mod, permissions: matchedPerms };
    })
    .filter((mod) => mod.permissions.length > 0);

  // Lọc danh sách Admin trong popup selector
  const filteredAdminsInSelector = adminsList.filter(
    (adm) =>
      adm.name.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
      adm.email.toLowerCase().includes(adminSearchQuery.toLowerCase()),
  );

  // Tính tổng số lượng quyền hiện có
  const totalPermissionsCount = modules.reduce(
    (acc, m) => acc + m.permissions.length,
    0,
  );

  // Lấy danh sách duy nhất các Admin/Staff đang được gán bất kỳ quyền nào
  const activeAdminsCount = new Set(
    modules.flatMap((m) =>
      m.permissions.flatMap((p) => p.assigned_users.map((u) => u.id)),
    ),
  ).size;

  return (
    <AdminLayout>
      <div className="mb-8 animate-in fade-in duration-500 text-slate-800">
        {/* Header Panel */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Phân Quyền Quản Trị
                </h1>
              </div>
            </div>
          </div>

          {/* Stats Panel */}
          <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm self-start lg:self-center">
            <div className="flex items-center gap-3 pr-4 border-r border-slate-100">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Shield size={16} />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">
                  Tổng số quyền
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {totalPermissionsCount}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Users size={16} />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">
                  Nhân sự được gán
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {activeAdminsCount} nhân viên
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Action/Alert Bar when isDirty is true */}
        {isDirty && (
          <div className="sticky top-4 z-40 mb-6 flex items-center justify-between bg-indigo-600 text-white px-6 py-4 rounded-2xl shadow-xl shadow-indigo-100 animate-pulse-subtle border border-indigo-500/20">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <h4 className="font-semibold text-sm">
                  Bạn đang có thay đổi chưa lưu!
                </h4>
                <p className="text-xs text-indigo-100/90 mt-0.5">
                  Vui lòng rà soát lại và bấm nút Lưu để đồng bộ lên máy chủ.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={resetChanges}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-indigo-500/30 hover:bg-indigo-500/50 rounded-xl transition-all border border-indigo-400/20"
              >
                <RotateCcw size={14} />
                Hủy thay đổi
              </button>
              <button
                onClick={() => setIsConfirmOpen(true)}
                className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-white text-indigo-600 hover:bg-slate-50 rounded-xl shadow-lg transition-all"
              >
                <Save size={14} />
                Lưu thay đổi
              </button>
            </div>
          </div>
        )}

        {/* Control bar: Search permissions */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Tìm quyền theo tên hoặc mã code (e.g. products.create)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm placeholder-slate-400 shadow-sm transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Main Grid View of Modules */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-sm text-slate-500 mt-4 font-medium animate-pulse">
              Đang tải ma trận phân quyền hệ thống...
            </span>
          </div>
        ) : filteredModules.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <SearchCode size={40} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-base font-bold text-slate-700">
              Không tìm thấy quyền phù hợp
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Hãy thử gõ từ khóa khác hoặc dọn sạch bộ lọc.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredModules.map((mod) => (
              <div
                key={mod.group_name}
                className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md"
              >
                {/* Module header */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800 tracking-wide uppercase">
                    {mod.group_name}
                  </span>
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg">
                    {mod.permissions.length} quyền khả dụng
                  </span>
                </div>

                {/* Module permissions list */}
                <div className="divide-y divide-slate-100">
                  {mod.permissions.map((perm) => (
                    <div
                      key={perm.id}
                      className="px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-slate-50/40 transition-colors"
                    >
                      {/* Left: Permission Info */}
                      <div className="min-w-0 md:max-w-xs lg:max-w-sm flex-1">
                        <h4 className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                          {perm.name}
                        </h4>
                        <div className="mt-1">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-mono font-medium">
                            {perm.code}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Active Staff */}
                      <div className="flex-1 flex flex-wrap items-center gap-2">
                        {perm.assigned_users.filter(
                          (u) => (u.role_code || u.role?.code) === "staff",
                        ).length === 0 ? (
                          <span className="text-xs text-slate-400 italic">
                            Chưa gán nhân viên nào
                          </span>
                        ) : (
                          perm.assigned_users
                            .filter(
                              (u) => (u.role_code || u.role?.code) === "staff",
                            )
                            .map((user) => (
                              <div
                                key={user.id}
                                className="group/avatar relative inline-flex items-center justify-center transition-all"
                              >
                                <img
                                  className="h-7 w-7 rounded-full object-cover ring-2 ring-slate-100 group-hover/avatar:ring-indigo-200 cursor-pointer transition-all shadow-sm"
                                  src={
                                    user?.avatar ||
                                    "https://ui-avatars.com/api/?name=" +
                                      user?.name
                                  }
                                  alt={user?.name}
                                />

                                {/* CSS Tooltip hiển thị tên khi Hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-medium rounded shadow-sm opacity-0 invisible group-hover/avatar:opacity-100 group-hover/avatar:visible transition-all duration-200 whitespace-nowrap z-10 pointer-events-none">
                                  {user?.name}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                </div>
                              
                                {/* Nút Xóa (Badge) góc phải trên */}
                                <button
                                  onClick={() =>
                                    removeAdminFromPermission(perm.id, user.id)
                                  }
                                  className="absolute -top-1.5 -right-1.5 p-0.5 bg-white text-rose-500 hover:text-white hover:bg-rose-500 rounded-full shadow-sm border border-rose-100 opacity-0 invisible group-hover/avatar:opacity-100 group-hover/avatar:visible transition-all duration-200 z-10"
                                  title={`Gỡ quyền khỏi ${user.name}`}
                                >
                                  <X size={10} strokeWidth={3} />
                                </button>
                              </div>
                            ))
                        )}
                      </div>

                      {/* Right: Add Admin Button */}
                      <div className="self-end md:self-center">
                        <button
                          onClick={() => {
                            setSelectedPermission(perm);
                            setIsSelectorOpen(true);
                            setAdminSearchQuery(""); // clear search
                          }}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-100/50"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Popup Selector Modal for Selecting Admin/Staff */}
        {isSelectorOpen &&
          selectedPermission &&
          createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setIsSelectorOpen(false)}
              />
              <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all border border-slate-100 max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Gán nhân viên vào quyền
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedPermission.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsSelectorOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Admin search box */}
                <div className="my-4 relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Tìm nhân viên theo tên hoặc email..."
                    value={adminSearchQuery}
                    onChange={(e) => setAdminSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 pl-9 pr-4 py-2.5 rounded-xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs placeholder-slate-400"
                  />
                </div>

                {/* List of employees */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[30vh] max-h-[40vh]">
                  {filteredAdminsInSelector.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      Không tìm thấy quản trị viên/nhân viên nào.
                    </div>
                  ) : (
                    filteredAdminsInSelector.map((admin) => {
                      const isAlreadyAssigned =
                        selectedPermission.assigned_users.some(
                          (u) => u.id === admin.id,
                        );

                      return (
                        <div
                          key={admin.id}
                          onClick={() => {
                            if (isAlreadyAssigned) {
                              removeAdminFromPermission(
                                selectedPermission.id,
                                admin.id,
                              );
                            } else {
                              // Format lại object user đúng chuẩn lưu trữ của matrix
                              addAdminToPermission(selectedPermission.id, {
                                id: admin.id,
                                name: admin.name,
                                email: admin.email,
                                role_code:
                                  admin.role?.code ||
                                  admin.role_code ||
                                  "staff",
                              });
                            }
                            // Sau khi click ta cập nhật selectedPermission để UI phản hồi tức thời dấu checkmark
                            setSelectedPermission((prev) => {
                              const exist = prev.assigned_users.some(
                                (u) => u.id === admin.id,
                              );
                              return {
                                ...prev,
                                assigned_users: exist
                                  ? prev.assigned_users.filter(
                                      (u) => u.id !== admin.id,
                                    )
                                  : [
                                      ...prev.assigned_users,
                                      {
                                        id: admin.id,
                                        name: admin.name,
                                        email: admin.email,
                                        role_code:
                                          admin.role?.code ||
                                          admin.role_code ||
                                          "staff",
                                      },
                                    ],
                              };
                            });
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            isAlreadyAssigned
                              ? "bg-indigo-50/50 border-indigo-200/60"
                              : "border-slate-100 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-indigo-50">
                              <User size={14} />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-800">
                                {admin.name}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {admin.email}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                (admin.role?.code || admin.role_code) ===
                                "admin"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {admin.role?.code === "admin"
                                ? "Quản trị viên"
                                : "Nhân viên"}
                            </span>
                            {isAlreadyAssigned && (
                              <div className="p-0.5 bg-indigo-600 text-white rounded-full">
                                <Check size={12} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer buttons */}
                <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsSelectorOpen(false)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-100"
                  >
                    Xong
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )}

        {/* Save Confirmation Dialog detailing changes (+/- list) */}
        <PermissionSaveDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleSave}
          isLoading={isSaving}
        />
      </div>
    </AdminLayout>
  );
}
