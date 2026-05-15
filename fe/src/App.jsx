import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Auth Components
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import VerifyEmail from "./components/Auth/VerifyEmail";

// Page Components
import Home from "./pages/Home";
import Profile from "./pages/Customer/Profile";
import ProductList from "./pages/Customer/ProductList";
import ProductDetail from "./pages/Customer/ProductDetail";
import Wishlist from "./pages/Customer/Wishlist";
import Promotions from "./pages/Customer/Promotions";
import Checkout from "./pages/Customer/Checkout";
import MyOrders from "./pages/Customer/MyOrders";
import MyOrderDetails from "./pages/Customer/MyOrderDetails";
import OrderSuccess from "./pages/Customer/OrderSuccess";
import VNPayCallback from "./pages/Customer/VNPayCallback";
import WalletPage from "./pages/Customer/WalletPage";

import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminProfile from "./pages/Admin/AdminProfile";
import ReviewManagement from "./pages/Admin/review/ReviewManagement";
import MyReviews from "./pages/Customer/MyReviews";

// Auth & Route Guards
import RoleGuard from "./middleware/RoleGuard";
import AuthGuard from "./middleware/AuthGuard";
import GuestGuard from "./middleware/GuestGuard";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { BuyNowProvider } from "./context/BuyNowContext";

import CategoryListPage from "./pages/Admin/category/CategoryListPage";
import CategoryForm from "./pages/Admin/category/CategoryForm";
import SupplierListPage from "./pages/Admin/supplier/SupplierListPage";
import SupplierForm from "./pages/Admin/supplier/SupplierForm";
import ProductListPage from "./pages/Admin/product/ProductListPage";
import ProductForm from "./pages/Admin/product/ProductForm";
import OrderListPage from "./pages/Admin/order/OrderListPage";
import OrderDetailsPage from "./pages/Admin/order/OrderDetailsPage";
import OrderCreatePage from "./pages/Admin/order/OrderCreatePage";
import InventoryListPage from "./pages/Admin/inventory/InventoryListPage";
import OrderReturnListPage from "./pages/Admin/order/OrderReturnListPage";
import OrderReturnDetailsPage from "./pages/Admin/order/OrderReturnDetailsPage";
import ShippingMethodPage from "./pages/Admin/shipping/ShippingMethodPage";
import TaxRatePage from "./pages/Admin/tax/TaxRatePage";
import PaymentResultPage from "./pages/Admin/order/PaymentResultPage";
import PaymentMethodPage from "./pages/Admin/payment/PaymentMethodPage";
import PromotionPage from "./pages/Admin/promotion/PromotionPage";
import PromotionFormPage from "./pages/Admin/promotion/PromotionFormPage";
import CustomerListPage from "./pages/Admin/customer/CustomerListPage";
import StaffListPage from "./pages/Admin/staff/StaffListPage";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import ChatbotWidget from "./components/common/ChatbotWidget";

