import React, { useState, useEffect } from "react";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";
import {
  Search,
  User,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  CheckSquare,
  Square,
  Lock,
  Unlock,
  Eye,
  Edit,
  X,
  MapPin,
  Users,
} from "lucide-react";
import {
  fetchCustomersRequest,
  bulkUpdateCustomerStatusRequest,
  updateCustomerRequest,
} from "../../../services/CustomerService";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { getImageUrl, formatPrice } from "../../../helper/helper";

const CustomerListPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");

  // Modal States
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    gender: "Other",
    date_of_birth: "",
    image: null,
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetchCustomersRequest();
      setCustomers(response.data);
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
      setSelectedIds(filteredCustomers.map((c) => c.id));
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

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 1 ? false : true;
    const actionText = nextStatus ? "mở khóa" : "khóa";

    const result = await Swal.fire({
      title: `Xác nhận ${actionText}?`,
      text: `Bạn có chắc chắn muốn ${actionText} tài khoản khách hàng này?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: nextStatus ? "#22c55e" : "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy",
      background: "#fff",
      borderRadius: "16px",
    });

    if (result.isConfirmed) {
      try {
        await bulkUpdateCustomerStatusRequest([id], nextStatus);
        toast.success(`Đã ${actionText} thành công!`);
        fetchCustomers();
      } catch (error) {
        toast.error("Có lỗi xảy ra khi cập nhật!");
      }
    }
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Vui lòng nhập đầy đủ Tên và Email!");
      return;
    }

    try {
      let payload;
      if (formData.image) {
        // multipart/form-data
        payload = new FormData();
        payload.append("name", formData.name);
        payload.append("email", formData.email);
        if (formData.phone) payload.append("phone", formData.phone);
        if (formData.address) payload.append("address", formData.address);
        if (formData.gender) payload.append("gender", formData.gender);
        if (formData.date_of_birth)
          payload.append("date_of_birth", formData.date_of_birth);
        payload.append("image", formData.image);
      } else {
        payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          gender: formData.gender,
          date_of_birth: formData.date_of_birth,
        };
      }

      await updateCustomerRequest(selectedCustomer.id, payload);
      toast.success("Cập nhật thông tin khách hàng thành công!");
      setIsEditModalOpen(false);
      resetFormData();
      fetchCustomers();
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        "Có lỗi xảy ra khi cập nhật khách hàng!";
      toast.error(errorMsg);
    }
  };

  const resetFormData = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      gender: "Other",
      date_of_birth: "",
      image: null,
    });
    setSelectedCustomer(null);
  };

  const openViewModal = (customer) => {
    setSelectedCustomer(customer);
    setIsViewModalOpen(true);
  };

  const openEditModal = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.customer_profile?.phone || "",
      address: customer.customer_profile?.address || "",
      gender: customer.customer_profile?.gender || "Other",
      date_of_birth: customer.customer_profile?.date_of_birth || "",
      image: null,
    });
    setIsEditModalOpen(true);
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
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Users size={24} />
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
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
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
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
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
        <div className="bg-white p-4 mb-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
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
                  className="w-full h-12 bg-gray-50 border-none rounded-xl pl-12 pr-4 text-sm focus:ring-2 focus:ring-black/5 transition-all outline-none"
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
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
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
                          selectedIds.length === filteredCustomers.length &&
                          filteredCustomers.length > 0
                        }
                        onChange={handleSelectAll}
                      />
                      {selectedIds.length === filteredCustomers.length &&
                      filteredCustomers.length > 0 ? (
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
                  <th className="px-6 py-4 text-[0.8rem] font-medium text-gray-700 uppercase tracking-widest text-center">
                    Tổng chi tiêu
                  </th>
                  <th className="px-6 py-4 text-[0.8rem] font-medium text-gray-700 uppercase tracking-widest text-center">
                    Tổng đơn
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
                      <td className="px-6 py-8" colSpan="8">
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
                      <td className="px-6 py-4 text-center font-semibold text-slate-700">
                        {formatPrice(
                          customer.customer_profile?.total_spent || 0,
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-slate-600">
                        {customer.customer_profile?.total_orders || 0}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-tight">
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
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openViewModal(customer)}
                            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                            title="Xem chi tiết"
                          >
                            <Eye size={17} />
                          </button>
                          <button
                            onClick={() => openEditModal(customer)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Chỉnh sửa"
                          >
                            <Edit size={17} />
                          </button>
                          <button
                            onClick={() =>
                              handleToggleStatus(
                                customer.id,
                                customer.customer_profile?.is_active,
                              )
                            }
                            className={`p-2 rounded-lg transition-all ${
                              customer.customer_profile?.is_active === 1
                                ? "text-gray-400 hover:text-red-600 hover:bg-red-50"
                                : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                            }`}
                            title={
                              customer.customer_profile?.is_active === 1
                                ? "Khóa tài khoản"
                                : "Mở khóa tài khoản"
                            }
                          >
                            {customer.customer_profile?.is_active === 1 ? (
                              <Lock size={17} />
                            ) : (
                              <Unlock size={17} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-20 text-center">
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

      {/* --- MODAL 1: XEM CHI TIẾT --- */}
      {isViewModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-neutral-100 shadow-2xl p-8 relative mx-4 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all"
            >
              <X size={18} />
            </button>

            {/* Profile Header */}
            <div className="flex items-center gap-5 pb-6 border-b border-gray-100">
              <div className="w-16 h-16 rounded-xl bg-neutral-100 overflow-hidden ring-4 ring-neutral-50 flex-shrink-0">
                {selectedCustomer.avatar ? (
                  <img
                    src={getImageUrl(selectedCustomer.avatar)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black text-white text-xl font-black">
                    {selectedCustomer.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {selectedCustomer.name}
                </h3>
                <p className="text-xs text-gray-400 font-bold mt-0.5">
                  Mã KH: #{selectedCustomer.id.toString().padStart(4, "0")}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[9px] font-black rounded-full uppercase tracking-widest">
                    {selectedCustomer.customer_profile?.loyalty_tier ||
                      "BRONZE"}
                  </span>
                  {selectedCustomer.customer_profile?.is_active === 1 ? (
                    <span className="px-3 py-1 bg-green-50 text-green-600 text-[9px] font-black rounded-full uppercase tracking-widest">
                      Hoạt động
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-50 text-red-600 text-[9px] font-black rounded-full uppercase tracking-widest">
                      Đang khóa
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Stats */}
            <div className="grid grid-cols-2 gap-4 my-6 p-4 bg-gray-50 rounded-xl">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  Tổng chi tiêu
                </span>
                <span className="text-lg font-black text-slate-800">
                  {formatPrice(
                    selectedCustomer.customer_profile?.total_spent || 0,
                  )}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  Tổng đơn hàng
                </span>
                <span className="text-lg font-black text-slate-800">
                  {selectedCustomer.customer_profile?.total_orders || 0} Đơn
                </span>
              </div>
            </div>

            {/* General Info */}
            <div className="space-y-4 text-sm text-slate-700 font-medium">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                  <Mail size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block leading-none mb-1">
                    Email
                  </span>
                  <span>{selectedCustomer.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                  <Phone size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block leading-none mb-1">
                    Số điện thoại
                  </span>
                  <span>
                    {selectedCustomer.customer_profile?.phone ||
                      "Chưa cập nhật"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                  <MapPin size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block leading-none mb-1">
                    Địa chỉ
                  </span>
                  <span>
                    {selectedCustomer.customer_profile?.address ||
                      "Chưa cập nhật"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <User size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block leading-none mb-1">
                      Giới tính
                    </span>
                    <span>
                      {selectedCustomer.customer_profile?.gender || "Khác"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block leading-none mb-1">
                      Ngày sinh
                    </span>
                    <span>
                      {selectedCustomer.customer_profile?.date_of_birth ||
                        "Chưa cập nhật"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  openEditModal(selectedCustomer);
                }}
                className="w-full h-12 bg-black text-white hover:bg-neutral-800 rounded-xl text-sm font-semibold transition-all"
              >
                Chỉnh sửa thông tin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: CHỈNH SỬA --- */}
      {isEditModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden border border-neutral-100 shadow-2xl p-8 relative mx-4 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all"
            >
              <X size={18} />
            </button>

            <div className="mb-6">
              <h3 className="text-lg font-black text-slate-900">
                Chỉnh sửa hồ sơ
              </h3>
              <p className="text-xs text-gray-400 mt-1 font-medium">
                Thay đổi thông tin hồ sơ của khách hàng {selectedCustomer.name}.
              </p>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-4">
              {/* Avatar Upload Preview */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-gray-100">
                <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden relative flex-shrink-0">
                  {formData.image ? (
                    <img
                      src={URL.createObjectURL(formData.image)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : selectedCustomer.avatar ? (
                    <img
                      src={getImageUrl(selectedCustomer.avatar)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-black text-white text-sm font-bold">
                      {formData.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                    Ảnh đại diện
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="text-xs font-semibold text-slate-600 block file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-black file:bg-black file:text-white hover:file:bg-neutral-800 file:cursor-pointer"
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.files[0] })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập họ và tên khách hàng..."
                  className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  Địa chỉ Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                    Giới tính
                  </label>
                  <select
                    className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-3 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                  >
                    <option value="Male">Nam</option>
                    <option value="Female">Nữ</option>
                    <option value="Other">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-3 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                    value={formData.date_of_birth}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        date_of_birth: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  placeholder="Nhập số điện thoại..."
                  className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  placeholder="Nhập địa chỉ của khách hàng..."
                  className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-slate-700 font-semibold rounded-xl text-sm transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 bg-black text-white hover:bg-neutral-800 font-semibold rounded-xl text-sm transition-all shadow-sm"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default CustomerListPage;
