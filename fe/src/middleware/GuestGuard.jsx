import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

const GuestGuard = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    // Check if the user is an admin by role code or ID
    const isAdmin = user?.role?.code === "admin" || user?.role_id === 1;
    return <Navigate to={isAdmin ? "/admin/dashboard" : "/"} replace />;
  }

  return children;
};

export default GuestGuard;
