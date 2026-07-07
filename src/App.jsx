// src/App.jsx
import React, { useContext, useState, useEffect } from "react";
import LedgerScreen from "./screens/LedgerScreen.jsx";
import LoginScreen from "./screens/LoginScreen.jsx";
import DashboardScreen from "./screens/DashboardScreen.jsx";
import MaterialScreen from "./screens/MaterialScreen.jsx";
import ClerkScreen from "./screens/ClerkScreen.jsx";
import AnalyticsExplorerScreen from "./screens/AnalyticsExplorerScreen.jsx";
import VoidRequestsScreen from "./screens/VoidRequestScreen.jsx";
import { AdminContext } from "./context/AdminContext.jsx";
import {
  Loader2,
  LayoutDashboard,
  FileSpreadsheet,
  Layers,
  Users,
  LineChart,
  LogOut,
  Building2,
  ShieldAlert,
  Settings,
} from "lucide-react";
import Setting from "./screens/Setting.jsx";

export default function App() {
  const { isAdminAuthenticated, globalLoading, adminLogout, currentAdmin } =
    useContext(AdminContext);

  const getInitialRouteFromUrlHash = () => {
    const activeHashString = window.location.hash.replace("#", "");
    const verifiedValidRoutes = [
      "dashboard",
      "ledger",
      "materials",
      "clerks",
      "trends",
      "voids",
      "settings",
    ];
    return verifiedValidRoutes.includes(activeHashString)
      ? activeHashString
      : "dashboard";
  };

  const [currentTab, setCurrentTab] = useState(getInitialRouteFromUrlHash);

  // Track hovered button indexes to trigger isolated floating tooltips
  const [hoveredTab, setHoveredTab] = useState(null);
  const [liveTime, setLiveTime] = useState(
    new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    window.location.hash = currentTab;
  }, [currentTab]);

  useEffect(() => {
    const handleUrlHashFallbackEvent = () => {
      setCurrentTab(getInitialRouteFromUrlHash());
    };
    window.addEventListener("hashchange", handleUrlHashFallbackEvent);
    return () =>
      window.removeEventListener("hashchange", handleUrlHashFallbackEvent);
  }, []);

  if (globalLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#0f172a",
          gap: "12px",
        }}
      >
        <Loader2
          size={32}
          style={{ animation: "spin 1s linear infinite", color: "#16a34a" }}
        />
        <span
          style={{
            color: "#94a3b8",
            fontSize: "14px",
            fontFamily: "sans-serif",
          }}
        >
          Securing Authentication Session...
        </span>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div style={styles.appShell}>
      {/* 🏛️ 1. MASTER TOP NAVBAR (With Integrated User Context Controls) */}
      <header style={styles.permanentHeaderRibbon}>
        <div style={styles.headerLeftBrandGroup}>
          <div style={styles.brandIconBox}>
            <Building2 size={18} color="#38bdf8" />
          </div>
          <div style={styles.brandText}>
            <h1 style={styles.brandTitle}>Mandar Crusher</h1>
            <span style={styles.brandSubtitle}>
              Management System{" "}
              <span style={{ color: "#38bdf8", fontWeight: "bold" }}>/</span>{" "}
              {currentTab.toUpperCase()}
            </span>
          </div>
        </div>

        <div style={styles.headerRightProfileGroup}>
          {/* Live Shift Clock Display */}
          {/* <div style={styles.utilityBadge}>
            <span style={styles.utilityText}>
              Shift Time:{" "}
              <strong style={{ color: "#f8fafc", fontFamily: "monospace" }}>
                {liveTime}
              </strong>
            </span>
          </div> */}

          {/* 👑 Relocated User Credentials & Logout Button Trigger */}
          <div style={styles.navbarUserCard}>
            <span style={{ ...styles.navProfileName }}>
              {currentAdmin?.name || "Owner Admin"}
            </span>
            <button
              onClick={adminLogout}
              style={styles.navLogoutBtn}
              title="Log Out Session"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* 📌 2. PERMANENT SLIM ICON STRIP NAVIGATION (With Dynamic Hover Tooltips) */}
      <aside style={styles.sidebarWrapper}>
        <nav style={styles.sidebarNavigationRibbon}>
          {/* Dashboard Tab */}
          <div
            style={styles.navItemContainer}
            onMouseEnter={() => setHoveredTab("dashboard")}
            onMouseLeave={() => setHoveredTab(null)}
          >
            <button
              onClick={() => setCurrentTab("dashboard")}
              style={
                currentTab === "dashboard"
                  ? styles.sideTabButtonActive
                  : styles.sideTabButton
              }
            >
              <LayoutDashboard size={18} style={{ flexShrink: 0 }} />
            </button>
            {hoveredTab === "dashboard" && (
              <div style={styles.floatingTooltip}>Executive Panel</div>
            )}
          </div>

          {/* Weighbridge Ledger Tab */}
          <div
            style={styles.navItemContainer}
            onMouseEnter={() => setHoveredTab("ledger")}
            onMouseLeave={() => setHoveredTab(null)}
          >
            <button
              onClick={() => setCurrentTab("ledger")}
              style={
                currentTab === "ledger"
                  ? styles.sideTabButtonActive
                  : styles.sideTabButton
              }
            >
              <FileSpreadsheet size={18} style={{ flexShrink: 0 }} />
            </button>
            {hoveredTab === "ledger" && (
              <div style={styles.floatingTooltip}>Weighbridge Ledger</div>
            )}
          </div>

          {/* Data Explorer Tab */}
          <div
            style={styles.navItemContainer}
            onMouseEnter={() => setHoveredTab("trends")}
            onMouseLeave={() => setHoveredTab(null)}
          >
            <button
              onClick={() => setCurrentTab("trends")}
              style={
                currentTab === "trends"
                  ? styles.sideTabButtonActive
                  : styles.sideTabButton
              }
            >
              <LineChart size={18} style={{ flexShrink: 0 }} />
            </button>
            {hoveredTab === "trends" && (
              <div style={styles.floatingTooltip}>Data Explorer</div>
            )}
          </div>

          {/* Pricing Matrix Tab */}
          {/* <div
            style={styles.navItemContainer}
            onMouseEnter={() => setHoveredTab("materials")}
            onMouseLeave={() => setHoveredTab(null)}
          >
            <button
              onClick={() => setCurrentTab("materials")}
              style={
                currentTab === "materials"
                  ? styles.sideTabButtonActive
                  : styles.sideTabButton
              }
            >
              <Layers size={18} style={{ flexShrink: 0 }} />
            </button>
            {hoveredTab === "materials" && (
              <div style={styles.floatingTooltip}>Pricing Matrix</div>
            )}
          </div> */}

          {/* Cabin Operators Tab */}
          {/* <div
            style={styles.navItemContainer}
            onMouseEnter={() => setHoveredTab("clerks")}
            onMouseLeave={() => setHoveredTab(null)}
          >
            <button
              onClick={() => setCurrentTab("clerks")}
              style={
                currentTab === "clerks"
                  ? styles.sideTabButtonActive
                  : styles.sideTabButton
              }
            >
              <Users size={18} style={{ flexShrink: 0 }} />
            </button>
            {hoveredTab === "clerks" && (
              <div style={styles.floatingTooltip}>Cabin Operators</div>
            )}
          </div> */}

          {/* Void Clearances Tab */}
          <div
            style={styles.navItemContainer}
            onMouseEnter={() => setHoveredTab("voids")}
            onMouseLeave={() => setHoveredTab(null)}
          >
            <button
              onClick={() => setCurrentTab("voids")}
              style={
                currentTab === "voids"
                  ? styles.sideTabButtonActive
                  : styles.sideTabButton
              }
            >
              <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            </button>
            {hoveredTab === "voids" && (
              <div style={styles.floatingTooltip}>Void Clearances</div>
            )}
          </div>
          {/* Settings page */}
          <div
            style={styles.navItemContainer}
            onMouseEnter={() => setHoveredTab("settings")}
            onMouseLeave={() => setHoveredTab(null)}
          >
            <button
              onClick={() => setCurrentTab("settings")}
              style={
                currentTab === "settings"
                  ? styles.sideTabButtonActive
                  : styles.sideTabButton
              }
            >
              <Settings size={18} style={{ flexShrink: 0 }} />
            </button>
            {hoveredTab === "settings" && (
              <div style={styles.floatingTooltip}>Settings</div>
            )}
          </div>
        </nav>
      </aside>

      {/* 🌊 3. MAIN PORT CANVAS CONTROLLER */}
      <main style={styles.mainViewportContainer}>
        {currentTab === "dashboard" && <DashboardScreen />}
        {currentTab === "ledger" && <LedgerScreen />}
        {currentTab === "trends" && <AnalyticsExplorerScreen />}
        {currentTab === "materials" && <MaterialScreen />}
        {currentTab === "clerks" && <ClerkScreen />}
        {currentTab === "voids" && <VoidRequestsScreen />}
        {currentTab === "settings" && <Setting />}
      </main>
    </div>
  );
}

