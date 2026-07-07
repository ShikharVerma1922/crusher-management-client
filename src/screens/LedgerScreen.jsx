// src/screens/LedgerScreen.jsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import { AdminContext } from "../context/AdminContext.jsx";
import * as XLSX from "xlsx";
import { exportToExcelFormat } from "../utils/excel.js";
import {
  Calendar,
  Download,
  RefreshCw,
  Search,
  ShieldCheck,
  AlertCircle,
  SlidersHorizontal,
} from "lucide-react";
import DateRangeFilter from "../components/DateRangeFilter.jsx";

export default function LedgerScreen() {
  const { adminApi } = useContext(AdminContext);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [totalQuantity, setTotalQuantity] = useState(0);
  const [totalCash, setTotalCash] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(15);

  const [searchQuery, setSearchQuery] = useState("");

  const [editingTicketId, setEditingTicketId] = useState(null);
  const [editingAmount, setEditingAmount] = useState("");

  // 🗓️ 1. TIME-SERIES BOUNDARY INITIALIZATION CONTEXT
  // Returns a raw "YYYY-MM-DD" string mapping to local calendar states cleanly
  const formatLocalCalendarDate = (dateObj) => {
    const year = dateObj.getFullYear();
    // Months are 0-indexed in JS (January is 0), so we add 1 and pad with leading zeros
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`; // Returns perfectly aligned "YYYY-MM-DD"
  };

  const [dateRangePreset, setDateRangePreset] = useState("this_month"); // 🌟 Default standard fallback configuration
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ⚙️ 2. MATHEMATICAL TIME INTERVAL COMPUTATION ENGINE

  const calculatePresetBoundaries = useCallback((preset) => {
    const today = new Date();
    const shiftStart = new Date(today);

    if (shiftStart.getHours() < 9) {
      shiftStart.setDate(shiftStart.getDate() - 1);
    }

    shiftStart.setHours(9, 0, 0, 0);

    let start = new Date(shiftStart);
    const end = new Date();

    switch (preset) {
      case "today":
        break;
      case "this_week":
        const dayOfWeek = shiftStart.getDay();
        start.setDate(shiftStart.getDate() - dayOfWeek);
        break;
      case "this_month":
        start = new Date(
          shiftStart.getFullYear(),
          shiftStart.getMonth(),
          1,
          9,
          0,
          0,
          0,
        );
        break;
      case "this_year":
        start = new Date(shiftStart.getFullYear(), 0, 1, 9, 0, 0, 0);
        break;
      case "last_7_days":
        start.setDate(shiftStart.getDate() - 7);
        break;
      case "last_30_days":
        start.setDate(shiftStart.getDate() - 30);
        break;
      case "last_3_months":
        start.setMonth(shiftStart.getMonth() - 3);
        break;
      case "last_6_months":
        start.setMonth(shiftStart.getMonth() - 6);
        break;
      case "last_1_year":
        start.setFullYear(shiftStart.getFullYear() - 1);
        break;
      case "custom":
        return;
      default:
        start = new Date(
          shiftStart.getFullYear(),
          shiftStart.getMonth(),
          1,
          0,
          0,
          0,
          0,
        );
    }

    // 🌟 Sync structural calendar strings safely
    setStartDate(formatLocalCalendarDate(start));
    setEndDate(formatLocalCalendarDate(end));
  }, []);

  // 🚀 3. BOOT ENGINE RUNTIME DISPATCHER
  // Evaluates once on mount to establish your 'this_month' baseline layout vectors
  useEffect(() => {
    calculatePresetBoundaries(dateRangePreset);
  }, [dateRangePreset, calculatePresetBoundaries]);

  const fetchLedgerData = useCallback(
    async (pageTarget = currentPage) => {
      if (!startDate || !endDate) return;

      setLoading(true);
      setErrorMessage("");
      try {
        const start = new Date(startDate);
        start.setHours(9, 0, 0, 0);

        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        end.setHours(8, 59, 59, 999);

        const absoluteStartDate = start.toISOString();
        const absoluteEndDate = end.toISOString();

        const queryParams = new URLSearchParams({
          page: pageTarget,
          limit: limit,
          ...(searchQuery.trim() && { search: searchQuery.trim() }),
          startDate: absoluteStartDate,
          endDate: absoluteEndDate,
        });

        console.log(
          `📡 [API Window Check] Range: ${absoluteStartDate} ➔ ${absoluteEndDate}`,
        );

        const response = await adminApi.get(
          `/transactions?${queryParams.toString()}`,
        );
        const backendPayload = response.data?.data;

        if (backendPayload && backendPayload.transactions) {
          setTickets(backendPayload.transactions);
          if (backendPayload.meta) {
            setTotalPages(backendPayload.meta.totalPages || 1);
            setCurrentPage(backendPayload.meta.currentPage || pageTarget);
            setTotalQuantity(backendPayload.meta.totalQuantity || 0);
            setTotalCash(backendPayload.meta.totalCash || 0);
            setTotalCredit(backendPayload.meta.totalCredit || 0);
          }
        } else {
          setTickets([]);
          setTotalPages(1);
        }
      } catch (error) {
        console.error("❌ Ledger Fetch UI Error:", error);
        setErrorMessage(
          error.response?.data?.message ||
            "Failed to sync with backend ledger endpoint.",
        );
      } finally {
        setLoading(false);
      }
    },
    [adminApi, searchQuery, startDate, endDate, limit, currentPage],
  );

  // Network listener reacts automatically to any changes in standard parameter values
  useEffect(() => {
    fetchLedgerData(1);
  }, [searchQuery, startDate, endDate]);

  async function handleEditCreditAmount(ticketId, quantity) {
    try {
      const response = await adminApi.patch(
        `/transactions/${ticketId}/credit-amount`,
        {
          amount: Number(editingAmount),
          quantity,
        },
      );
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                totalAmount: response.data.data.totalAmount,
                rateApplied: response.data.data.rateApplied,
              }
            : ticket,
        ),
      );
    } finally {
      setEditingTicketId(null);
    }
  }

  return (
    <div className="ledger-screen" style={styles.viewViewportContainer}>
      <div className="ledger-static-header" style={styles.staticHeaderBlock}>
        <div className="ledger-action-header" style={styles.actionHeader}>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              fontSize: "small",
              gap: "10px",
            }}
          >
            <span style={{ height: "15px" }}>Total Cash: {totalCash}</span>
            <span style={{ height: "15px" }}>Total Credit: {totalCredit}</span>
          </div>
          <button
            className="ledger-export-button"
            onClick={() =>
              exportToExcelFormat(tickets, startDate, endDate, searchQuery)
            }
            style={styles.exportButton}
          >
            <Download size={16} style={{ marginRight: 6 }} /> Export to Excel
          </button>
        </div>

        {/* 📊 PROFESSIONAL UNIFIED CONTROL RIBBON LAYOUT */}
        <div className="ledger-filter-panel" style={styles.filterControlPanel}>
          <div
            className="ledger-search-container"
            style={styles.searchContainer}
          >
            <Search size={16} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search vehicle number, customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <DateRangeFilter
            dateRangePreset={dateRangePreset}
            setDateRangePreset={setDateRangePreset}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            onFetchData={() => fetchLedgerData(currentPage)}
          />
        </div>

        {errorMessage && (
          <div style={styles.errorAlertCard}>
            <AlertCircle size={18} style={{ marginRight: 8 }} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      <div
        className="ledger-scroll-body"
        style={styles.dynamicScrollBodyWrapper}
      >
        <div className="ledger-table-card" style={styles.tableCardContainer}>
          <div
            className="ledger-table-scroller"
            style={styles.overflowTableScroller}
          >
            {loading ? (
              <div style={styles.loadingWrapperGrid}>
                <div style={styles.spinnerElement}></div>
                <p
                  style={{ marginTop: 12, color: "#64748b", fontSize: "13px" }}
                >
                  Syncing data matrices...
                </p>
              </div>
            ) : tickets.length === 0 ? (
              <div style={styles.emptyStateBlock}>
                <p style={{ color: "#64748b", fontWeight: "500" }}>
                  No active records match parameters.
                </p>
              </div>
            ) : (
              <table className="ledger-table" style={styles.masterTableElement}>
                <thead style={styles.stickyTableHeader}>
                  <tr>
                    <th width="60" style={styles.thElement}>
                      R No.
                    </th>

                    <th width="120" style={styles.thElement}>
                      Date/Time
                    </th>
                    <th width="100" style={styles.thElement}>
                      Customer
                    </th>
                    <th width="100" style={styles.thElement}>
                      V No.
                    </th>
                    <th width="80" style={styles.thElement}>
                      Site
                    </th>
                    <th width="80" style={styles.thElement}>
                      Material
                    </th>

                    <th width="50" style={styles.thElement}>
                      Quantity
                    </th>
                    <th width="50" style={styles.thElement}>
                      Rate
                    </th>
                    <th width="50" style={styles.thElement}>
                      Type
                    </th>
                    <th width="70" style={styles.thElement}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} style={styles.tableBodyRowElement}>
                      <td
                        style={{
                          ...styles.tdElement,
                          fontWeight: "800",
                          color: "#0f172a",
                        }}
                      >
                        {ticket.receiptNumber}
                      </td>
                      <td style={{ ...styles.tdElement, color: "#64748b" }}>
                        {new Date(ticket.createdAt).toLocaleString("en-IN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td style={{ ...styles.tdElement, color: "#4b5563" }}>
                        {ticket.customerName}
                      </td>
                      <td
                        style={{
                          ...styles.tdElement,
                          fontWeight: "700",
                          letterSpacing: "0.5px",
                          // color: "#2563eb",
                        }}
                      >
                        {ticket.vehicleNumber.toUpperCase()}
                      </td>
                      <td style={{ ...styles.tdElement, color: "#64748b" }}>
                        {ticket.site?.toLocaleString() || ""}
                      </td>
                      <td
                        style={{
                          ...styles.tdElement,
                          fontWeight: "600",
                          color: "#475569",
                        }}
                      >
                        {ticket.material?.name || "Standard aggregate"}
                      </td>

                      <td
                        style={{
                          ...styles.tdElement,
                          fontWeight: "700",
                          color: "#334155",
                        }}
                      >
                        {ticket.quantity.toLocaleString()}
                      </td>
                      <td style={styles.tdElement}>
                        {ticket.rateApplied
                          ? ticket.rateApplied.toLocaleString()
                          : "N/A"}
                      </td>
                      <td style={styles.tdElement}>
                        {ticket.paymentType.toLocaleString()}
                      </td>
                      <td
                        style={{
                          ...styles.tdElement,
                          fontWeight: "800",
                          color:
                            ticket.paymentType === "CASH"
                              ? "#16a34a"
                              : "#0284c7",
                          cursor:
                            ticket.paymentType === "CASH"
                              ? "default"
                              : "pointer",
                        }}
                        onDoubleClick={() => {
                          setEditingTicketId(ticket.id);
                          setEditingAmount(String(ticket.totalAmount));
                        }}
                      >
                        {editingTicketId === ticket.id &&
                        ticket.paymentType === "CREDIT" ? (
                          <input
                            type="number"
                            value={editingAmount}
                            autoFocus
                            onChange={(e) => setEditingAmount(e.target.value)}
                            onBlur={() => {
                              handleEditCreditAmount(
                                ticket.id,
                                ticket.quantity,
                              );
                              setEditingTicketId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleEditCreditAmount(
                                  ticket.id,
                                  ticket.quantity,
                                );
                                setEditingTicketId(null);
                              }
                              if (e.key === "Escape") {
                                setEditingTicketId(null);
                              }
                            }}
                            style={{
                              width: "60px",
                              padding: "2px 4px",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              backgroundColor: "#f8fafc",
                              color: "#0f172a",
                              fontSize: "13px",
                              fontWeight: "700",
                              fontFamily: "inherit",
                              outline: "none",
                            }}
                          />
                        ) : (
                          <>₹{ticket.totalAmount.toLocaleString()}</>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="ledger-pagination-row" style={styles.paginationRow}>
            <span style={styles.paginationText}>
              Page <strong>{currentPage}</strong> of{" "}
              <strong>{totalPages}</strong>
            </span>
            <div
              className="ledger-pagination-button-pair"
              style={styles.paginationButtonPair}
            >
              <button
                disabled={currentPage === 1 || loading}
                onClick={() => fetchLedgerData(currentPage - 1)}
                style={
                  currentPage === 1
                    ? styles.pagBtnDisabled
                    : styles.pagBtnActive
                }
              >
                Prev
              </button>
              <button
                disabled={currentPage === totalPages || loading}
                onClick={() => fetchLedgerData(currentPage + 1)}
                style={
                  currentPage === totalPages
                    ? styles.pagBtnDisabled
                    : styles.pagBtnActive
                }
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 🎨 UPDATED DESIGN STYLE VECTOR PROPS
const styles = {
  viewViewportContainer: {
    display: "flex",
    flexDirection: "column",
    position: "absolute",
    top: "0px",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#f8fafc",
    overflow: "hidden",
    fontFamily: "system-ui, sans-serif",
  },
  staticHeaderBlock: {
    padding: "10px 24px 0px 24px",
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
  exportButton: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#16a34a",
    color: "#ffffff",
    fontWeight: "700",
    padding: "8px 14px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
  },
  filterControlPanel: {
    display: "flex",
    gap: "12px",
    backgroundColor: "#ffffff",
    marginTop: "10px",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    alignItems: "center",
    flexWrap: "nowrap",
  },
  searchContainer: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    padding: "0 10px",
    flex: 1,
  },
  searchIcon: { color: "#94a3b8", marginRight: "6px" },
  searchInput: {
    backgroundColor: "transparent",
    border: "none",
    outline: "none",
    width: "100%",
    padding: "6px 0",
    fontSize: "13px",
    color: "#334155",
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
    padding: "16px 24px 24px 24px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  },
  tableCardContainer: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    flex: 1,
    overflow: "hidden",
    width: "100%",
    boxSizing: "border-box",
  },
  overflowTableScroller: {
    flex: 1,
    overflowY: "auto",
    overflowX: "auto",
    width: "100%",
    position: "relative",
  },
  masterTableElement: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: "13px",
  },
  stickyTableHeader: {
    position: "sticky",
    top: 0,
    backgroundColor: "#0f172a",
    zIndex: 10,
  },
  thElement: {
    padding: "12px 14px",
    color: "#94a3b8",
    fontWeight: "600",
    textTransform: "uppercase",
    fontSize: "11px",
    letterSpacing: "0.5px",
    backgroundColor: "#0f172a",
  },
  tableBodyRowElement: { borderBottom: "1px solid #f1f5f9" },
  tdElement: { padding: "12px 14px", color: "#475569", whiteSpace: "nowrap" },
  badgeApproved: {
    backgroundColor: "#dcfce7",
    color: "#16a34a",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "700",
  },
  badgeVoid: {
    backgroundColor: "#fee2e2",
    color: "#ef4444",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "700",
  },
  paginationRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 16px",
    backgroundColor: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
    flexShrink: 0,
  },
  paginationText: { fontSize: "12px", color: "#475569" },
  paginationButtonPair: { display: "flex", gap: "6px" },
  pagBtnActive: {
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    color: "#334155",
    padding: "5px 10px",
    borderRadius: "4px",
    fontWeight: "600",
    fontSize: "12px",
    cursor: "pointer",
  },
  pagBtnDisabled: {
    backgroundColor: "#f1f5f9",
    border: "1px solid #cbd5e1",
    color: "#94a3b8",
    padding: "5px 10px",
    borderRadius: "4px",
    fontSize: "12px",
    cursor: "not-allowed",
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
  emptyStateBlock: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "200px",
    width: "100%",
  },
};
