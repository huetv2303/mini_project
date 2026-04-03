import api from "../api/axios";

const TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setToken = ({ access_token, refresh_token }) => {
  localStorage.setItem(TOKEN_KEY, access_token);
  if (refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const loginRequest = (email, password) => {
  return api.post("/login", { email, password });
};

export const registerRequest = (name, email, password, password_confirmation) => {
  return api.post("/register", { name, email, password, password_confirmation });
};

export const logoutRequest = async () => {
  try {
    await api.post("/logout");
  } finally {
    clearAuth();
  }
};

export const fetchUserRequest = () => api.get("/user");

export const refreshTokenRequest = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");
  const response = await api.post("/auth/refresh", {
    refresh_token: refreshToken,
  });
  setToken(response.data);
  return response.data.access_token;
};

export const resendVerificationRequest = (email) => {
  return api.post("/email/resend", { email });
};

export const changePasswordRequest = (payload) => {
  return api.post("/change-password", payload);
};