// 🎨 COMPACT DESIGN ENGINE TOKENS
const styles = {
  appShell: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100%",
    overflow: "hidden",
    boxSizing: "border-box",
    backgroundColor: "#f8fafc",
    position: "relative",
  },

  permanentHeaderRibbon: {
    height: "56px",
    backgroundColor: "#0f172a",
    borderBottom: "1px solid #1e293b",
    display: "flex",
    alignItems: "center",
    justifyBox: "space-between",
    justifyContent: "space-between",
    padding: "0 20px",
    boxSizing: "border-box",
    flexShrink: 0,
    width: "100%",
    zIndex: 3000,
  },
  headerLeftBrandGroup: { display: "flex", alignItems: "center", gap: "12px" },
  brandIconBox: {
    backgroundColor: "#1e293b",
    padding: "6px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#ffffff",
    margin: 0,
    lineHeight: 1.1,
  },
  brandSubtitle: {
    fontSize: "11px",
    color: "#94a3b8",
    lineHeight: 1,
  },
  brandText: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: "2px",
  },

  headerRightProfileGroup: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  utilityBadge: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid #334155",
  },
  utilityText: { fontSize: "11px", fontWeight: "600", color: "#94a3b8" },

  // Navbar Identity Block Styles
  navbarUserCard: {
    display: "flex",
    alignItems: "center",
    gap: "0px",
    backgroundColor: "#E6E6FA",
    padding: "4px 6px 4px 10px",
    borderRadius: "20px",
    border: "1px solid #334155",
  },
  avatarIndicator: {
    fontSize: "12px",
    backgroundColor: "#0f172a",
    padding: "2px 4px",
    borderRadius: "50%",
  },
  userDataCluster: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  navProfileName: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#392467",
    lineHeight: "1.2",
    padding: 0,
  },
  navProfileRole: { fontSize: "10px", color: "#64748b", fontWeight: "600" },
  navLogoutBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: "6px",
    marginLeft: "4px",
    borderRadius: "4px",
    transition: "color 0.1s",
    ":hover": { color: "#ef4444" },
  },

  // Fixed Slim Sidebar Layout Rules
  sidebarWrapper: {
    position: "absolute",
    top: "56px",
    left: 0,
    bottom: 0,
    backgroundColor: "#0f172a",
    borderRight: "1px solid #1e293b",
    display: "flex",
    flexDirection: "column",
    width: "60px",
    height: "calc(100% - 56px)",
    zIndex: 2000,
    overflow: "visible",
  },
  sidebarNavigationRibbon: {
    padding: "16px 8px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    alignItems: "center",
  },

  // Isolated hover anchor configurations
  navItemContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    width: "44px",
    height: "44px",
  },
  sideTabButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    backgroundColor: "transparent",
    color: "#94a3b8",
    padding: "0",
    borderRadius: "8px",
    cursor: "pointer",
    width: "100%",
    height: "100%",
    transition: "all 0.15s",
  },
  sideTabButtonActive: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    backgroundColor: "#1e293b",
    color: "#38bdf8",
    padding: "0",
    borderRadius: "8px",
    cursor: "pointer",
    width: "100%",
    height: "100%",
  },

  // 🚀 FLOATING TOOLTIP BADGE ELEMENT (Slides out cleanly past the 60px bounds)
  floatingTooltip: {
    position: "absolute",
    left: "54px",
    backgroundColor: "#1e293b",
    color: "#f8fafc",
    fontSize: "11px",
    fontWeight: "700",
    padding: "6px 12px",
    borderRadius: "4px",
    whiteSpace: "nowrap",
    boxShadow: "4px 4px 12px rgba(15, 23, 42, 0.5)",
    border: "1px solid #334155",
    pointerEvents: "none",
    animation: "fadeIn 0.1s ease-out forwards",
    zIndex: 4000,
  },

  mainViewportContainer: {
    flex: 1,
    marginLeft: "60px",
    height: "calc(100vh - 56px)",
    overflow: "auto",
  },
};
