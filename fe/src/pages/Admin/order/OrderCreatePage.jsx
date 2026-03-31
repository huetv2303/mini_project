import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  Phone,
  MapPin,
  Tag,
  CreditCard,
  Save,
  Loader2,
  AlertCircle,
  Truck,
  Percent,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { formatPrice, getImageUrl } from "../../../helper/helper";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";
import api from "../../../api/axios";
import PromotionModal from "./components/PromotionModal";
import SelectSearch from "../../../components/common/SelectSearch";
import { usePromotion } from "../../../hooks/usePromotion";
import PaymentIntegration from "../../../components/common/PaymentIntegration";
import { getBankConfigRequest } from "../../../services/PaymentService";

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
};

const ProductVariantSelector = ({ product, onAdd }) => {
  const [sel, setSel] = useState({});
  const groups = useMemo(() => {
    const g = {};
    product.variants?.forEach((v) =>
      v.attributes?.forEach((a) => {
        if (!g[a.attribute_name]) g[a.attribute_name] = new Set();
        g[a.attribute_name].add(a.attribute_value);
      }),
    );
    const r = {};
    Object.keys(g).forEach((k) => (r[k] = Array.from(g[k])));
    return r;
  }, [product]);

  useEffect(() => {
    if (Object.keys(sel).length === 0 && product.variants?.[0]) {
      const init = {};
      product.variants[0].attributes?.forEach(
        (a) => (init[a.attribute_name] = a.attribute_value),
      );
      setSel(init);
    }
  }, [product]);

  const matchingVariant = useMemo(
    () =>
      product.variants?.find((v) =>
        Object.entries(sel).every(
          ([n, val]) =>
            val ===
            v.attributes?.find((a) => a.attribute_name === n)?.attribute_value,
        ),
      ),
    [sel, product],
  );

  const qty = matchingVariant ? matchingVariant.inventory?.quantity || 0 : 0;
  const min_qty = matchingVariant
    ? matchingVariant.inventory?.min_quantity || 0
    : 0;

  return (
    <div className="p-3 bg-gray-50 rounded-xl space-y-3">
      {Object.keys(groups).map((name) => (
        <div key={name} className="flex flex-wrap gap-1.5 font-bold">
          <span className="text-[10px] w-full text-gray-400">{name}</span>
          {groups[name].map((v) => (
            <button
              type="button"
              key={v}
              onClick={() => setSel({ ...sel, [name]: v })}
              className={`px-2 py-1 rounded-lg text-[10px] border transition-all ${
                sel[name] === v
                  ? "bg-black text-white"
                  : "bg-white text-gray-500 hover:bg-gray-100"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      ))}
      <div className="flex justify-between items-center pt-2 border-t text-xs ">
        <span className="font-bold text-gray-900">
          {matchingVariant ? formatPrice(matchingVariant.price) : "---"}
        </span>

        <div className="flex gap-2 items-center">
          <div className="flex gap-1">
            Còn:
            <p
              className={`text-xs font-bold ${
                qty <= min_qty ? "text-red-500" : "text-green-500"
              }`}
            >
              {qty}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdd(product, matchingVariant);
            }}
            disabled={!matchingVariant || qty <= 0}
            className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
          >
            THÊM
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderCreatePage = () => {
  const navigate = useNavigate();

  // --- Multi-tab & Persistence Logic ---
  const createEmptySession = (id) => ({
    id,
    label: `Khách ${id.split("-")[1] || id}`,
    selectedItems: [],
    customer: { name: "", phone: "" },
    selectedCustomer: null,
    selectedPaymentMethod: null,
    fulfillmentType: null, // 'pickup' | 'delivery'
    shippingFee: 0,
    shippingInfo: { name: "", phone: "", address: "" },
    selectedTaxRate: null,
    note: "",
    promotionCode: "",
    appliedPromotion: null,
    discountAmount: 0,
  });

  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem("pos_sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Migrate old sessions: ensure new fields exist
          return parsed.map((s) => ({
            fulfillmentType: null,
            shippingFee: 0,
            shippingInfo: { name: "", phone: "", address: "" },
            customer: { name: "", phone: "" },
            ...s,
            shippingInfo: {
              name: "",
              phone: "",
              address: "",
              ...(s.shippingInfo || {}),
            },
            customer: {
              name: "",
              phone: "",
              ...(s.customer || {}),
            },
          }));
        }
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
    return [createEmptySession("tab-1")];
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    return localStorage.getItem("pos_active_tab_id") || sessions[0].id;
  });

  const [tabCounter, setTabCounter] = useState(() => {
    return Number(localStorage.getItem("pos_tab_counter")) || 2;
  });

  const activeSession = useMemo(() => {
    return (
      sessions.find((s) => s.id === activeSessionId) ||
      sessions[0] ||
      createEmptySession("tab-1")
    );
  }, [sessions, activeSessionId]);

  useEffect(() => {
    localStorage.setItem("pos_sessions", JSON.stringify(sessions));
    localStorage.setItem("pos_active_tab_id", activeSessionId);
    localStorage.setItem("pos_tab_counter", tabCounter.toString());
  }, [sessions, activeSessionId, tabCounter]);

  const patchSession = useCallback(
    (patch) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, ...patch } : s)),
      );
    },
    [activeSessionId],
  );

  const addTab = () => {
    const newId = `tab-${tabCounter}`;
    setSessions((prev) => [...prev, createEmptySession(newId)]);
    setActiveSessionId(newId);
    setTabCounter((prev) => prev + 1);
  };

  const removeTab = (e, id) => {
    if (e) e.stopPropagation();
    if (sessions.length === 1) {
      setSessions([createEmptySession("tab-1")]);
      setActiveSessionId("tab-1");
      return;
    }
    if (confirm("Bạn có chắc chắn muốn xóa tab này?")) {
      const newSessions = sessions.filter((s) => s.id !== id);
      setSessions(newSessions);
      if (activeSessionId === id) setActiveSessionId(newSessions[0].id);
    }
  };

  // --- Core State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [bankConfig, setBankConfig] = useState(null);

  const {
    applyPromotion: runApplyPromotion,
    fetchEligiblePromotions: runFetchEligiblePromotions,
    clearPromotion: runClearPromotion,
    eligiblePromotions,
    isLoadingEligible,
    isApplying: isApplyingPromotion,
  } = usePromotion();

  const [editingTabId, setEditingTabId] = useState(null);
  const [editingLabel, setEditingLabel] = useState("");

  const searchResultsRef = useRef(null);
  const customerResultsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target)
      ) {
        setShowResults(false);
      }
      if (
        customerResultsRef.current &&
        !customerResultsRef.current.contains(event.target)
      ) {
        setCustomerSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pm, tr, bc] = await Promise.all([
          api.get("/payment-methods"),
          api.get("/tax-rates"),
          getBankConfigRequest(),
        ]);
        setPaymentMethods(pm.data.data || pm.data);
        setTaxRates(tr.data.data || tr.data);
        setBankConfig(bc.data);
      } catch (error) {
        toast.error("Lỗi tải dữ liệu cấu hình");
      }
    };
    fetchData();
  }, []);

  // --- Handlers ---
  const handleProductSearch = useCallback(
    debounce(async (term) => {
      if (!term) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await api.get("/products/search", {
          params: { q: term },
        });
        setSearchResults(res.data.data || res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [],
  );

  const handleCustomerSearch = useCallback(
    debounce(async (term) => {
      if (!term) {
        setCustomerSearchResults([]);
        return;
      }
      setIsSearchingCustomer(true);
      try {
        const res = await api.get("/customers", {
          params: { query: term },
        });
        setCustomerSearchResults(res.data.data || res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsSearchingCustomer(false);
      }
    }, 300),
    [],
  );

  const selectCustomer = (c) => {
    patchSession({
      selectedCustomer: c,
      customer: {
        name: c.name || "",
        phone: c.customer_profile?.phone || "",
        address: c.customer_profile?.address || "",
      },
    });
    setCustomerSearchTerm("");
    setCustomerSearchResults([]);
  };

  const addItemToOrder = (product, variant) => {
    const items = [...activeSession.selectedItems];
    const idx = items.findIndex((i) => i.variant_id === variant.id);
    if (idx > -1) {
      items[idx].quantity += 1;
    } else {
      items.push({
        product_id: product.id,
        category_id: product.category_id,
        variant_id: variant.id,
        product_name: product.name,
        variant_name:
          variant.attributes?.map((a) => a.attribute_value).join(" / ") ||
          "Mặc định",
        sku: variant.sku,
        price: Number(variant.price),
        quantity: 1,
        image: product.feature_image || product.images?.[0]?.url,
      });
    }
    patchSession({ selectedItems: items });
    setShowResults(false);
  };

  const updateQuantity = (idx, delta) => {
    const items = [...activeSession.selectedItems];
    items[idx].quantity += delta;
    if (items[idx].quantity <= 0) {
      items.splice(idx, 1);
    }
    patchSession({ selectedItems: items });
  };

  const calculateSubtotal = () =>
    activeSession.selectedItems.reduce(
      (acc, i) => acc + i.price * i.quantity,
      0,
    );
  const calculateTax = () => {
    const rate =
      taxRates.find((t) => t.id == activeSession.selectedTaxRate)?.rate || 0;
    return (calculateSubtotal() * rate) / 100;
  };
  const calculateTotal = () => {
    const sub = calculateSubtotal();
    const ship =
      activeSession.fulfillmentType === "delivery"
        ? Number(activeSession.shippingFee) || 0
        : 0;
    return sub + ship + calculateTax() - activeSession.discountAmount;
  };

  const applyPromotion = async (code = activeSession.promotionCode) => {
    try {
      const data = await runApplyPromotion(
        code,
        activeSession.selectedItems.map((item) => ({
          product_id: item.product_id,
          category_id: item.category_id,
          subtotal: item.price * item.quantity,
        })),
        activeSession.selectedCustomer?.id,
        "pos",
      );

      patchSession({
        appliedPromotion: data,
        discountAmount: data.discount_amount,
        promotionCode: code,
      });
    } catch (e) {
      patchSession({ appliedPromotion: null, discountAmount: 0 });
    }
  };

  const fetchEligiblePromotions = async () => {
    if (activeSession.selectedItems.length === 0) return;
    const data = await runFetchEligiblePromotions(
      activeSession.selectedItems.map((item) => ({
        product_id: item.product_id,
        category_id: item.category_id,
        subtotal: item.price * item.quantity,
      })),
      activeSession.selectedCustomer?.id,
      "pos",
    );

    if (data) {
      setIsPromotionModalOpen(true);
    }
  };

  const handleClearPromotion = () => {
    runClearPromotion();
    patchSession({
      appliedPromotion: null,
      discountAmount: 0,
      promotionCode: "",
    });
  };

  const handlePlaceOrder = async () => {
    if (activeSession.selectedItems.length === 0) return;
    if (!activeSession.selectedPaymentMethod) {
      toast.error("Vui lòng chọn phương thức thanh toán");
      return;
    }
    if (!activeSession.fulfillmentType) {
      toast.error("Vui lòng chọn hình thức nhận hàng");
      return;
    }
    if (activeSession.fulfillmentType === "delivery") {
      if (!activeSession.shippingInfo.name.trim()) {
        toast.error("Vui lòng nhập tên người nhận");
        return;
      }
      if (!activeSession.shippingInfo.phone.trim()) {
        toast.error("Vui lòng nhập số điện thoại người nhận");
        return;
      }
      if (!activeSession.shippingInfo.address.trim()) {
        toast.error("Vui lòng nhập địa chỉ giao hàng");
        return;
      }
    }

    setSubmitting(true);
    try {
      const data = {
        customer_id: activeSession.selectedCustomer?.id,
        items: activeSession.selectedItems.map((item) => ({
          product_variant_id: item.variant_id,
          quantity: item.quantity,
        })),
        payment_method_id: activeSession.selectedPaymentMethod,
        fulfillment_type: activeSession.fulfillmentType,
        shipping_fee:
          activeSession.fulfillmentType === "delivery"
            ? Number(activeSession.shippingFee) || 0
            : 0,
        recipient_name:
          activeSession.fulfillmentType === "delivery"
            ? activeSession.shippingInfo.name
            : activeSession.customer.name ||
              activeSession.selectedCustomer?.name ||
              "",
        recipient_phone:
          activeSession.fulfillmentType === "delivery"
            ? activeSession.shippingInfo.phone
            : activeSession.customer.phone ||
              activeSession.selectedCustomer?.customer_profile?.phone ||
              "",
        shipping_address:
          activeSession.fulfillmentType === "delivery"
            ? activeSession.shippingInfo.address
            : null,
        tax_rate_id: activeSession.selectedTaxRate,
        discount_amount: activeSession.discountAmount,
        promotion_id: activeSession.appliedPromotion?.promotion?.id,
        note: activeSession.note,
        customer_name:
          activeSession.customer.name ||
          activeSession.selectedCustomer?.name ||
          "",
        customer_phone:
          activeSession.customer.phone ||
          activeSession.selectedCustomer?.customer_profile?.phone ||
          "",
      };
      const res = await api.post("/orders", data);
      toast.success("Tạo đơn hàng thành công!");
      removeTab(null, activeSessionId);
      navigate(`/admin/orders/${res.data.data?.id || res.data.id}`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Lỗi tạo đơn");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Multi-tab & Persistence Logic ---

  // Hàm lưu tên mới
  const renameTab = (id, newLabel) => {
    if (!newLabel.trim()) return; // Không cho đặt tên rỗng
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, label: newLabel.trim() } : s)),
    );
    setEditingTabId(null); // Thoát chế độ edit
    setEditingLabel("");
  };
  return (
    <AdminLayout>
      <div className="pb-20 max-w-[1400px] mx-auto text-left">
        {/* TAB BAR */}
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pt-2">
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              className={`flex items-center gap-3 px-5 py-3 rounded-lg cursor-pointer border transition-all ${s.id === activeSessionId ? "bg-blue-500 text-white shadow-xl" : "bg-white text-gray-500 border-gray-100"}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${s.id === activeSessionId ? "bg-green-400 animate-pulse" : "bg-gray-300"}`}
              />
              <span className="text-sm font-bold truncate max-w-[100px]">
                {s.label}
              </span>
              {sessions.length > 1 && (
                <Trash2
                  className="w-3.5 h-3.5 opacity-30 hover:opacity-100"
                  onClick={(e) => removeTab(e, s.id)}
                />
              )}
            </div>
          ))}
          <button
            onClick={addTab}
            className="px-5 py-3 rounded-lg bg-white border-2 border-dashed border-gray-200 text-gray-400 font-bold text-sm hover:border-blue-300 hover:text-blue-500 transition-all"
          >
            + Đơn mới
          </button>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            {editingTabId === activeSession.id ? (
              <input
                type="text"
                value={editingLabel}
                onChange={(e) => setEditingLabel(e.target.value)}
                onBlur={() => renameTab(activeSession.id, editingLabel)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    renameTab(activeSession.id, editingLabel);
                  if (e.key === "Escape") {
                    setEditingTabId(null);
                    setEditingLabel("");
                  }
                }}
                autoFocus
                className="text-2xl font-bold border-none outline-none bg-transparent"
              />
            ) : (
              <span
                onClick={() => {
                  setEditingTabId(activeSession.id);
                  setEditingLabel(activeSession.label);
                }}
                className="text-2xl font-bold cursor-pointer hover:text-blue-500"
              >
                {activeSession.label}
              </span>
            )}
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={submitting || activeSession.selectedItems.length === 0}
            className="px-6 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />} XÁC
            NHẬN LÊN ĐƠN
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            {/* PRODUCT SEARCH */}
            <div className="bg-white rounded-lg border p-4 shadow-sm z-30 sticky top-0">
              <div className="relative" ref={searchResultsRef}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    handleProductSearch(e.target.value);
                  }}
                  onFocus={() => setShowResults(true)}
                  placeholder="Tìm sản phẩm (Tên/SKU)..."
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-lg outline-none"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                {isSearching && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}
                {showResults && searchTerm.length >= 1 && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border rounded-lg shadow-2xl p-4 max-h-[500px] overflow-y-auto z-50">
                    {searchResults.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {searchResults.map((p) => (
                          <div key={p.id} className="p-3 border rounded-xl">
                            <div className="flex items-center gap-2">
                              <img
                                src={
                                  getImageUrl(p.feature_image) ||
                                  getImageUrl(p.images?.[0]?.url) ||
                                  "/placeholder-product.png"
                                }
                                className="w-12 h-12 rounded-lg object-cover bg-gray-100 border"
                              />
                              <p className="font-bold text-sm mb-2">{p.name}</p>
                            </div>
                            <ProductVariantSelector
                              product={p}
                              onAdd={addItemToOrder}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-20 text-center text-gray-400 italic">
                        Không tìm thấy sản phẩm
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* CART TABLE */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden  h-[500px] overflow-y-auto">
              <div className="p-6 border-b font-bold text-sm uppercase flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" /> Giỏ hàng (
                {activeSession.selectedItems.length})
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-[10px] text-gray-500 uppercase ">
                    <th className="px-6 py-4 text-left">Sản phẩm</th>
                    <th className="px-6 py-4 text-center">Số lượng</th>
                    <th className="px-6 py-4 text-center">Đơn giá</th>
                    <th className="px-6 py-4 text-right">Thành tiền</th>
                    <th className="px-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {activeSession.selectedItems.map((item, idx) => (
                    <tr
                      key={idx}
                      className="border-b last:border-0 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getImageUrl(item.image)}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-700 text-sm">
                              {item.product_name}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {item.variant_name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => updateQuantity(idx, -1)}
                            className="w-7 h-7 border rounded-full flex items-center justify-center hover:bg-gray-100"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-sm w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(idx, 1)}
                            className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right  text-sm">
                        {formatPrice(item.price)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-sm">
                        {formatPrice(item.price * item.quantity)}
                      </td>
                      <td className="px-6 text-right">
                        <Trash2
                          className="w-4 h-4 text-gray-300 hover:text-red-500 cursor-pointer transition-colors"
                          onClick={() => updateQuantity(idx, -item.quantity)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {activeSession.selectedItems.length === 0 && (
                <div className="p-20 text-center text-gray-300 italic">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />{" "}
                  Giỏ hàng đang trống
                </div>
              )}
            </div>

            {/* FULFILLMENT SECTION */}
            {activeSession.selectedItems.length > 0 && (
              <div className="bg-white rounded-lg border shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-sm uppercase flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Hình thức nhận hàng
                </h3>

                {/* Toggle cards */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => patchSession({ fulfillmentType: "pickup" })}
                    className={`flex flex-col items-center gap-2 py-5 rounded-xl border-2 font-bold text-sm transition-all ${
                      activeSession.fulfillmentType === "pickup"
                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-gray-200 text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-2xl">🏢</span>
                    Nhận tại cửa hàng
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      patchSession({ fulfillmentType: "delivery" })
                    }
                    className={`flex flex-col items-center gap-2 py-5 rounded-xl border-2 font-bold text-sm transition-all ${
                      activeSession.fulfillmentType === "delivery"
                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-gray-200 text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-2xl">🚚</span>
                    Giao hàng
                  </button>
                </div>

                {/* Delivery form */}
                {activeSession.fulfillmentType === "delivery" && (
                  <div className="space-y-3 pt-2 border-t">
                    <p className="text-xs font-bold uppercase text-gray-500">
                      Thông tin giao hàng
                    </p>
                    <div className="relative">
                      <input
                        type="text"
                        value={activeSession.shippingInfo.name}
                        onChange={(e) =>
                          patchSession({
                            shippingInfo: {
                              ...activeSession.shippingInfo,
                              name: e.target.value,
                            },
                          })
                        }
                        placeholder="Tên người nhận *"
                        className="w-full pl-10 p-3 bg-gray-50 rounded-xl text-xs outline-none"
                      />
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={activeSession.shippingInfo.phone}
                        onChange={(e) =>
                          patchSession({
                            shippingInfo: {
                              ...activeSession.shippingInfo,
                              phone: e.target.value,
                            },
                          })
                        }
                        placeholder="Số điện thoại *"
                        className="w-full pl-10 p-3 bg-gray-50 rounded-xl text-xs outline-none"
                      />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    </div>
                    <div className="relative">
                      <textarea
                        value={activeSession.shippingInfo.address}
                        onChange={(e) =>
                          patchSession({
                            shippingInfo: {
                              ...activeSession.shippingInfo,
                              address: e.target.value,
                            },
                          })
                        }
                        placeholder="Địa chỉ giao hàng *"
                        rows="2"
                        className="w-full pl-10 p-3 bg-gray-50 rounded-xl text-xs outline-none resize-none"
                      />
                      <MapPin className="absolute left-3 top-4 w-4 h-4 text-gray-300" />
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={activeSession.shippingFee || ""}
                        onChange={(e) =>
                          patchSession({ shippingFee: Number(e.target.value) })
                        }
                        placeholder="Phí vận chuyển (đồng)"
                        className="w-full pl-10 p-3 bg-gray-50 rounded-xl text-xs outline-none"
                      />
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                )}

                {/* Pickup note */}
                {activeSession.fulfillmentType === "pickup" && (
                  <div className="p-3 bg-green-50 rounded-xl text-xs text-green-700 font-medium">
                    ✅ Khách nhận hàng trực tiếp tại cửa hàng. Không cần địa chỉ
                    giao hàng.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            {/* CUSTOMER SIDEBAR */}
            <div className="bg-white rounded-lg border p-6 shadow-sm space-y-6">
              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase flex items-center gap-2">
                  <User className="w-4 h-4" /> Khách hàng
                </h3>
                {activeSession.selectedCustomer ? (
                  <div className="p-4 bg-blue-50 rounded-xl flex justify-between items-center animate-in fade-in">
                    <div>
                      <p className="flex gap-2 items-center">
                        <img
                          src={getImageUrl(
                            activeSession.selectedCustomer.avatar,
                          )}
                          alt=""
                          className="w-5 h-5 rounded-full"
                        />
                        <div className="">
                          <p className="font-bold text-sm text-blue-900">
                            {activeSession.selectedCustomer.name}
                          </p>
                          <p className="text-xs text-blue-600">
                            {activeSession.selectedCustomer.customer_profile
                              ?.phone || ""}
                          </p>
                        </div>
                      </p>
                    </div>
                    <Trash2
                      className="w-4 h-4 text-blue-400 cursor-pointer hover:text-red-500"
                      onClick={() => patchSession({ selectedCustomer: null })}
                    />
                  </div>
                ) : (
                  <div className="relative" ref={customerResultsRef}>
                    <input
                      type="text"
                      value={customerSearchTerm}
                      onChange={(e) => {
                        setCustomerSearchTerm(e.target.value);
                        handleCustomerSearch(e.target.value);
                      }}
                      placeholder="Tìm khách tài khoản..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl text-xs border-none"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    {customerSearchResults.length > 0 && (
                      <div className="absolute top-full left-0 w-full mt-1 bg-white border rounded-xl shadow-xl z-50 max-h-[150px] overflow-y-auto">
                        {customerSearchResults.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => selectCustomer(c)}
                            className="w-full p-3 text-left hover:bg-gray-50 text-xs  border-b last:border-0"
                          >
                            <p className="flex gap-2 items-center">
                              <img
                                src={getImageUrl(c.avatar)}
                                alt=""
                                className="w-5 h-5 rounded-full"
                              />
                              <div>
                                <p className="font-bold">{c.name}</p>
                                <p className="text-gray-500">
                                  {c.customer_profile?.phone}
                                </p>
                              </div>
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={activeSession.customer.name}
                      onChange={(e) =>
                        patchSession({
                          customer: {
                            ...activeSession.customer,
                            name: e.target.value,
                          },
                        })
                      }
                      placeholder="Tên khách lẻ..."
                      className="w-full pl-10 p-3 bg-gray-50 rounded-xl text-xs outline-none"
                    />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={activeSession.customer.phone}
                      onChange={(e) =>
                        patchSession({
                          customer: {
                            ...activeSession.customer,
                            phone: e.target.value,
                          },
                        })
                      }
                      placeholder="Số điện thoại..."
                      className="w-full pl-10 p-3 bg-gray-50 rounded-xl text-xs outline-none"
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  </div>
                </div>
              </div>

              <hr className="border-gray-50" />

              <div className="space-y-2">
                <label className="text-[0.8rem] font-medium text-gray-700 uppercase flex items-center gap-1">
                  <Percent className="w-4 h-4" /> Thuế
                </label>
                <SelectSearch
                  placeholder="Chọn thuế"
                  options={taxRates.map((t) => ({
                    label: `${t.name}`,
                    value: t.id,
                  }))}
                  value={activeSession.selectedTaxRate || ""}
                  onChange={(val) => patchSession({ selectedTaxRate: val })}
                />
              </div>

              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-xs font-medium opacity-60">
                  <span>Tạm tính</span>
                  <span>{formatPrice(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-xs font-medium opacity-60">
                  <span>Thuế</span>
                  <span>{formatPrice(calculateTax())}</span>
                </div>
                <div className="flex justify-between text-xs font-medium opacity-60">
                  <span>Phí ship</span>
                  <span>
                    {activeSession.fulfillmentType === "delivery"
                      ? formatPrice(Number(activeSession.shippingFee) || 0)
                      : "Miễn phí"}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold text-red-500">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(activeSession.discountAmount)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="font-bold text-sm">TỔNG CỘNG</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatPrice(calculateTotal())}
                  </span>
                </div>
                <div className="flex gap-2 h-11">
                  <div className="relative flex-1 group">
                    <input
                      type="text"
                      value={activeSession.promotionCode}
                      onChange={(e) =>
                        patchSession({
                          promotionCode: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="Mã giảm giá..."
                      className="w-full h-full pl-4 pr-10 bg-white border border-gray-200 rounded-xl text-xs font-bold uppercase outline-none focus:border-black transition-all"
                    />
                    {(activeSession.promotionCode ||
                      activeSession.appliedPromotion) && (
                      <button
                        onClick={handleClearPromotion}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Gỡ bỏ"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => applyPromotion()}
                    disabled={
                      isApplyingPromotion || !activeSession.promotionCode
                    }
                    className="px-6 h-full bg-black text-white rounded-xl text-[13px]  uppercase font-bold  hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400 transition-all flex items-center justify-center min-w-[100px] shadow-sm shadow-black/5"
                  >
                    {isApplyingPromotion ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Áp dụng"
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={fetchEligiblePromotions}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-[10px] text-gray-400 font-bold uppercase hover:border-blue-200 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                >
                  {isLoadingEligible ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Tag className="w-3 h-3" />
                  )}{" "}
                  DANH SÁCH MÃ GIẢM GIÁ
                </button>
              </div>

              <div className="space-y-4">
                <h4 className="text-[0.8rem] font-medium text-gray-700 uppercase">
                  Phương thức thanh toán
                </h4>
                <SelectSearch
                  placeholder="Chọn phương thức thanh toán"
                  options={paymentMethods.map((pm) => ({
                    icon: getImageUrl(pm.image),
                    label: pm.name,
                    value: pm.id,
                  }))}
                  value={activeSession.selectedPaymentMethod || ""}
                  onChange={(val) =>
                    patchSession({ selectedPaymentMethod: val })
                  }
                />
              </div>

              {activeSession.selectedPaymentMethod &&
                (() => {
                  const selectedMethod = paymentMethods.find(
                    (pm) => pm.id === activeSession.selectedPaymentMethod,
                  );
                  if (
                    ["bank_transfer", "vnpay"].includes(selectedMethod?.code)
                  ) {
                    return (
                      <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm animate-in fade-in slide-in-from-right-2 duration-300">
                        <h4 className="text-[0.8rem] font-bold text-gray-700 uppercase flex items-center gap-2 mb-4">
                          <CreditCard className="w-4 h-4" />
                          Thanh toán dự kiến
                        </h4>
                        <PaymentIntegration
                          selectedMethod={selectedMethod}
                          bankConfig={bankConfig}
                          validOrders={[
                            { code: activeSession.label || "Order" },
                          ]}
                          totalAmount={calculateTotal()}
                          isVnpayLoading={false}
                          onVnpayPayment={() =>
                            toast.error(
                              "Vui lòng 'Xác nhận tạo đơn' trước khi tiến hành thanh toán VNPay",
                            )
                          }
                        />
                      </div>
                    );
                  }
                  return null;
                })()}

              <div className="space-y-2">
                <h4 className="text-[0.8rem] font-medium text-gray-700 uppercase">
                  Ghi chú
                </h4>
                <textarea
                  value={activeSession.note}
                  onChange={(e) => patchSession({ note: e.target.value })}
                  placeholder="Nhập ghi chú cho đơn hàng..."
                  rows="2"
                  className="w-full h-[100px] text-[0.8rem] p-4 bg-gray-50 rounded-xl border-none outline-none resize-none focus:bg-gray-100 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <PromotionModal
        isOpen={isPromotionModalOpen}
        onClose={() => setIsPromotionModalOpen(false)}
        promotions={eligiblePromotions}
        onSelect={(p) => {
          applyPromotion(p.code);
          setIsPromotionModalOpen(false);
        }}
      />
    </AdminLayout>
  );
};

export default OrderCreatePage;
