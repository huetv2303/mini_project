import React from "react";
import { formatPrice } from "../../../../helper/helper";

const POSReceipt = ({ order, cashierName = "Admin" }) => {
  if (!order) return null;

  // Normalize fields between backend and frontend structures
  const code = order.code || order.id || "HD-XXXX";
  const items = order.items || order.order_items || [];
  const createdAt = order.created_at || new Date().toISOString();
  const customerName =
    order.customer_name || order.customer?.name || "Khách vãng lai";
  const customerPhone =
    order.customer_phone ||
    order.customer?.phone ||
    order.recipient_phone ||
    "";

  const subtotal = items.reduce(
    (acc, item) => {
      const qty = Number(item.quantity) - (Number(item.returned_quantity) || 0);
      return acc + Number(item.price) * Math.max(0, qty);
    },
    0,
  );

  const discountAmount = Number(order.discount_amount) || 0;
  const taxRate = Number(order.tax_rate_snapshot) || 0;
  const taxAmount = taxRate > 0 
    ? Math.max(0, subtotal - discountAmount) * (taxRate / 100)
    : Number(order.tax_amount) || 0;

  const shippingFee = Number(order.shipping_fee) || 0;
  const total = Math.max(0, subtotal + taxAmount + shippingFee - discountAmount);

  const paymentMethod =
    order.payment_method?.name || order.payment_method_name || "Tiền mặt";

  const formattedDate = new Date(createdAt).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="receipt-container select-none">
      <style>{`
        .receipt-container {
          max-width: 80mm;
          width: 100%;
          margin: 0 auto;
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #000;
          background: #fff;
          padding: 8px;
          box-sizing: border-box;
        }
        .receipt-header {
          text-align: center;
          margin-bottom: 12px;
        }
        .receipt-header h2 {
          font-size: 16px;
          font-weight: 800;
          margin: 0 0 4px 0;
          text-transform: uppercase;
        }
        .receipt-header p {
          font-size: 9.5px;
          margin: 2px 0;
          color: #333;
          line-height: 1.3;
        }
        .receipt-divider {
          border-top: 1px dashed #000;
          margin: 8px 0;
        }
        .receipt-title {
          text-align: center;
          margin: 8px 0;
        }
        .receipt-title h3 {
          font-size: 12px;
          font-weight: 700;
          margin: 0;
          text-transform: uppercase;
        }
        .receipt-title p {
          font-size: 9px;
          font-weight: 600;
          margin: 2px 0 0 0;
        }
        .receipt-meta {
          font-size: 9.5px;
          margin: 8px 0;
        }
        .receipt-meta-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .receipt-meta-label {
          color: #444;
        }
        .receipt-meta-value {
          font-weight: 600;
        }
        .receipt-table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          font-size: 9.5px;
        }
        .receipt-table th {
          border-bottom: 1px solid #000;
          padding: 6px 0;
          font-weight: 700;
        }
        .receipt-table td {
          padding: 6px 0;
          vertical-align: top;
        }
        .item-qty {
          text-align: center;
          width: 40px;
        }
        .item-total {
          text-align: right;
          font-weight: 600;
        }
        .item-variant {
          font-size: 8.5px;
          color: #666;
          font-style: italic;
          margin-top: 1px;
        }
        .receipt-summary {
          font-size: 9.5px;
          margin: 8px 0;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .summary-total {
          display: flex;
          justify-content: space-between;
          font-size: 11.5px;
          font-weight: 600;
          padding-top: 4px;
        }
        .receipt-footer {
          text-align: center;
          margin-top: 12px;
          font-size: 9.5px;
        }
        .qr-container {
          display: flex;
          justify-content: center;
          margin: 10px 0;
        }
        .qr-box {
          padding: 4px;
          border: 1px solid #ddd;
          background: #fff;
          display: inline-block;
        }
        .qr-image {
          width: 90px;
          height: 90px;
          display: block;
        }
        
        @media print {
          @page {
            size: auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background-color: #fff;
            color: #000;
          }
          .receipt-container {
            padding: 4mm !important;
            width: 80mm !important;
            box-sizing: border-box !important;
            margin: 0 auto !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="receipt-header">
        <h2 className="text-[10px]">THE TRENDORA</h2>
        <p className="text-[10px]">Cửa Hàng Thời Trang FASHION</p>
        <p className="text-[10px]">
          Địa chỉ: 17 XÓM ĐIẾM - XÃ ĐẠI THANH - HỮU TỪ - HÀ NỘI
        </p>
        <p className="text-[10px]">Hotline: 0335304882 </p>
      </div>

      <div className="receipt-divider" />

      {/* Title */}
      <div className="receipt-title">
        <h3>HÓA ĐƠN BÁN LẺ</h3>
        <p>Số: {code}</p>
      </div>

      {/* Meta */}
      <div className="receipt-meta">
        <div className="receipt-meta-row">
          <span className="receipt-meta-label">Ngày mua:</span>
          <span className="receipt-meta-value">{formattedDate}</span>
        </div>
        <div className="receipt-meta-row">
          <span className="receipt-meta-label">Thu ngân:</span>
          <span className="receipt-meta-value">{cashierName}</span>
        </div>
        <div className="receipt-meta-row">
          <span className="receipt-meta-label">Khách hàng:</span>
          <span className="receipt-meta-value">{customerName}</span>
        </div>
        {customerPhone && (
          <div className="receipt-meta-row">
            <span className="receipt-meta-label">Điện thoại:</span>
            <span className="receipt-meta-value">{customerPhone}</span>
          </div>
        )}
      </div>

      <div className="receipt-divider" />

      {/* Table */}
      <table className="receipt-table">
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Tên SP</th>
            <th className="item-qty">SL</th>
            <th style={{ textAlign: "right" }}>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const name = item.product_name || item.product?.name || "Sản phẩm";
            const variantName =
              item.variant_name ||
              item.variant?.attributes
                ?.map((a) => a.attribute_value)
                .join(" / ") ||
              "";
            const qty = Number(item.quantity) - (Number(item.returned_quantity) || 0);
            if (qty <= 0) return null;
            const price = Number(item.price) || 0;
            const totalItemPrice = price * qty;

            return (
              <tr key={idx}>
                <td>
                  <div>{name}</div>
                  {variantName && (
                    <div className="item-variant">- {variantName}</div>
                  )}
                </td>
                <td className="item-qty">{qty}</td>
                <td className="item-total">{formatPrice(totalItemPrice)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="receipt-divider" />

      {/* Summary */}
      <div className="receipt-summary">
        <div className="summary-row">
          <span>Cộng tiền hàng:</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="summary-row" style={{ fontWeight: "600" }}>
            <span>Chiết khấu (Khuyến mãi):</span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}
        {(taxAmount > 0 || taxRate > 0) && (
          <div className="summary-row">
            <span>Thuế GTGT (VAT {taxRate}%):</span>
            <span>{formatPrice(taxAmount)}</span>
          </div>
        )}
        {shippingFee > 0 && (
          <div className="summary-row">
            <span>Phí vận chuyển:</span>
            <span>{formatPrice(shippingFee)}</span>
          </div>
        )}
        <div className="receipt-divider" />
        <div className="summary-total">
          <span>TỔNG CỘNG:</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      <div className="receipt-divider" />

      {/* Footer */}
      <div className="receipt-footer">
        <p style={{ margin: "4px 0" }}>
          Hình thức thanh toán:{" "}
          <strong style={{ textTransform: "uppercase" }}>
            {paymentMethod}
          </strong>
        </p>

        <p style={{ fontStyle: "italic", margin: "6px 0" }}>
          Cảm ơn quý khách và hẹn gặp lại!
        </p>
        <p
          style={{
            fontSize: "8px",
            color: "#888",
            letterSpacing: "1px",
            margin: "4px 0",
          }}
        >
          Powered by The Trendora
        </p>
      </div>
    </div>
  );
};

export default POSReceipt;
