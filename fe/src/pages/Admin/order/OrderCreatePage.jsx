import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  Phone,
  MapPin,
  CreditCard,
  Tag,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Loader2,
  Save,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PromotionService from "../../../services/PromotionService";
import toast from "react-hot-toast";
import { getImageUrl, formatPrice } from "../../../helper/helper";
import SelectSearch from "../../../components/common/SelectSearch";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";
import api from "../../../api/axios";
import PromotionModal from "./components/PromotionModal";

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
};

const OrderCreatePage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const searchResultsRef = useRef(null);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
  });

  // Customer search states
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const searchCustomers = async (term) => {
    if (!term || term.length < 2) {
      setCustomerSearchResults([]);
      return;
    }
    try {
      setIsSearchingCustomer(true);
      const res = await api.get(`/customers?query=${term}`);
      const data = res.data.data || res.data || [];
      setCustomerSearchResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Customer search failed", error);
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  const debouncedCustomerSearch = useCallback(
    debounce((val) => searchCustomers(val), 500),
    [],
  );

  const handleCustomerSearchChange = (e) => {
    setCustomerSearchTerm(e.target.value);
    debouncedCustomerSearch(e.target.value);
  };

  const selectCustomer = (c) => {
    setSelectedCustomer(c);
    setCustomer({
      name: c.name || "",
      phone: c.customer_profile?.phone || "",
      address: c.customer_profile?.address || "",
    });
    setCustomerSearchTerm("");
    setCustomerSearchResults([]);
    toast.success(`Đã chọn khách hàng: ${c.name}`);
  };

  const clearSelectedCustomer = () => {
    setSelectedCustomer(null);
    setCustomer({ name: "", phone: "", address: "" });
  };

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState(null);
  const [taxRates, setTaxRates] = useState([]);
  const [selectedTaxRate, setSelectedTaxRate] = useState(null);
  const [note, setNote] = useState("");

  // Promotion state
  const [promotionCode, setPromotionCode] = useState("");
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [eligiblePromotions, setEligiblePromotions] = useState([]);
  const [isLoadingEligible, setIsLoadingEligible] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [pmRes, smRes, taxRes] = await Promise.all([
        api.get("/payment-methods"),
        api.get("/shipping-methods"),
        api.get("/tax-rates"),
      ]);

      console.log("PM Response:", pmRes.data);

      const getArray = (res) => {
        if (res.data && Array.isArray(res.data.data)) return res.data.data;
        if (Array.isArray(res.data)) return res.data;
        return [];
      };

      setPaymentMethods(getArray(pmRes));
      setShippingMethods(getArray(smRes));
      setTaxRates(getArray(taxRes));
    } catch (error) {
      console.error("Failed to fetch initial data", error);
      toast.error("Không thể tải thông tin phương thức vận chuyển/thanh toán");
    }
  };

  const handleShippingChange = (methodId) => {
    setSelectedShippingMethod(methodId);
  };

  const handleTaxRateChange = (taxId) => {
    setSelectedTaxRate(taxId);
  };
  const fetchEligiblePromotions = async () => {
    if (selectedItems.length === 0) {
      toast.error("Vui lòng thêm sản phẩm vào giỏ hàng trước");
      return;
    }

    try {
      setIsLoadingEligible(true);
      setIsPromotionModalOpen(true);
      const cartItems = selectedItems.map((item) => ({
        product_id: item.product_id,
        category_id: item.category_id,
        subtotal: item.price * item.quantity,
      }));

      const res = await PromotionService.getEligible({
        cart_items: cartItems,
        channel: "pos",
        customer_id: null,
      });

      const data = res.data.data || res.data || [];
      setEligiblePromotions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch eligible promotions", error);
      toast.error("Không thể tải danh sách khuyến mại hợp lệ");
    } finally {
      setIsLoadingEligible(false);
    }
  };
  const applyPromotion = async (codeToApply = promotionCode) => {
    if (!codeToApply || !codeToApply.trim() || selectedItems.length === 0)
      return;

    try {
      setIsApplyingPromo(true);
      const cartItems = selectedItems.map((item) => ({
        product_id: item.product_id,
        category_id: item.category_id,
        subtotal: item.price * item.quantity,
      }));
      const res = await PromotionService.apply({
        code: codeToApply,
        cart_items: cartItems,
        channel: "pos",
        customer_id: null,
      });

      if (res.data.status === "success") {
        setAppliedPromotion(res.data.data);
        setDiscountAmount(res.data.data.discount_amount);
        setPromotionCode("");
        toast.success(`Đã áp dụng mã: ${res.data.data.promotion.code}`);
      }
    } catch (error) {
      console.error("Apply promo failed", error);
      toast.error(error.response?.data?.message || "Không thể áp dụng mã này");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const selectPromotion = (promo) => {
    setPromotionCode(promo.code);
    applyPromotion(promo.code);
    setIsPromotionModalOpen(false);
  };

  const searchProducts = async (term) => {
    if (!term || term.length < 1) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const res = await api.get(`/products/search?q=${term}`);
      const data = res.data.data || res.data || [];
      // Chỉ lấy những sản phẩm đang hoạt động (active)
      const activeProducts = Array.isArray(data)
        ? data.filter((p) => p.status === "active")
        : [];
      setSearchResults(activeProducts);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const debouncedSearch = useCallback(
    debounce((val) => searchProducts(val), 500),
    [],
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowResults(true);
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
          category_id: product.category_id,
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

  const shippingFee = useMemo(() => {
    if (!selectedShippingMethod) return 0;
    const method = shippingMethods.find((m) => m.id == selectedShippingMethod);
    return method ? Number(method.cost || 0) : 0;
  }, [selectedShippingMethod, shippingMethods]);

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
      if (!selectedCustomer) {
        return toast.error(
          "Vui lòng nhập đầy đủ thông tin khách hàng hoặc chọn khách hàng có tài khoản",
        );
      }
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
        customer_id: selectedCustomer?.id || null,
        discount_amount: discountAmount,
        payment_method_id: selectedPaymentMethod,
        shipping_method_id: selectedShippingMethod,
        note: note,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_address: customer.address,
        tax_rate_id: selectedTaxRate,
      };

      const res = await api.post("/orders", orderData);
      toast.success("Lên đơn hàng thành công!");
      navigate(`/admin/orders/${res.data.data.id || res.data.id}`);
    } catch (error) {
      console.error("Failed to create order", error);
      toast.error(error.response?.data?.message || "Lỗi khi tạo đơn hàng");
    } finally {
      setSubmitting(false);
    }
  };

  const ProductVariantSelector = ({ product, onAdd }) => {
    const [selectedAttributes, setSelectedAttributes] = useState({});

    const attributeGroups = useMemo(() => {
      const groups = {};
      product.variants?.forEach((v) => {
        v.attributes?.forEach((attr) => {
          if (!groups[attr.attribute_name]) {
            groups[attr.attribute_name] = new Set();
          }
          groups[attr.attribute_name].add(attr.attribute_value);
        });
      });
      const result = {};
      Object.keys(groups).forEach((key) => {
        result[key] = Array.from(groups[key]);
      });
      return result;
    }, [product]);

    const attributeNames = Object.keys(attributeGroups);

    // Initial auto-selection logic
    useEffect(() => {
      if (
        attributeNames.length > 0 &&
        Object.keys(selectedAttributes).length === 0
      ) {
        // Find first available variant to pre-fill
        const firstVariant =
          product.variants?.find((v) => v.inventory?.quantity > 0) ||
          product.variants?.[0];
        if (firstVariant) {
          const initial = {};
          firstVariant.attributes?.forEach((attr) => {
            initial[attr.attribute_name] = attr.attribute_value;
          });
          setSelectedAttributes(initial);
        }
      }
    }, [product.variants, attributeNames]);

    const getMatchingVariant = (attributes) => {
      return product.variants?.find((v) => {
        // Variant must match all currently selected attributes
        return Object.entries(attributes).every(([name, value]) => {
          const attr = v.attributes?.find((a) => a.attribute_name === name);
          return attr?.attribute_value === value;
        });
      });
    };

    const matchingVariant = useMemo(
      () => getMatchingVariant(selectedAttributes),
      [product.variants, selectedAttributes],
    );

    const isOptionPossible = (name, value) => {
      // Check if there is ANY variant that has this value AND matches other selections
      return product.variants?.some((v) => {
        const hasThisValue = v.attributes?.some(
          (a) => a.attribute_name === name && a.attribute_value === value,
        );
        if (!hasThisValue) return false;

        // Check compatibility with other selected attributes (exclude current one)
        return Object.entries(selectedAttributes).every(([sName, sValue]) => {
          if (sName === name) return true;
          const attr = v.attributes?.find((a) => a.attribute_name === sName);
          return attr?.attribute_value === sValue;
        });
      });
    };

    const handleSelect = (name, value) => {
      const newSelection = { ...selectedAttributes, [name]: value };

      Object.keys(newSelection).forEach((k) => {
        if (k !== name) {
          const stillPossible = product.variants?.some((v) => {
            const hasNew = v.attributes?.some(
              (a) => a.attribute_name === name && a.attribute_value === value,
            );
            const hasOld = v.attributes?.some(
              (a) =>
                a.attribute_name === k && a.attribute_value === newSelection[k],
            );
            return hasNew && hasOld;
          });

          if (!stillPossible) {
            const replacement = product.variants
              ?.find((v) =>
                v.attributes?.some(
                  (a) =>
                    a.attribute_name === name && a.attribute_value === value,
                ),
              )
              ?.attributes?.find(
                (a) => a.attribute_name === k,
              )?.attribute_value;

            if (replacement) {
              newSelection[k] = replacement;
            } else {
              delete newSelection[k];
            }
          }
        }
      });

      setSelectedAttributes(newSelection);
    };

    const available = matchingVariant
      ? (matchingVariant.inventory?.quantity || 0) -
        (matchingVariant.inventory?.reserved || 0)
      : 0;
    const isOutOfStock = available <= 0;

    return (
      <div className="space-y-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
        <div className="space-y-3">
          {attributeNames.map((name) => {
            const options = attributeGroups[name];
            // If only one option exists across all variants for this attribute AND it's already selected,
            // maybe we can skip showing it or just show it as label.
            // But let's follow user's UI request to keep it consistent.

            return (
              <div key={name} className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Chọn {name}
                </span>
                <div className="flex flex-wrap gap-2">
                  {options.map((value) => {
                    const isPossible = isOptionPossible(name, value);
                    const isSelected = selectedAttributes[name] === value;

                    return (
                      <button
                        key={value}
                        onClick={() => handleSelect(name, value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-black text-white shadow-md active:scale-95"
                            : isPossible
                              ? "bg-white text-gray-600 border border-gray-100 hover:border-gray-300 active:scale-95"
                              : "bg-white text-gray-300 border border-gray-50 hover:border-gray-200 opacity-60 active:scale-95"
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {matchingVariant ? (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              <p className="text-sm font-black text-gray-900">
                {formatPrice(matchingVariant.price)}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-bold">
                <span className="text-gray-400">Tồn kho:</span>
                <span
                  className={isOutOfStock ? "text-red-500" : "text-green-600"}
                >
                  {available}
                </span>
              </div>
            </div>
            <button
              onClick={() => onAdd(product, matchingVariant)}
              disabled={isOutOfStock}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                isOutOfStock
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              THÊM
            </button>
          </div>
        ) : (
          <div className="text-[10px] font-bold text-rose-500 italic p-3 bg-rose-50 rounded-xl border border-rose-100 flex items-center gap-2 animate-pulse">
            <AlertCircle className="w-3 h-3" />
            Vui lòng chọn đầy đủ các thuộc tính
          </div>
        )}
      </div>
    );
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
              <h1 className="text-2xl font-bold text-gray-900">
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
              <div className="relative" ref={searchResultsRef}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => setShowResults(true)}
                  placeholder="Nhập tên sản phẩm hoặc mã SKU..."
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none text-sm outline-none "
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
                {showResults && searchTerm.length >= 1 &&
                  (searchResults.length > 0 || !isSearching) && (
                    <div 
                      className="absolute top-full left-0 w-full mt-4 bg-white border border-gray-100 rounded-lg shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300"
                    >
                      {searchResults.length > 0 ? (
                        <div className="max-h-[400px] overflow-y-auto grid grid-cols-1 md:grid-cols-2  gap-4">
                          {searchResults.map((product) => (
                            <div
                              key={product.id}
                              className="p-4 border-b border-gray-50 last:border-0"
                            >
                              <div className="flex items-center gap-4 mb-2">
                                <img
                                  src={getImageUrl(
                                    product.images?.[0]?.url ||
                                      product.feature_image,
                                  )}
                                  className="w-12 h-12 rounded-xl object-cover border border-gray-100"
                                  alt={product.name}
                                />
                                <span className="font-bold text-gray-900 text-sm">
                                  {product.name}
                                </span>
                              </div>
                              <div className="ml-16">
                                {product.variants?.length === 1 &&
                                (!product.variants[0].attributes ||
                                  product.variants[0].attributes.length ===
                                    0) ? (
                                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div>
                                      <p className="text-xs font-bold">
                                        {formatPrice(product.variants[0].price)}
                                      </p>
                                      <p className="text-[10px] text-gray-400">
                                        Tồn kho:{" "}
                                        {(product.variants[0].inventory
                                          ?.quantity || 0) -
                                          (product.variants[0].inventory
                                            ?.reserved || 0)}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() =>
                                        addItemToOrder(
                                          product,
                                          product.variants[0],
                                        )
                                      }
                                      className="p-2 bg-blue-600 text-white rounded-lg shadow-sm"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <ProductVariantSelector
                                    product={product}
                                    onAdd={addItemToOrder}
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        !isSearching && (
                          <div className="p-12 text-center text-gray-400">
                            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-bold italic">
                              Không tìm thấy sản phẩm nào
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
                          <th className="px-8 py-4 text-[13px] font-bold text-gray-800 text-left">
                            Sản phẩm
                          </th>
                          <th className="px-6 py-4 text-[13px] font-bold text-gray-800 text-center">
                            Số lượng
                          </th>
                          <th className="px-6 py-4 text-[13px] font-bold text-gray-800 text-right">
                            Giá
                          </th>
                          <th className="px-6 py-4 text-[13px] font-bold text-gray-800 text-right">
                            Tổng
                          </th>
                          <th className="px-8 py-4 text-right w-10"></th>
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
                                  <p className="text-[10px] text-gray-600 fony-medium  uppercase">
                                    {item.variant_name} | {item.sku}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center justify-center gap-3">
                                <button
                                  onClick={() => updateQuantity(index, -1)}
                                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="font-black text-sm w-4 text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(index, 1)}
                                  className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shadow-lg"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-right text-xs">
                              {formatPrice(item.price)}
                            </td>
                            <td className="px-6 py-5 text-right font-bold text-gray-900 text-sm">
                              {formatPrice(item.price * item.quantity)}
                            </td>
                            <td className="px-8 py-5 text-right">
                              <button
                                onClick={() => removeItem(index)}
                                className="p-2 text-gray-300 hover:text-rose-500 rounded-xl"
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

                {/* Promo Code Input Section */}
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex flex-col gap-3">
                    <label className="text-[13px] font-bold text-gray-800 uppercase">
                      Mã giảm giá
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={promotionCode}
                          onChange={(e) =>
                            setPromotionCode(e.target.value.toUpperCase())
                          }
                          placeholder="Nhập mã..."
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl text-sm outline-none border border-gray-100 focus:border-indigo-300 transition-all font-bold"
                        />
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                      <button
                        onClick={() => applyPromotion()}
                        disabled={isApplyingPromo || !promotionCode}
                        className="px-6 py-3 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 disabled:opacity-50 transition-all"
                      >
                        {isApplyingPromo ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "ÁP DỤNG"
                        )}
                      </button>
                    </div>
                    <button
                      onClick={fetchEligiblePromotions}
                      disabled={isLoadingEligible || selectedItems.length === 0}
                      className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-all group"
                    >
                      {isLoadingEligible ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Tag className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                          DANH SÁCH MÃ GIẢM GIÁ
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {appliedPromotion && (
                  <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Tag className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-indigo-900">
                          {appliedPromotion.promotion.code}
                        </p>
                        <p className="text-[10px] text-indigo-600 font-bold uppercase">
                          Đã giảm{" "}
                          {formatPrice(appliedPromotion.discount_amount)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setAppliedPromotion(null);
                        setDiscountAmount(0);
                      }}
                      className="p-2 text-indigo-300 hover:text-indigo-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

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
            <div className="bg-white rounded-lg border border-gray-100 p-8 shadow-sm relative z-10">
              <h3 className="text-sm font-bold uppercase flex items-center gap-2 mb-6">
                <User className="w-4 h-4" />
                Khách hàng
              </h3>

              {/* Selected Customer Badge */}
              {selectedCustomer ? (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg  text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {selectedCustomer.avatar ? (
                        <img
                          src={getImageUrl(selectedCustomer.avatar)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {selectedCustomer.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {selectedCustomer.name}
                      </p>
                      <p className="text-[10px] text-blue-600 font-bold uppercase">
                        {selectedCustomer.customer_profile?.loyalty_tier ||
                          "Thành viên"}{" "}
                        · #{selectedCustomer.id}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelectedCustomer}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Bỏ chọn"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Search Existing Customer */
                <div className="mb-6 relative">
                  <label className="text-[12px] font-bold text-gray-600 uppercase mb-2 block">
                    Tìm khách hàng có tài khoản
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={customerSearchTerm}
                      onChange={handleCustomerSearchChange}
                      placeholder="Nhập tên, email, SĐT..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl text-sm outline-none border border-transparent focus:border-blue-200 transition-all"
                    />
                    {isSearchingCustomer && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                    )}
                  </div>
                  {customerSearchResults.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden z-50">
                      {customerSearchResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => selectCustomer(c)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-50 last:border-0"
                        >
                          <div className="w-8 h-8 rounded-lg  text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {c.avatar ? (
                              <img
                                src={getImageUrl(c.avatar)}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                                {c.name?.[0]?.toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {c.name}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">
                              {c.email} ·{" "}
                              {c.customer_profile?.phone || "Chưa có SĐT"}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0 ml-auto" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10px] font-bold text-gray-300 uppercase">
                  {selectedCustomer
                    ? "Chi tiết giao hàng"
                    : "hoặc nhập thủ công"}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[12px] font-bold text-gray-600 uppercase mb-2 block">
                    Tên khách hàng
                  </label>
                  <div className="relative">
                    <input
                      value={customer.name}
                      onChange={(e) =>
                        setCustomer({ ...customer, name: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-4 bg-gray-50 rounded-lg text-sm outline-none"
                      placeholder="Nhập tên..."
                    />
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  </div>
                </div>
                <div>
                  <label className="text-[12px] font-bold text-gray-600 uppercase mb-2 block">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <input
                      value={customer.phone}
                      onChange={(e) =>
                        setCustomer({ ...customer, phone: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-4 bg-gray-50 rounded-lg text-sm outline-none"
                      placeholder="09xxxx..."
                    />
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  </div>
                </div>
                <div>
                  <label className="text-[12px] font-bold text-gray-600 uppercase mb-2 block">
                    Địa chỉ nhận hàng
                  </label>
                  <div className="relative">
                    <textarea
                      value={customer.address}
                      onChange={(e) =>
                        setCustomer({ ...customer, address: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-4 bg-gray-50 rounded-lg text-sm outline-none"
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
                      icon: getImageUrl(method.image),
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
                  <PromotionModal
                    isOpen={isPromotionModalOpen}
                    onClose={() => setIsPromotionModalOpen(false)}
                    eligiblePromotions={eligiblePromotions}
                    onSelect={selectPromotion}
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
