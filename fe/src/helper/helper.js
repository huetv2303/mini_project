export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const url = (
    import.meta.env.VITE_URL_IMAGE || "http://localhost:8000/storage"
  ).replace(/\/$/, "");
  return `${url}/${path.replace(/^\//, "")}`;
};

export const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price || 0);
};
