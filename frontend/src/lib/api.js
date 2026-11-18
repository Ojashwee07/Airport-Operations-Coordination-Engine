import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("airport_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith("/login")) {
      localStorage.removeItem("airport_token");
      localStorage.removeItem("airport_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Mirrors ROLE_PERMISSIONS in backend/app/core/security.py. The server is the real gate; this only hides buttons.
const ROLE_CAN = {
  view: ["operations_admin", "manager", "duty_officer", "analyst", "ground_staff"],
  request: ["operations_admin", "duty_officer", "analyst"],
  decide: ["operations_admin", "manager", "duty_officer"],
  admin: ["operations_admin"],
};

export function currentUser() {
  try {
    return JSON.parse(localStorage.getItem("airport_user") || "null");
  } catch {
    return null;
  }
}

export function can(permission) {
  const user = currentUser();
  return Boolean(user && (ROLE_CAN[permission] || []).includes(user.role));
}

export default api;
