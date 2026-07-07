import React, { act, useState } from "react";
import MaterialTable from "../components/MaterialTable.jsx";
import ClerkTable from "../components/ClerkTable.jsx";
import { Loader2, ShieldAlert } from "lucide-react";

export default function Setting() {
  const [activeTab, setActiveTab] = useState("Material");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  return (
    <div style={styles.viewViewportContainer}>
      {/* HEADER STRIP */}
      <div style={styles.staticHeaderBlock}>
        {/* <div style={styles.actionHeader}> */}
        {/* <div>
            <h1 style={styles.pageTitle}>SETTINGS</h1>
          </div> */}
        {/* <button onClick={} style={styles.refreshButton}>
            Refresh Data Registry
          </button> */}
        {/* </div> */}

        {/* CONTROLS STRIP */}
        <div style={styles.tabBarWrapper}>
          <button
            onClick={() => setActiveTab("Material")}
            style={
              activeTab === "Material"
                ? styles.tabButtonActive
                : styles.tabButton
            }
          >
            Material Catalogue
          </button>
          <button
            onClick={() => setActiveTab("Clerk")}
            style={
              activeTab === "Clerk"
                ? {
                    ...styles.tabButtonActive,
                    color: "#16a34a",
                    borderBottomColor: "#16a34a",
                  }
                : styles.tabButton
            }
          >
            Operator Access
          </button>
        </div>

        {errorMessage && (
          <div style={styles.errorAlertCard}>
            <AlertCircle size={14} style={{ marginRight: 6 }} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      <div style={styles.dynamicTableBodyWrapper}>
        {loading ? (
          <div style={styles.centeredStateBox}>
            <Loader2
              size={24}
              style={{ animation: "spin 1s linear infinite", color: "#2563eb" }}
            />
          </div>
        ) : 1 === 0 ? (
          <div style={styles.emptyClearStateCard}>
            <ShieldAlert
              size={28}
              style={{ color: "#94a3b8", marginBottom: 6 }}
            />
            <h4 style={{ margin: 0, color: "#475569" }}>No Settings Found</h4>
          </div>
        ) : (
          <>
            {activeTab === "Material" && <MaterialTable />}
            {activeTab === "Clerk" && <ClerkTable />}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  viewViewportContainer: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#f8fafc",
    overflow: "hidden",
    width: "100%",
    boxSizing: "border-box",
  },
  staticHeaderBlock: {
    padding: "10px 24px 16px 24px",
    flexShrink: 0,
    width: "100%",
    boxSizing: "border-box",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
  },
  actionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  pageTitle: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0,
  },
  pageSubtitle: {
    fontSize: "11px",
    color: "#64748b",
    marginTop: "1px",
    margin: 0,
  },
  refreshButton: {
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    color: "#334155",
    fontWeight: "700",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "11px",
  },

  tabBarWrapper: { display: "flex", gap: "20px" },
  tabButton: {
    background: "none",
    border: "none",
    padding: "8px 2px 10px 2px",
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    cursor: "pointer",
    borderBottom: "3px solid transparent",
  },
  tabButtonActive: {
    background: "none",
    border: "none",
    padding: "8px 2px 10px 2px",
    fontSize: "12px",
    fontWeight: "800",
    color: "#2563eb",
    cursor: "pointer",
    borderBottom: "3px solid #2563eb",
  },
  errorAlertCard: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    border: "1px solid #fca5a5",
    color: "#991b1b",
    padding: "6px 10px",
    borderRadius: "4px",
    margin: "8px 0",
    fontSize: "11px",
  },
  centeredStateBox: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px",
  },
  emptyClearStateCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "32px",
    border: "1px dashed #cbd5e1",
    borderRadius: "8px",
    maxWidth: "240px",
    margin: "30px auto",
  },
  dynamicTableBodyWrapper: {
    flex: 1,
    padding: "16px 24px",
    overflowY: "auto",
    width: "100%",
    boxSizing: "border-box",
  },
  tableCardFrame: {
    backgroundColor: "#ffffff",
    overflow: "hidden",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  },
};
