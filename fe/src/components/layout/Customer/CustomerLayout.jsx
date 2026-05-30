import React from "react";
import CustomerNavbar from "./CustomerNavbar";
import CustomerFooter from "./CustomerFooter";

import { useAuth } from "../../../context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

const CustomerLayout = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (!loading && isAuthenticated) {
    const isAdminOrStaff = user?.role?.code === "admin" || user?.role?.code === "staff";
    if (isAdminOrStaff) {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  const pageTransitionStyle = `
    @keyframes pageTransitionFadeIn {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .page-transition-wrapper {
      animation: pageTransitionFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
  `;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <CustomerNavbar />
      <main key={location.pathname} className="flex-grow page-transition-wrapper">
        <style>{pageTransitionStyle}</style>
        {children}
      </main>
      <CustomerFooter />
    </div>
  );
};

export default CustomerLayout;
