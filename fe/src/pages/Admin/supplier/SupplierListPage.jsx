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

const SupplierListPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    lastPage: 1,
    perPage: 10,
  });

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    slug: null,
    ids: [],
    name: "",
    mode: "single",
  });

  const getSuppliers = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const res = await fetchSuppliersRequest({ page, search });
      const rawData = res?.data;
      const items = rawData?.data || [];
      const meta = rawData?.meta || {};

      setSuppliers(items);
      setPagination({
        currentPage: meta.current_page,
        lastPage: meta.last_page,
        total: meta.total,
        perPage: meta.per_page,
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
      getSuppliers(newPage, searchTerm);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const debouncedSearch = useCallback(
    debounce((val) => {
      setCurrentPage(1);
      getSuppliers(1, val);
    }, 500),
    [],
  );

  useEffect(() => {
    getSuppliers(currentPage, searchTerm);
  }, [currentPage]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
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
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Đối tác Cung ứng
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <button
                onClick={openBulkDeleteModal}
                className="inline-flex items-center px-6 py-3 bg-red-500 text-white text-sm font-bold rounded-2xl hover:bg-red-600 transition-all shadow-lg active:scale-95 animate-in slide-in-from-right-4"
              >
                <Trash2 className="w-5 h-5 mr-2" /> Xóa {selectedIds.size}
              </button>
            )}
            <Link
              to="/admin/suppliers/create"
              className="inline-flex items-center px-4 py-3 bg-black text-white text-sm font-bold rounded-lg hover:bg-black/90 transition-all shadow-lg active:scale-95"
            >
              <Plus className="w-5 h-5 mr-2" /> Thêm NCC
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 shadow-2xl shadow-black/5 overflow-hidden">
          <div className="p-8 border-b border-gray-50 bg-gray-50/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Tìm tên, email hoặc mã số thuế..."
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-3xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
            {selectedIds.size > 0 && (
              <div className="text-sm font-bold text-indigo-600 bg-indigo-50/50 px-6 py-3 rounded-2xl border border-indigo-100 animate-pulse">
                Đang chọn {selectedIds.size} nhà cung cấp
              </div>
            )}
          </div>

          <div className="overflow-x-auto overflow-y-auto max-h-[480px]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="w-16 px-8 py-6">
                    <button
                      onClick={selectAllOnPage}
                      className="text-gray-400 hover:text-indigo-500 transition-colors"
                    >
                      {selectedIds.size === suppliers.length &&
                      suppliers.length > 0 ? (
                        <CheckSquare className="w-6 h-6 text-indigo-500" />
                      ) : (
                        <Square className="w-6 h-6" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] text-gray-600 uppercase    ">
                    Nhà cung cấp
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] text-gray-600 uppercase    ">
                    Liên hệ
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] text-gray-600 uppercase   ">
                    Trạng thái
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] text-gray-600 uppercase  ">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-24 text-center">
                      <Loader2 className="w-12 h-12 text-black animate-spin mx-auto mb-4" />
                      <span className="text-gray-400 font-bold text-[10px] uppercase ">
                        Đang tải nhà cung cấp...
                      </span>
                    </td>
                  </tr>
                ) : suppliers.length > 0 ? (
                  suppliers.map((sup) => (
                    <tr
                      key={sup.id}
                      className={`border-b border-gray-50 transition-all group ${selectedIds.has(sup.id) ? "bg-indigo-50/40" : "hover:bg-gray-50/50"}`}
                    >
                      <td className="px-8 py-5">
                        <button
                          onClick={() => toggleSelect(sup.id)}
                          className="text-indigo-500"
                        >
                          {selectedIds.has(sup.id) ? (
                            <CheckSquare className="w-6 h-6" />
                          ) : (
                            <Square className="w-6 h-6 text-gray-200" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <img
                            src={
                              sup.image
                                ? `${import.meta.env.VITE_URL_IMAGE}/${sup.image}`
                                : "/no-image.png"
                            }
                            className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shadow-sm transition-transform group-hover:scale-105"
                            alt={sup.name}
                          />
                          <div>
                            <div className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {sup.name}
                            </div>
                            <div className="text-[13px] text-gray-600  mt-1">
                              MST: {sup.tax_code || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1.5">
                          <div className="flex items-center text-sm text-gray-600 ">
                            <Mail className="w-3.5 h-3.5 mr-2 text-gray-400" />{" "}
                            {sup.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-600 ">
                            <Phone className="w-3.5 h-3.5 mr-2 text-gray-400" />{" "}
                            {sup.phone || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-medium uppercase  ${sup.status === 1 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}
                        >
                          {sup.status === 1 ? "Hoạt động" : "Tạm ngưng"}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/admin/suppliers/edit/${sup.slug}`}
                            className="p-2.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                          >
                            <Edit2 className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => openDeleteModal(sup.slug, sup.name)}
                            className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-24 text-center">
                      <AlertCircle className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                      <p className="text-gray-400 font-bold">
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
            label="Nhà cung cấp"
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
