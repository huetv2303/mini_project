import React from "react";
import CustomerNavbar from "./CustomerNavbar";
import CustomerFooter from "./CustomerFooter";

import { useAuth } from "../../../context/AuthContext";
import { Navigate } from "react-router-dom";

const CustomerLayout = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (!loading && isAuthenticated) {
    const isAdminOrStaff = user?.role?.code === "admin" || user?.role?.code === "staff";
    if (isAdminOrStaff) {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <CustomerNavbar />
      <main className="flex-grow">
        {children}
      </main>
      <CustomerFooter />
    </div>
  );
};

export default CustomerLayout;
