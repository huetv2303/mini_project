import React, { useState, useEffect } from "react";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";
import {
  Search,
  User,
  UserPlus,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Edit3,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Key,
} from "lucide-react";
import {
  fetchUsersRequest,
  deleteUserRequest,
  fetchRolesRequest,
  createUserRequest,
  updateUserRequest,
} from "../../../services/UserService";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import StaffFormModal from "./StaffFormModal";

const StaffListPage = () => {
  const [staffs, setStaffs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        fetchUsersRequest(),
        fetchRolesRequest(),
      ]);

      // Lọc chỉ lấy admin và staff (không lấy customer ở trang này)
      const staffList = usersRes.data.filter(
        (u) => u.role && u.role.code !== "customer",
      );
      setStaffs(staffList);

      // Chỉ lấy các role admin và staff để gán
      const staffRoles = rolesRes.data.filter((r) => r.code !== "customer");
      setRoles(staffRoles);
    } catch (error) {
      toast.error("Không thể tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa?",
      text: "Nhân viên này sẽ bị xóa khỏi hệ thống!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Xóa ngay",
      cancelButtonText: "Hủy",
      borderRadius: "16px",
    });

    if (result.isConfirmed) {
      try {
        await deleteUserRequest(id);
        toast.success("Đã xóa nhân viên thành công!");
        fetchData();
      } catch (error) {
        toast.error("Không thể xóa nhân viên này!");
      }
    }
  };

  const handleEdit = (staff) => {
    setEditingStaff(staff);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingStaff(null);
    setIsModalOpen(true);
  };

  const filteredStaffs = staffs.filter((s) => {
    return (
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.role?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <AdminLayout>
      <div className="mb-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Quản lý Nhân viên
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium italic">
              Quản lý tài khoản quản trị và nhân viên vận hành hệ thống.
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-extrabold uppercase rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/20 active:scale-95"
          >
            <UserPlus size={16} />
            Thêm nhân viên
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 mb-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="relative max-w-md">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm theo tên, email hoặc vai trò..."
              className="w-full h-11 bg-slate-50/50 border border-slate-200 rounded-xl pl-12 pr-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-slate-800 font-semibold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/30 border-b border-slate-100">
                  <th className="px-6 py-4 text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
                    Nhân viên
                  </th>
                  <th className="px-6 py-4 text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
                    Email
                  </th>
                  <th className="px-6 py-4 text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
                    Vai trò
                  </th>
                  <th className="px-6 py-4 text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest">
                    Ngày tham gia
                  </th>
                  <th className="px-6 py-4 text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr
                      key={i}
                      className="animate-pulse border-b border-slate-100"
                    >
                      <td className="px-6 py-6" colSpan="5">
                        <div className="h-10 bg-slate-50 rounded-xl"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredStaffs.length > 0 ? (
                  filteredStaffs.map((staff) => (
                    <tr
                      key={staff.id}
                      className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100/50 text-blue-600 flex items-center justify-center font-bold text-sm">
                            {staff.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {staff.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold">
                              ID: #{staff.id.toString().padStart(4, "0")}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
                          <Mail size={14} className="text-slate-300" />
                          {staff.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-tight ${
                            staff.role?.code === "admin"
                              ? "bg-rose-50 text-rose-600 border border-rose-100"
                              : "bg-blue-50 text-blue-600 border border-blue-100"
                          }`}
                        >
                          {staff.role?.name || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-semibold">
                        {staff.created_at}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(staff)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Sửa thông tin"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(staff.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Xóa nhân viên"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 text-slate-300">
                        <User size={48} strokeWidth={1} />
                        <p className="text-slate-400 text-sm font-medium">
                          Chưa có nhân viên nào trong danh sách.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <StaffFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchData();
        }}
        staff={editingStaff}
        roles={roles}
      />
    </AdminLayout>
  );
};

export default StaffListPage;
