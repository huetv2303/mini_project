import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  fetchSuppliersRequest,
  deleteSupplierRequest,
  bulkDeleteSupplierRequest,
} from "../../../services/SupplierService";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  Mail,
  Phone,
  Building2,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import ConfirmModal from "../../../components/common/ConfirmModal";
import Pagination from "../../../components/common/Pagination";

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

import { useAuth } from "../../../context/AuthContext";

const SupplierListPage = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("suppliers.manage");

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [pagination, setPagination] = useState({
    total: 0,
    lastPage: 1,
    perPage: 15,
  });

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    slug: null,
    ids: [],
    name: "",
    mode: "single",
  });

  const getSuppliers = async (page = 1, search = "", perPageCount = 15) => {
    try {
      setLoading(true);
      const res = await fetchSuppliersRequest({
        page,
        search,
        per_page: perPageCount,
      });
      const rawData = res?.data;
      const items = rawData?.data || [];
      const meta = rawData?.meta || {};

      setSuppliers(items);
      setPagination({
        currentPage: meta.current_page || 1,
        lastPage: meta.last_page || 1,
        total: meta.total || 0,
        perPage: meta.per_page || perPageCount,
      });
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
      toast.error("Không thể tải danh sách nhà cung cấp");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.lastPage) {
      getSuppliers(newPage, searchTerm, itemsPerPage);
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const debouncedSearch = useCallback(
    debounce((val, perPage) => {
      setCurrentPage(1);
      getSuppliers(1, val, perPage);
    }, 500),
    [],
  );

  useEffect(() => {
    getSuppliers(currentPage, searchTerm, itemsPerPage);
  }, [currentPage, itemsPerPage]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value, itemsPerPage);
  };

  const selectAllOnPage = () => {
    if (selectedIds.size === suppliers.length && suppliers.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(suppliers.map((s) => s.id)));
    }
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const openDeleteModal = (slug, name) => {
    setModalConfig({ isOpen: true, slug, name, mode: "single" });
  };

  const openBulkDeleteModal = () => {
    if (selectedIds.size === 0) return;
    setModalConfig({
      isOpen: true,
      ids: Array.from(selectedIds),
      name: `${selectedIds.size} nhà cung cấp`,
      mode: "bulk",
    });
  };

  const confirmAction = async () => {
    try {
      if (modalConfig.mode === "single") {
        await deleteSupplierRequest(modalConfig.slug);
        toast.success("Đã xóa nhà cung cấp");
      } else {
        await bulkDeleteSupplierRequest(modalConfig.ids);
        toast.success("Đã xóa hàng loạt thành công");
      }
      getSuppliers(currentPage, searchTerm);
    } catch (error) {
      toast.error(error.response?.data?.message || "Thao tác thất bại");
    }
  };

  return (
    <AdminLayout>
      <div className="animate-in fade-in duration-500 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              Đối tác Cung ứng
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {canManage && selectedIds.size > 0 && (
              <button
                onClick={openBulkDeleteModal}
                className="inline-flex items-center px-6 py-3 bg-rose-500 text-white text-sm font-bold rounded-xl hover:bg-rose-600 transition-all shadow-md shadow-rose-500/20 active:scale-95 animate-in slide-in-from-right-4"
              >
                <Trash2 className="w-5 h-5 mr-2" /> Xóa {selectedIds.size}
              </button>
            )}
            {canManage && (
              <Link
                to="/admin/suppliers/create"
                className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-extrabold uppercase rounded-[5px] hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/20 active:scale-95"
              >
                <Plus className="w-5 h-5 mr-2" /> Thêm NCC
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Tìm tên, email hoặc mã số thuế..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm text-slate-800 font-semibold"
              />
            </div>
            {selectedIds.size > 0 && (
              <div className="text-xs font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-5 py-3 rounded-xl border border-blue-100 animate-pulse">
                Đang chọn {selectedIds.size} nhà cung cấp
              </div>
            )}
          </div>

          <div className="">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/30 border-b border-slate-100">
                  {canManage && (
                    <th className="w-16 px-8 py-6">
                      <button
                        onClick={selectAllOnPage}
                        className="text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        {selectedIds.size === suppliers.length &&
                        suppliers.length > 0 ? (
                          <CheckSquare className="w-6 h-6 text-blue-600" />
                        ) : (
                          <Square className="w-6 h-6" />
                        )}
                      </button>
                    </th>
                  )}
                  <th className="px-6 py-6 text-[0.8rem] text-slate-400 font-bold uppercase tracking-wider">
                    Nhà cung cấp
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] text-slate-400 font-bold uppercase tracking-wider">
                    Liên hệ
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] text-slate-400 font-bold uppercase tracking-wider">
                    Trạng thái
                  </th>
                  {canManage && (
                    <th className="px-6 py-6 text-[0.8rem] text-slate-400 font-bold uppercase tracking-wider text-right">
                      Thao tác
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr
                      key={i}
                      className="animate-pulse border-b border-slate-100"
                    >
                      <td className="px-6 py-6" colSpan="5">
                        <div className="h-12 bg-slate-50 rounded-xl"></div>
                      </td>
                    </tr>
                  ))
                ) : suppliers.length > 0 ? (
                  suppliers.map((sup) => (
                    <tr
                      key={sup.id}
                      className={`border-b border-slate-100 transition-all group ${selectedIds.has(sup.id) ? "bg-blue-50/20" : "hover:bg-slate-50/50"}`}
                    >
                      {canManage && (
                        <td className="px-8 py-5">
                          <button
                            onClick={() => toggleSelect(sup.id)}
                            className="text-blue-600"
                          >
                            {selectedIds.has(sup.id) ? (
                              <CheckSquare className="w-6 h-6" />
                            ) : (
                              <Square className="w-6 h-6 text-slate-200" />
                            )}
                          </button>
                        </td>
                      )}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <img
                            src={
                              sup.image
                                ? `${import.meta.env.VITE_URL_IMAGE}/${sup.image}`
                                : "/no-image.png"
                            }
                            className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-sm transition-transform group-hover:scale-105"
                            alt={sup.name}
                          />
                          <div>
                            <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                              {sup.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-bold mt-1">
                              MST: {sup.tax_code || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1.5">
                          <div className="flex items-center text-sm text-slate-600 font-semibold">
                            <Mail className="w-3.5 h-3.5 mr-2 text-slate-300" />{" "}
                            {sup.email}
                          </div>
                          <div className="flex items-center text-sm text-slate-600 font-semibold">
                            <Phone className="w-3.5 h-3.5 mr-2 text-slate-300" />{" "}
                            {sup.phone || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase border ${sup.status === 1 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}
                        >
                          {sup.status === 1 ? "Hoạt động" : "Tạm ngưng"}
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              to={`/admin/suppliers/edit/${sup.slug}`}
                              className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            >
                              <Edit2 className="w-5 h-5" />
                            </Link>
                            <button
                              onClick={() =>
                                openDeleteModal(sup.slug, sup.name)
                              }
                              className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-24 text-center">
                      <AlertCircle className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold">
                        Không có nhà cung cấp nào.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            label="nhà cung cấp"
          />
        </div>
      </div>
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={
          modalConfig.mode === "single" ? "Xóa đối tác?" : "Xóa hàng loạt?"
        }
        message={
          modalConfig.mode === "single"
            ? `Dữ liệu về "${modalConfig.name}" sẽ biến mất vĩnh viễn.`
            : `Xóa vĩnh viễn ${selectedIds.size} nhà cung cấp đã chọn?`
        }
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={confirmAction}
      />
    </AdminLayout>
  );
};

export default SupplierListPage;
