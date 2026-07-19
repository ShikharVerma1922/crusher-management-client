import React, { useState, useEffect, useCallback, act } from "react";
import { adminApi } from "../lib/axiosApi";
import DateRangeFilter from "../components/DateRangeFilter";
import {
  Download,
  FileWarning,
  Loader2,
  Pen,
  Pencil,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { exportToExcelFormat } from "../utils/customerExcel";
import { ledgerStyles } from "../styles/ledgerStyles";
import { calculateBusinessDate } from "../utils/businessDateCalculator";
import CustomerEditModal from "../components/CustomerEditModal";

export default function CustomerLedger() {
  // --- UI Layout & Interaction States ---

  const navigate = useNavigate();
  const { customerId } = useParams();
  const now = new Date();

  const localDateTime = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 16);
  const [formData, setFormData] = useState({
    amountPaid: "",
    paymentMode: "BANK_TRANSFER",
    referenceNo: "",
    remarks: "",
    receivedById: null,
    paymentDate: localDateTime,
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Core State Registries ---
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // --- Core Operational States ---
  const [ledgerData, setLedgerData] = useState({
    openingBalance: 0,
    closingBalance: 0,
    items: [], // List of combined Transactions (Debits) and Payments (Credits)
  });
  const [exporting, setExporting] = useState(false);
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeCustomer = customers.find((c) => c.id === customerId);

  const handleOpenEditModal = (id) => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleRefreshCustomerRowData = (updatedCustomer) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === updatedCustomer.id
          ? {
              ...c,
              name: updatedCustomer.name,
              outstandingBalance: updatedCustomer.outstandingBalance,
            }
          : c,
      ),
    );
  };

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

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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

  // --- 🌐 API DATA FETCH DIRECTIVE: CHRONOLOGICAL STATEMENT ENGINE ---
  const fetchRunningLedger = useCallback(async () => {
    if (!customerId) return;

    setIsLedgerLoading(true);
    setLedgerError(null);

    try {
      const response = await adminApi.get(
        `/customers/${customerId}?from=${startDate}&to=${endDate}`,
      );

      const data = response.data.data;

      setLedgerData({
        openingBalance: data.openingBalance || 0,
        closingBalance: data.closingBalance || 0,
        items: data.items || [],
      });

      // setActiveCustomer(
      //   customers.find((cust) => cust.id === selectedCustomerId),
      // );
    } catch (err) {
      setLedgerError(err.message || "Failed to load statement register.");
    } finally {
      setIsLedgerLoading(false);
    }
  }, [customerId, startDate, endDate, customers]);

  useEffect(() => {
    fetchRunningLedger();
  }, [fetchRunningLedger]);

  // --- 🌐 API DATA FETCH DIRECTIVE ENGINE ---
  useEffect(() => {
    const fetchCustomerRegistry = async () => {
      setIsLoading(true);
      setFetchError(null);

      try {
        const response = await adminApi.get(`/customers`);

        if (response.status !== 200) {
          throw new Error(
            `CRITICAL SYSTEM ERR: HTTP Status ${response.status}`,
          );
        }

        console.log(response.data?.data);

        // const data = await response.data.json();

        setCustomers(response.data?.data);

        if (!customerId && response.data.data.length > 0) {
          navigate(`/customers/${response.data.data[0].id}`, {
            replace: true,
          });
        }
      } catch (err) {
        console.error("Database connection failure context logs:", err);
        setFetchError(err.message || "E-042: Database Connection Timeout");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerRegistry();
  }, []);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    const parsedAmount = parseFloat(formData.amountPaid);
    if (!formData.amountPaid || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    setIsSubmitting(true);
    const businessDate = calculateBusinessDate(formData.paymentDate);

    try {
      // 🔌 API ENDPOINT LOCATION FOR PAYMENT SUBMISSION
      const response = await adminApi.post(`/payments`, {
        customerId,
        amountPaid: parsedAmount,
        paymentMode: formData.paymentMode,
        referenceNo: formData.referenceNo,
        remarks: formData.remarks,
        paymentDate: formData.paymentDate,
        businessDate,
      });

      if (response.status !== 201) {
        const errorData = await response.json();
        throw new Error(errorData.error || "System rejected payment post.");
      }

      const result = response.data.data;

      // 1. Success Notification
      alert(`Success: Posted voucher ${result.receiptNumber}`);

      // 2. Update Left Sidebar Customer Balance State Locally
      setCustomers((prevCustomers) =>
        prevCustomers.map((cust) =>
          cust.id === customerId
            ? { ...cust, outstandingBalance: result.newBalance }
            : cust,
        ),
      );

      // 3. Force Statement Refetch
      // This updates the central running ledger layout dynamically
      await fetchRunningLedger();

      // 4. Reset Form & Close Slide Drawer
      setFormData({
        amountPaid: "",
        paymentMode: "BANK_TRANSFER",
        referenceNo: "",
        remarks: "",
        paymentDate: localDateTime,
      });
      setIsDrawerOpen(false);
    } catch (error) {
      console.error("Payment registration failed:", error);
      alert(`Voucher Posting Failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const start = new Date(startDate);
      start.setHours(9, 0, 0, 0);

      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      end.setHours(8, 59, 59, 999);

      exportToExcelFormat(ledgerData, activeCustomer.name, startDate, endDate);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  const projectedBalance =
    (activeCustomer?.outstandingBalance || 0) -
    (parseFloat(formData.amountPaid) || 0);

  const formatERPAmount = (value) =>
    new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

  const formatLedgerBalance = (value) => {
    const amount = Number(value) || 0;
    return `${formatERPAmount(Math.abs(amount))} ${amount >= 0 ? "Dr" : "Cr"}`;
  };

  return (
    <div style={styles.viewViewportContainer}>
      {/* 🚀 MAIN SPLIT FRAME */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* 1. LEFT COLUMN: MASTER CONTROLS (300px fixed width) */}
        <div
          style={{
            ...styles.leftMasterPane,
            opacity: isDrawerOpen ? "0.5" : "1",
          }}
        >
          <div style={styles.paneHeader}>CUSTOMER REGISTER</div>
          <div style={{ padding: "8px" }}>
            <div style={styles.searchContainer}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>
          <div
            style={{
              padding: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              flex: 1,
              overflowY: "auto",
            }}
          >
            {/* Status 1: Database syncing load indicators */}
            {isLoading && (
              <div
                style={{
                  fontSize: "11px",
                  color: "#64748b",
                  padding: "12px",
                  textAlign: "center",
                  fontWeight: "700",
                }}
              >
                SYNCING DATABASE LEDGER RECORDS...
              </div>
            )}

            {/* Status 2: Core network failure tracking log bars */}
            {fetchError && (
              <div
                style={{
                  fontSize: "11px",
                  color: "#991b1b",
                  backgroundColor: "#fef2f2",
                  padding: "8px",
                  border: "1px solid #fca5a5",
                  fontWeight: "700",
                }}
              >
                {fetchError}
              </div>
            )}

            {/* Status 3: Empty ledger fallback array validation */}
            {!isLoading && !fetchError && customers.length === 0 && (
              <div
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  padding: "12px",
                  textAlign: "center",
                }}
              >
                NO CURRENT ACTIVE LEDGERS FOUND
              </div>
            )}

            {/* Status 4: True production ledger row listing render map */}
            {!isLoading &&
              !fetchError &&
              filteredCustomers.map((cust) => {
                // Formats currency string explicitly per Indian LAC numbering standard
                const formattedBalance = new Intl.NumberFormat("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(cust.outstandingBalance || 0);

                const isCurrentActiveTarget = customerId === cust.id;

                return (
                  <button
                    key={cust.id}
                    onClick={() => navigate(`/customers/${cust.id}`)}
                    style={{
                      ...styles.selectionButton,
                      backgroundColor: isCurrentActiveTarget
                        ? "#ecf5ff"
                        : "#ffffff",
                      borderColor: isCurrentActiveTarget
                        ? "#2563eb"
                        : "#cbd5e1",
                      color: isCurrentActiveTarget ? "#1e40af" : "#1e293b",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    <span style={{ fontWeight: "700" }}>{cust.name}</span>
                    <span
                      style={{
                        fontSize: "11px",
                        color:
                          (cust.outstandingBalance || 0) > 0
                            ? "#dc2626"
                            : "#475569",
                        fontWeight: "700",
                      }}
                    >
                      ₹{formatLedgerBalance(cust.outstandingBalance)}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* 2. CENTER COLUMN: ACTIVE CONTEXT SHEET (Pushed dynamically when drawer opens) */}
        <div
          style={{
            ...styles.centerLedgerStatementPane,
            marginRight: isDrawerOpen ? "320px" : "0px",
          }}
        >
          {/* 📅 ERP DURATION PERIOD CONTROL BAR */}
          <div style={styles.filterControlPanel}>
            <DateRangeFilter
              dateRangePreset={dateRangePreset}
              setDateRangePreset={setDateRangePreset}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              onFetchData={fetchRunningLedger}
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
          {/* LEDGER WORKSPACE HEADER STRIP */}
          {activeCustomer && (
            <div style={styles.ledgerHeaderStrip}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "baseline",
                  gap: 10,
                }}
              >
                <h2
                  style={{
                    fontSize: "15px",
                    fontWeight: "800",
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  {activeCustomer.name}
                </h2>

                <Pencil
                  size={13}
                  onClick={() => handleOpenEditModal()}
                  style={{ cursor: "pointer" }}
                />
              </div>
              <button
                onClick={() => setIsDrawerOpen(true)}
                style={styles.actionPaymentLaunchBtn}
              >
                Add Payment
              </button>
            </div>
          )}

          <div style={styles.tableCardContainer}>
            {/* LOADING MASK COVER OVERLAY */}
            {isLedgerLoading ? (
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
                  COMPUTING SYSTEM BALANCE SHEETS...
                </p>
              </div>
            ) : ledgerError ? (
              <div style={styles.errorAlertCard}>
                <span>CRITICAL ERROR: {ledgerError}</span>
              </div>
            ) : (
              <div style={styles.overflowTableScroller}>
                <table style={styles.masterTableElement}>
                  <thead style={styles.stickyTableHeader}>
                    <tr>
                      <th
                        style={{
                          ...styles.thElement,
                          width: "100px",
                          minwidth: "40px",
                        }}
                      >
                        Date
                      </th>
                      <th
                        style={{
                          ...styles.thElement,
                          width: "60px",
                          minwidth: "60px",
                        }}
                      >
                        Ref
                      </th>
                      <th
                        style={{
                          ...styles.thElement,
                          width: "240px",
                          minwidth: "240px",
                        }}
                      >
                        Particulars
                      </th>
                      <th
                        style={{
                          ...styles.thElement,
                          width: "80px",
                          textAlign: "right",
                        }}
                      >
                        Debit
                      </th>
                      <th
                        style={{
                          ...styles.thElement,
                          width: "80px",
                          textAlign: "right",
                        }}
                      >
                        Credit
                      </th>
                      <th
                        style={{
                          ...styles.thElement,
                          width: "100px",
                          textAlign: "right",
                          borderRight: "none",
                        }}
                      >
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* ROW 1: READ-ONLY OPENING BALANCE ENTRY */}
                    <tr
                      style={{
                        backgroundColor: "#f8fafc",
                        borderBottom: "1px dashed #cbd5e1",
                      }}
                    >
                      <td style={styles.tdElement}>
                        {new Date(startDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                        })}
                      </td>
                      <td style={styles.tdElement}>-</td>
                      <td
                        style={{
                          ...styles.tdElement,
                          fontWeight: "700",
                          color: "#475569",
                        }}
                      >
                        Opening Balance B/F
                      </td>
                      <td
                        style={{
                          ...styles.tdElement,
                          textAlign: "right",
                          color: "#94a3b8",
                        }}
                      >
                        -
                      </td>
                      <td
                        style={{
                          ...styles.tdElement,
                          textAlign: "right",
                          color: "#94a3b8",
                        }}
                      >
                        -
                      </td>
                      <td
                        style={{
                          ...styles.tdElement,
                          textAlign: "right",
                          fontWeight: "700",
                          color: "#475569",
                        }}
                      >
                        {formatLedgerBalance(ledgerData.openingBalance)}
                      </td>
                    </tr>

                    {/* ITERATIVE LOG RECORDS ROWS */}
                    {(() => {
                      // 🔀 DYNAMIC ACCOUNTING MATRICES ENGINE
                      // Keeps tracking running math state dynamically down the line
                      let currentRunningBalance = ledgerData.openingBalance;

                      return ledgerData.items.map((item) => {
                        const isDebit = item.type === "DEBIT"; // Transaction invoice increases debt
                        const amount = item.amount || 0;

                        // Adjust running balance state based on double-entry rules
                        if (isDebit) {
                          currentRunningBalance += amount;
                        } else {
                          currentRunningBalance -= amount;
                        }

                        return (
                          <tr key={item.id} style={styles.tableBodyRowElement}>
                            {/* Date column */}
                            <td style={styles.tdElement}>
                              {new Date(item.date).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "2-digit",
                              })}
                            </td>

                            {/* Reference / Voucher Code */}
                            <td
                              style={{
                                ...styles.tdElement,
                                fontWeight: "700",
                                cursor:
                                  item?.rateStatus === "OPEN"
                                    ? "pointer"
                                    : "default",
                              }}
                              onClick={() => {
                                item?.rateStatus === "OPEN" &&
                                  navigate(
                                    `/settlements?search=${item.referenceNumber}`,
                                  );
                              }}
                            >
                              {item.type === "CREDIT" ? "PAY-" : "INV-"}
                              {item.referenceNumber}{" "}
                              {item?.rateStatus === "OPEN" && (
                                <span title="Rate not settled">
                                  <TriangleAlert
                                    size={10}
                                    color="orange"
                                    style={{
                                      marginLeft: 4,
                                      verticalAlign: "middle",
                                    }}
                                  />
                                </span>
                              )}
                            </td>

                            {/* Particulars explanation string */}
                            <td style={styles.tdElement}>
                              <div
                                style={styles.particulars}
                                title={item.particulars}
                              >
                                {item.particulars}
                              </div>
                            </td>

                            {/* Debit value (if transaction) */}
                            <td
                              style={{
                                ...styles.tdElement,
                                textAlign: "right",
                                color: isDebit ? "#1e293b" : "#cbd5e1",
                              }}
                            >
                              {isDebit ? formatERPAmount(amount) : "-"}
                            </td>

                            {/* Credit value (if payment) */}
                            <td
                              style={{
                                ...styles.tdElement,
                                textAlign: "right",
                                color: !isDebit ? "#16a34a" : "#cbd5e1",
                                fontWeight: !isDebit ? "700" : "600",
                              }}
                            >
                              {!isDebit ? formatERPAmount(amount) : "-"}
                            </td>

                            {/* Recalculated dynamic outstanding balance line */}
                            <td
                              style={{
                                ...styles.tdElement,
                                textAlign: "right",
                                fontWeight: "700",
                                color:
                                  currentRunningBalance > 0
                                    ? "#dc2626"
                                    : "#166534",
                              }}
                            >
                              {formatLedgerBalance(currentRunningBalance)}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>

                  {/* DUST CLOSING BOOK TOTALS STRIP */}
                  <tfoot style={styles.tableStickyFooterTotalStrip}>
                    <tr
                      style={{
                        backgroundColor: "#e2e8f0",
                        borderTop: "2px double #cbd5e1",
                      }}
                    >
                      <td
                        colSpan="3"
                        style={{
                          ...styles.tdElement,
                          fontWeight: "800",
                          color: "#0f172a",
                        }}
                      >
                        CLOSING BALANCE C/F (As of{" "}
                        {new Date(endDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                        )
                      </td>
                      <td style={styles.tdElement}></td>
                      <td style={styles.tdElement}></td>
                      <td
                        style={{
                          ...styles.tdElement,
                          textAlign: "right",
                          fontWeight: "800",
                          color:
                            ledgerData.closingBalance > 0
                              ? "#b91c1c"
                              : "#166534",
                        }}
                      >
                        ₹{formatLedgerBalance(ledgerData.closingBalance)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 3. RIGHT COLUMN: ERP SLIDE DRAWER (Absolute positioned sidebar) */}
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
                  fontSize: "12px",
                  color: "#38bdf8",
                  fontWeight: "700",
                }}
              >
                Payment Received
              </h3>
              {/* <p
                style={{
                  margin: 0,
                  fontSize: "11px",
                  color: "#94a3b8",
                  marginTop: "2px",
                }}
              >
                [Credit Collection Leg Record]
              </p> */}
            </div>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              style={styles.closeDrawerCrossBtn}
            >
              ✕
            </button>
          </div>

          {/* 📝 Voucher Form Frame */}
          <div style={styles.drawerBody}>
            <form
              onSubmit={handlePaymentSubmit}
              style={styles.drawerFormElement}
            >
              {/* Customer Context Metadata Block */}
              <div style={styles.drawerMetaCardField}>
                <div
                  style={{
                    fontWeight: "700",
                    color: "#0f172a",
                    marginTop: "2px",
                  }}
                >
                  {activeCustomer?.name}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color:
                      activeCustomer?.outstandingBalance > 0
                        ? "#dc2626"
                        : "#166534",
                    fontWeight: "700",
                    marginTop: "4px",
                  }}
                >
                  {activeCustomer?.outstandingBalance < 0
                    ? "Advance Payment"
                    : "Current Debt"}
                  {" : "}₹
                  {formatLedgerBalance(activeCustomer?.outstandingBalance)}
                </div>
              </div>
              <hr style={styles.drawerDivider} />

              <div style={styles.formInputStackUnit}>
                <label style={styles.formLabelElement}>
                  Payment Date & Time
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="datetime-local"
                    value={formData.paymentDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        paymentDate: e.target.value,
                      }))
                    }
                    style={{
                      ...styles.formTextInputField,
                    }}
                  />
                  <style>{`
                    input[type="datetime-local"]::-webkit-calendar-picker-indicator {
                      filter: invert(32%) sepia(89%) saturate(1800%) hue-rotate(210deg) brightness(95%) contrast(95%);
                      cursor: pointer;
                    }
                  `}</style>
                </div>
              </div>

              {/* 1. Input: Amount */}
              <div style={styles.formInputStackUnit}>
                <label style={styles.formLabelElement}>
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  required
                  autoFocus={isDrawerOpen}
                  placeholder="0.00"
                  step="0.01"
                  value={formData.amountPaid}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      amountPaid: e.target.value,
                    }))
                  }
                  style={styles.formTextInputField}
                />
                {parseFloat(formData.amountPaid) > 0 && (
                  <span style={styles.liveCalculationLabel}>
                    Balance After Payment: ₹{formatERPAmount(projectedBalance)}{" "}
                    Dr
                  </span>
                )}
              </div>

              {/* 2. Input: Mode of Payment */}
              <div style={styles.formInputStackUnit}>
                <label style={styles.formLabelElement}>Payment Mode</label>
                <select
                  value={formData.paymentMode}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      paymentMode: e.target.value,
                    }))
                  }
                  style={styles.formDropdownSelectField}
                >
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  <option value="UPI">UPI LINK / QR</option>
                  <option value="CASH">CASH VOUCHER</option>
                  <option value="CHEQUE">BANK CHEQUE</option>
                </select>
              </div>

              {/* 3. Conditional Input: Reference String (Only if not Cash) */}
              {formData.paymentMode !== "CASH" && (
                <div style={styles.formInputStackUnit}>
                  <label style={styles.formLabelElement}>
                    {formData.paymentMode === "UPI"
                      ? "UPI Transaction ID"
                      : formData.paymentMode === "CHEQUE"
                        ? "Cheque Leaf Number"
                        : "Bank UTR / Ref Number"}
                  </label>
                  <input
                    type="text"
                    placeholder="Enter validation reference..."
                    value={formData.referenceNo}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        referenceNo: e.target.value,
                      }))
                    }
                    style={styles.formTextInputField}
                  />
                </div>
              )}

              {/* 4. Input: Remarks */}
              <div style={styles.formInputStackUnit}>
                <label style={styles.formLabelElement}>Remarks</label>
                <textarea
                  rows="3"
                  placeholder="Enter receipt context remarks..."
                  value={formData.remarks}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      remarks: e.target.value,
                    }))
                  }
                  style={{
                    ...styles.formTextInputField,
                    resize: "none",
                    height: "auto",
                  }}
                />
              </div>
              <hr style={styles.drawerDivider} />
              {/* 🚀 Action Execution Buttons */}
              <div style={styles.drawerSubmissionActionContainer}>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  style={styles.cancelFormVoucherBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={styles.commitFormVoucherBtn}
                >
                  {isSubmitting ? "POSTING..." : "Save Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <CustomerEditModal
        isOpen={isModalOpen}
        customerId={customerId}
        onClose={handleCloseModal}
        onUpdateSuccess={handleRefreshCustomerRowData}
      />
    </div>
  );
}

// --- 🎨 HIGH-DENSITY PROFESSIONAL STYLESHEET ARCHITECTURE (SHARP MONOSPACE SYSTEM STYLE) ---
const styles = {
  viewViewportContainer: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    height: "100%",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#f1f5f9", // Crisp light-grey ERP backdrop
    overflow: "hidden",
    fontFamily: "JetBrains Mono, Fira Code, Monaco, Consolas, monospace",
  },
  staticHeaderBlock: {
    padding: "3px 0px",
    flexShrink: 0,
    width: "100%",
    boxSizing: "border-box",
    // backgroundColor: "#dcdada",
    borderBottom: "1px solid #0f172a",
    paddingBottom: 6,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#38bdf8",
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  pageSubtitle: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "0px",
    margin: 0,
  },
  // 🎛️ CONTROLS BAR: Filters, Date Pickers, & Dropdowns
  filterControlPanel: {
    display: "flex",
    gap: "8px",
    backgroundColor: "#ffffff",
    padding: "6px 12px",
    borderBottom: "1px solid #cbd5e1",
    alignItems: "center",
    flexWrap: "nowrap",
    flexShrink: 0,
    marginBottom: "4px",
  },
  datePickerWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  dropdownInputGroup: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "0px", // Flat system UI geometry
    padding: "0 6px",
    height: "28px",
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
  dateInputGroup: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "0px",
    padding: "0 6px",
    height: "28px",
  },
  dateInputGroupReadOnly: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#e2e8f0", // Strict mechanical disable grey
    border: "1px solid #cbd5e1",
    borderRadius: "0px",
    padding: "0 6px",
    height: "28px",
    opacity: 0.8,
  },
  dateField: {
    border: "none",
    backgroundColor: "transparent",
    outline: "none",
    padding: "2px 0",
    color: "#1e293b",
    fontSize: "12px",
    fontFamily: "inherit",
    fontWeight: "600",
  },
  refreshButton: {
    backgroundColor: "#475569",
    color: "#ffffff",
    height: "28px",
    padding: "0 10px",
    borderRadius: "0px",
    border: "1px solid #334155",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
  },

  // 📂 LEFT SIDEBAR: Master list selection panel
  leftMasterPane: {
    width: "300px",
    borderRight: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    display: "flex",
    // margin: "4px 0px 4px 0px",
    flexDirection: "column",
    flexShrink: 0,
  },
  paneHeader: {
    padding: "8px 12px",
    backgroundColor: "#f1f5f9",
    borderBottom: "1px solid #cbd5e1",
    fontSize: "11px",
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.2px",
  },
  searchContainer: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    border: "1px solid #cbd5e1",
    borderRadius: "0px",
    padding: "0 6px",
    height: "28px",
  },
  searchIcon: { fontSize: "11px", marginRight: "4px", color: "#64748b" },
  searchInput: {
    backgroundColor: "transparent",
    border: "none",
    outline: "none",
    width: "100%",
    fontSize: "12px",
    fontFamily: "inherit",
    color: "#1e293b",
  },
  selectionButton: {
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "0px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.1s",
  },
  customerRegistryItem: {
    padding: "8px 12px",
    borderBottom: "1px solid #e2e8f0",
    cursor: "pointer",
    fontSize: "12px",
    transition: "all 0.1s",
  },

  // 📊 CENTER PANEL: Ledger running balance register
  centerLedgerStatementPane: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "8px 12px 4px 8px",
    overflow: "hidden",
    transition: "margin-right 0.2s ease-in-out", // Smooth shift to clear space for open drawer
  },
  ledgerHeaderStrip: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
    backgroundColor: "#ffffff",
    padding: "8px 12px",
    border: "1px solid #cbd5e1",
  },
  actionPaymentLaunchBtn: {
    backgroundColor: "#16a34a",
    color: "#ffffff",
    border: "1px solid #15803d",
    height: "28px",
    padding: "0 12px",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    cursor: "pointer",
  },

  // 📋 TABLE GRID MATRIX: High-density ledger table
  tableCardContainer: {
    backgroundColor: "#ffffff",
    borderRadius: "0px",
    border: "1px solid #cbd5e1",
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
    backgroundColor: "#ffffff",
  },
  masterTableElement: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: "12px",
  },
  stickyTableHeader: {
    position: "sticky",
    top: 0,
    backgroundColor: "#f1f5f9",
    zIndex: 10,
  },
  thElement: {
    padding: "8px 20px",
    color: "#475569",
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: "11px",
    letterSpacing: "0.2px",
    backgroundColor: "#f1f5f9",
    borderBottom: "2px solid #cbd5e1",
    borderRight: "1px solid #cbd5e1", // Strict Excel/Tally vertical gridlines
  },
  tableBodyRowElement: {
    borderBottom: "1px solid #e2e8f0",
  },
  tdElement: {
    padding: "6px 10px",
    color: "#1e293b",
    whiteSpace: "normal",
    verticalAlign: "top",
    wordBreak: "break-word",
    fontWeight: "600",
    borderRight: "1px solid #e2e8f0",
  },
  particulars: {
    maxWidth: "240px",
    whiteSpace: "normal",
    wordBreak: "break-word",
    lineHeight: "1.4",
  },
  badgeApproved: {
    backgroundColor: "#f0fdf4",
    color: "#166534",
    padding: "0px 4px",
    border: "1px solid #bbf7d0",
    borderRadius: "0px",
    fontSize: "10px",
    fontWeight: "700",
  },
  badgeVoid: {
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    padding: "0px 4px",
    border: "1px solid #fecaca",
    borderRadius: "0px",
    fontSize: "10px",
    fontWeight: "700",
  },
  tableStickyFooterTotalStrip: {
    position: "sticky",
    bottom: 0,
    zIndex: 10,
    backgroundColor: "#e2e8f0",
  },

  // 📥 RIGHT DRAWER: Side form slide-over panel
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
    padding: "14px 16px",
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
    borderRadius: "8px",
    backgroundColor: "#f8fafc",
    padding: "12px",
    fontSize: "12px",
  },
  drawerDivider: {
    border: "none",
    borderTop: "1px solid #e2e8f0",
    margin: 0,
  },
  formInputStackUnit: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#ffffff",
    gap: "4px",
  },
  formLabelElement: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
  },
  formTextInputField: {
    border: "1px solid #cbd5e1",
    padding: "5px 8px",
    fontSize: "12px",
    fontFamily: "inherit",
    fontWeight: "600",
    color: "#1e293b",
    backgroundColor: "#f2f4f6",
    outline: "none",
    height: "28px",
    boxSizing: "border-box",
  },
  formDropdownSelectField: {
    border: "1px solid #cbd5e1",
    padding: "4px 6px",
    fontSize: "12px",
    fontFamily: "inherit",
    fontWeight: "600",
    color: "#1e293b",
    backgroundColor: "#f2f4f6",
    outline: "none",
    height: "28px",
    cursor: "pointer",
  },
  liveCalculationLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#16a34a",
    marginTop: "2px",
    textAlign: "right",
  },
  drawerSubmissionActionContainer: {
    display: "flex",
    gap: "8px",
    marginTop: "auto",
    paddingTop: "8px",
    position: "sticky",
    bottom: 0,
    backgroundColor: "#fff",
  },
  cancelFormVoucherBtn: {
    flex: 1,
    backgroundColor: "#64748b",
    color: "#ffffff",
    border: "1px solid #475569",
    height: "32px",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    cursor: "pointer",
  },
  commitFormVoucherBtn: {
    flex: 2,
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "1px solid #1d4ed8",
    height: "32px",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    cursor: "pointer",
  },

  // 🧭 FOOTER SYSTEM STATUS ROW
  systemFooterControlRegistry: {
    backgroundColor: "#1e293b",
    color: "#94a3b8",
    padding: "6px 12px",
    fontSize: "11px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexShrink: 0,
    borderTop: "1px solid #334155",
  },
  hotkeyTag: {
    backgroundColor: "#475569",
    color: "#ffffff",
    padding: "0 4px",
    fontWeight: "700",
  },

  // ⚠️ EXTRAS: System Loading / Errors
  loadingWrapperGrid: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "200px",
    width: "100%",
    backgroundColor: "#ffffff",
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
  },
  spinnerElement: {
    width: "20px",
    height: "20px",
    border: "2px solid #e2e8f0",
    borderTopColor: "#0f172a",
    borderRadius: "50%",
    marginBottom: "8px",
  },
  errorAlertCard: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderLeft: "4px solid #dc2626",
    borderTop: "1px solid #fee2e2",
    borderRight: "1px solid #fee2e2",
    borderBottom: "1px solid #fee2e2",
    color: "#991b1b",
    padding: "6px 12px",
    borderRadius: "0px",
    marginTop: "4px",
    fontSize: "11px",
    fontWeight: "600",
  },
};
