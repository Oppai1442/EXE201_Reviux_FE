import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 5000,
  // headers: {
  //   "Content-Type": "application/json",
  // },
});


axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accountToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // Tự động detect FormData và set headers phù hợp
    if (config.data instanceof FormData) {
      // Không set Content-Type để browser tự động set với boundary
      config.timeout = 30000; // Timeout lâu hơn cho file upload
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    if (response?.data) return response.data;
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }

);


// Helper function cho file uploads

export default axiosInstance;
