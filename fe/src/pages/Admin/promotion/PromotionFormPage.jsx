import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tag, CalendarDays, Loader2, ArrowLeft, Search } from "lucide-react";
import toast from "react-hot-toast";
import PromotionService from "../../../services/PromotionService";
import { fetchCategoriesRequest } from "../../../services/CategoryService";
import { fetchProductsRequest } from "../../../services/ProductService";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";

const PromotionFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const [categoryTab, setCategoryTab] = useState("all");
  const [productTab, setProductTab] = useState("all");

  // Pagination & Loading states for selection
  const [productPage, setProductPage] = useState(1);
  const [isMoreProducts, setIsMoreProducts] = useState(false);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Store detailed objects of selected items to ensure they show up in 'Selected' tab
  const [selectedDetails, setSelectedDetails] = useState({
    categories: [],
    products: [],
  });

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    type: "percent",
    value: "",
    scope: "all",
    applies_to: "all",
    min_order_amount: 0,
    max_discount_amount: "",
    usage_limit: "",
    usage_limit_per_user: null,
    starts_at: "",
    expires_at: "",
    is_active: true,
    category_ids: [],
    product_ids: [],
  });

  useEffect(() => {
    if (isEditing) {
      fetchPromotion();
    }
  }, [id]);

  const fetchDetailedItems = async () => {
    // This will be called after initial render to load defaults if needed
    // or when editing
  };

  const loadProducts = async (page = 1, search = "", append = false) => {
    try {
      setIsSearchingProducts(true);
      const res = await fetchProductsRequest({
        search,
        page,
        per_page: 20,
      });
      const newProducts = res.data?.data || res.data || [];
      const pagination = res.data?.meta || res.data; // adjust based on API response structure

      setProducts((prev) => (append ? [...prev, ...newProducts] : newProducts));
      setIsMoreProducts(page < (pagination?.last_page || 1));
      setProductPage(page);
    } catch (err) {
      console.error("Error loading products", err);
    } finally {
      setIsSearchingProducts(false);
    }
  };

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const res = await fetchCategoriesRequest({ all: true });
      const allCats = res.data?.data || res.data || [];
      setCategories(allCats);
    } catch (err) {
      console.error("Error loading categories", err);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts(1, productSearch, false);
    }, 500);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const fetchPromotion = async () => {
    try {
      setLoading(true);
      const res = await PromotionService.getById(id);
      const promo = res.data?.data || res.data;

      setFormData({
        code: promo.code,
        name: promo.name,
        description: promo.description || "",
        type: promo.type,
        value: promo.value,
        scope: promo.scope,
        applies_to: promo.applies_to,
        min_order_amount: promo.min_order_amount,
        max_discount_amount: promo.max_discount_amount || "",
        usage_limit: promo.usage_limit || "",
        usage_limit_per_user: promo.usage_limit_per_user,
        starts_at: promo.starts_at ? promo.starts_at.substring(0, 16) : "",
        expires_at: promo.expires_at ? promo.expires_at.substring(0, 16) : "",
        is_active: promo.is_active,
        category_ids: promo.categories ? promo.categories.map((c) => c.id) : [],
        product_ids: promo.products ? promo.products.map((p) => p.id) : [],
      });
      setSelectedDetails({
        categories: promo.categories || [],
        products: promo.products || [],
      });
    } catch (err) {
      toast.error("Không thể tải thông tin khuyến mại");
      navigate("/admin/promotions");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (!payload.max_discount_amount) payload.max_discount_amount = null;
      if (!payload.usage_limit) payload.usage_limit = null;
      if (!payload.usage_limit_per_user) payload.usage_limit_per_user = null;

      if (isEditing) {
        await PromotionService.update(id, payload);
        toast.success("Cập nhật thành công");
      } else {
        await PromotionService.create(payload);
        toast.success("Thêm mới thành công");
      }
      navigate("/admin/promotions");
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSelection = (item, type) => {
    const listKey = type === "category" ? "category_ids" : "product_ids";
    const detailKey = type === "category" ? "categories" : "products";
    const currentList = formData[listKey];
    const itemId = item.id;

    if (currentList.includes(itemId)) {
      setFormData({
        ...formData,
        [listKey]: currentList.filter((id) => id !== itemId),
      });
      setSelectedDetails({
        ...selectedDetails,
        [detailKey]: selectedDetails[detailKey].filter((i) => i.id !== itemId),
      });
    } else {
      setFormData({ ...formData, [listKey]: [...currentList, itemId] });
      setSelectedDetails({
        ...selectedDetails,
        [detailKey]: [...selectedDetails[detailKey], item],
      });
    }
  };

  const displayCategories =
    categoryTab === "all"
      ? categories.filter((c) =>
          c.name.toLowerCase().includes(categorySearch.toLowerCase()),
        )
      : selectedDetails.categories;

  const displayProducts =
    productTab === "all" ? products : selectedDetails.products;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/admin/promotions")}
            className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all shadow-sm group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Tag className="w-6 h-6 text-indigo-500" />
              {isEditing ? "Cập Nhật Khuyến Mại" : "Tạo Khuyến Mại Mới"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Điền thông tin chi tiết chương trình khuyến mại để áp dụng cho
              khách hàng
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mã Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase font-bold text-indigo-600 transition"
                  placeholder="VD: SUMMER2026"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên Chương Trình <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3  border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  placeholder="VD: Khuyến Mại Hè"
                />
              </div>
            </div>

            <div className="flex gap-10">
              <div className="hover:cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  id="percent"
                  value="percent"
                  checked={formData.type === "percent"}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="hover:cursor-pointer"
                />
                <label htmlFor="percent"> Giảm Theo Phần Trăm (%)</label>
              </div>

              <div className="hover:cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  id="fixed"
                  value="fixed"
                  checked={formData.type === "fixed"}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="hover:cursor-pointer"
                />
                <label htmlFor="fixed"> Giảm Cố Định (VND)</label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mức Giảm <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step={formData.type === "percent" ? "1" : "any"}
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  className="w-full px-4 py-3  border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  placeholder={
                    formData.type === "percent" ? "VD: 10" : "VD: 50000"
                  }
                />
              </div>
              {formData.type === "percent" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Giảm Tối Đa{" "}
                    {formData.type === "fixed" && "(Không áp dụng cho cố định)"}
                  </label>
                  <input
                    type="number"
                    disabled={formData.type === "fixed"}
                    min="0"
                    value={formData.max_discount_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_discount_amount: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3  border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 transition"
                    placeholder="Để trống nếu không giới hạn"
                  />
                </div>
              )}
            </div>

            {/* Row 3: Scope and Channel */}
            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-indigo-900 mb-2">
                    Kênh Áp Dụng
                  </label>
                  <select
                    value={formData.applies_to}
                    onChange={(e) =>
                      setFormData({ ...formData, applies_to: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-gray-700 transition"
                  >
                    <option value="all">Tất Cả Kênh (POS + Website)</option>
                    <option value="pos">Chỉ Áp Dụng Tại POS (Cửa hàng)</option>
                    <option value="website">
                      Chỉ Áp Dụng Website (Online)
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-indigo-900 mb-2">
                    Phạm Vi Sản Phẩm
                  </label>
                  <select
                    value={formData.scope}
                    onChange={(e) =>
                      setFormData({ ...formData, scope: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-gray-700 transition"
                  >
                    <option value="all">Toàn Bộ Hệ Thống</option>
                    <option value="category">Theo Danh Mục Chỉ Định</option>
                    <option value="product">Theo Sản Phẩm Chỉ Định</option>
                  </select>
                </div>
              </div>

              {/* Scope specific selections */}
              {formData.scope === "category" && (
                <div className="mt-6 bg-white p-5 rounded-xl border border-indigo-100 shadow-sm">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Chọn Danh Mục Áp Dụng ({formData.category_ids.length} đã
                    chọn)
                  </label>

                  <div className="flex items-center gap-2 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
                    <button
                      type="button"
                      onClick={() => setCategoryTab("all")}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        categoryTab === "all"
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Tất cả ({categories.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryTab("selected")}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        categoryTab === "selected"
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Đã chọn ({formData.category_ids.length})
                    </button>
                  </div>

                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm danh mục..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2  border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="h-48 overflow-y-auto border border-gray-100 rounded-xl p-3 space-y-1 bg-gray-50/50">
                    {displayCategories.map((cat) => (
                      <label
                        key={cat.id}
                        className="flex items-center p-3 hover:bg-white rounded-lg cursor-pointer transition shadow-sm border border-transparent hover:border-gray-100"
                      >
                        <input
                          type="checkbox"
                          className="w-5 h-5 text-indigo-600 rounded border-gray-300 mr-4 cursor-pointer focus:ring-indigo-500"
                          checked={formData.category_ids.includes(cat.id)}
                          onChange={() => toggleSelection(cat, "category")}
                        />
                        <span className="text-sm text-gray-800">
                          {cat.name}
                        </span>
                      </label>
                    ))}
                    {displayCategories.length === 0 && !isLoadingCategories && (
                      <p className="text-gray-400 text-sm p-4 text-center border border-dashed rounded-lg">
                        Không tìm thấy danh mục nào
                      </p>
                    )}
                    {isLoadingCategories && (
                      <div className="flex justify-center p-4">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {formData.scope === "product" && (
                <div className="mt-6 bg-white p-5 rounded-xl border border-indigo-100 shadow-sm">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Chọn Sản Phẩm Áp Dụng ({formData.product_ids.length} đã
                    chọn)
                  </label>

                  <div className="flex items-center gap-2 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
                    <button
                      type="button"
                      onClick={() => setProductTab("all")}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        productTab === "all"
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Tất cả ({products.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductTab("selected")}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        productTab === "selected"
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Đã chọn ({formData.product_ids.length})
                    </button>
                  </div>

                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm sản phẩm (mã, tên)..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2  border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="h-64 overflow-y-auto border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50/50">
                    {displayProducts.map((prod) => (
                      <label
                        key={prod.id}
                        className="flex items-center p-3 hover:bg-white rounded-lg cursor-pointer transition shadow-sm border border-transparent hover:border-gray-100"
                      >
                        <input
                          type="checkbox"
                          className="w-5 h-5 text-indigo-600 rounded border-gray-300 mr-4 cursor-pointer focus:ring-indigo-500"
                          checked={formData.product_ids.includes(prod.id)}
                          onChange={() => toggleSelection(prod, "product")}
                        />
                        <div className="flex items-center gap-4">
                          <img
                            src={
                              prod.feature_image || "https://placehold.co/60x60"
                            }
                            alt=""
                            className="w-12 h-12 rounded-lg border border-gray-100 object-cover"
                          />
                          <div>
                            <span className="text-sm text-gray-800 line-clamp-1 block">
                              {prod.name}
                            </span>
                            <span className="text-xs text-gray-500 mt-0.5 block">
                              MÃ SP: {prod.code || prod.id}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                    {productTab === "all" && isMoreProducts && (
                      <button
                        type="button"
                        onClick={() =>
                          loadProducts(productPage + 1, productSearch, true)
                        }
                        className="w-full py-2 text-sm font-bold text-indigo-600 hover:bg-white rounded-lg transition"
                      >
                        Tải thêm sản phẩm...
                      </button>
                    )}
                    {displayProducts.length === 0 && !isSearchingProducts && (
                      <p className="text-gray-400 text-sm p-4 text-center border border-dashed rounded-lg">
                        Không tìm thấy sản phẩm nào
                      </p>
                    )}
                    {isSearchingProducts && (
                      <div className="flex justify-center p-4">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Row 4: Constraints */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Đơn Tối Thiểu
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.min_order_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_order_amount: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3  border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  placeholder="0đ"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Giới Hạn Lượt Dùng (Tổng)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.usage_limit}
                  onChange={(e) =>
                    setFormData({ ...formData, usage_limit: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  placeholder="Để trống nếu không giới hạn"
                />
                <div className="flex items-center gap-3 mt-3 p-3 bg-indigo-50/30 rounded-lg border border-indigo-100/50">
                  <input
                    type="checkbox"
                    id="usage_limit_per_user"
                    checked={formData.usage_limit_per_user === 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usage_limit_per_user: e.target.checked ? 1 : null,
                      })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 cursor-pointer focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="usage_limit_per_user"
                    className="text-sm font-bold text-indigo-900 cursor-pointer select-none"
                  >
                    Mỗi khách hàng chỉ được sử dụng mã này 1 lần duy nhất
                  </label>
                </div>
              </div>
            </div>

            {/* Row 5: Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ngày Bắt Đầu
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) =>
                      setFormData({ ...formData, starts_at: e.target.value })
                    }
                    className="w-full pl-11 pr-4 py-3  border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ngày Kết Thúc
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) =>
                      setFormData({ ...formData, expires_at: e.target.value })
                    }
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 mt-4">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="w-5 h-5 rounded border-gray-300 text-indigo-600 cursor-pointer focus:ring-indigo-500"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-bold text-gray-800 cursor-pointer select-none"
              >
                Bật / Tắt Khuyến Mại Này
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-8 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate("/admin/promotions")}
                className="px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 inline-flex items-center"
              >
                {submitting && (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                )}
                {isEditing ? "Lưu Cập Nhật" : "Tạo Mã Mới"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default PromotionFormPage;
