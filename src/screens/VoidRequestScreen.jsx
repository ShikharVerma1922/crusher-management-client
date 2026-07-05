// src/screens/VoidRequestsScreen.jsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import { AdminContext } from "../context/AdminContext.jsx";
import {
  AlertCircle,
  Loader2,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Pencil,
} from "lucide-react";

export default function VoidRequestsScreen() {
  const { adminApi } = useContext(AdminContext);

  const [activeTab, setActiveTab] = useState("PENDING"); // PENDING | APPROVED | REJECTED
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Pagination State Engine
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const rowsPerPage = 12;

  const [processingId, setProcessingId] = useState(null);
  const [adminNotesMap, setAdminNotesMap] = useState({});

  const [expandedNotesId, setExpandedNotesId] = useState(null);

  const fetchTabData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      if (activeTab === "PENDING") {
        // Pending queues don't typically paginate as they should be resolved instantly
        const response = await adminApi.get("/void-requests/pending");
        setRequests(response.data?.data || response.data || []);
        setTotalPages(1);
      } else {
        const response = await adminApi.get(
          `/void-requests/history?status=${activeTab}&page=${currentPage}&limit=${rowsPerPage}`,
        );
        setRequests(response.data?.data.history || response.data || []);

        const paginationMeta = response.data?.data.meta;
        if (paginationMeta) {
          setTotalPages(paginationMeta.totalPages || 1);
        }
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Failed to sync ledger data pipelines.",
      );
    } finally {
      setLoading(false);
    }
  }, [adminApi, activeTab, currentPage]);

  useEffect(() => {
    setCurrentPage(1); // Reset index frame on tab toggle switch clicks
  }, [activeTab]);

  useEffect(() => {
    fetchTabData();
  }, [fetchTabData]);

  const handleProcessRequest = async (id, targetStatus) => {
    setProcessingId(id);
    try {
      const note = adminNotesMap[id]?.trim() || "";
      await adminApi.patch(`/void-requests/${id}`, {
        status: targetStatus,
        adminNotes: note || undefined,
      });

      setRequests((prev) => prev.filter((req) => req.id !== id));
      setAdminNotesMap((prev) => {
        const c = { ...prev };
        delete c[id];
        return c;
      });
    } catch (error) {
      alert(
        error.response?.data?.message || "Failed to update transaction status.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={styles.viewViewportContainer}>
      {/* HEADER STRIP */}
      <div style={styles.staticHeaderBlock}>
        <div style={styles.actionHeader}>
          <div>
            <h1 style={styles.pageTitle}>VOID REQUESTS</h1>
          </div>
          <button onClick={fetchTabData} style={styles.refreshButton}>
            Refresh Data Registry
          </button>
        </div>

        {/* CONTROLS STRIP */}
        <div style={styles.tabBarWrapper}>
          <button
            onClick={() => setActiveTab("PENDING")}
            style={
              activeTab === "PENDING"
                ? styles.tabButtonActive
                : styles.tabButton
            }
          >
            Pending Clearances
          </button>
          <button
            onClick={() => setActiveTab("APPROVED")}
            style={
              activeTab === "APPROVED"
                ? {
                    ...styles.tabButtonActive,
                    color: "#16a34a",
                    borderBottomColor: "#16a34a",
                  }
                : styles.tabButton
            }
          >
            Approved History
          </button>
          <button
            onClick={() => setActiveTab("REJECTED")}
            style={
              activeTab === "REJECTED"
                ? {
                    ...styles.tabButtonActive,
                    color: "#dc2626",
                    borderBottomColor: "#dc2626",
                  }
                : styles.tabButton
            }
          >
            Rejected Logs
          </button>
        </div>

        {errorMessage && (
          <div style={styles.errorAlertCard}>
            <AlertCircle size={14} style={{ marginRight: 6 }} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* COMPACT TABLE RENDER AREA */}
      <div style={styles.dynamicTableBodyWrapper}>
        {loading ? (
          <div style={styles.centeredStateBox}>
            <Loader2
              size={24}
              style={{ animation: "spin 1s linear infinite", color: "#2563eb" }}
            />
          </div>
        ) : requests.length === 0 ? (
          <div style={styles.emptyClearStateCard}>
            <ShieldAlert
              size={28}
              style={{ color: "#94a3b8", marginBottom: 6 }}
            />
            <h4 style={{ margin: 0, color: "#475569" }}>No Logs Found</h4>
          </div>
        ) : (
          <div style={styles.tableCardFrame}>
            <table style={styles.compactTable}>
              <thead>
                <tr style={styles.thRow}>
                  <th width="80" style={styles.tableHeaderCell}>
                    Receipt
                  </th>
                  <th width="90" style={styles.tableHeaderCell}>
                    Date
                  </th>
                  <th width="120" style={styles.tableHeaderCell}>
                    Customer
                  </th>
                  <th width="90" style={styles.tableHeaderCell}>
                    Vehicle
                  </th>
                  <th width="140" style={styles.tableHeaderCell}>
                    Material
                  </th>
                  <th width="90" style={styles.tableHeaderCell}>
                    Quantity
                  </th>
                  <th width="70" style={styles.tableHeaderCell}>
                    Amount
                  </th>

                  {/* The text explanation rows inherit the remaining structural space fluidly */}
                  <th style={{ ...styles.tableHeaderCell, minWidth: "100px" }}>
                    Operator Reason Notes
                  </th>
                  <th
                    style={{
                      ...styles.tableHeaderCell,
                      textAlign: "right",
                      minWidth: "250px",
                    }}
                  >
                    Resolution Actions / Comments
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} style={styles.tbRow}>
                    <td style={styles.tableBodyCell}>
                      #{req.transaction?.receiptNumber}
                    </td>
                    <td
                      style={{
                        ...styles.tableBodyCell,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(req.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td style={styles.tableBodyCell}>
                      <strong>{req.transaction?.customerName}</strong>
                    </td>

                    <td
                      style={{
                        ...styles.tableBodyCell,
                        fontFamily: "monospace",
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                        maxWidth: "90px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {req.transaction?.vehicleNumber}
                    </td>
                    <td style={styles.tableBodyCell}>
                      <span style={styles.materialMiniTag}>
                        {req.transaction?.material?.name}
                      </span>
                    </td>
                    <td
                      style={{
                        ...styles.tableBodyCell,
                        whiteSpace: "nowrap",
                        maxWidth: "90px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {req.transaction?.quantity?.toLocaleString()}
                    </td>
                    <td
                      style={{
                        ...styles.tableBodyCell,
                        whiteSpace: "nowrap",
                        maxWidth: "90px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      ₹{req.transaction?.totalAmount?.toLocaleString("en-IN")}
                    </td>
                    <td
                      style={{
                        ...styles.tableBodyCell,
                        fontStyle: "italic",
                        color: "#64748b",
                        maxWidth: "185px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={req.reason}
                    >
                      "{req.reason}"
                    </td>

                    {/* INLINE ACTION ROUTER CELL */}
                    <td style={{ ...styles.tableBodyCell, textAlign: "right" }}>
                      {activeTab === "PENDING" ? (
                        <div style={styles.inlineActionForm}>
                          <div style={styles.inlineButtonRow}>
                            <button
                              onClick={() =>
                                handleProcessRequest(req.id, "APPROVED")
                              }
                              style={styles.inlineApproveBtn}
                              disabled={processingId !== null}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                handleProcessRequest(req.id, "REJECTED")
                              }
                              style={styles.inlineRejectBtn}
                              disabled={processingId !== null}
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              style={styles.noteToggleBtn}
                              onClick={() =>
                                setExpandedNotesId(
                                  expandedNotesId === req.id ? null : req.id,
                                )
                              }
                            >
                              <Pencil size={14} />
                            </button>
                          </div>

                          {expandedNotesId === req.id && (
                            <textarea
                              rows={2}
                              placeholder="Add clearance note..."
                              value={adminNotesMap[req.id] || ""}
                              onChange={(e) =>
                                setAdminNotesMap((prev) => ({
                                  ...prev,

                                  [req.id]: e.target.value,
                                }))
                              }
                              style={styles.inlineTextarea}
                              disabled={processingId === req.id}
                            />
                          )}
                        </div>
                      ) : (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "bold",
                            color:
                              activeTab === "APPROVED" ? "#16a34a" : "#dc2626",
                          }}
                        >
                          {req.adminNotes ? `"${req.adminNotes}"` : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🧭 SYSTEM PAGINATION CONTROLLER FOOTER */}
      {activeTab !== "PENDING" && totalPages > 1 && (
        <footer style={styles.paginationFooterBar}>
          <span style={styles.paginationInfoText}>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>
          <div style={styles.paginationBtnCluster}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              style={styles.pagerBtn}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={styles.pagerBtn}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}

// 🎨 HIGH-DENSITY COMPACT SHEET DESIGN MATRIX
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

  dynamicTableBodyWrapper: {
    flex: 1,
    padding: "16px 24px",
    overflowY: "auto",
    width: "100%",
    boxSizing: "border-box",
  },
  tableCardFrame: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
  },
  compactTable: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: "12px",
  },
  thRow: { backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  tableHeaderCell: {
    padding: "10px 12px",
    fontWeight: "700",
    color: "#475569",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  tbRow: {
    borderBottom: "1px solid #f1f5f9",
    transition: "background-color 0.1s",
  },
  tableBodyCell: {
    padding: "10px 12px",
    color: "#334155",
    verticalAlign: "top",
    fontSize: "12px",
    lineHeight: "1.5",
    wordBreak: "break-word",
  },
  materialMiniTag: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#2563eb",
    backgroundColor: "#eff6ff",
    padding: "2px 6px",
    borderRadius: "4px",
  },

  // Inline actions grid
  inlineActionForm: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "6px",
  },
  inlineButtonRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  noteToggleBtn: {
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #cbd5e1",
    borderRadius: "4px",
    backgroundColor: "#ffffff",
    color: "#475569",
    cursor: "pointer",
  },
  inlineTextarea: {
    width: "220px",
    minHeight: "54px",
    resize: "vertical",
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    padding: "6px 8px",
    fontSize: "11px",
    color: "#000",
    outline: "none",
  },
  inlineApproveBtn: {
    border: "none",
    backgroundColor: "#16a34a",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "11px",
    padding: "4px 10px",
    borderRadius: "4px",
    cursor: "pointer",
  },
  inlineRejectBtn: {
    border: "none",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    fontWeight: "700",
    fontSize: "11px",
    padding: "4px 10px",
    borderRadius: "4px",
    cursor: "pointer",
  },

  paginationFooterBar: {
    height: "48px",
    borderTop: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
  },
  paginationInfoText: { fontSize: "12px", color: "#64748b" },
  paginationBtnCluster: { display: "flex", gap: "6px" },
  pagerBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "28px",
    width: "28px",
    borderRadius: "4px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    cursor: "pointer",
    color: "#475569",
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
};
