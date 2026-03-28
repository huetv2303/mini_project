import React, { useState, useEffect } from "react";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";
import {
  Search,
  User,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Filter,
  Download,
  CheckSquare,
  Square,
  Lock,
  Unlock,
  Eye,
} from "lucide-react";
import {
  fetchCustomersRequest,
  bulkUpdateCustomerStatusRequest,
  deleteCustomerRequest,
} from "../../../services/CustomerService";
import toast from "react-hot-toast";
import { getImageUrl, formatPrice } from "../../../helper/helper";


const CustomerListPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetchCustomersRequest();
      setCustomers(response.data);
      console.log(response.data);
    } catch (error) {
      toast.error("Không thể tải danh sách khách hàng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(customers.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkStatusUpdate = async (isActive) => {
    if (selectedIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một khách hàng!");
      return;
    }

    const actionText = isActive ? "mở khóa" : "khóa";

    const result = await Swal.fire({
      title: `Xác nhận ${actionText}?`,
      text: `Bạn có chắc chắn muốn ${actionText} ${selectedIds.length} tài khoản đã chọn?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: isActive ? "#22c55e" : "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy",
      background: "#fff",
      borderRadius: "16px",
    });

    if (result.isConfirmed) {
      try {
        await bulkUpdateCustomerStatusRequest(selectedIds, isActive);
        toast.success(
          `Đã ${actionText} thành công ${selectedIds.length} khách hàng!`,
        );
        setSelectedIds([]);
        fetchCustomers();
      } catch (error) {
        toast.error("Có lỗi xảy ra khi cập nhật!");
      }
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa?",
      text: "Hành động này không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Xóa ngay",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await deleteCustomerRequest(id);
        toast.success("Đã xóa khách hàng!");
        fetchCustomers();
      } catch (error) {
        toast.error("Không thể xóa khách hàng!");
      }
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.customer_profile?.phone || "").includes(searchTerm);

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && c.customer_profile?.is_active) ||
      (filterStatus === "inactive" && !c.customer_profile?.is_active);

    return matchesSearch && matchesStatus;
  });


  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Quản lý Khách hàng
            </h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">
              Theo dõi và quản lý toàn bộ cơ sở dữ liệu khách hàng của hệ thống.
            </p>
          </div>
          {/* <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
              <Download size={18} />
              Xuất dữ liệu
            </button>
          </div> */}
        </div>

        {/* Stats Summary (Optional) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <User size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-2">
                Tổng khách hàng
              </p>
              <h3 className="text-2xl font-black text-slate-900">
                {customers.length}
              </h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-2">
                Đang hoạt động
              </p>
              <h3 className="text-2xl font-black text-slate-900">
                {customers.filter((c) => c.customer_profile?.is_active).length}
              </h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
              <ShieldAlert size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-2">
                Đang bị khóa
              </p>
              <h3 className="text-2xl font-black text-slate-900">
                {customers.filter((c) => !c.customer_profile?.is_active).length}
              </h3>
            </div>
          </div>
        </div>

        {/* Filters & Bulk Actions */}
        <div className="bg-white p-4 mb-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-4 max-w-2xl">
              <div className="relative flex-1">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Tìm theo tên, email hoặc số điện thoại..."
                  className="w-full h-12 bg-gray-50 border-none rounded-xl pl-12 pr-4 text-sm  focus:ring-2 focus:ring-black/5 transition-all outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl whitespace-nowrap overflow-x-auto">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${filterStatus === "all" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setFilterStatus("active")}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${filterStatus === "active" ? "bg-white text-green-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Hoạt động
                </button>
                <button
                  onClick={() => setFilterStatus("inactive")}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${filterStatus === "inactive" ? "bg-white text-red-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Bị khóa
                </button>
              </div>
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300 bg-black/5 p-2 rounded-xl border border-black/5">
                <span className="text-xs font-bold text-gray-700 px-2 border-r border-gray-200">
                  Đã chọn {selectedIds.length}
                </span>
                <button
                  onClick={() => handleBulkStatusUpdate(true)}
                  className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors shadow-lg shadow-gray-500/20"
                  title="Mở khóa tài khoản"
                >
                  <Unlock size={18} />
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate(false)}
                  className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors shadow-lg shadow-gray-500/20"
                  title="Khóa tài khoản"
                >
                  <Lock size={18} />
                </button>
                <button
                  className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors shadow-lg shadow-gray-500/20"
                  title="Xóa đã chọn"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-50">
                  <th className="px-6 py-4 w-12">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={
                          selectedIds.length === customers.length &&
                          customers.length > 0
                        }
                        onChange={handleSelectAll}
                      />
                      {selectedIds.length === customers.length &&
                      customers.length > 0 ? (
                        <CheckSquare size={18} className="text-black" />
                      ) : selectedIds.length > 0 ? (
                        <Square size={18} className="text-black opacity-40" />
                      ) : (
                        <Square size={18} className="text-gray-300" />
                      )}
                    </label>
                  </th>

                  <th className="px-6 py-4 text-[0.8rem] font-medium text-gray-700 uppercase tracking-widest">
                    Khách hàng
                  </th>
                  <th className="px-6 py-4 text-[0.8rem] font-medium text-gray-700 uppercase tracking-widest">
                    Liên hệ
                  </th>
                  <th className="px-6 py-4 text-[0.8rem] font-medium text-gray-700 uppercase tracking-widest">
                    Tổng chi tiêu
                  </th>
                  <th className="px-6 py-4 text-[0.8rem] font-medium text-gray-700 uppercase tracking-widest">
                    Tổng đơn hàng
                  </th>

                  <th className="px-6 py-4 text-[0.8rem] font-medium text-gray-700 uppercase tracking-widest">
                    Hạng
                  </th>
                  <th className="px-6 py-4 text-[0.8rem] font-medium text-gray-700 uppercase tracking-widest text-center">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-[0.8rem] font-medium text-gray-700 uppercase tracking-widest text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr
                      key={i}
                      className="animate-pulse border-b border-gray-50"
                    >
                      <td className="px-6 py-8" colSpan="6">
                        <div className="h-12 bg-gray-50 rounded-xl"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <td className="px-6 py-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={selectedIds.includes(customer.id)}
                            onChange={() => handleSelectOne(customer.id)}
                          />
                          {selectedIds.includes(customer.id) ? (
                            <CheckSquare size={18} className="text-black" />
                          ) : (
                            <Square
                              size={18}
                              className="text-gray-300 group-hover:text-gray-400"
                            />
                          )}
                        </label>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden ring-1 ring-gray-100">
                            {customer.avatar ? (
                              <img
                                src={getImageUrl(customer.avatar)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-black text-white text-xs font-bold">
                                {customer.name?.[0]?.toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 leading-none mb-1">
                              {customer.name}
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium">
                              ID: #{customer.id.toString().padStart(4, "0")}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                            <Mail size={14} className="text-gray-300" />
                            {customer.email}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                            <Phone size={14} className="text-gray-300" />
                            {customer.customer_profile?.phone ||
                              "Chưa cập nhật"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {formatPrice(
                          customer.customer_profile?.total_spent || 0,
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {customer.customer_profile?.total_orders || 0}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-yellow-50 text-yellow-600 text-[10px] font-bold rounded-full uppercase tracking-tight">
                          {customer.customer_profile?.loyalty_tier || "BRONZE"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {customer.customer_profile?.is_active === 1 ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-bold uppercase">
                              Hoạt động
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                            <span className="text-[10px] font-bold uppercase">
                              Bị khóa
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                            title="Xem chi tiết"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Xóa"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                          <User size={40} />
                        </div>
                        <p className="text-gray-400 text-sm font-medium">
                          Không tìm thấy khách hàng nào khớp với tìm kiếm.
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
    </AdminLayout>
  );
};

export default CustomerListPage;
