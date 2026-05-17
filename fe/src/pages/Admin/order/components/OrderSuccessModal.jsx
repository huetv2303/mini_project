import React, { useRef } from "react";
import { CheckCircle2, Printer, Plus, X } from "lucide-react";
import POSReceipt from "./POSReceipt";
import { formatPrice } from "../../../../helper/helper";

const OrderSuccessModal = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  const printFrameRef = useRef(null);

  const handlePrint = () => {
    const iframe = printFrameRef.current;
    if (!iframe) return;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    // Get the HTML content of the receipt
    const receiptHtml = document.getElementById(
      "pos-receipt-print-area",
    ).innerHTML;

    iframeDoc.open();
    iframeDoc.write(`
      <html>
        <head>
          <title>In Hóa Đơn - ${order.code || order.id}</title>
        </head>
        <body style="margin: 0; padding: 0; background: #fff; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh;">
          ${receiptHtml}
          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    iframeDoc.close();
  };

  const code = order.code || order.id || "HD-XXXX";
  const items = order.items || order.order_items || [];
  const subtotal =
    Number(order.subtotal) ||
    items.reduce(
      (acc, item) => acc + Number(item.price) * Number(item.quantity),
      0,
    );
  const discountAmount = Number(order.discount_amount) || 0;
  const taxAmount = Number(order.tax_amount) || 0;
  const shippingFee = Number(order.shipping_fee) || 0;
  const total =
    Number(order.total) || subtotal + taxAmount + shippingFee - discountAmount;

  const paymentMethod =
    order.payment_method?.name || order.payment_method_name || "Tiền mặt";
  const customerName =
    order.customer_name || order.customer?.name || "Khách vãng lai";

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Main Container */}
      <div className="relative bg-gray-50 w-full max-w-4xl h-[90vh] rounded-lg shadow-lg overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-300">
        {/* Left Side: Success Message & Actions */}
        <div className="flex-1 p-8 flex flex-col justify-between bg-white">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-3 bg-emerald-50 rounded-2xl">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Lên đơn thành công!</h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Đơn hàng đã được lưu nhận trên hệ thống
                </p>
              </div>
            </div>

            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Mã đơn hàng:</span>
                <span className="text-gray-900 font-bold uppercase tracking-wider">
                  {code}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Khách hàng:</span>
                <span className="text-gray-900 font-bold">{customerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Phương thức:</span>
                <span className="text-gray-900 font-semibold">
                  {paymentMethod}
                </span>
              </div>
              <div className="border-t border-dashed border-gray-200 my-2" />
              <div className="flex justify-between items-center text-sm pt-1">
                <span className="text-gray-900 font-bold">
                  Tổng thanh toán:
                </span>
                <span className="text-blue-600 font-black text-base">
                  {formatPrice(total)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-8">
            <button
              onClick={handlePrint}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-blue-700 active:scale-98 transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              In Hóa Đơn K80 (80mm)
            </button>

            <button
              onClick={() => onClose(true)}
              className="w-full py-4 bg-black text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-gray-800 active:scale-98 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tiếp tục tạo đơn mới
            </button>

            <button
              onClick={() => onClose(false)}
              className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-gray-200 active:scale-98 transition flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Đóng và xem chi tiết
            </button>
          </div>
        </div>

        {/* Right Side: Invoice Receipt Live Preview */}
        <div className="w-full md:w-[380px] bg-gray-100 border-l border-gray-200/50 p-6 flex flex-col justify-between overflow-hidden">
          <span className="text-[15px] text-gray-400 font-semibold  mb-3 block text-center">
            Bản xem trước khi in hóa đơn
          </span>

          <div className="flex-1 overflow-y-auto custom-scrollbar rounded-2xl shadow-inner bg-white border border-gray-200 max-w-[340px] mx-auto w-full">
            <div id="pos-receipt-print-area">
              <POSReceipt order={order} />
            </div>
          </div>
        </div>
      </div>

      {/* Hidden iframe for background printing */}
      <iframe
        ref={printFrameRef}
        style={{ display: "none" }}
        title="Print Frame"
      />
    </div>
  );
};

export default OrderSuccessModal;
