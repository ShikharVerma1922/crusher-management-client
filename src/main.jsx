// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AdminProvider } from "./context/AdminContext";
import "./index.css"; // Keep Vite's default styles or leave empty
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <React.StrictMode>
      <AdminProvider>
        <App />
      </AdminProvider>
    </React.StrictMode>
  </BrowserRouter>,
);
