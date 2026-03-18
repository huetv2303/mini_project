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

const App = () => {
  return (
    <AuthProvider>
      <Toaster position="top-right" reverseOrder={false} />
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

          <Route
            path="/"
            element={
              <AuthGuard>
                <Home />
              </AuthGuard>
            }
          />

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
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
