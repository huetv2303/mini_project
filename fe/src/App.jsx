import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Auth Components
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import VerifyEmail from "./components/Auth/VerifyEmail";

// Page Components
import Home from "./pages/Home";
import AdminDashboard from "./pages/Admin/AdminDashboard";

// Auth & Route Guards
import { AuthProvider } from "./context/AuthContext";
import AuthGuard from "./middleware/AuthGuard";
import GuestGuard from "./middleware/GuestGuard";
import RoleGuard from "./middleware/RoleGuard";
import { Toaster } from "react-hot-toast";
import CategoryListPage from "./pages/Admin/category/CategoryListPage";
import CategoryForm from "./pages/Admin/category/CategoryForm";
import SupplierListPage from "./pages/Admin/supplier/SupplierListPage";
import SupplierForm from "./pages/Admin/supplier/SupplierForm";

const App = () => {
  return (
    <AuthProvider>
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
          {/* 
          <Route
            path="/"
            element={
              <AuthGuard>
                <Home />
              </AuthGuard>
            }
          /> */}

          <Route
            path="/admin"
            element={
              <AuthGuard>
                <RoleGuard permission="admin.manage">
                  <AdminDashboard />
                </RoleGuard>
              </AuthGuard>
            }
          />

          <Route
            path="/admin/categories"
            element={
              <AuthGuard>
                <RoleGuard>
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
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
