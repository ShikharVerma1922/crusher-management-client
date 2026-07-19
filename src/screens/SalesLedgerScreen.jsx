// src/screens/LedgerScreen.jsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import { AdminContext } from "../context/AdminContext.jsx";
import * as XLSX from "xlsx";
import { exportToExcelFormat } from "../utils/salesExcel.js";
import {
  Calendar,
  Download,
  RefreshCw,
  Search,
  ShieldCheck,
  AlertCircle,
  SlidersHorizontal,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DateRangeFilter from "../components/DateRangeFilter.jsx";
import { ledgerStyles } from "../styles/ledgerStyles.js";

export default function LedgerScreen() {
  const { adminApi } = useContext(AdminContext);
  const navigate = useNavigate();

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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  const [editingTicketId, setEditingTicketId] = useState(null);
  const [editingAmount, setEditingAmount] = useState("");

  const [exporting, setExporting] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400); // delay in the search after typing

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
      case "this_week": {
        const dayOfWeek = shiftStart.getDay();
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        start.setDate(shiftStart.getDate() - mondayOffset);
        break;
      }
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
          ...(debouncedSearchQuery.trim() && {
            search: debouncedSearchQuery.trim(),
          }),
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
    [adminApi, debouncedSearchQuery, startDate, endDate, limit, currentPage],
  );

  // Network listener reacts automatically to any changes in standard parameter values
  useEffect(() => {
    fetchLedgerData(1);
  }, [debouncedSearchQuery, startDate, endDate]);

  async function handleEditCreditAmount(ticketId, materialQuantity) {
    try {
      const response = await adminApi.patch(
        `/transactions/${ticketId}/credit-amount`,
        {
          amount: Number(editingAmount),
          materialQuantity,
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

  const handleExport = async () => {
    try {
      setExporting(true);

      const start = new Date(startDate);
      start.setHours(9, 0, 0, 0);

      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      end.setHours(8, 59, 59, 999);

      const response = await adminApi.get("/transactions/export", {
        params: {
          search: searchQuery.trim(),
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      });

      exportToExcelFormat(response.data.data, startDate, endDate, searchQuery);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="ledger-screen" style={ledgerStyles.viewViewportContainer}>
      <div
        className="ledger-static-header"
        style={ledgerStyles.staticHeaderBlock}
      >
        {/* <div className="ledger-action-header" style={ledgerStyles.actionHeader}>
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
            style={ledgerStyles.exportButton}
          >
            <Download size={16} style={{ marginRight: 6 }} /> Export to Excel
          </button>
        </div> */}

        {/* 📊 PROFESSIONAL UNIFIED CONTROL RIBBON LAYOUT */}
        <div
          className="ledger-filter-panel"
          style={ledgerStyles.filterControlPanel}
        >
          <div
            className="ledger-search-container"
            style={ledgerStyles.searchContainer}
          >
            <Search size={16} style={ledgerStyles.searchIcon} />
            <input
              type="text"
              placeholder="Search vehicle number, receipt number, customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={ledgerStyles.searchInput}
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

          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              ...ledgerStyles.exportButton,
              ...(exporting && ledgerStyles.exportButtonDisabled),
            }}
          >
            {exporting ? (
              <RefreshCw
                size={16}
                style={{
                  animation: "spin 1s linear infinite",
                }}
              />
            ) : (
              <Download size={16} />
            )}
          </button>
        </div>

        {errorMessage && (
          <div style={ledgerStyles.errorAlertCard}>
            <AlertCircle size={18} style={{ marginRight: 8 }} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      <div
        className="ledger-scroll-body"
        style={ledgerStyles.dynamicScrollBodyWrapper}
      >
        <div
          className="ledger-table-card"
          style={ledgerStyles.tableCardContainer}
        >
          <div
            className="ledger-table-scroller"
            style={ledgerStyles.overflowTableScroller}
          >
            {loading ? (
              <div style={ledgerStyles.loadingWrapperGrid}>
                <Loader2
                  size={24}
                  style={{
                    animation: "spin 1s linear infinite",
                    color: "#2563eb",
                  }}
                />
                <p
                  style={{ marginTop: 12, color: "#64748b", fontSize: "13px" }}
                >
                  Syncing data matrices...
                </p>
              </div>
            ) : tickets.length === 0 ? (
              <div style={ledgerStyles.emptyStateBlock}>
                <p style={{ color: "#64748b", fontWeight: "500" }}>
                  No active records match parameters.
                </p>
              </div>
            ) : (
              <table
                className="ledger-table"
                style={ledgerStyles.masterTableElement}
              >
                <thead style={ledgerStyles.stickyTableHeader}>
                  <tr>
                    <th width="30" style={ledgerStyles.thElement}>
                      R.No.
                    </th>

                    <th width="60" style={ledgerStyles.thElement}>
                      Date/Time
                    </th>
                    <th minwidth="100" style={ledgerStyles.thElement}>
                      Customer
                    </th>
                    <th width="60" style={ledgerStyles.thElement}>
                      V.No.
                    </th>
                    <th minwidth="80" style={ledgerStyles.thElement}>
                      Site
                    </th>
                    <th width="35" style={ledgerStyles.thElement}>
                      Mat
                    </th>

                    <th width="30" style={ledgerStyles.thElement}>
                      M.Qty
                    </th>
                    <th width="40" style={ledgerStyles.thElement}>
                      M.Rate
                    </th>
                    <th width="50" style={ledgerStyles.thElement}>
                      M.Amt
                    </th>
                    <th width="30" style={ledgerStyles.thElement}>
                      R.Qty
                    </th>
                    <th width="40" style={ledgerStyles.thElement}>
                      R.Rate
                    </th>
                    <th width="50" style={ledgerStyles.thElement}>
                      R.Amt
                    </th>
                    <th width="40" style={ledgerStyles.thElement}>
                      P.Mode
                    </th>
                    <th width="60" style={ledgerStyles.thElement}>
                      G.Total
                    </th>
                    <th width="40" style={ledgerStyles.thElement}>
                      A.Paid
                    </th>
                    <th width="60" style={ledgerStyles.thElement}>
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      style={{
                        ...ledgerStyles.tableBodyRowElement,
                        ...(selectedReceiptId === ticket.id &&
                          ledgerStyles.selectedTableRow),
                      }}
                    >
                      <td
                        style={{
                          ...ledgerStyles.tdElement,
                          color:
                            ticket?.rateStatus === "OPEN"
                              ? "#FF8C00"
                              : "#0f172a",
                          cursor:
                            ticket?.rateStatus === "OPEN"
                              ? "pointer"
                              : "default",
                          userSelect: "none",
                        }}
                        onClick={() => {
                          ticket?.rateStatus === "OPEN" &&
                            navigate(
                              `/settlements?search=${ticket.receiptNumber}`,
                            );
                        }}
                      >
                        {ticket.receiptNumber}
                      </td>
                      <td
                        style={{ ...ledgerStyles.tdElement, color: "#64748b" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            lineHeight: 1.2,
                          }}
                          onClick={() =>
                            setSelectedReceiptId((prev) =>
                              prev === ticket.id ? null : ticket.id,
                            )
                          }
                        >
                          <span style={{ fontWeight: 600, color: "#334155" }}>
                            {new Date(ticket.businessDate).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#94a3b8",
                              marginTop: "2px",
                            }}
                          >
                            {new Date(ticket.createdAt).toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              },
                            )}
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          ...ledgerStyles.tdElement,
                          cursor: "pointer",
                          color: "#2563eb",
                        }}
                        onClick={() =>
                          navigate(`/customers/${ticket.customerId}`)
                        }
                      >
                        {ticket.customer.name}
                      </td>
                      <td style={ledgerStyles.tdElement}>
                        {ticket.vehicleNumber.toUpperCase()}
                      </td>
                      <td style={ledgerStyles.tdElement}>
                        {ticket.site?.toLocaleString() || ""}
                      </td>
                      <td style={ledgerStyles.tdElement}>
                        {ticket.material?.name || "Standard aggregate"}
                      </td>

                      <td style={ledgerStyles.tdElement}>
                        {ticket.materialQuantity.toLocaleString()}
                      </td>
                      <td style={ledgerStyles.tdElement}>
                        {ticket.materialRate === 0 ? "--" : ticket.materialRate}
                      </td>
                      <td
                        style={{
                          ...ledgerStyles.tdElement,
                          textAlign: "right",
                        }}
                      >
                        {ticket.materialRate === 0
                          ? "--"
                          : ticket.materialAmount.toLocaleString("en-IN")}
                      </td>
                      <td style={ledgerStyles.tdElement}>
                        {ticket.royaltyQuantity === 0 &&
                        ticket.materialRate === 0
                          ? "--"
                          : ticket.royaltyQuantity.toLocaleString()}
                      </td>
                      <td style={ledgerStyles.tdElement}>
                        {ticket.royaltyRate === 0 && ticket.materialRate === 0
                          ? "--"
                          : ticket.royaltyRate}
                      </td>
                      <td
                        style={{
                          ...ledgerStyles.tdElement,
                          textAlign: "right",
                        }}
                      >
                        {ticket.royaltyAmount === 0 && ticket.materialRate === 0
                          ? "--"
                          : ticket.royaltyAmount.toLocaleString("en-IN")}
                      </td>
                      <td style={ledgerStyles.tdElement}>
                        {ticket.paymentMode.toLocaleString()}
                      </td>
                      <td
                        style={{
                          ...ledgerStyles.tdElement,
                          textAlign: "right",
                        }}
                      >
                        {ticket.materialRate === 0
                          ? "--"
                          : ticket.grandTotal.toLocaleString("en-IN")}
                      </td>

                      <td
                        style={{
                          ...ledgerStyles.tdElement,
                          textAlign: "right",
                        }}
                      >
                        {ticket.materialRate === 0
                          ? "--"
                          : ticket.amountPaid.toLocaleString("en-IN")}
                      </td>
                      <td
                        style={{
                          ...ledgerStyles.tdElement,
                          color:
                            ticket.materialRate === 0
                              ? "gray"
                              : ticket.balance > 0
                                ? "#dc2626"
                                : "#16a34a",
                          fontWeight: 700,
                          textAlign: "right",
                        }}
                      >
                        {ticket.materialRate === 0
                          ? "--"
                          : ticket.balance.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div
            className="ledger-pagination-row"
            style={ledgerStyles.paginationRow}
          >
            <span style={ledgerStyles.paginationText}>
              Page <strong>{currentPage}</strong> of{" "}
              <strong>{totalPages}</strong>
            </span>
            <div
              className="ledger-pagination-button-pair"
              style={ledgerStyles.paginationButtonPair}
            >
              <button
                disabled={currentPage === 1 || loading}
                onClick={() => fetchLedgerData(currentPage - 1)}
                style={
                  currentPage === 1
                    ? ledgerStyles.pagBtnDisabled
                    : ledgerStyles.pagBtnActive
                }
              >
                Prev
              </button>
              <button
                disabled={currentPage === totalPages || loading}
                onClick={() => fetchLedgerData(currentPage + 1)}
                style={
                  currentPage === totalPages
                    ? ledgerStyles.pagBtnDisabled
                    : ledgerStyles.pagBtnActive
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

// const ledgerStyles = {
//   viewViewportContainer: {
//     display: "flex",
//     flexDirection: "column",
//     position: "relative",
//     height: "100%",
//     top: 0,
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: "#f1f5f9", // Crisp light-grey ERP backdrop
//     overflow: "hidden",
//     fontFamily: "JetBrains Mono, Fira Code, Monaco, Consolas, monospace",
//   },
//   staticHeaderBlock: {
//     padding: "3px 0px",
//     flexShrink: 0,
//     width: "100%",
//     boxSizing: "border-box",
//     backgroundColor: "#1e293b",
//     borderBottom: "2px solid #0f172a",
//   },
//   actionHeader: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     gap: "12px",
//     height: "44px",
//   },
//   pageTitle: {
//     fontSize: "13px",
//     fontWeight: "700",
//     color: "#38bdf8",
//     margin: 0,
//     textTransform: "uppercase",
//     letterSpacing: "0.5px",
//   },
//   pageSubtitle: {
//     fontSize: "11px",
//     color: "#94a3b8",
//     marginTop: "0px",
//     margin: 0,
//   },
//   filterControlPanel: {
//     display: "flex",
//     gap: "8px",
//     backgroundColor: "#ffffff",
//     marginTop: "0px",
//     padding: "6px 12px",
//     borderRadius: "0px",
//     borderBottom: "1px solid #cbd5e1",
//     alignItems: "center",
//     flexWrap: "nowrap",
//   },
//   searchContainer: {
//     display: "flex",
//     alignItems: "center",
//     backgroundColor: "#f8fafc",
//     borderRadius: "0px",
//     border: "1px solid #cbd5e1",
//     padding: "0 8px",
//     flex: 1,
//     height: "28px",
//   },
//   searchIcon: { color: "#64748b", marginRight: "6px" },
//   searchInput: {
//     backgroundColor: "transparent",
//     border: "none",
//     outline: "none",
//     width: "100%",
//     padding: "4px 0",
//     fontSize: "12px",
//     color: "#1e293b",
//     fontFamily: "inherit",
//     fontWeight: "600",
//   },
//   exportButton: {
//     backgroundColor: "#16a34a",
//     color: "#ffffff",
//     height: "28px",
//     padding: "0 12px",
//     borderRadius: "0px",
//     border: "1px solid #15803d",
//     cursor: "pointer",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     fontSize: "11px",
//     fontWeight: "700",
//     textTransform: "uppercase",
//   },
//   errorAlertCard: {
//     display: "flex",
//     alignItems: "center",
//     backgroundColor: "#fef2f2",
//     borderLeft: "4px solid #dc2626",
//     borderTop: "1px solid #fee2e2",
//     borderRight: "1px solid #fee2e2",
//     borderBottom: "1px solid #fee2e2",
//     color: "#991b1b",
//     padding: "6px 12px",
//     borderRadius: "0px",
//     marginTop: "4px",
//     fontSize: "11px",
//     fontWeight: "600",
//   },
//   dynamicScrollBodyWrapper: {
//     flex: 1,
//     padding: "8px 12px 12px 12px",
//     overflow: "hidden",
//     display: "flex",
//     flexDirection: "column",
//     boxSizing: "border-box",
//   },
//   tableCardContainer: {
//     backgroundColor: "#ffffff",
//     borderRadius: "0px",
//     border: "1px solid #cbd5e1",
//     display: "flex",
//     flexDirection: "column",
//     flex: 1,
//     overflow: "hidden",
//     width: "100%",
//     boxSizing: "border-box",
//   },
//   overflowTableScroller: {
//     flex: 1,
//     overflowY: "auto",
//     overflowX: "auto",
//     width: "100%",
//     position: "relative",
//     backgroundColor: "#ffffff",
//   },
//   masterTableElement: {
//     width: "100%",
//     borderCollapse: "collapse",
//     textAlign: "left",
//     fontSize: "12px",
//   },
//   stickyTableHeader: {
//     position: "sticky",
//     top: 0,
//     backgroundColor: "#f8fafc",
//     zIndex: 10,
//   },
//   thElement: {
//     padding: "8px 10px",
//     color: "#475569",
//     fontWeight: "700",
//     textTransform: "uppercase",
//     fontSize: "11px",
//     letterSpacing: "0.2px",
//     backgroundColor: "#f1f5f9",
//     borderBottom: "2px solid #cbd5e1",
//     borderRight: "1px solid #cbd5e1", // Visible grid borders like an Excel/Tally ledger matrix
//   },
//   tableBodyRowElement: {
//     borderBottom: "1px solid #e2e8f0",
//   },
//   selectedTableRow: {
//     backgroundColor: "#9fc5f6",
//   },
//   tdElement: {
//     padding: "6px 10px",
//     color: "#1e293b",
//     whiteSpace: "nowrap",
//     fontWeight: "600",
//     borderRight: "1px solid #e2e8f0",
//     borderBottom: "1px solid #e2e8f0",
//   },
//   badgeApproved: {
//     backgroundColor: "#f0fdf4",
//     color: "#166534",
//     padding: "0px 4px",
//     border: "1px solid #bbf7d0",
//     borderRadius: "0px",
//     fontSize: "10px",
//     fontWeight: "700",
//   },
//   badgeVoid: {
//     backgroundColor: "#fef2f2",
//     color: "#991b1b",
//     padding: "0px 4px",
//     border: "1px solid #fecaca",
//     borderRadius: "0px",
//     fontSize: "10px",
//     fontWeight: "700",
//   },
//   paginationRow: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: "6px 12px",
//     backgroundColor: "#f1f5f9",
//     borderTop: "2px solid #cbd5e1",
//     flexShrink: 0,
//     height: "36px",
//   },
//   paginationText: {
//     fontSize: "11px",
//     color: "#475569",
//     fontWeight: "700",
//   },
//   paginationButtonPair: { display: "flex", gap: "4px" },
//   pagBtnActive: {
//     backgroundColor: "#ffffff",
//     border: "1px solid #cbd5e1",
//     color: "#1e293b",
//     padding: "3px 10px",
//     borderRadius: "0px",
//     fontWeight: "700",
//     fontSize: "11px",
//     cursor: "pointer",
//   },
//   pagBtnDisabled: {
//     backgroundColor: "#e2e8f0",
//     border: "1px solid #cbd5e1",
//     color: "#94a3b8",
//     padding: "3px 10px",
//     borderRadius: "0px",
//     fontSize: "11px",
//     cursor: "not-allowed",
//   },
//   loadingWrapperGrid: {
//     display: "flex",
//     flexDirection: "column",
//     alignItems: "center",
//     justifyContent: "center",
//     minHeight: "200px",
//     width: "100%",
//     backgroundColor: "#ffffff",
//     fontSize: "12px",
//     fontWeight: "700",
//     color: "#64748b",
//   },
//   emptyStateBlock: {
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     minHeight: "200px",
//     width: "100%",
//     backgroundColor: "#ffffff",
//     fontSize: "12px",
//     fontWeight: "700",
//     color: "#94a3b8",
//   },
//   exportButtonDisabled: {
//     backgroundColor: "#cbd5e1",
//     borderColor: "#94a3b8",
//     color: "#94a3b8",
//     cursor: "not-allowed",
//   },
// };
