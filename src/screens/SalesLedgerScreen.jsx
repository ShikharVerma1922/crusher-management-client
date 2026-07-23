// src/screens/LedgerScreen.jsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import * as XLSX from "xlsx";
import { AdminContext } from "../context/AdminContext.jsx";
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
  BadgeIndianRupee,
  Package,
  Wallet,
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
  const [materialFilter, setMaterialFilter] = useState("all");
  const [paymentModeFilter, setPaymentModeFilter] = useState("both");

  const [editingTicketId, setEditingTicketId] = useState(null);
  const [editingAmount, setEditingAmount] = useState("");

  const [exporting, setExporting] = useState(false);
  const [selectedReceiptData, setSelectedReceiptData] = useState({});

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
          material: materialFilter,
          paymentMode: paymentModeFilter,
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
    [
      adminApi,
      debouncedSearchQuery,
      startDate,
      endDate,
      limit,
      currentPage,
      materialFilter,
      paymentModeFilter,
    ],
  );

  // Network listener reacts automatically to any changes in standard parameter values
  useEffect(() => {
    fetchLedgerData(1);
  }, [
    debouncedSearchQuery,
    startDate,
    endDate,
    materialFilter,
    paymentModeFilter,
  ]);

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

  const handleVoidTransaction = async () => {
    try {
      await adminApi.post("/void-requests/direct", {
        transactionId: selectedReceiptData.id,
        reason: "Admin Privilege",
      });

      setIsDrawerOpen(false);
      setSelectedReceiptData({});
      await fetchLedgerData(currentPage);
    } catch (error) {
      console.error("Failed to void transaction:", error);
      alert(error.response?.data?.message || "Failed to void the transaction.");
    }
  };

  return (
    <div className="ledger-screen" style={ledgerStyles.viewViewportContainer}>
      <div
        className="ledger-static-header"
        style={ledgerStyles.staticHeaderBlock}
      >
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
          <div style={styles.dropdownInputGroup}>
            <Package size={14} style={{ color: "#64748b", marginRight: 6 }} />
            <select
              value={materialFilter}
              onChange={(e) => setMaterialFilter(e.target.value)}
              style={{
                ...styles.selectDropdownElement,
                borderColor: materialFilter !== "all" ? "#2563eb" : "#cbd5e1",
                backgroundColor:
                  materialFilter !== "all" ? "#eff6ff" : "#ffffff",
              }}
            >
              <option value="10mm">10mm</option>
              <option value="20mm">20mm</option>
              <option value="6mm">6mm</option>
              <option value="copra">Copra</option>
              <option value="crm">CRM</option>
              <option value="dust">Dust</option>
              <option value="gsb">GSB</option>
              <option value="mix">Mix</option>
              <option value="all">All Material</option>
            </select>
          </div>
          <div style={styles.dropdownInputGroup}>
            <Wallet size={14} style={{ color: "#64748b", marginRight: 6 }} />
            <select
              value={paymentModeFilter}
              onChange={(e) => setPaymentModeFilter(e.target.value)}
              style={{
                ...styles.selectDropdownElement,
                borderColor:
                  paymentModeFilter !== "both" ? "#2563eb" : "#cbd5e1",
                backgroundColor:
                  paymentModeFilter !== "both" ? "#eff6ff" : "#ffffff",
              }}
            >
              <option value="CASH">CASH</option>
              <option value="CREDIT">CREDIT</option>
              <option value="both">All Payment Modes</option>
            </select>
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
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
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
                    style={{
                      marginTop: 12,
                      color: "#64748b",
                      fontSize: "13px",
                    }}
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
                          ...(selectedReceiptData.id === ticket.id &&
                            ledgerStyles.selectedTableRow),
                        }}
                        onClick={() => {
                          setIsDrawerOpen(true);
                          setSelectedReceiptData(ticket);
                        }}
                      >
                        <td
                          style={{
                            ...ledgerStyles.tdElement,
                            borderLeft:
                              ticket?.rateStatus === "OPEN"
                                ? "3px solid #FF8C00"
                                : "none",
                            cursor:
                              ticket?.rateStatus === "OPEN"
                                ? "pointer"
                                : "default",
                            userSelect: "none",
                          }}
                          onDoubleClick={() => {
                            ticket?.rateStatus === "OPEN" &&
                              navigate(
                                `/settlements?search=${ticket.receiptNumber}`,
                              );
                          }}
                        >
                          {ticket.receiptNumber}
                        </td>
                        <td
                          style={{
                            ...ledgerStyles.tdElement,
                            color: "#64748b",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              lineHeight: 1.2,
                            }}
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
                          onDoubleClick={() =>
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
                          {ticket.materialRate === 0
                            ? "--"
                            : ticket.materialRate}
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
                          {ticket.royaltyQuantity.toLocaleString()}
                        </td>
                        <td style={ledgerStyles.tdElement}>
                          {ticket.royaltyRate}
                        </td>
                        <td
                          style={{
                            ...ledgerStyles.tdElement,
                            textAlign: "right",
                          }}
                        >
                          {ticket.royaltyAmount.toLocaleString("en-IN")}
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
      <div
        style={{
          ...styles.rightFormInputDrawerPane,
          transform: isDrawerOpen ? "translateX(0%)" : "translateX(100%)", // Animates on/off canvas
        }}
      >
        <div style={styles.drawerTitleBand}>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                color: "#1e80cb",
              }}
            >
              Ticket Details
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsDrawerOpen(false);
              setSelectedReceiptData({});
            }}
            style={styles.closeDrawerCrossBtn}
          >
            ✕
          </button>
        </div>
        <div style={styles.drawerBody}>
          <div style={styles.drawerMetaCardField}>
            <span flex={1}>Receipt no.</span>
            <span flex={2}>{selectedReceiptData.receiptNumber}</span>
          </div>
          <div style={styles.drawerMetaCardField}>
            <span>Date</span>
            <span>
              {new Date(selectedReceiptData.businessDate).toLocaleDateString(
                "en-IN",
                { day: "2-digit", month: "2-digit", year: "numeric" },
              )}
            </span>
          </div>
          <div style={styles.drawerMetaCardField}>
            <span>Time</span>
            <span>
              {new Date(selectedReceiptData.createdAt).toLocaleTimeString(
                "en-IN",
                { minute: "2-digit", hour: "numeric" },
              )}
            </span>
          </div>
          <div style={styles.drawerMetaCardField}>
            <span>Customer Name</span>
            <span>{selectedReceiptData.customer?.name}</span>
          </div>
          <div style={styles.drawerMetaCardField}>
            <span>Vehicle No.</span>
            <span>{selectedReceiptData.vehicleNumber}</span>
          </div>
          <div style={styles.drawerMetaCardField}>
            <span>Site</span>
            <span>{selectedReceiptData?.site}</span>
          </div>

          <div style={styles.drawerMetaCardField}>
            <span>Material</span>
            <span>{selectedReceiptData.material?.name}</span>
          </div>
          <div style={styles.drawerMetaCardField}>
            <span>Material Quantity</span>
            <span>{selectedReceiptData.materialQuantity} ft³</span>
          </div>
          <div style={styles.drawerMetaCardField}>
            <span>Material Rate</span>
            <span>
              {selectedReceiptData.rateStatus === "SETTLED"
                ? `₹${selectedReceiptData.materialRate} /ft³`
                : "--"}
            </span>
          </div>
          <div style={styles.drawerMetaCardField}>
            <span>Royalty Quantity</span>
            <span>{selectedReceiptData.royaltyQuantity} m³</span>
          </div>
          <div style={styles.drawerMetaCardField}>
            <span>Royalty Rate</span>
            <span>₹{selectedReceiptData.royaltyRate} /m³</span>
          </div>
          <div style={styles.drawerMetaCardField}>
            <span>Material Amount</span>
            <span>
              {selectedReceiptData.rateStatus === "SETTLED"
                ? `₹${selectedReceiptData.materialAmount}`
                : "--"}
            </span>
          </div>
          <div style={styles.drawerMetaCardField}>
            <span>Royalty Amount</span>
            <span>₹{selectedReceiptData.royaltyAmount}</span>
          </div>
          <div style={styles.drawerMetaCardField}>
            <span>Grand Total</span>
            <span>
              {selectedReceiptData.rateStatus === "SETTLED"
                ? `₹${selectedReceiptData.grandTotal}`
                : "--"}
            </span>
          </div>
          <div style={styles.drawerMetaCardField}>
            <span>Amount Paid</span>
            <span>₹{selectedReceiptData.amountPaid}</span>
          </div>
          <div style={styles.drawerMetaCardField}>
            <span>Payment Mode</span>
            <span>{selectedReceiptData.paymentMode}</span>
          </div>
          <div style={styles.drawerMetaCardField}>
            <span>Balance</span>
            <span>
              {selectedReceiptData.rateStatus === "SETTLED"
                ? `₹${selectedReceiptData.balance}`
                : "--"}
            </span>
          </div>
          <div style={styles.drawerMetaCardField}>
            <span>Clerk Name</span>
            <span>{selectedReceiptData.clerk?.name}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-evenly",
              marginTop: "20px",
            }}
          >
            {selectedReceiptData.rateStatus === "OPEN" && (
              <button
                onClick={() =>
                  navigate(
                    `/settlements?search=${selectedReceiptData.receiptNumber}`,
                  )
                }
              >
                Settle Rate
              </button>
            )}
            <button
              onClick={() => {
                const confirmed = window.confirm(
                  "Are you sure you want to void this ticket? This action cannot be undone.",
                );
                if (!confirmed) return;
                handleVoidTransaction();
              }}
            >
              Void Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  rightFormInputDrawerPane: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: "320px",
    backgroundColor: "#ffffff",
    borderLeft: "1px solid #e2e8f0",
    boxShadow: "-2px 0 10px rgba(15,23,42,0.08)",
    zIndex: 50,
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.2s ease-in-out", // Glides smoothly from right margin
  },
  drawerBody: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
  },
  drawerFormElement: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    minHeight: "100%",
  },
  drawerTitleBand: {
    backgroundColor: "#ffffff",
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e2e8f0",
  },
  closeDrawerCrossBtn: {
    color: "#475569",
    width: "28px",
    height: "28px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    fontSize: "14px",
    cursor: "pointer",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  drawerMetaCardField: {
    borderRadius: "1px",
    backgroundColor: "#e6e9ec",
    display: "flex",
    color: "#000000",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: "4px",
    padding: "0px 10px",
    fontSize: "12px",
  },
  drawerDivider: {
    border: "none",
    borderTop: "1px solid #e2e8f0",
    margin: 0,
  },
  selectDropdownElement: {
    border: "none",
    backgroundColor: "transparent",
    outline: "none",
    fontSize: "12px",
    fontWeight: "600",
    color: "#1e293b",
    cursor: "pointer",
    padding: "2px 0",
    fontFamily: "inherit",
  },
  dropdownInputGroup: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#ffffff", // Pure white background for clear input contrast
    border: "1px solid #cbd5e1",
    borderRadius: "0px", // Sharp industrial edges
    padding: "0 6px",
    height: "28px", // Reduced frame height matching your header inputs
  },
};
