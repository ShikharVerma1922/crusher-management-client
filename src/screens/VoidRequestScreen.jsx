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
  RefreshCw,
} from "lucide-react";
import { ledgerStyles } from "../styles/ledgerStyles.js";

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
    <div style={ledgerStyles.viewViewportContainer}>
      {/* HEADER STRIP */}
      <div style={ledgerStyles.staticHeaderBlock}>
        {/* <div style={styles.actionHeader}>
          <div>
            <h1 style={styles.pageTitle}>VOID REQUESTS</h1>
          </div>
        </div> */}

        {/* CONTROLS STRIP */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingRight: "10px",
          }}
        >
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
          <button onClick={fetchTabData} style={styles.refreshButton}>
            <RefreshCw size={14} />
          </button>
        </div>
        {errorMessage && (
          <div style={ledgerStyles.errorAlertCard}>
            <AlertCircle size={14} style={{ marginRight: 6 }} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* COMPACT TABLE RENDER AREA */}
      <div style={ledgerStyles.dynamicScrollBodyWrapper}>
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
          <div style={ledgerStyles.tableCardContainer}>
            <table style={styles.compactTable}>
              <thead>
                <tr style={styles.thRow}>
                  <th width="50" style={ledgerStyles.thElement}>
                    R.No.
                  </th>
                  <th width="60" style={ledgerStyles.thElement}>
                    Date
                  </th>
                  <th width="100" style={ledgerStyles.thElement}>
                    Customer
                  </th>
                  <th width="60" style={ledgerStyles.thElement}>
                    V.No.
                  </th>
                  <th width="35" style={ledgerStyles.thElement}>
                    Mat
                  </th>
                  <th width="30" style={ledgerStyles.thElement}>
                    M.QTY
                  </th>
                  <th width="40" style={ledgerStyles.thElement}>
                    M.Rate
                  </th>
                  <th width="50" style={ledgerStyles.thElement}>
                    M.Amt
                  </th>
                  <th width="50" style={ledgerStyles.thElement}>
                    R.Amt
                  </th>
                  <th width="60" style={ledgerStyles.thElement}>
                    G.Total
                  </th>
                  <th width="40" style={ledgerStyles.thElement}>
                    A.Paid
                  </th>

                  {/* The text explanation rows inherit the remaining structural space fluidly */}
                  <th style={{ ...ledgerStyles.thElement, minWidth: "100px" }}>
                    Operator Reason Notes
                  </th>
                  <th
                    style={{
                      ...ledgerStyles.thElement,
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
                  <tr key={req.id} style={ledgerStyles.tableBodyRowElement}>
                    <td style={ledgerStyles.tdElement}>
                      #{req.transaction?.receiptNumber}
                    </td>
                    <td
                      style={{
                        ...ledgerStyles.tdElement,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(req.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td style={ledgerStyles.tdElement}>
                      <strong>{req.transaction?.customer.name}</strong>
                    </td>

                    <td
                      style={{
                        ...ledgerStyles.tdElement,
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
                    <td style={ledgerStyles.tdElement}>
                      <span style={styles.materialMiniTag}>
                        {req.transaction?.material?.name}
                      </span>
                    </td>
                    <td
                      style={{
                        ...ledgerStyles.tdElement,
                        whiteSpace: "nowrap",
                        maxWidth: "90px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {req.transaction?.materialQuantity?.toLocaleString()}
                    </td>
                    <td style={ledgerStyles.tdElement}>
                      {req.transaction?.materialRate?.toLocaleString("en-IN")}
                    </td>
                    <td style={ledgerStyles.tdElement}>
                      {req.transaction?.materialAmount?.toLocaleString("en-IN")}
                    </td>
                    <td style={ledgerStyles.tdElement}>
                      {req.transaction?.royaltyAmount?.toLocaleString("en-IN")}
                    </td>
                    <td style={ledgerStyles.tdElement}>
                      {req.transaction?.grandTotal?.toLocaleString("en-IN")}
                    </td>
                    <td style={ledgerStyles.tdElement}>
                      {req.transaction?.amountPaid?.toLocaleString("en-IN")}
                    </td>
                    <td
                      style={{
                        ...ledgerStyles.tdElement,
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
                    <td
                      style={{ ...ledgerStyles.tdElement, textAlign: "right" }}
                    >
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
    backgroundColor: "#0f172a",
    color: "#ffffff",
    height: "34px",
    width: "34px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  tabBarWrapper: {
    display: "flex",
    gap: "20px",
    paddingLeft: "10px",
  },
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

  compactTable: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: "12px",
  },

  materialMiniTag: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#2563eb",
    backgroundColor: "#eff6ff",
    padding: "2px 6px",
    borderRadius: "4px",
  },

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
