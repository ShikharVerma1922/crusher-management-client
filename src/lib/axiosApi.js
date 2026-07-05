import axios from "axios";

export const adminApi = axios.create({
  baseURL: `${import.meta.env.VITE_SERVER}`,
  timeout: 8000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});
