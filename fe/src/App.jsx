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

import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminProfile from "./pages/Admin/AdminProfile";

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
import { AuthProvider } from "./context/AuthContext";

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <BuyNowProvider>

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
                path="/wishlist"
                element={
                  <Wishlist />
                }
              />

              <Route
                path="/promotions"
                element={
                  <Promotions />
                }
              />

              <Route
                path="/checkout"
                element={
                  <Checkout />
                }
              />

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
                element={
                  <OrderSuccess />
                }
              />
              
              <Route
                path="/checkout/vnpay-callback"
                element={
                  <VNPayCallback />
                }
              />


              <Route
                path="/admin/dashboard"
                element={
                  <AuthGuard>
                    <RoleGuard permission="admin.manage">
                      <AdminDashboard />
                    </RoleGuard>
                  </AuthGuard>
                }
              />
              <Route
                path="/admin/profile"
                element={
                  <AuthGuard>
                    <RoleGuard permission="admin.manage">
                      <AdminProfile />
                    </RoleGuard>
                  </AuthGuard>
                }
              />
              <Route
                path="/admin/change-password"
                element={
                  <AuthGuard>
                    <RoleGuard permission="admin.manage">
                      <AdminProfile />
                    </RoleGuard>
                  </AuthGuard>
                }
              />

              <Route
                path="/admin/categories"
                element={
                  <AuthGuard>
                    <RoleGuard permission="admin.manage">
                      <CategoryListPage />
                    </RoleGuard>
                  </AuthGuard>
                }
              />

              <Route
                path="/admin/categories/create"
                element={
                  <AuthGuard>
                    <RoleGuard permission="admin.manage">
                      <CategoryForm />
                    </RoleGuard>
                  </AuthGuard>
                }
              />

              <Route
                path="/admin/categories/edit/:slug"
                element={
                  <AuthGuard>
                    <RoleGuard permission="admin.manage">
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
                    <RoleGuard permission="admin.manage">
                      <CustomerListPage />
                    </RoleGuard>
                  </AuthGuard>
                }
              />

              {/* Suppliers */}
              <Route
                path="/admin/suppliers"
                element={
                  <AuthGuard>
                    <RoleGuard permission="admin.manage">
                      <SupplierListPage />
                    </RoleGuard>
                  </AuthGuard>
                }
              />

              <Route
                path="/admin/suppliers/create"
                element={
                  <AuthGuard>
                    <RoleGuard permission="admin.manage">
                      <SupplierForm />
                    </RoleGuard>
                  </AuthGuard>
                }
              />

              <Route
                path="/admin/suppliers/edit/:slug"
                element={
                  <AuthGuard>
                    <RoleGuard permission="admin.manage">
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
                    <RoleGuard permission="admin.manage">
                      <ProductListPage />
                    </RoleGuard>
                  </AuthGuard>
                }
              />

              <Route
                path="/admin/products/create"
                element={
                  <AuthGuard>
                    <RoleGuard permission="admin.manage">
                      <ProductForm />
                    </RoleGuard>
                  </AuthGuard>
                }
              />

              <Route
                path="/admin/products/edit/:slug"
                element={
                  <AuthGuard>
                    <RoleGuard permission="admin.manage">
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
                    <RoleGuard permission="admin.manage">
                      <OrderListPage />
                    </RoleGuard>
                  </AuthGuard>
                }
              />

              <Route
                path="/admin/orders/create"
                element={
                  <AuthGuard>
                    <RoleGuard permission="admin.manage">
                      <OrderCreatePage />
                    </RoleGuard>
                  </AuthGuard>
                }
              />

              <Route
                path="/admin/orders/:id"
                element={
                  <AuthGuard>
                    <RoleGuard permission="admin.manage">
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
                    <RoleGuard permission="admin.manage">
                      <OrderReturnListPage />
                    </RoleGuard>
                  </AuthGuard>
                }
              />

              <Route
                path="/admin/order-returns/:id"
                element={
                  <AuthGuard>
                    <RoleGuard permission="admin.manage">
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
                    <RoleGuard permission="admin.manage">
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
            </Routes>
          </Router>
          </BuyNowProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
