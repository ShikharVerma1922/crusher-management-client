// src/screens/LedgerScreen.jsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import { AdminContext } from "../context/AdminContext.jsx";
import * as XLSX from "xlsx";
import { exportToExcelFormat } from "../utils/paymentsExcel.js";
import {
  Calendar,
  Download,
  RefreshCw,
  Search,
  ShieldCheck,
  AlertCircle,
  SlidersHorizontal,
  Loader2,
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

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(15);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

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
          `/payments?${queryParams.toString()}`,
        );
        const backendPayload = response.data?.data;

        if (backendPayload && backendPayload.payments) {
          setTickets(backendPayload.payments);
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
    [adminApi, debouncedSearchQuery, startDate, endDate, limit, currentPage],
  );

  // Network listener reacts automatically to any changes in standard parameter values
  useEffect(() => {
    fetchLedgerData(1);
  }, [debouncedSearchQuery, startDate, endDate]);

  const handleExport = async () => {
    try {
      setExporting(true);

      const start = new Date(startDate);
      start.setHours(9, 0, 0, 0);

      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      end.setHours(8, 59, 59, 999);

      const response = await adminApi.get("/payments/export", {
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
              placeholder="Search receipt no., customer name..."
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
                style={{
                  ...ledgerStyles.masterTableElement,
                  tableLayout: "fixed",
                }}
              >
                <thead style={ledgerStyles.stickyTableHeader}>
                  <tr>
                    <th width="50" style={ledgerStyles.thElement}>
                      R.No.
                    </th>

                    <th minWidth="70" width="80" style={ledgerStyles.thElement}>
                      Date/Time
                    </th>
                    <th width="100" style={ledgerStyles.thElement}>
                      Customer
                    </th>
                    <th width="100" style={ledgerStyles.thElement}>
                      Payment Mode
                    </th>
                    <th
                      minWidth="180"
                      width="180"
                      style={ledgerStyles.thElement}
                    >
                      Ref.No.
                    </th>
                    <th
                      width="220"
                      style={{
                        ...ledgerStyles.thElement,
                        width: "220px",
                        minWidth: "220px",
                        maxWidth: "220px",
                      }}
                    >
                      Remark
                    </th>
                    <th width="60" style={ledgerStyles.thElement}>
                      Amount
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
                          fontWeight: "800",
                          color: "#0f172a",
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                        onClick={() =>
                          setSelectedReceiptId((prev) =>
                            prev === ticket.id ? null : ticket.id,
                          )
                        }
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
                        >
                          <span style={{ fontWeight: 600, color: "#334155" }}>
                            {new Date(ticket.createdAt).toLocaleDateString(
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
                        {ticket.paymentMode.toUpperCase()}
                      </td>
                      <td
                        style={{
                          ...ledgerStyles.tdElement,
                          width: "180px",
                          minWidth: "180px",
                          maxWidth: "180px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {ticket.referenceNo || ""}
                      </td>
                      <td
                        style={{
                          ...ledgerStyles.tdElement,
                          width: "220px",
                          minWidth: "220px",
                          maxWidth: "220px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={ticket.remarks || ""}
                      >
                        {ticket.remarks || ""}
                      </td>
                      <td
                        style={{
                          ...ledgerStyles.tdElement,
                          textAlign: "right",
                        }}
                      >
                        {ticket.amountPaid.toLocaleString("en-IN")}
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