const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>
          <WishlistProvider>
            <BuyNowProvider>
              {/* ... existing code ... */}

              <Toaster
                position="top-right"
                reverseOrder={false}
                toastOptions={{
                  style: {
                    borderRadius: "24px",
                    background: "#111",
                    color: "#fff",
                    padding: "12px 24px",
                    fontSize: "14px",
                    fontWeight: "600",
                    letterSpacing: "-0.2px",
                    boxShadow: "0 10px 30px -10px rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  },
                  success: {
                    iconTheme: {
                      primary: "#22c55e",
                      secondary: "#fff",
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: "#ef4444",
                      secondary: "#fff",
                    },
                  },
                }}
              />
              <Router>
                <Routes>
                  {/* ... routes ... */}
                  <Route
                    path="/login"
                    element={
                      <GuestGuard>
                        <Login />
                      </GuestGuard>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <GuestGuard>
                        <Register />
                      </GuestGuard>
                    }
                  />
                  <Route
                    path="/verify-email"
                    element={
                      <GuestGuard>
                        <VerifyEmail />
                      </GuestGuard>
                    }
                  />
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<ProductList />} />
                  <Route path="/products/:slug" element={<ProductDetail />} />
                  <Route path="/categories" element={<ProductList />} />
                  <Route
                    path="/profile"
                    element={
                      <AuthGuard>
                        <Profile />
                      </AuthGuard>
                    }
                  />
                    <Route
                    path="/my-wallet"
                    element={
                      <AuthGuard>
                        <WalletPage />
                      </AuthGuard>
                    }
                  />

                  <Route
                    path="/my-reviews"
                    element={
                      <AuthGuard>
                        <MyReviews />
                      </AuthGuard>
                    }
                  />

                  <Route path="/wishlist" element={<Wishlist />} />

                  <Route path="/promotions" element={<Promotions />} />

                  <Route path="/checkout" element={<Checkout />} />

                  <Route
                    path="/orders"
                    element={
                      <AuthGuard>
                        <MyOrders />
                      </AuthGuard>
                    }
                  />

                  <Route
                    path="/orders/:id"
                    element={
                      <AuthGuard>
                        <MyOrderDetails />
                      </AuthGuard>
                    }
                  />

                  <Route
                    path="/orders/:id/success"
                    element={<OrderSuccess />}
                  />

                  <Route
                    path="/checkout/vnpay-callback"
                    element={<VNPayCallback />}
                  />

                  <Route
                    path="/admin/dashboard"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="dashboard.view">
                          <AdminDashboard />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/admin/profile"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="dashboard.view">
                          <AdminProfile />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/admin/change-password"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="dashboard.view">
                          <AdminProfile />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />

                  <Route
                    path="/admin/categories"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="categories.view">
                          <CategoryListPage />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />

                  <Route
                    path="/admin/categories/create"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="categories.manage">
                          <CategoryForm />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />

                  <Route
                    path="/admin/categories/edit/:slug"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="categories.manage">
                          <CategoryForm />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />

                  {/* Customers */}
                  <Route
                    path="/admin/customers"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="users.view">
                          <CustomerListPage />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />

                  {/* Staff */}
                  <Route
                    path="/admin/staff"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="admin.manage">
                          <StaffListPage />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />

                  {/* Suppliers */}
                  <Route
                    path="/admin/suppliers"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="suppliers.view">
                          <SupplierListPage />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />

                  <Route
                    path="/admin/suppliers/create"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="suppliers.manage">
                          <SupplierForm />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />

                  <Route
                    path="/admin/suppliers/edit/:slug"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="suppliers.manage">
                          <SupplierForm />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />

                  {/* Products */}
                  <Route
                    path="/admin/products"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="products.view">
                          <ProductListPage />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />

                  <Route
                    path="/admin/products/create"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="products.create">
                          <ProductForm />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />

                  <Route
                    path="/admin/products/edit/:slug"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="products.edit">
                          <ProductForm />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />

                  {/* Orders */}
                  <Route
                    path="/admin/orders"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="orders.view">
                          <OrderListPage />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />

                  <Route
                    path="/admin/orders/create"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="orders.edit">
                          <OrderCreatePage />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />

                  <Route
                    path="/admin/orders/:id"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="orders.view">
                          <OrderDetailsPage />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />

                  <Route
                    path="/admin/payment-result"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="admin.manage">
                          <PaymentResultPage />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />

                  <Route
                    path="/admin/order-returns"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="orders.view">
                          <OrderReturnListPage />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />

                  <Route
                    path="/admin/order-returns/:id"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="orders.view">
                          <OrderReturnDetailsPage />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />

                  {/* Inventory / Warehouse */}
                  <Route
                    path="/admin/inventory"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="inventory.manage">
                          <InventoryListPage />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />

                  {/* Shipping Methods */}
                  <Route
                    path="/admin/shipping-methods"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="admin.manage">
                          <ShippingMethodPage />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />
                  {/* Tax Rates */}
                  <Route
                    path="/admin/tax-rates"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="admin.manage">
                          <TaxRatePage />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />

                  {/* Payment Methods */}
                  <Route
                    path="/admin/payment-methods"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="admin.manage">
                          <PaymentMethodPage />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />

                  {/* Promotions */}
                  <Route
                    path="/admin/promotions"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="admin.manage">
                          <PromotionPage />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/admin/promotions/create"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="admin.manage">
                          <PromotionFormPage />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/admin/promotions/edit/:id"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="admin.manage">
                          <PromotionFormPage />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/admin/reviews"
                    element={
                      <AuthGuard>
                        <RoleGuard permission="admin.manage">
                          <ReviewManagement />
                        </RoleGuard>
                      </AuthGuard>
                    }
                  />
                </Routes>
                <ChatbotWidget />
              </Router>
            </BuyNowProvider>
          </WishlistProvider>
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
