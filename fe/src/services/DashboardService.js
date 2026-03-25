import axiosInstance from "../api/axios";

export const getDashboardStatisticsRequest = (params) => {
  return axiosInstance.get("/dashboard/statistics", { params });
};
