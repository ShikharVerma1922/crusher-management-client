// src/context/adminContext.jsx
import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { adminApi } from "../lib/axiosApi.js";

export const AdminContext = createContext(null);

export const AdminProvider = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [globalLoading, setGlobalLoading] = useState(true); // App-wide boot blocker

  // const adminApi = axios.create({
  //   baseURL: "http://localhost:3000/api",
  //   timeout: 8000,
  //   headers: { "Content-Type": "application/json" },
  //   withCredentials: true,
  // });

  // 📡 1. AUTOMATIC BACKGROUND COOKIE CHECK (Runs ONCE on page load/refresh)
  useEffect(() => {
    const verifyActiveSessionOnBoot = async () => {
      try {
        console.log(
          "📡 [Session Engine] Validating session via /auth/profile...",
        );
        const response = await adminApi.get("/user/profile");

        if (response.data?.success) {
          const userObj = response.data.data;

          if (userObj?.role === "OWNER") {
            console.log(
              `✅ [Session Engine] User verified: ${userObj.name}. Restoring application state.`,
            );

            setCurrentAdmin(userObj);
            setIsAdminAuthenticated(true);

            setGlobalLoading(false);
            return;
          }
        }

        setIsAdminAuthenticated(false);
        setCurrentAdmin(null);
        setGlobalLoading(false);
      } catch (error) {
        console.log(
          "📡 [Session Engine] No active session cookie found or server rejected handshake.",
        );
        setIsAdminAuthenticated(false);
        setCurrentAdmin(null);
        setGlobalLoading(false);
      }
    };

    verifyActiveSessionOnBoot();
  }, []); // Balanced tracking configuration dependencies

  // 🔐 2. MANUAL SUBMIT FORM ACCESS CHANNEL
  const adminLogin = async (username, password) => {
    try {
      console.log(
        `🔑 [Login Action] Sending payload request for user: ${username}`,
      );

      const response = await adminApi.post("/auth/login", {
        username,
        password,
      });

      if (response.data && response.data.success) {
        // Extract the clerk object based on your standard payload structure
        const adminPayload =
          response.data.data.clerk || response.data.data.user;

        if (adminPayload && adminPayload.role === "OWNER") {
          setCurrentAdmin(adminPayload);
          setIsAdminAuthenticated(true);
          console.log(
            "🎯 [Login Action] Admin successfully verified. Dispatching dashboard transition.",
          );
          return { success: true };
        } else {
          return {
            success: false,
            message: "Access Denied: Account lacks administrative privileges.",
          };
        }
      }
      return {
        success: false,
        message: "Authentication mapping exception encountered.",
      };
    } catch (err) {
      console.error(
        "❌ [Login Action Error]:",
        err.response?.data || err.message,
      );
      return {
        success: false,
        message:
          err.response?.data?.message ||
          "Invalid administrative credentials or database mismatch.",
      };
    }
  };

  const adminLogout = async () => {
    try {
      await adminApi.post("/auth/logout");
    } catch (e) {
      console.error("Logout cookie teardown failed:", e.message);
    } finally {
      setIsAdminAuthenticated(false);
      setCurrentAdmin(null);
    }
  };

  return (
    <AdminContext.Provider
      value={{
        isAdminAuthenticated,
        currentAdmin,
        globalLoading,
        adminLogin,
        adminLogout,
        adminApi,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};
