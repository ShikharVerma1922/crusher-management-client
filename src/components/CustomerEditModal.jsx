import React, { useState, useEffect } from "react";
import { adminApi } from "../lib/axiosApi";
import { Cross, X } from "lucide-react";

export default function CustomerEditModal({
  customerId,
  isOpen,
  onClose,
  onUpdateSuccess,
}) {
  // --- 📦 Local Component State Channels ---
  const [formData, setFormData] = useState({
    name: "",
    initialOpeningBalance: 0,
    openingBalanceDate: "",
    creditLimit: 0,
  });

  // Read-only dynamic stats calculated by the backend server
  const [liveMetrics, setLiveMetrics] = useState({
    outstandingBalance: 0,
    totalTicketsCount: 0,
    availableCredit: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // --- 🔌 Lifecycle: Fetch existing record specs on mount/open ---
  useEffect(() => {
    if (isOpen && customerId) {
      const loadCustomerProfile = async () => {
        setIsLoading(true);
        setErrorMessage(null);
        try {
          const response = await adminApi.get(
            `/customers/detail/${customerId}`,
          );

          if (response.status !== 200) {
            throw new Error(`Server returned code: ${response.status}`);
          }

          const data = response.data.data;

          // Separate form fields from read-only account diagnostics
          setFormData({
            name: data.customer.name,
            initialOpeningBalance: data.customer.initialOpeningBalance,
            openingBalanceDate: data.customer.openingBalanceDate ?? "",
            creditLimit: data.customer.creditLimit,
          });

          setLiveMetrics({
            outstandingBalance: data.customer.outstandingBalance,
            totalTicketsCount: data.meta.totalTicketsCount,
            availableCredit: data.meta.availableCredit,
          });
        } catch (err) {
          console.error("Error retrieving customer specs:", err);
          setErrorMessage(
            "Failed to pull account specifics from ledger indexes.",
          );
        } finally {
          setIsLoading(false);
        }
      };

      loadCustomerProfile();
    }
  }, [isOpen, customerId]);

  // --- 💾 Action: Submit updated dataset rules to database ---
  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim())
      return alert("Legal/Business Customer Name is required.");

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const response = await adminApi.put(
        `/customers/detail/${customerId}`,
        formData,
      );

      const data = response.data.data;

      if (response.status !== 200) {
        throw new Error(
          result.error || "Failed data serialization profile rewrite.",
        );
      }

      alert(
        "Customer specifications successfully updated and balances re-indexed.",
      );

      if (onUpdateSuccess) {
        onUpdateSuccess(data); // Trigger dashboard state refresh bubble
      }
      onClose(); // Shut window view frame
    } catch (err) {
      console.error("Customer update lifecycle error:", err);
      setErrorMessage(err.message || "Failed to commit parameter updates.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  // Safe escape check preventing rendering layout items outside open trigger cycles
  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlayMask}>
      <div style={styles.modalWindowFrame}>
        {/* 🛠️ ERP Title Header Bar */}
        <div style={styles.modalHeaderBand}>
          <span style={styles.headerTitleText}>CUSTOMER DETAILS</span>
          <X onClick={onClose} size={20} cursor={"pointer"} />
        </div>

        {isLoading ? (
          <div style={styles.systemStatusLoadingCell}>
            SYNCING ACCOUNT PARAMETERS FROM DATABASE LEDGER...
          </div>
        ) : (
          <form onSubmit={handleSubmitUpdate} style={styles.modalContentBody}>
            {errorMessage && (
              <div style={styles.errorBannerContainer}>
                ⚠️ ERROR: {errorMessage}
              </div>
            )}

            {/* 📊 ROW 1: READ-ONLY LIVE GENERAL ACCOUNT HEALTH DIAGNOSTICS */}
            <div style={styles.metricsSummaryRowBlock}>
              <div style={styles.metricCard}>
                <label style={styles.metricLabel}>ACTIVE RUNNING BALANCE</label>
                <div
                  style={{
                    ...styles.metricValue,
                    color:
                      liveMetrics.outstandingBalance > 0
                        ? "#dc2626"
                        : "#1e293b",
                  }}
                >
                  ₹
                  {liveMetrics.outstandingBalance.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div style={styles.metricCard}>
                <label style={styles.metricLabel}>AVAILABLE CREDIT SPACE</label>
                <div
                  style={{
                    ...styles.metricValue,
                    color:
                      liveMetrics.availableCredit < 0 ? "#dc2626" : "#16a34a",
                  }}
                >
                  ₹
                  {liveMetrics.availableCredit.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div style={styles.metricCard}>
                <label style={styles.metricLabel}>TOTAL DISPATCH TICKETS</label>
                <div style={styles.metricValue}>
                  {liveMetrics.totalTicketsCount} Records
                </div>
              </div>
            </div>

            {/* 🖊️ ROW 2: MODIFIABLE BASE ACCOUNT SPECIFICATIONS */}
            <div style={styles.inputStackGridContainer}>
              <div
                style={{ ...styles.inputFieldGroupBlock, gridColumn: "span 1" }}
              >
                <label style={styles.inputLabelElementText}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  style={styles.textInputControl}
                />
              </div>

              <div
                style={{ ...styles.inputFieldGroupBlock, gridColumn: "span 1" }}
              >
                <label style={styles.inputLabelElementText}>
                  Credit Limit (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.creditLimit}
                  onChange={(e) =>
                    handleInputChange(
                      "creditLimit",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  style={{ ...styles.numericInputControl, color: "#89adf9" }}
                />
              </div>

              <div style={styles.inputFieldGroupBlock}>
                <label style={styles.inputLabelElementText}>
                  Initial Opening Balance (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.initialOpeningBalance}
                  onChange={(e) =>
                    handleInputChange(
                      "initialOpeningBalance",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  style={styles.numericInputControl}
                />
                <span style={styles.inputHelpSubtext}>
                  Use (+) for Debit owed, (-) for Credit/Advance
                </span>
              </div>

              <div style={styles.inputFieldGroupBlock}>
                <label style={styles.inputLabelElementText}>
                  Opening Balance Effective Date
                </label>
                <input
                  type="date"
                  value={formData.openingBalanceDate}
                  onChange={(e) =>
                    handleInputChange("openingBalanceDate", e.target.value)
                  }
                  style={styles.dateInputControl}
                />
              </div>
            </div>

            {/* 🚪 MODAL ACTION BUTTON BAR BANNER */}
            <div style={styles.actionButtonContainerGrid}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                style={styles.dismissActionBtn}
              >
                DISMISS
              </button>
              <button
                type="submit"
                disabled={isSaving}
                style={styles.commitActionBtn}
              >
                {isSaving ? "SYNCING PARAMETERS..." : "COMMIT UPDATES"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// --- 🎨 Dense ERP Interface Monospace Style Sheets ---
const styles = {
  modalOverlayMask: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)", // Standard dark slate opacity blend
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    fontFamily: "monospace",
    fontSize: "12px",
    boxSizing: "border-box",
  },
  modalWindowFrame: {
    backgroundColor: "#ffffff",
    border: "2px solid #0f172a",
    width: "600px",
    maxWidth: "95%",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
    boxSizing: "border-box",
  },
  modalHeaderBand: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    padding: "10px 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitleText: {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.5px",
  },
  closeHeaderBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    fontWeight: "700",
    fontFamily: "inherit",
  },
  systemStatusLoadingCell: {
    padding: "40px",
    textAlign: "center",
    fontWeight: "700",
    color: "#475569",
  },
  modalContentBody: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    margin: 0,
  },
  errorBannerContainer: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fca5a5",
    color: "#b91c1c",
    padding: "8px 12px",
    fontWeight: "700",
  },
  metricsSummaryRowBlock: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "10px",
    backgroundColor: "#f8fafc",
    padding: "10px",
    border: "1px solid #cbd5e1",
  },
  metricCard: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  metricLabel: {
    fontSize: "9px",
    color: "#64748b",
    fontWeight: "700",
  },
  metricValue: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#0f172a",
  },
  inputStackGridContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  inputFieldGroupBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  inputLabelElementText: {
    fontWeight: "700",
    color: "#0f172a",
    fontSize: "11px",
  },
  textInputControl: {
    padding: "6px 8px",
    border: "2px solid #0f172a",
    fontFamily: "inherit",
    fontSize: "12px",
    outline: "none",
    fontWeight: "700",
  },
  numericInputControl: {
    padding: "6px 8px",
    border: "2px solid #0f172a",
    fontFamily: "inherit",
    fontSize: "12px",
    outline: "none",
    fontWeight: "800",
    textAlign: "right",
  },
  dateInputControl: {
    padding: "5px 8px",
    border: "2px solid #0f172a",
    fontFamily: "inherit",
    fontSize: "12px",
    outline: "none",
    fontWeight: "700",
  },
  inputHelpSubtext: {
    fontSize: "9px",
    color: "#64748b",
    lineHeight: "1.2",
  },
  actionButtonContainerGrid: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
    borderTop: "1px dashed #cbd5e1",
    paddingTop: "14px",
  },
  dismissActionBtn: {
    backgroundColor: "#94a3b8",
    color: "#ffffff",
    border: "1px solid #64748b",
    padding: "8px 16px",
    fontFamily: "inherit",
    fontWeight: "700",
    cursor: "pointer",
  },
  commitActionBtn: {
    flex: 1,
    backgroundColor: "#16a34a",
    color: "#ffffff",
    border: "1px solid #15803d",
    padding: "8px 16px",
    fontFamily: "inherit",
    fontWeight: "700",
    cursor: "pointer",
    textTransform: "uppercase",
  },
};
