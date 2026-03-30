import React, { createContext, useState, useContext, useEffect } from "react";
import {
  clearAuth,
  fetchUserRequest,
  getToken,
  loginRequest,
  logoutRequest,
  registerRequest,
  resendVerificationRequest,
  setToken,
} from "../services/AuthService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = React.useCallback(async () => {
    try {
      const response = await fetchUserRequest();
      const userData = response.data.data || response.data;
      setUser(userData);
      return userData; // <-- Return userData
    } catch (error) {
      clearAuth();
      setUser(null);
      throw error; // <-- Rethrow to handle in then/catch
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getToken()) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const login = async (email, password) => {
    const response = await loginRequest(email, password);
    setToken(response.data);
    const userData = response.data.user.data || response.data.user;
    setUser(userData);
    return response.data;
  };

  const register = async (name, email, password, password_confirmation) => {
    const response = await registerRequest(
      name,
      email,
      password,
      password_confirmation,
    );
    return response.data;
  };

  const logout = async () => {
    await logoutRequest();
    setUser(null);
  };

  const resendVerification = async (email) => {
    const response = await resendVerificationRequest(email);
    return response.data;
  };

  const hasPermission = (permissionCode) => {
    if (!user) return false;

    // Handle potential data wrapping from Laravel resources
    const roleData = user.role?.data || user.role;
    const permissions = roleData?.permissions?.data || roleData?.permissions;

    if (!permissions || !Array.isArray(permissions)) return false;

    return permissions.some((p) => p.code === permissionCode);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        resendVerification,
        hasPermission,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải dùng trong AuthProvider");
  return ctx;
};
