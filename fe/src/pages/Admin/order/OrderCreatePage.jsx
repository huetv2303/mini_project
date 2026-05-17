import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
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
  Loader2,
  Truck,
  Percent,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { formatPrice, getImageUrl } from "../../../helper/helper";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";
import api from "../../../api/axios";
import PromotionModal from "./components/PromotionModal";
import OrderSuccessModal from "./components/OrderSuccessModal";
import SelectSearch from "../../../components/common/SelectSearch";
import { usePromotion } from "../../../hooks/usePromotion";
import PaymentIntegration from "../../../components/common/PaymentIntegration";
import {
  fetchBankConfigRequest,
  checkSepayStatusRequest,
} from "../../../services/PaymentService";

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
    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3.5 mt-2 text-left">
      {Object.keys(groups).map((name) => (
        <div key={name} className="flex flex-col gap-1 font-bold">
          <span className="text-[9px] uppercase tracking-wider text-slate-400">
            {name}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {groups[name].map((v) => {
              const isSelected = sel[name] === v;
              return (
                <button
                  type="button"
                  key={v}
                  onClick={() => setSel({ ...sel, [name]: v })}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all duration-200 ${
                    isSelected
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/10"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex justify-between items-center pt-2.5 border-t border-slate-200/50 text-xs">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">
            Đơn giá
          </span>
          <span className="font-extrabold text-slate-800 text-xs sm:text-sm">
            {matchingVariant ? formatPrice(matchingVariant.price) : "---"}
          </span>
        </div>

        <div className="flex gap-3 items-center">
          <div className="text-right">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">
              Tồn kho
            </span>
            <span
              className={`text-xs font-bold ${
                qty <= min_qty ? "text-rose-500" : "text-emerald-500"
              }`}
            >
              {qty}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdd(product, matchingVariant);
            }}
            disabled={!matchingVariant || qty <= 0}
            className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-500/10 active:scale-95"
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
    const activeTax = taxRates.find(
      (r) => r.is_active === 1 || r.is_active === true,
    );
    const newSession = createEmptySession(newId);
    if (activeTax) {
      newSession.selectedTaxRate = activeTax.id;
    }
    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(newId);
    setTabCounter((prev) => prev + 1);
  };

  const removeTab = (e, id, silent = false) => {
    if (e) e.stopPropagation();
    if (sessions.length === 1) {
      const emptyTab = createEmptySession("tab-1");
      const activeTax = taxRates.find(
        (r) => r.is_active === 1 || r.is_active === true,
      );
      if (activeTax) {
        emptyTab.selectedTaxRate = activeTax.id;
      }
      setSessions([emptyTab]);
      setActiveSessionId("tab-1");
      return;
    }
    if (silent || confirm("Bạn có chắc chắn muốn xóa tab này?")) {
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

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentBankInfo, setCurrentBankInfo] = useState(null);
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [successOrder, setSuccessOrder] = useState(null);
  const [isFetchingSuccessOrder, setIsFetchingSuccessOrder] = useState(false);

  const fetchAndShowSuccessModal = useCallback(
    async (orderId) => {
      setIsFetchingSuccessOrder(true);
      try {
        const res = await api.get(`/orders/${orderId}`);
        setSuccessOrder(res.data.data || res.data);
      } catch (error) {
        toast.error("Lỗi khi tải thông tin hóa đơn");
        navigate(`/admin/orders/${orderId}`);
      } finally {
        setIsFetchingSuccessOrder(false);
      }
    },
    [navigate],
  );

  const handleCloseSuccessModal = (shouldCreateNew) => {
    const orderId = successOrder?.id;
    setSuccessOrder(null);
    setCreatedOrderId(null);
    setCurrentBankInfo(null);

    // Silently remove the active session tab since it was successfully converted to an order
    removeTab(null, activeSessionId, true);

    if (!shouldCreateNew && orderId) {
      // Navigate to the order detail page
      navigate(`/admin/orders/${orderId}`);
    }
  };

  useEffect(() => {
    let pollingInterval;

    if (showPaymentModal && currentBankInfo && createdOrderId) {
      pollingInterval = setInterval(async () => {
        try {
          const resp = await checkSepayStatusRequest(
            currentBankInfo.order_code,
            currentBankInfo.amount,
          );

          if (resp && resp.paid) {
            clearInterval(pollingInterval);
            toast.success("Thanh toán thành công! Đơn hàng đã được xác nhận.");
            setShowPaymentModal(false);
            fetchAndShowSuccessModal(createdOrderId);
          }
        } catch (error) {
          console.error("Polling failed:", error);
        }
      }, 5000);
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [
    showPaymentModal,
    currentBankInfo,
    createdOrderId,
    fetchAndShowSuccessModal,
  ]);

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
        const [pm, tr, bc, prod] = await Promise.all([
          api.get("/payment-methods"),
          api.get("/tax-rates"),
          fetchBankConfigRequest(),
          api.get("/products/search", { params: { q: "" } }),
        ]);
        setPaymentMethods(pm.data.data || pm.data);
        const rates = tr.data.data || tr.data;
        setTaxRates(rates);
        setBankConfig(bc.data);
        setSearchResults(prod.data.data || prod.data || []);

        // Tự động chọn thuế đang active cho các tab chưa chọn thuế
        const activeTax = rates.find(
          (r) => r.is_active === 1 || r.is_active === true,
        );
        if (activeTax) {
          setSessions((prev) =>
            prev.map((s) =>
              s.selectedTaxRate === null ||
              s.selectedTaxRate === undefined ||
              s.selectedTaxRate === ""
                ? { ...s, selectedTaxRate: activeTax.id }
                : s,
            ),
          );
        }
      } catch (error) {
        toast.error("Lỗi tải dữ liệu cấu hình");
      }
    };
    fetchData();
  }, []);

  // --- Handlers ---
  const handleProductSearch = useCallback(
    debounce(async (term) => {
      setIsSearching(true);
      try {
        const res = await api.get("/products/search", {
          params: { q: term || "" },
        });
        setSearchResults(res.data.data || res.data || []);
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
        is_taxable: product.is_taxable !== false,
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
  const calculateTaxableSubtotal = () =>
    activeSession.selectedItems.reduce(
      (acc, i) => acc + (i.is_taxable !== false ? i.price * i.quantity : 0),
      0,
    );
  const calculateTax = () => {
    const rate =
      taxRates.find((t) => t.id == activeSession.selectedTaxRate)?.rate || 0;
    const totalSub = calculateSubtotal();
    if (totalSub <= 0) return 0;
    const taxableSub = calculateTaxableSubtotal();
    const discountAmount = activeSession.discountAmount || 0;
    const taxableRatio = taxableSub / totalSub;
    const discountForTaxable = discountAmount * taxableRatio;
    return (Math.max(0, taxableSub - discountForTaxable) * rate) / 100;
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
    if (activeSession.selectedItems.length === 0) {
      toast.error(
        "Vui lòng thêm sản phẩm vào đơn hàng để xem danh sách khuyến mại!",
      );
      return;
    }
    try {
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
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách khuyến mại!");
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

    // BUG FIX: Nếu đã tạo đơn trước đó rồi (do nhân viên tắt QR rồi bấm lại) thì không tạo đơn mới nữa
    if (createdOrderId && currentBankInfo) {
      setShowPaymentModal(true);
      return;
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
      const orderData = res.data.data || res.data;

      const selectedMethod = paymentMethods.find(
        (pm) => pm.id === activeSession.selectedPaymentMethod,
      );

      if (selectedMethod?.code === "bank_transfer") {
        setCreatedOrderId(orderData.id);
        setCurrentBankInfo({
          ...bankConfig,
          amount: calculateTotal(),
          order_code: orderData.code,
        });
        setShowPaymentModal(true);
      } else {
        toast.success("Tạo đơn hàng thành công!");
        fetchAndShowSuccessModal(orderData.id);
      }
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
      <div className="pb-20 max-w-[1400px] mx-auto text-left space-y-6">
        {/* TAB BAR */}
        <div className="bg-slate-50 border border-slate-100 p-2 rounded-2xl flex gap-2 overflow-x-auto no-scrollbar shadow-sm">
          {sessions.map((s) => {
            const isActive = s.id === activeSessionId;
            return (
              <div
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={`group relative flex items-center gap-3 px-5 py-3 rounded-xl cursor-pointer transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 border-t border-blue-400/20"
                    : "bg-white text-slate-500 border border-slate-100 hover:border-blue-200 hover:bg-slate-50/50"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-slate-300 group-hover:bg-blue-400"
                  }`}
                />
                <span className="text-xs font-bold tracking-wide truncate max-w-[100px]">
                  {s.label}
                </span>
                {sessions.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => removeTab(e, s.id)}
                    className={`p-1 rounded-md transition-all duration-200 ${
                      isActive
                        ? "text-blue-200 hover:text-white hover:bg-blue-500/40"
                        : "text-slate-400 hover:text-red-500 hover:bg-red-50"
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
          <button
            onClick={addTab}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-white border border-dashed border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/20 font-bold text-xs transition-all duration-200 shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-blue-500" />
            <span>Đơn mới</span>
          </button>
        </div>

        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Phiên giao dịch
              </p>
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
                  className="text-lg font-extrabold border-b border-blue-500 outline-none bg-transparent py-0.5 text-slate-800 w-44"
                />
              ) : (
                <div className="flex items-center gap-2 group">
                  <span
                    onClick={() => {
                      setEditingTabId(activeSession.id);
                      setEditingLabel(activeSession.label);
                    }}
                    className="text-lg font-extrabold text-slate-800 cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    {activeSession.label}
                  </span>
                  <span
                    className="text-[10px] font-semibold text-slate-300 group-hover:text-slate-400 cursor-pointer hidden sm:inline"
                    onClick={() => {
                      setEditingTabId(activeSession.id);
                      setEditingLabel(activeSession.label);
                    }}
                  >
                    (Nhấp để đổi tên)
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={submitting || activeSession.selectedItems.length === 0}
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 disabled:shadow-none hover:shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all duration-200"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>XÁC NHẬN LÊN ĐƠN HÀNG</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {/* PRODUCT SEARCH */}
            <div className="relative" ref={searchResultsRef}>
              <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all duration-300">
                <Search size={18} className="text-blue-500 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    handleProductSearch(e.target.value);
                  }}
                  onFocus={() => {
                    setShowResults(true);
                    if (!searchTerm && searchResults.length === 0) {
                      handleProductSearch("");
                    }
                  }}
                  placeholder="Tìm kiếm sản phẩm theo tên hoặc mã SKU..."
                  className="flex-1 outline-none text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent font-medium"
                />
                {isSearching && (
                  <Loader2 className="w-4.5 h-4.5 animate-spin text-blue-500" />
                )}
              </div>

              {showResults && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl p-5 max-h-[500px] overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase ">
                      Kết quả tìm kiếm ({searchResults.length})
                    </p>
                    <button
                      onClick={() => setShowResults(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {searchResults.map((p) => (
                        <div
                          key={p.id}
                          className="p-4 bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-white rounded-2xl hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <img
                              src={
                                getImageUrl(p.feature_image) ||
                                getImageUrl(p.images?.[0]?.url) ||
                                "/placeholder-product.png"
                              }
                              className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-100 shrink-0"
                              alt={p.name}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 leading-snug">
                                {p.name}
                              </p>
                              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-semibold rounded">
                                {p.variants?.[0]?.sku || "N/A"}
                              </span>
                            </div>
                          </div>
                          <ProductVariantSelector
                            product={p}
                            onAdd={addItemToOrder}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center text-slate-400 italic">
                      <Search className="w-8 h-8 mx-auto mb-2 opacity-30 text-blue-500" />
                      Không tìm thấy sản phẩm phù hợp
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CART TABLE */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden h-[520px] flex flex-col">
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100/50 rounded-lg">
                    <ShoppingCart size={18} className="text-blue-600" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 tracking-wide uppercase">
                    Giỏ hàng chi tiết
                  </h2>
                </div>
                <span className="bg-blue-100 text-blue-600 text-[13px] font-medium px-3 py-1 rounded-full shadow-sm">
                  {activeSession.selectedItems.length} mặt hàng
                </span>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar">
                {activeSession.selectedItems.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 sticky top-0 bg-slate-50 z-10">
                        <th className="px-6 py-4 text-left">Sản phẩm</th>
                        <th className="px-4 py-4 text-center">Số lượng</th>
                        <th className="px-4 py-4 text-right">Đơn giá</th>
                        <th className="px-6 py-4 text-right">Thành tiền</th>
                        <th className="px-4 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/60">
                      {activeSession.selectedItems.map((item, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={getImageUrl(item.image)}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-sm bg-slate-50"
                                alt={item.product_name}
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-slate-700 text-xs sm:text-sm line-clamp-1 leading-snug">
                                  {item.product_name}
                                </p>
                                <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded">
                                  {item.variant_name}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="inline-flex items-center gap-2  p-1 rounded-full">
                              <button
                                onClick={() => updateQuantity(idx, -1)}
                                className="w-8 h-8 bg-white text-slate-600 border border-slate-200/50 rounded-lg flex items-center justify-center hover:bg-slate-50 hover:text-rose-500 shadow-sm transition-all duration-150 active:scale-90"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-extrabold text-slate-800 text-xs w-5 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(idx, 1)}
                                className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 shadow-sm transition-all duration-150 active:scale-90"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right text-slate-600 text-xs sm:text-sm font-semibold whitespace-nowrap">
                            {formatPrice(item.price)}
                          </td>
                          <td className="px-6 py-4 text-right font-extrabold text-blue-600 text-xs sm:text-sm whitespace-nowrap">
                            {formatPrice(item.price * item.quantity)}
                          </td>
                          <td className="px-4 text-center">
                            <button
                              onClick={() =>
                                updateQuantity(idx, -item.quantity)
                              }
                              className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="h-full flex flex-col justify-center items-center py-20 text-slate-400">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
                      <ShoppingCart className="w-7 h-7 text-blue-500 opacity-70" />
                    </div>
                    <p className="font-bold text-slate-500 text-sm">
                      Giỏ hàng đang trống
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[280px] text-center">
                      Tìm kiếm và thêm sản phẩm từ thanh công cụ phía trên để
                      bắt đầu
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* FULFILLMENT FORM */}
            {activeSession.selectedItems.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100/50">
                  <div className="p-2 bg-blue-100/50 rounded-lg">
                    <Truck className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 uppercase tracking-wide">
                    Hình thức nhận hàng
                  </h3>
                </div>

                {/* Toggle cards */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => patchSession({ fulfillmentType: "pickup" })}
                    className={`flex items-center justify-center gap-3 py-4 rounded-xl border-2 font-extrabold text-xs sm:text-sm transition-all duration-300 ${
                      activeSession.fulfillmentType === "pickup"
                        ? "border-blue-500 bg-blue-50/40 text-blue-700 shadow-sm"
                        : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <span className="text-xl">🏢</span>
                    <span>Tại cửa hàng</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      patchSession({ fulfillmentType: "delivery" })
                    }
                    className={`flex items-center justify-center gap-3 py-4 rounded-xl border-2 font-extrabold text-xs sm:text-sm transition-all duration-300 ${
                      activeSession.fulfillmentType === "delivery"
                        ? "border-blue-500 bg-blue-50/40 text-blue-700 shadow-sm"
                        : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <span className="text-xl">🚚</span>
                    <span>Giao hàng tận nơi</span>
                  </button>
                </div>

                {/* Delivery form */}
                {activeSession.fulfillmentType === "delivery" && (
                  <div className="space-y-4 pt-3 border-t border-slate-100/60 animate-in slide-in-from-top duration-300">
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Thông tin giao hàng chi tiết
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 hover:border-blue-200 focus:bg-white focus:border-blue-500 rounded-xl text-xs font-bold text-slate-700 outline-none transition-all"
                        />
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 hover:border-blue-200 focus:bg-white focus:border-blue-500 rounded-xl text-xs font-bold text-slate-700 outline-none transition-all"
                        />
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
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
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 hover:border-blue-200 focus:bg-white focus:border-blue-500 rounded-xl text-xs font-bold text-slate-700 outline-none resize-none transition-all"
                      />
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 hover:border-blue-200 focus:bg-white focus:border-blue-500 rounded-xl text-xs font-bold text-slate-700 outline-none transition-all"
                      />
                      <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                )}

                {/* Pickup note */}
                {activeSession.fulfillmentType === "pickup" && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100/50 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2 animate-in slide-in-from-top duration-300">
                    <span>✅</span>
                    <span>
                      Khách nhận hàng trực tiếp tại cửa hàng. Miễn phí vận
                      chuyển.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            {/* CUSTOMER SIDEBAR */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 space-y-6">
              {/* Customer section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100/50">
                  <div className="p-2 bg-blue-100/50 rounded-lg">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 uppercase tracking-wide">
                    Khách hàng thành viên
                  </h3>
                </div>

                {activeSession.selectedCustomer ? (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/20 border border-blue-100/50 rounded-xl flex justify-between items-center animate-in fade-in duration-250">
                    <div className="flex items-center gap-3">
                      <img
                        src={getImageUrl(activeSession.selectedCustomer.avatar)}
                        alt=""
                        className="w-10 h-10 rounded-full border-2 border-blue-200 object-cover shadow-sm bg-white"
                        onError={(e) => {
                          e.target.src = "/placeholder-user.png";
                        }}
                      />
                      <div className="min-w-0">
                        <p className="font-extrabold text-xs sm:text-sm text-blue-900 leading-tight truncate">
                          {activeSession.selectedCustomer.name}
                        </p>
                        <p className="text-[10px] sm:text-xs font-semibold text-blue-600 mt-0.5">
                          {activeSession.selectedCustomer.customer_profile
                            ?.phone || "Không có SĐT"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => patchSession({ selectedCustomer: null })}
                      className="p-1.5 rounded-lg text-blue-400 hover:text-rose-500 hover:bg-rose-50 transition-all duration-150 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                      placeholder="Tìm kiếm tài khoản thành viên..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 hover:border-blue-200 focus:bg-white focus:border-blue-500 rounded-xl text-xs font-bold text-slate-700 outline-none transition-all"
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                    {customerSearchResults.length > 0 && (
                      <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-50 max-h-[180px] overflow-y-auto divide-y divide-slate-50 animate-in fade-in duration-200">
                        {customerSearchResults.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => selectCustomer(c)}
                            className="w-full p-3 text-left hover:bg-blue-50/50 flex items-center gap-3 transition-colors"
                          >
                            <img
                              src={getImageUrl(c.avatar)}
                              alt=""
                              className="w-8 h-8 rounded-full border border-slate-100 object-cover bg-slate-50"
                              onError={(e) => {
                                e.target.src = "/placeholder-user.png";
                              }}
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-700 text-xs truncate">
                                {c.name}
                              </p>
                              <p className="text-slate-400 text-[10px] mt-0.5">
                                SĐT: {c.customer_profile?.phone || "N/A"}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
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
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all"
                    />
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
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
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all"
                    />
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Tax section */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-blue-500" />
                  <span>Thuế suất áp dụng</span>
                </label>
                <SelectSearch
                  placeholder="Chọn thuế"
                  options={taxRates
                    ?.filter((t) => t.is_active)
                    ?.map((t) => ({
                      label: `${t.name}`,
                      value: t.id,
                    }))}
                  value={activeSession.selectedTaxRate || ""}
                  onChange={(val) => patchSession({ selectedTaxRate: val })}
                />
              </div>

              {/* Promotion button */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    fetchEligiblePromotions();
                  }}
                  className="w-full py-3 border-2 border-dashed border-slate-200 hover:border-blue-300 hover:text-blue-600 rounded-xl text-[10px] text-slate-500 font-extrabold uppercase transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {isLoadingEligible ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  ) : (
                    <Tag className="w-4 h-4 text-blue-500" />
                  )}
                  <span>Danh sách mã giảm giá</span>
                </button>
              </div>

              {/* Payment methods */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  <span>Phương thức thanh toán</span>
                </h4>
                <SelectSearch
                  placeholder="Chọn phương thức thanh toán"
                  options={paymentMethods
                    .filter((pm) => pm.code !== "vnpay")
                    .map((pm) => ({
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

              {/* Order breakdown */}
              <div className="space-y-3.5 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Tạm tính</span>
                  <span className="text-slate-800">
                    {formatPrice(calculateSubtotal())}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Thuế suất</span>
                  <span className="text-slate-800">
                    {formatPrice(calculateTax())}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Phí ship</span>
                  <span className="text-slate-800">
                    {activeSession.fulfillmentType === "delivery"
                      ? formatPrice(Number(activeSession.shippingFee) || 0)
                      : "Miễn phí"}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-extrabold text-rose-500">
                  <span>Khuyến mại</span>
                  <span>-{formatPrice(activeSession.discountAmount)}</span>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-extrabold text-[11px] text-slate-600 tracking-wider">
                    TỔNG CỘNG
                  </span>
                  <span className="text-lg font-black text-blue-600 tracking-tight">
                    {formatPrice(calculateTotal())}
                  </span>
                </div>

                <div className="flex gap-2 h-10 mt-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={activeSession.promotionCode}
                      onChange={(e) =>
                        patchSession({
                          promotionCode: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="Mã giảm giá..."
                      className="w-full h-full pl-3.5 pr-8 bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs font-bold uppercase outline-none transition-all"
                    />
                    {(activeSession.promotionCode ||
                      activeSession.appliedPromotion) && (
                      <button
                        onClick={handleClearPromotion}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        title="Gỡ bỏ"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => applyPromotion()}
                    disabled={
                      isApplyingPromotion || !activeSession.promotionCode
                    }
                    className="px-4 h-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold uppercase hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-100 disabled:text-slate-400 disabled:shadow-none transition-all flex items-center justify-center min-w-[85px] active:scale-95 shadow-sm"
                  >
                    {isApplyingPromotion ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Áp dụng"
                    )}
                  </button>
                </div>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-600 uppercase">
                  Ghi chú đơn hàng
                </h4>
                <textarea
                  value={activeSession.note}
                  onChange={(e) => patchSession({ note: e.target.value })}
                  placeholder="Nhập ghi chú cho đơn hàng..."
                  rows="3"
                  className="w-full text-xs font-semibold p-4 bg-slate-50 border border-slate-100 hover:border-blue-200 focus:bg-white focus:border-blue-500 rounded-xl outline-none resize-none transition-all"
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

      <BankPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        bankInfo={currentBankInfo}
      />

      <OrderSuccessModal
        isOpen={!!successOrder}
        onClose={handleCloseSuccessModal}
        order={successOrder}
      />
    </AdminLayout>
  );
};

const BankPaymentModal = ({ isOpen, onClose, bankInfo }) => {
  if (!isOpen || !bankInfo) return null;

  const qrUrl = `https://qr.sepay.vn/img?bank=${bankInfo.bank_id}&acc=${bankInfo.account_no}&template=compact&amount=${bankInfo.amount}&des=${bankInfo.order_code}`;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        // Chặn việc bấm ra ngoài để đóng modal (tránh việc chưa trả tiền đã tắt mã)
      />
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100 text-left">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
          <h3 className="text-xl font-bold">Thanh toán chuyển khoản</h3>
          <p className="text-blue-100 text-xs mt-1 font-medium">
            Quét mã QR bằng ứng dụng ngân hàng của bạn
          </p>
        </div>

        <div className="p-8 flex flex-col items-center">
          <div className="relative p-4 bg-white rounded-2xl shadow-lg border border-slate-100 mb-6 group">
            <img
              src={qrUrl}
              alt="SePay QR"
              className="w-60 h-60 object-contain transition-transform group-hover:scale-105 duration-300"
            />
            <div className="absolute inset-0 border-2 border-blue-500/20 rounded-2xl pointer-events-none" />
          </div>

          <div className="w-full space-y-3.5">
            <div className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                Số tiền:
              </span>
              <span className="text-blue-600 font-extrabold text-sm sm:text-base">
                {formatPrice(bankInfo.amount)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                Nội dung chuyển khoản:
              </span>
              <span className="text-indigo-600 font-extrabold text-sm tracking-wider uppercase">
                {bankInfo.order_code}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs sm:text-sm font-bold animate-pulse">
                Đang chờ thanh toán tự động...
              </span>
            </div>
            <p className="text-[10px] text-slate-400 text-center max-w-[270px] leading-relaxed">
              Hệ thống sẽ tự động xác nhận sau khi nhận được giao dịch. Vui lòng
              giữ nguyên màn hình này.
            </p>
          </div>

          <button
            onClick={onClose}
            className="mt-6 text-slate-400 hover:text-rose-500 text-[10px] font-extrabold uppercase tracking-widest transition-colors underline underline-offset-4"
          >
            Quay lại và thanh toán sau
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderCreatePage;
