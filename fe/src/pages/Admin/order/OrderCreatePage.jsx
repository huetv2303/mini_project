import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";
import {
  Search,
  Plus,
  Trash2,
  Package,
  User,
  CreditCard,
  Save,
  Loader2,
  ArrowLeft,
  Minus,
  ShoppingCart,
  Check,
  AlertCircle,
  Phone,
  MapPin,
} from "lucide-react";
import { fetchProductsRequest } from "../../../services/ProductService";
import { fetchPaymentMethodsRequest } from "../../../services/PaymentService";
import { createOrderRequest } from "../../../services/OrderService";
import ShippingMethodService from "../../../services/ShippingMethodService";
import TaxRateService from "../../../services/TaxRateService";
import toast from "react-hot-toast";
import { formatPrice } from "./OrderListPage";
import SelectSearch from "../../../components/common/SelectSearch";

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

const OrderCreatePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Products search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Order state
  const [selectedItems, setSelectedItems] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState(null);
  const [shippingFee, setShippingFee] = useState(0);
  const [taxRates, setTaxRates] = useState([]);
  const [selectedTaxRate, setSelectedTaxRate] = useState(null);
  const [taxAmount, setTaxAmount] = useState(0);
  const [note, setNote] = useState("");
  // Customer state
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    const loadInitData = async () => {
      try {
        const [paymentRes, shippingRes, taxRes] = await Promise.all([
          fetchPaymentMethodsRequest(),
          ShippingMethodService.getActive(),
          TaxRateService.getActive(),
        ]);

        setPaymentMethods(paymentRes.data || []);
        setShippingMethods(shippingRes.data || []);
        setTaxRates(taxRes.data || []);
      } catch (error) {
        console.error("Failed to load init data", error);
      }
    };
    loadInitData();
  }, []);

  const handleShippingChange = (methodId) => {
    setSelectedShippingMethod(methodId);
    const method = shippingMethods.find((m) => m.id == methodId);
    setShippingFee(method ? Number(method.cost) : 0);
  };

  const searchProducts = async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const res = await fetchProductsRequest({ search: term, per_page: 10 });
      // structure: { status, data: { data: [...] } }
      setSearchResults(res.data?.data || []);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((val) => searchProducts(val), 500),
    [],
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  };

  const addItemToOrder = (product, variant) => {
    const existingIndex = selectedItems.findIndex(
      (item) => item.product_variant_id === variant.id,
    );

    if (existingIndex > -1) {
      const newItems = [...selectedItems];
      newItems[existingIndex].quantity += 1;
      setSelectedItems(newItems);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          product_id: product.id,
          product_variant_id: variant.id,
          product_name: product.name,
          variant_name: variant.name,
          sku: variant.sku,
          price: variant.price,
          quantity: 1,
          image: product.images?.[0]?.url,
        },
      ]);
    }
    toast.success(`Đã thêm ${product.name} - ${variant.name}`);
    setSearchTerm("");
    setSearchResults([]);
  };

  const updateQuantity = (index, delta) => {
    const newItems = [...selectedItems];
    const newQty = newItems[index].quantity + delta;
    if (newQty > 0) {
      newItems[index].quantity = newQty;
      setSelectedItems(newItems);
    }
  };

  const removeItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return selectedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  };

  const calculateTax = () => {
    if (!selectedTaxRate) return 0;
    const taxRate = taxRates.find((t) => t.id == selectedTaxRate);
    if (!taxRate) return 0;
    return (
      (calculateSubtotal() - Number(discountAmount)) * (taxRate.rate / 100)
    );
  };

  const calculateTotal = () => {
    return Math.max(
      0,
      calculateSubtotal() +
        Number(shippingFee) +
        calculateTax() -
        Number(discountAmount),
    );
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      return toast.error("Vui lòng chọn ít nhất 1 sản phẩm");
    }
    if (!customer.name || !customer.phone || !customer.address) {
      return toast.error("Vui lòng nhập đầy đủ thông tin khách hàng");
    }
    if (!selectedPaymentMethod) {
      return toast.error("Vui lòng chọn hình thức thanh toán");
    }
    if (!selectedShippingMethod) {
      return toast.error("Vui lòng chọn phương thức vận chuyển");
    }

    try {
      setSubmitting(true);
      const orderData = {
        items: selectedItems.map((item) => ({
          product_variant_id: item.product_variant_id,
          quantity: item.quantity,
        })),
        discount_amount: discountAmount,
        payment_method_id: selectedPaymentMethod,
        shipping_method_id: selectedShippingMethod,
        note: note,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_address: customer.address,
        tax_rate_id: selectedTaxRate,
      };

      const res = await createOrderRequest(orderData);
      toast.success("Lên đơn hàng thành công!");
      navigate(`/admin/orders/${res.data.id}`);
    } catch (error) {
      console.error("Failed to create order", error);
      toast.error(error.response?.data?.message || "Lỗi khi tạo đơn hàng");
    } finally {
      setSubmitting(false);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return "/no-image.png";
    if (path.startsWith("http")) return path;
    const url = (
      import.meta.env.VITE_URL_IMAGE || "http://localhost:8000/storage"
    ).replace(/\/$/, "");
    return `${url}/${path.replace(/^\//, "")}`;
  };

  return (
    <AdminLayout>
      <div className="pb-20 max-w-[1400px] mx-auto text-left">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/admin/orders"
              className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all shadow-sm group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-gray-900">
                Lên đơn hàng mới
              </h1>
              <p className="text-xs text-gray-400 font-medium">
                Tạo vận đơn trực tiếp cho khách hàng
              </p>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={submitting || selectedItems.length === 0}
            className="inline-flex items-center px-4 py-4  text-sm font-bold bg-blue-600 text-white rounded-lg shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            XÁC NHẬN LÊN ĐƠN
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Customer & Items */}
          <div className="lg:col-span-8 space-y-8">
            {/* Product Search */}
            <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm relative z-20">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Nhập tên sản phẩm hoặc mã SKU..."
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none text-sm outline-none "
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}

                {/* Search Results Dropdown */}
                {(searchResults.length > 0 || (searchTerm && !isSearching)) &&
                  searchTerm.length >= 1 && (
                    <div className="absolute top-full left-0 w-full mt-4 bg-white border border-gray-100 rounded-lg shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                      {searchResults.length > 0 ? (
                        <div className="max-h-[400px] overflow-y-auto">
                          {searchResults.map((product) => (
                            <div
                              key={product.id}
                              className="p-4 border-b border-gray-50 last:border-0"
                            >
                              {product.status === "active" && (
                                <>
                                  <div className="flex items-center gap-4 mb-2">
                                    <img
                                      src={getImageUrl(
                                        product.images?.[0]?.url,
                                      )}
                                      className="w-12 h-12 rounded-xl object-cover border border-gray-100"
                                      alt={product.name}
                                    />
                                    <span className="font-bold text-gray-900 text-sm">
                                      {product.name}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-16">
                                    {product.variants?.map((variant) => {
                                      const isOutOfStock =
                                        variant.inventory?.quantity -
                                          (variant.inventory?.reserved || 0) <=
                                        0;

                                      return (
                                        <button
                                          key={variant.id}
                                          onClick={() =>
                                            addItemToOrder(product, variant)
                                          }
                                          disabled={isOutOfStock}
                                          className={`flex items-center justify-between p-3 rounded-xl transition-all group ${
                                            isOutOfStock
                                              ? "bg-gray-200 cursor-not-allowed opacity-60"
                                              : " hover:bg-blue-50 "
                                          }`}
                                        >
                                          <div className="text-left">
                                            <div className="flex items-center gap-2">
                                              <p
                                                className={`text-[0.9rem] uppercase opacity-70 ${!isOutOfStock && "group-hover:opacity-100"}`}
                                              >
                                                {variant.name || "Default"}
                                              </p>
                                            </div>

                                            <p className="text-xs font-bold ">
                                              {formatPrice(variant.price)}
                                            </p>
                                            <div className="flex items-center gap-2 pt-1">
                                              <span className="text-xs">
                                                Có thể bán:{" "}
                                              </span>
                                              <span
                                                className={`text-xs ${
                                                  variant.inventory?.quantity <
                                                  variant.inventory
                                                    ?.min_quantity
                                                    ? "text-yellow-600"
                                                    : isOutOfStock
                                                      ? "text-red-600"
                                                      : "text-green-600"
                                                } font-medium`}
                                              >
                                                {variant.inventory?.quantity -
                                                  (variant.inventory
                                                    ?.reserved || 0)}
                                              </span>
                                            </div>
                                          </div>

                                          <Plus
                                            className={`w-4 h-4 ${isOutOfStock ? "opacity-30" : ""}`}
                                          />
                                        </button>
                                      );
                                    })}
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        !isSearching && (
                          <div className="p-12 text-center text-gray-400">
                            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-bold italic">
                              Không tìm thấy sản phẩm phù hợp
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}
              </div>
            </div>

            {/* Selected Items Table */}
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden ">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase  flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Giỏ hàng
                </h3>
                <span className="text-[12px] bg-black text-white px-3 py-1 rounded-full font-bold">
                  {selectedItems.length} MỤC
                </span>
              </div>
              <div className="overflow-y-auto max-h-[400px]">
                {selectedItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/50">
                          <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase text-left">
                            Sản phẩm
                          </th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-center">
                            Số lượng
                          </th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-right">
                            Giá
                          </th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-right">
                            Tổng
                          </th>
                          <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase text-right w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItems.map((item, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-50 group"
                          >
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <img
                                  src={getImageUrl(item.image)}
                                  className="w-12 h-12 rounded-xl object-cover"
                                />
                                <div>
                                  <p className="font-bold text-gray-900 text-sm">
                                    {item.product_name}
                                  </p>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase">
                                    {item.variant_name} | {item.sku}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center justify-center gap-3">
                                <button
                                  onClick={() => updateQuantity(index, -1)}
                                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="font-black text-sm w-4 text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(index, 1)}
                                  className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-right  text-xs">
                              {formatPrice(item.price)}
                            </td>
                            <td className="px-6 py-5 text-right font-bold text-gray-900  text-sm">
                              {formatPrice(item.price * item.quantity)}
                            </td>
                            <td className="px-8 py-5 text-right">
                              <button
                                onClick={() => removeItem(index)}
                                className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-32 text-gray-300">
                    <ShoppingCart className="w-16 h-16 mb-4 opacity-10" />
                    <p className="text-sm font-bold italic">
                      Chưa có sản phẩm nào được chọn
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className=" rounded-lg p-8 shadow-2xl shadow-black/20 bg-white">
              <div className="space-y-4">
                <div className="flex justify-between items-center opacity-60">
                  <span className="text-[12px] font-bold uppercase ">
                    Tạm tính
                  </span>
                  <span className=" text-sm">
                    {formatPrice(calculateSubtotal())}
                  </span>
                </div>
                {shippingFee > 0 && (
                  <>
                    <div className="flex justify-between items-center opacity-60">
                      <span className="text-[12px] font-bold uppercase ">
                        Phí vận chuyển
                      </span>
                      <span className=" text-sm text-indigo-500">
                        {formatPrice(shippingFee)}
                      </span>
                    </div>
                    {selectedShippingMethod && (
                      <div className="flex justify-between items-center opacity-60">
                        <span className="text-[12px] font-bold uppercase ">
                          Dự kiến giao
                        </span>
                        <span className=" text-sm text-gray-900 italic">
                          {(() => {
                            const method = shippingMethods.find(
                              (m) => m.id == selectedShippingMethod,
                            );
                            if (!method) return "";
                            const start = new Date();
                            start.setDate(start.getDate() + 1);
                            const end = new Date();
                            end.setDate(
                              end.getDate() + Number(method.estimated_days),
                            );
                            const options = {
                              day: "2-digit",
                              month: "2-digit",
                            };
                            return `${start.toLocaleDateString("vi-VN", options)} - ${end.toLocaleDateString("vi-VN", options)}`;
                          })()}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between items-center text-rose-400">
                  <span className="text-[12px] font-bold uppercase ">
                    Giảm giá
                  </span>
                  <span className=" text-sm">
                    -{formatPrice(discountAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center opacity-60">
                  <span className="text-[12px] font-bold uppercase ">Thuế</span>
                  <span className=" text-sm text-gray-900">
                    {formatPrice(calculateTax())}
                  </span>
                </div>
                <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase  opacity-70">
                    TỔNG CỘNG
                  </span>
                  <span className="text-xl font-black italic">
                    {formatPrice(calculateTotal())}
                  </span>
                </div>
              </div>

              <div className="mt-8 p-4 rounded-2xl border border-red-300 bg-red-50 flex gap-3 ">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-[10px] font-bold leading-relaxed">
                  Vui lòng kiểm tra kỹ tồn kho và thông tin khách hàng trước khi
                  xác nhận lên đơn.
                </p>
              </div>
            </div>
          </div>
          {/* Right Column: Customer Info & Summary */}
          <div className="lg:col-span-4 space-y-8">
            {/* Customer Form */}
            <div className="bg-white rounded-lg border border-gray-100 p-8 shadow-sm">
              <h3 className="text-sm font-bold uppercase  flex items-center gap-2 mb-8">
                <User className="w-4 h-4" />
                Khách hàng
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[12px] font-bold text-gray-600 uppercase  mb-2 block">
                    Tên khách hàng
                  </label>
                  <div className="relative">
                    <input
                      value={customer.name}
                      onChange={(e) =>
                        setCustomer({ ...customer, name: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-4 bg-gray-50 rounded-lg text-sm outline-none "
                      placeholder="Nhập tên..."
                    />
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  </div>
                </div>
                <div>
                  <label className="text-[12px] font-bold text-gray-600 uppercase  mb-2 block">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <input
                      value={customer.phone}
                      onChange={(e) =>
                        setCustomer({ ...customer, phone: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-4 bg-gray-50 rounded-lg text-sm outline-none "
                      placeholder="09xxxx..."
                    />
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  </div>
                </div>
                <div>
                  <label className="text-[12px] font-bold text-gray-600 uppercase  mb-2 block">
                    Địa chỉ nhận hàng
                  </label>
                  <div className="relative">
                    <textarea
                      value={customer.address}
                      onChange={(e) =>
                        setCustomer({ ...customer, address: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-4 bg-gray-50 rounded-lg text-sm outline-none "
                      placeholder="Địa chỉ cụ thể..."
                    />
                    <MapPin className="absolute left-4 top-6 w-4 h-4 text-gray-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment & Discount */}
            <div className="bg-white rounded-lg border border-gray-100 p-8 shadow-sm ">
              <h3 className="text-sm font-bold uppercase  flex items-center gap-2 mb-8">
                <CreditCard className="w-4 h-4" />
                Thanh toán
              </h3>
              <div className="space-y-6">
                <div>
                  <SelectSearch
                    label="Hình thức thanh toán"
                    placeholder="Chọn hình thức thanh toán"
                    options={paymentMethods.map((method) => ({
                      value: method.id,
                      label: method.name,
                    }))}
                    value={selectedPaymentMethod}
                    onChange={(val) => setSelectedPaymentMethod(val)}
                  />
                </div>
                <div>
                  <SelectSearch
                    label="Vận chuyển"
                    placeholder="Chọn vận chuyển"
                    options={shippingMethods.map((method) => ({
                      value: method.id,
                      label: method.name,
                    }))}
                    value={selectedShippingMethod}
                    onChange={handleShippingChange}
                  />
                </div>
                <div>
                  <SelectSearch
                    label="Thuế suất"
                    placeholder="Chọn mức thuế"
                    options={taxRates.map((tax) => ({
                      value: tax.id,
                      label: `${tax.name} (${tax.rate}%)`,
                    }))}
                    value={selectedTaxRate}
                    onChange={(val) => setSelectedTaxRate(val)}
                  />
                </div>
                <div>
                  <label className="text-[12px] font-bold text-gray-500 uppercase  mb-2 block ">
                    Giảm giá trực tiếp (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none text-sm outline-none hover:cursor-pointer font-bold "
                  />
                </div>
                <div>
                  <label className="text-[12px] font-bold text-gray-500 uppercase  mb-2 block ">
                    Ghi chú đơn hàng
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 rounded-lg border-none text-sm outline-none "
                    placeholder="Ghi chú nội bộ..."
                  />
                </div>
              </div>
            </div>

            {/* Total Summary */}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrderCreatePage;
