// src/screens/LedgerScreen.jsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import { AdminContext } from "../context/AdminContext.jsx";
import * as XLSX from "xlsx";
import {
  Calendar,
  Download,
  RefreshCw,
  Search,
  ShieldCheck,
  AlertCircle,
  SlidersHorizontal,
} from "lucide-react";

export default function LedgerScreen() {
  const { adminApi } = useContext(AdminContext);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(15);

  const [searchQuery, setSearchQuery] = useState("");

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

    // Create an absolute localized midnight base anchor for calculations
    const localMidnightBase = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
      0,
    );

    const end = new Date(); // End date stays exactly as current time moment
    let start = new Date(localMidnightBase.getTime()); // Copy the midnight base anchor

    switch (preset) {
      case "today":
        // Already pinned perfectly to 00:00:00 local time
        break;
      case "this_week":
        const dayOfWeek = localMidnightBase.getDay();
        start.setDate(localMidnightBase.getDate() - dayOfWeek);
        break;
      case "this_month":
        start = new Date(
          localMidnightBase.getFullYear(),
          localMidnightBase.getMonth(),
          1,
          0,
          0,
          0,
          0,
        );
        break;
      case "this_year":
        start = new Date(localMidnightBase.getFullYear(), 0, 1, 0, 0, 0, 0);
        break;
      case "last_7_days":
        start.setDate(localMidnightBase.getDate() - 7);
        break;
      case "last_30_days":
        start.setDate(localMidnightBase.getDate() - 30);
        break;
      case "last_3_months":
        start.setMonth(localMidnightBase.getMonth() - 3);
        break;
      case "last_6_months":
        start.setMonth(localMidnightBase.getMonth() - 6);
        break;
      case "last_1_year":
        start.setFullYear(localMidnightBase.getFullYear() - 1);
        break;
      case "custom":
        return;
      default:
        start = new Date(
          localMidnightBase.getFullYear(),
          localMidnightBase.getMonth(),
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
        // 🌟 THE BACKEND WINDOW ALIGNMENT:
        // Forces the start date to catch the absolute first second of the day (00:00:00)
        // Forces the end date to catch the absolute last second of the day (23:59:59)
        const absoluteStartDate = `${startDate}T00:00:00.000Z`;
        const absoluteEndDate = `${endDate}T23:59:59.999Z`;

        const queryParams = new URLSearchParams({
          page: pageTarget,
          limit: limit,
          ...(searchQuery.trim() && { search: searchQuery.trim() }),
          startDate: absoluteStartDate, // Passes perfectly through gte
          endDate: absoluteEndDate, // Passes perfectly through lte
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

  const exportToExcelFormat = () => {
    if (tickets.length === 0) return;
    const flatSheetData = tickets.map((t, index) => ({
      "Receipt No": t.receiptNumber || index + 1,
      "System Ticket UUID": t.id,
      "Date & Time Logged": new Date(t.createdAt).toLocaleString("en-IN"),
      "Vehicle Plate Number": t.vehicleNumber.toUpperCase(),
      "Customer / Vendor": t.customerName,
      "Material Variant": t.material?.name || "Aggregates Row",
      "Gross Weight (KG)": t.grossWeight,
      "Tare Weight (KG)": t.tareWeight,
      "Net Weight (KG)": t.netWeight,
      "Rate (INR/Ton)": t.rateApplied,
      "Total Invoiced Bill (INR)": t.totalAmount,
      "Cabin Clerk": t.clerk?.name || "System Clerk",
      "Void Status": t.isVoided ? "VOIDED" : "OPERATIONAL",
    }));

    const worksheet = XLSX.utils.json_to_sheet(flatSheetData);
    const workbook = XLSX.utils.book_new();
    worksheet["!cols"] = [
      { wch: 12 },
      { wch: 38 },
      { wch: 22 },
      { wch: 22 },
      { wch: 26 },
      { wch: 24 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 24 },
      { wch: 20 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, "Weighbridge Ledger");
    XLSX.writeFile(
      workbook,
      `Mandar_Crusher_Ledger_${startDate}_to_${endDate}.xlsx`,
    );
  };

  return (
    <div style={styles.viewViewportContainer}>
      <div style={styles.staticHeaderBlock}>
        <div style={styles.actionHeader}>
          <div>
            <h1 style={styles.pageTitle}>CARGO LEDGER</h1>
          </div>
          <button onClick={exportToExcelFormat} style={styles.exportButton}>
            <Download size={16} style={{ marginRight: 6 }} /> Export to Excel
          </button>
        </div>

        {/* 📊 PROFESSIONAL UNIFIED CONTROL RIBBON LAYOUT */}
        <div style={styles.filterControlPanel}>
          <div style={styles.searchContainer}>
            <Search size={16} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search vehicle number, customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.datePickerWrapper}>
            {/* 🌟 PRESET TIMELINE QUICK DROPDOWN */}
            <div style={styles.dropdownInputGroup}>
              <SlidersHorizontal
                size={14}
                style={{ color: "#64748b", marginRight: 6 }}
              />
              <select
                value={dateRangePreset}
                onChange={(e) => setDateRangePreset(e.target.value)}
                style={styles.selectDropdownElement}
              >
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="this_year">This Year</option>
                <option value="last_7_days">Last 7 Days</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="last_3_months">Last 3 Months</option>
                <option value="last_6_months">Last 6 Months</option>
                <option value="last_1_year">Last 1 Year</option>
                <option value="custom">Custom Range...</option>
              </select>
            </div>

            {/* MANUAL CALENDAR OVERRIDES - Visual styles alter to show focus if Custom select is checked */}
            <div
              style={
                dateRangePreset !== "custom"
                  ? styles.dateInputGroupReadOnly
                  : styles.dateInputGroup
              }
            >
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateRangePreset("custom");
                }}
                style={styles.dateField}
              />
            </div>
            <span
              style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "bold" }}
            >
              to
            </span>
            <div
              style={
                dateRangePreset !== "custom"
                  ? styles.dateInputGroupReadOnly
                  : styles.dateInputGroup
              }
            >
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateRangePreset("custom");
                }}
                style={styles.dateField}
              />
            </div>

            <button
              onClick={() => fetchLedgerData(currentPage)}
              style={styles.refreshButton}
              title="Force Reload Data"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {errorMessage && (
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
              <table style={styles.masterTableElement}>
                <thead style={styles.stickyTableHeader}>
                  <tr>
                    <th width="90" style={styles.thElement}>
                      Receipt No
                    </th>
                    <th style={styles.thElement}>Date/Time</th>
                    <th style={styles.thElement}>Vehicle No</th>
                    <th width="100" style={styles.thElement}>
                      Customer Name
                    </th>
                    <th width="100" style={styles.thElement}>
                      Material Variant
                    </th>
                    <th style={styles.thElement}>Gross(KG)</th>
                    <th style={styles.thElement}>Tare(KG)</th>
                    <th style={styles.thElement}>Net(KG)</th>
                    <th style={styles.thElement}>Total Bill</th>
                    <th style={styles.thElement}>Operator Clerk</th>
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
                      <td style={styles.tdElement}>
                        {new Date(ticket.createdAt).toLocaleString("en-IN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td
                        style={{
                          ...styles.tdElement,
                          fontWeight: "700",
                          color: "#2563eb",
                        }}
                      >
                        {ticket.vehicleNumber.toUpperCase()}
                      </td>
                      <td style={styles.tdElement}>{ticket.customerName}</td>
                      <td
                        style={{
                          ...styles.tdElement,
                          fontWeight: "600",
                          color: "#475569",
                        }}
                      >
                        {ticket.material?.name || "Standard aggregate"}
                      </td>
                      <td style={styles.tdElement}>
                        {ticket.grossWeight.toLocaleString()}
                      </td>
                      <td style={styles.tdElement}>
                        {ticket.tareWeight.toLocaleString()}
                      </td>
                      <td
                        style={{
                          ...styles.tdElement,
                          fontWeight: "700",
                          color: "#334155",
                        }}
                      >
                        {ticket.netWeight.toLocaleString()}
                      </td>
                      <td
                        style={{
                          ...styles.tdElement,
                          fontWeight: "800",
                          color: "#16a34a",
                        }}
                      >
                        ₹{ticket.totalAmount.toLocaleString()}
                      </td>
                      <td style={styles.tdElement}>
                        {ticket.clerk?.name || "Gate Operator"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={styles.paginationRow}>
            <span style={styles.paginationText}>
              Page <strong>{currentPage}</strong> of{" "}
              <strong>{totalPages}</strong>
            </span>
            <div style={styles.paginationButtonPair}>
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

  datePickerWrapper: { display: "flex", alignItems: "center", gap: "8px" },
  dropdownInputGroup: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    padding: "0 8px",
    height: "32px",
  },
  selectDropdownElement: {
    border: "none",
    backgroundColor: "transparent",
    outline: "none",
    fontSize: "13px",
    fontWeight: "600",
    color: "#334155",
    cursor: "pointer",
    padding: "4px 0",
  },
  dateInputGroup: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    padding: "0 8px",
    height: "32px",
    transition: "all 0.15s",
  },
  dateInputGroupReadOnly: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    padding: "0 8px",
    height: "32px",
    opacity: 0.8,
  },
  dateField: {
    border: "none",
    backgroundColor: "transparent",
    outline: "none",
    padding: "4px 0",
    color: "#334155",
    fontSize: "13px",
    fontFamily: "inherit",
  },

  refreshButton: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    height: "32px",
    width: "32px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
