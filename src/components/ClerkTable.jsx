// src/screens/ClerkScreen.jsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import { AdminContext } from "../context/AdminContext.jsx";
import {
  Users,
  Plus,
  Edit2,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  Key,
} from "lucide-react";
import ConfirmationModal from "../components/ConfirmationModal.jsx";

export default function ClerkTable() {
  const { adminApi } = useContext(AdminContext);

  const [clerks, setClerks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // 📝 Management Drawer Modal Control States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClerk, setEditingClerk] = useState(null); // null = Register, object = Update Name/Password
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    password: "",
  });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    clerk: null,
  });

  const triggerAccessConfirmation = (clerk) => {
    setConfirmModal({ isOpen: true, clerk });
  };

  // 🌟 3. Execute the server-side access patch shift
  const handleExecuteAccessShift = async () => {
    const { clerk } = confirmModal;
    if (!clerk) return;

    try {
      setErrorMessage("");
      const updatedStatus = !clerk.isActive;
      await adminApi.patch(`/user/${clerk.username}`, {
        isActive: updatedStatus,
      });
      setClerks((prev) =>
        prev.map((c) =>
          c.id === clerk.id ? { ...c, isActive: updatedStatus } : c,
        ),
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Failed to alter clerk gate access.",
      );
    } finally {
      setConfirmModal({ isOpen: false, clerk: null });
    }
  };

  // 📡 FETCH ALL CLERKS
  const fetchClerkRegistry = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await adminApi.get("/user/clerks");
      const payload = response.data?.data || response.data;
      if (Array.isArray(payload)) {
        setClerks(payload);
      } else if (payload && Array.isArray(payload.clerks)) {
        setClerks(payload.clerks);
      }
    } catch (error) {
      console.error("❌ Clerk Fetch Error:", error);
      setErrorMessage(
        error.response?.data?.message ||
          "Failed to sync with clerk registry infrastructure.",
      );
    } finally {
      setLoading(false);
    }
  }, [adminApi]);

  useEffect(() => {
    fetchClerkRegistry();
  }, [fetchClerkRegistry]);

  // 🔄 1. INLINE ACCESS TOGGLE (Flipped status instantly reaches backend PATCH endpoint)
  const handleToggleClerkActive = async (clerk) => {
    // 🌟 THE SECURITY LOCK GATE
    const actionNoun = clerk.isActive ? "REVOKE ACCESS FOR" : "GRANT ACCESS TO";
    const confirmationMessage =
      `⚠️ CRITICAL AUTH CONTROL ACTION\n\n` +
      `Are you sure you want to ${actionNoun} operator "${clerk.name}" (@${clerk.username})?\n\n` +
      (clerk.isActive
        ? "This will immediately block this operator. If they are currently logged in at a cabin terminal, their next database action will fail."
        : "This will restore this operator's system privileges, allowing them to sign into weighbridge shifts.");

    if (!window.confirm(confirmationMessage)) {
      return; // Kill execution if the owner hits "Cancel"
    }

    try {
      setErrorMessage("");
      const updatedStatus = !clerk.isActive;

      await adminApi.patch(`/user/${clerk.username}`, {
        isActive: updatedStatus,
      });

      setClerks((prev) =>
        prev.map((c) =>
          c.id === clerk.id ? { ...c, isActive: updatedStatus } : c,
        ),
      );
      console.log(
        `🛡️ [Access Control] Profile @${clerk.username} shifted to status: ${updatedStatus}`,
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Failed to update clerk access window status.",
      );
      fetchClerkRegistry();
    }
  };

  const handleOpenModal = (clerk = null) => {
    if (clerk) {
      setEditingClerk(clerk);
      setFormData({ username: clerk.username, name: clerk.name, password: "" }); // Passwords stay blank on edit load
    } else {
      setEditingClerk(null);
      setFormData({ username: "", name: "", password: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ username: "", name: "", password: "" });
    setEditingClerk(null);
  };

  // 🚀 2. SUBMIT DATA REGISTRATION / UPDATE PAYLOADS
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setErrorMessage("");

    try {
      if (editingClerk) {
        // Build dynamic structural payload update blocks matching backend rules
        const updatePayload = { name: formData.name.trim() };
        if (formData.password.trim()) {
          updatePayload.password = formData.password.trim(); // Add if forcing a password overwrite
        }

        await adminApi.patch(`/user/${editingClerk.username}`, updatePayload);
      } else {
        // Enforce validations required for fresh profile construction
        if (
          !formData.username.trim() ||
          !formData.password.trim() ||
          !formData.name.trim()
        ) {
          throw new Error(
            "All fields are mandatory when onboarding a fresh operating profile.",
          );
        }

        await adminApi.post("/auth/register", {
          username: formData.username.trim().toLowerCase(),
          name: formData.name.trim(),
          password: formData.password.trim(),
        });
      }

      handleCloseModal();
      fetchClerkRegistry();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Failed to persist clerk account parameters.",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div style={styles.viewViewportContainer}>
      <div style={styles.staticHeaderBlock}>
        <div style={styles.actionHeader}>
          {/* <div>
            <h1 style={styles.pageTitle}>CLERK REGISTRY</h1>
          </div> */}
          <button
            onClick={() => handleOpenModal(null)}
            style={styles.createButton}
          >
            <Plus size={16} style={{ marginRight: 6 }} /> Add New Operator Clerk
          </button>
        </div>

        {errorMessage && !isModalOpen && (
          <div style={styles.errorAlertCard}>
            <AlertCircle size={18} style={{ marginRight: 8 }} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      <div style={styles.dynamicScrollBodyWrapper}>
        <div style={styles.tableCardContainer}>
          <div style={styles.overflowTableScroller}>
            {loading ? (
              <div style={styles.loadingWrapperGrid}>
                <div style={styles.spinnerElement}></div>
                <p
                  style={{ marginTop: 12, color: "#64748b", fontSize: "13px" }}
                >
                  Gathering weighbridge access data parameters...
                </p>
              </div>
            ) : clerks.length === 0 ? (
              <div style={styles.emptyStateBlock}>
                <p style={{ color: "#64748b", fontWeight: "500" }}>
                  No cabin operators registered inside this crusher
                  infrastructure database framework.
                </p>
              </div>
            ) : (
              <table style={styles.masterTableElement}>
                <thead style={styles.stickyTableHeader}>
                  <tr>
                    <th style={styles.thElement}>Operator Name</th>
                    <th style={styles.thElement}>System Username</th>
                    <th style={styles.thElement}>Terminal Access Status</th>
                    <th style={styles.thElement}>Account Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {clerks.map((clerk) => (
                    <tr
                      key={clerk.id}
                      style={{
                        ...styles.tableBodyRowElement,
                        opacity: clerk.isActive ? 1 : 0.6,
                      }}
                    >
                      <td
                        style={{
                          ...styles.tdElement,
                          fontWeight: "700",
                          color: "#0f172a",
                        }}
                      >
                        {clerk.name}
                      </td>
                      <td
                        style={{
                          ...styles.tdElement,
                          fontWeight: "600",
                          color: "#475569",
                        }}
                      >
                        @{clerk.username}
                      </td>
                      <td style={styles.tdElement}>
                        <span
                          style={
                            clerk.isActive
                              ? styles.badgeActive
                              : styles.badgeInactive
                          }
                        >
                          {clerk.isActive
                            ? "ACTIVE OPERATOR"
                            : "TERMINAL REVOKED / INACTIVE"}
                        </span>
                      </td>
                      <td style={styles.tdElement}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleOpenModal(clerk)}
                            style={styles.editActionLink}
                          >
                            <Edit2 size={13} style={{ marginRight: 4 }} />{" "}
                            Modify Credentials
                          </button>

                          <button
                            onClick={() => triggerAccessConfirmation(clerk)}
                            style={
                              clerk.isActive
                                ? styles.toggleBtnActive
                                : styles.toggleBtnInactive
                            }
                          >
                            {clerk.isActive ? (
                              <EyeOff size={13} style={{ marginRight: 4 }} />
                            ) : (
                              <Eye size={13} style={{ marginRight: 4 }} />
                            )}
                            {clerk.isActive ? "Revoke Access" : "Grant Access"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* 🛠️ OVERLAY ACCOUNT REGISTER/EDIT DRAWER MODAL */}
      {isModalOpen && (
        <div style={styles.modalOverlayMask}>
          <div style={styles.modalContentCard}>
            <div style={styles.modalHeaderBlock}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Shield size={18} style={{ color: "#2563eb" }} />
                <h3 style={styles.modalTitle}>
                  {editingClerk
                    ? `Modify Operator: @${editingClerk.username}`
                    : "Onboard Fresh Cabin Operator"}
                </h3>
              </div>
              <button onClick={handleCloseModal} style={styles.modalCloseXBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={styles.modalFormBlock}>
              {errorMessage && (
                <div
                  style={{
                    ...styles.errorAlertCard,
                    marginTop: 0,
                    marginBottom: "12px",
                  }}
                >
                  <AlertCircle size={16} style={{ marginRight: 6 }} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div style={styles.formFieldLayoutRow}>
                <label style={styles.fieldLabelElement}>
                  Unique Operator Handle (Username)
                </label>
                <input
                  type="text"
                  placeholder="e.g., madan_sharma"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  disabled={editingClerk !== null} // Freeze internal identifiers from mutations
                  style={
                    editingClerk
                      ? styles.disabledFormInput
                      : styles.formInputElement
                  }
                  required
                />
              </div>

              <div style={styles.formFieldLayoutRow}>
                <label style={styles.fieldLabelElement}>
                  Full Legal Operator Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Madan Sharma"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  style={styles.formInputElement}
                  required
                />
              </div>

              <div style={styles.formFieldLayoutRow}>
                <label style={styles.fieldLabelElement}>
                  {editingClerk
                    ? "Force Password Reset / Overwrite (Leave blank to keep old password)"
                    : "Secure Account Password"}
                </label>
                <div style={styles.passwordInputFrame}>
                  <Key
                    size={14}
                    style={{ color: "#64748b", marginLeft: 12, marginRight: 2 }}
                  />
                  <input
                    type="text" // Kept as standard text format so the owner can accurately read/copy passwords they issue
                    placeholder={
                      editingClerk
                        ? "•••••••• (Enter new sequence to swap)"
                        : "Minimum 6 complex text bytes"
                    }
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    style={styles.passwordInputField}
                    required={!editingClerk}
                  />
                </div>
              </div>

              <div style={styles.modalActionBarPair}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={styles.cancelBtn}
                  disabled={submitLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.saveSubmitBtn}
                  disabled={submitLoading}
                >
                  {submitLoading
                    ? "Saving Metrics..."
                    : editingClerk
                      ? "Overwrite Profile"
                      : "Onboard Operator"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, clerk: null })}
        onConfirm={handleExecuteAccessShift}
        title={
          confirmModal.clerk?.isActive
            ? "Revoke System Access"
            : "Restore Operator Access"
        }
        message={
          confirmModal.clerk?.isActive
            ? `⚠️ CRITICAL AUDIT WARNING\n\nAre you sure you want to revoke system access for ${confirmModal.clerk?.name} (@${confirmModal.clerk?.username})?\n\nThis will freeze their account. Any running batch session currently active in a weighbridge cabin will be invalidated instantly.`
            : `Restore full weighbridge operational clearance to ${confirmModal.clerk?.name} (@${confirmModal.clerk?.username}) immediately?`
        }
        actionText={
          confirmModal.clerk?.isActive ? "Revoke Privileges" : "Grant Access"
        }
        isDestructive={confirmModal.clerk?.isActive}
      />
    </div>
  );
}

// 🎨 HIGH-DENSITY ADMINISTRATIVE VISUAL LAYOUT CSS
const styles = {
  viewViewportContainer: {
    display: "flex",
    flexDirection: "column",
    // position: "relative",
    // top: 0,
    // bottom: 0,
    // left: -40,
    // right: 0,
    backgroundColor: "#f8fafc",
    // overflow: "hidden",
    width: "fit-content",
    // boxSizing: "border-box",
  },
  staticHeaderBlock: {
    padding: "10px 24px 16px 24px",
    flexShrink: 0,
    width: "100%",
    boxSizing: "border-box",
  },
  actionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
  },
  pageTitle: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0,
  },
  pageSubtitle: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px",
    margin: 0,
  },
  createButton: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: "700",
    padding: "8px 14px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
  },
  errorAlertCard: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    border: "1px solid #fca5a5",
    color: "#991b1b",
    padding: "8px 12px",
    borderRadius: "6px",
    marginTop: "8px",
    fontSize: "12px",
  },
  dynamicScrollBodyWrapper: {
    flex: 1,
    padding: "0px 24px 24px 24px",
    overflowY: "auto",
    boxSizing: "border-box",
    width: "100%",
  },
  tableCardContainer: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    width: "100%",
  },
  overflowTableScroller: { overflowX: "auto", width: "100%" },
  masterTableElement: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: "13px",
  },
  stickyTableHeader: { backgroundColor: "#0f172a" },
  thElement: {
    padding: "12px 16px",
    color: "#94a3b8",
    fontWeight: "600",
    textTransform: "uppercase",
    fontSize: "11px",
    letterSpacing: "0.5px",
    backgroundColor: "#0f172a",
  },
  tableBodyRowElement: {
    borderBottom: "1px solid #f1f5f9",
    transition: "all 0.15s",
  },
  tdElement: {
    padding: "14px 16px",
    color: "#334155",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
  },

  badgeActive: {
    backgroundColor: "#dcfce7",
    color: "#16a34a",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "700",
  },
  badgeInactive: {
    backgroundColor: "#f1f5f9",
    color: "#64748b",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "700",
  },

  editActionLink: {
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    color: "#334155",
    padding: "6px 10px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },
  toggleBtnActive: {
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid #fee2e2",
    backgroundColor: "#fff5f5",
    color: "#ef4444",
    padding: "6px 10px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },
  toggleBtnInactive: {
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid #dcfce7",
    backgroundColor: "#f0fdf4",
    color: "#16a34a",
    padding: "6px 10px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },

  loadingWrapperGrid: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "200px",
    width: "100%",
  },
  spinnerElement: {
    width: "24px",
    height: "24px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  emptyStateBlock: { padding: "40px 0", textAlign: "center", width: "100%" },
  modalOverlayMask: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(2px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContentCard: {
    backgroundColor: "#ffffff",
    width: "100%",
    maxWidth: "420px",
    margin: "0 16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
    overflow: "hidden",
  },
  modalHeaderBlock: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #f1f5f9",
  },
  modalTitle: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0,
  },
  modalCloseXBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "4px",
  },
  modalFormBlock: { padding: "20px" },
  formFieldLayoutRow: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "16px",
  },
  fieldLabelElement: { fontSize: "12px", fontWeight: "700", color: "#475569" },
  formInputElement: {
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    padding: "8px 12px",
    fontSize: "13px",
    outline: "none",
    backgroundColor: "white",
    color: "#0f172a",
  },
  disabledFormInput: {
    border: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    borderRadius: "6px",
    padding: "8px 12px",
    fontSize: "13px",
    color: "#64748b",
    cursor: "not-allowed",
  },
  passwordInputFrame: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  passwordInputField: {
    border: "none",
    backgroundColor: "transparent",
    width: "100%",
    padding: "8px 12px 8px 6px",
    fontSize: "13px",
    outline: "none",
    color: "#0f172a",
    fontFamily: "inherit",
  },
  modalActionBarPair: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    marginTop: "24px",
  },
  cancelBtn: {
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    color: "#475569",
    fontWeight: "600",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
  saveSubmitBtn: {
    backgroundColor: "#2563eb",
    border: "none",
    color: "#ffffff",
    fontWeight: "700",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
};
