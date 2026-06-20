// src/screens/MaterialScreen.jsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import { AdminContext } from "../context/AdminContext.jsx";
import { Layers, Plus, Edit2, X, AlertCircle, Eye, EyeOff } from "lucide-react";
import ConfirmationModal from "../components/ConfirmationModal.jsx";

export default function MaterialScreen() {
  const { adminApi } = useContext(AdminContext);

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [formData, setFormData] = useState({ name: "", ratePerTon: "" });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    item: null,
  });

  const triggerToggleConfirmation = (item) => {
    setConfirmModal({ isOpen: true, item });
  };

  const handleExecuteToggle = async () => {
    const { item } = confirmModal;
    if (!item) return;

    try {
      setErrorMessage("");
      const updatedStatus = !item.isActive;
      await adminApi.patch(`/materials/${item.id}`, {
        isActive: updatedStatus,
      });
      setMaterials((prev) =>
        prev.map((m) =>
          m.id === item.id ? { ...m, isActive: updatedStatus } : m,
        ),
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Failed to toggle variant visibility.",
      );
    } finally {
      setConfirmModal({ isOpen: false, item: null }); // Close modal smoothly
    }
  };

  // 📡 FETCH REGISTRY ENTITIES
  const fetchMaterialRegistry = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await adminApi.get("/materials");
      const payload = response.data?.data || response.data;
      if (Array.isArray(payload)) {
        setMaterials(payload);
      } else if (payload && Array.isArray(payload.materials)) {
        setMaterials(payload.materials);
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Failed to sync with material registry.",
      );
    } finally {
      setLoading(false);
    }
  }, [adminApi]);

  useEffect(() => {
    fetchMaterialRegistry();
  }, [fetchMaterialRegistry]);

  // 🔄 1. INLINE TOGGLE OPERATION: Fires an instant PATCH stream to flip operational availability
  const handleToggleActiveStatus = async (item) => {
    // 🌟 THE MISTAKE-PROOF GATE
    const actionNoun = item.isActive ? "DEACTIVATE" : "ACTIVATE";
    const confirmationMessage =
      `Are you absolutely sure you want to ${actionNoun} "${item.name}"?\n\n` +
      (item.isActive
        ? "This will instantly hide this material from the Cabin clerks. They won't be able to log new truck weights for it."
        : "This will expose this material type to the Cabin operator selection menus immediately.");

    if (!window.confirm(confirmationMessage)) {
      return; // Exit early if the owner clicks "Cancel"
    }

    try {
      setErrorMessage("");
      const updatedStatus = !item.isActive;

      await adminApi.patch(`/materials/${item.id}`, {
        isActive: updatedStatus,
      });

      setMaterials((prev) =>
        prev.map((m) =>
          m.id === item.id ? { ...m, isActive: updatedStatus } : m,
        ),
      );
      console.log(`✅ [Matrix Control] ${item.name} set to ${actionNoun}`);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Failed to toggle variant visibility.",
      );
      fetchMaterialRegistry();
    }
  };

  const handleOpenModal = (material = null) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        name: material.name,
        ratePerTon: material.ratePerTon.toString(),
      });
    } else {
      setEditingMaterial(null);
      setFormData({ name: "", ratePerTon: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ name: "", ratePerTon: "" });
    setEditingMaterial(null);
  };

  // 🚀 2. FIXED UPDATE ACTION SUBMISSION LAYER
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ratePerTon.trim()) return;

    setSubmitLoading(true);
    setErrorMessage("");
    try {
      const payloadData = {
        ratePerTon: parseFloat(formData.ratePerTon),
      };

      if (editingMaterial) {
        // 🌟 THE CRITICAL LINE CORRECTION: Swapped out .put() for your backend's .patch() execution handler
        await adminApi.patch(`/materials/${editingMaterial.id}`, payloadData);
      } else {
        // Fallback router rule mapping for initial structural generation
        await adminApi.post("/materials", {
          ...payloadData,
          name: formData.name.trim().toUpperCase(),
        });
      }

      handleCloseModal();
      fetchMaterialRegistry();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Failed to persist matrix modification.",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div style={styles.viewViewportContainer}>
      <div style={styles.staticHeaderBlock}>
        <div style={styles.actionHeader}>
          <div>
            <h1 style={styles.pageTitle}>MATERIAL PRICING</h1>
          </div>
          <button
            onClick={() => handleOpenModal(null)}
            style={styles.createButton}
          >
            <Plus size={16} style={{ marginRight: 6 }} /> Register New Variant
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
                  Syncing aggregate rates matrix...
                </p>
              </div>
            ) : materials.length === 0 ? (
              <div style={styles.emptyStateBlock}>
                <p style={{ color: "#64748b", fontWeight: "500" }}>
                  No commercial inventory variants registered in database.
                </p>
              </div>
            ) : (
              <table style={styles.masterTableElement}>
                <thead style={styles.stickyTableHeader}>
                  <tr>
                    <th style={styles.thElement}>Variant Code</th>
                    <th style={styles.thElement}>Material Nomenclature</th>
                    <th style={styles.thElement}>Commercial Rate</th>
                    <th style={styles.thElement}>Visibility Status</th>
                    <th style={styles.thElement}>System Control Matrix</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((item) => (
                    <tr
                      key={item.id}
                      style={{
                        ...styles.tableBodyRowElement,
                        opacity: item.isActive ? 1 : 0.65,
                      }}
                    >
                      <td
                        style={{
                          ...styles.tdElement,
                          fontFamily: "monospace",
                          color: "#64748b",
                          fontSize: "12px",
                        }}
                      >
                        {item.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td
                        style={{
                          ...styles.tdElement,
                          fontWeight: "700",
                          color: "#0f172a",
                        }}
                      >
                        {item.name}
                      </td>
                      <td
                        style={{
                          ...styles.tdElement,
                          fontWeight: "800",
                          color: "#2563eb",
                          fontSize: "14px",
                        }}
                      >
                        ₹{item.ratePerTon.toLocaleString("en-IN")}{" "}
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#64748b",
                            fontWeight: "500",
                          }}
                        >
                          / MT
                        </span>
                      </td>
                      <td style={styles.tdElement}>
                        <span
                          style={
                            item.isActive
                              ? styles.badgeActive
                              : styles.badgeInactive
                          }
                        >
                          {item.isActive ? "ACTIVE" : "ARCHIVED / DISABLED"}
                        </span>
                      </td>
                      <td style={styles.tdElement}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleOpenModal(item)}
                            style={styles.editActionLink}
                          >
                            <Edit2 size={13} style={{ marginRight: 4 }} />{" "}
                            Adjust Rate
                          </button>

                          {/* 🌟 THE ACTIVATE / DISABLE SLIDER ACTION TOGGLE BUTTON */}
                          <button
                            onClick={() => triggerToggleConfirmation(item)}
                            style={
                              item.isActive
                                ? styles.toggleBtnActive
                                : styles.toggleBtnInactive
                            }
                            title={
                              item.isActive
                                ? "Hide from Cabin clerks"
                                : "Expose to Cabin clerks"
                            }
                          >
                            {item.isActive ? (
                              <EyeOff size={13} style={{ marginRight: 4 }} />
                            ) : (
                              <Eye size={13} style={{ marginRight: 4 }} />
                            )}
                            {item.isActive ? "Deactivate" : "Activate"}
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

      {isModalOpen && (
        <div style={styles.modalOverlayMask}>
          <div style={styles.modalContentCard}>
            <div style={styles.modalHeaderBlock}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Layers size={18} style={{ color: "#2563eb" }} />
                <h3 style={styles.modalTitle}>
                  {editingMaterial
                    ? "Adjust Pricing Configuration"
                    : "Register Material Variant"}
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
                  Material Variant Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  disabled={editingMaterial !== null}
                  style={
                    editingMaterial
                      ? styles.disabledFormInput
                      : styles.formInputElement
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div style={styles.formFieldLayoutRow}>
                <label style={styles.fieldLabelElement}>
                  Rate Applied Per Metric Ton (INR)
                </label>
                <div style={styles.currencyInputFrame}>
                  <span style={styles.currencyPrefixSymbol}>₹</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.ratePerTon}
                    onChange={(e) =>
                      setFormData({ ...formData, ratePerTon: e.target.value })
                    }
                    style={styles.currencyInputField}
                    required
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
                  {submitLoading ? "Saving..." : "Commit Configuration Change"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, item: null })}
        onConfirm={handleExecuteToggle}
        title={
          confirmModal.item?.isActive
            ? "Deactivate Material Variant"
            : "Activate Material Variant"
        }
        message={
          confirmModal.item?.isActive
            ? `Are you sure you want to hide "${confirmModal.item?.name}"?\n\nCabin clerks won't be able to log incoming weight tickets for this material type.`
            : `Expose "${confirmModal.item?.name}" immediately?\n\nThis will instantly make this material type selectable across all active cabin weighbridge stations.`
        }
        actionText={confirmModal.item?.isActive ? "Deactivate" : "Activate"}
        isDestructive={confirmModal.item?.isActive} // Red styling for deactivation, Blue for activation
      />
    </div>
  );
}

// 🎨 EXPANDED CSS STYLE DESIGNS MAP
const styles = {
  viewViewportContainer: {
    display: "flex",
    flexDirection: "column",
    position: "absolute",
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
    color: "#0f172a",
    backgroundColor: "white",
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
  currencyInputFrame: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    backgroundColor: "#f8fafc",
    overflow: "hidden",
  },
  currencyPrefixSymbol: {
    padding: "0 12px",
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "bold",
  },
  currencyInputField: {
    border: "none",
    backgroundColor: "#ffffff",
    width: "100%",
    padding: "8px 12px 8px 0",
    fontSize: "13px",
    outline: "none",
    color: "#0f172a",
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
