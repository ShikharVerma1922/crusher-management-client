import React, { useState, useEffect, useMemo } from "react";
import { adminApi } from "../lib/axiosApi";
import { ledgerStyles } from "../styles/ledgerStyles";
import { Loader2, Search } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function FinancialReleaseDesk() {
  // --- 📦 Matrix State Channels ---
  const [records, setRecords] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkRateInput, setBulkRateInput] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => {
    return searchParams.get("search") || "";
  });

  // System Status Triggers
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const urlQuery = searchParams.get("search") || "";
    if (urlQuery !== searchQuery) {
      setSearchQuery(urlQuery);
    }
  }, [searchParams]);

  // Update input text field wrapper handler
  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    // Dynamically update the browser search query parameter string in real time
    if (val) {
      setSearchParams({ search: val });
    } else {
      searchParams.delete("search");
      setSearchParams(searchParams);
    }
  };
  // --- 🔌 API Integration Operations ---

  // 1. Initial Load: Fetch outstanding unvalued transactions
  const fetchUnvaluedData = async () => {
    setIsLoading(true);
    setErrorStatus(null);
    try {
      const response = await adminApi.get(`/transactions/unsettled`);
      const data = response.data?.data?.transactions;

      if (response.status !== 200) {
        throw new Error(
          `Server responded with execution code: ${response.status}`,
        );
      }

      setRecords(data);
    } catch (err) {
      console.error("Failed to load exception data:", err);
      setErrorStatus("Failed to synchronize with backend logistics registry.");
    } finally {
      setIsLoading(false);
    }
  };

  // Run fetch loop exactly once when admin opens the component panel
  useEffect(() => {
    fetchUnvaluedData();
  }, []);

  // 2. Commit Action: Transmit completed rate payload batch to database
  const handleReleaseBatch = async () => {
    if (selectedIds.length === 0) return;

    // Isolate targeting array items
    const targetRows = records.filter((row) => selectedIds.includes(row.id));
    const hasUnratedRows = targetRows.some(
      (row) => !row.materialRate || parseFloat(row.materialRate) <= 0,
    );

    if (hasUnratedRows) {
      alert(
        "All selected transactions must have a valid material rate before clearing queue.",
      );
      return;
    }

    // Format the precise structural input contract expected by the batch backend controller
    const payload = targetRows.map((row) => ({
      id: row.id,
      materialRate: parseFloat(row.materialRate),
    }));

    setIsSubmitting(true);

    try {
      const response = await adminApi.post(`transactions/batch-settle`, {
        items: payload,
      });
      const data = response.data?.data;

      if (response.status !== 200) {
        const errData = await response.json();
        throw new Error(
          errData.error || "Failed database serialization update.",
        );
      }

      alert(
        `Success: ${selectedIds.length} tickets successfully settled and locked to customer accounts.`,
      );

      // Clear committed lines out of current runtime memory state array
      setRecords((prev) => prev.filter((row) => !selectedIds.includes(row.id)));
      setSelectedIds([]);
      setBulkRateInput("");
    } catch (err) {
      console.error("Batch commitment failure:", err);
      alert(`Transaction Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 🔍 Client-Side Instant Memory Filter ---
  const filteredRecords = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return records;

    return records.filter(
      (row) =>
        row.customerName.toLowerCase().includes(query) ||
        row.vehicleNumber.toLowerCase().includes(query) ||
        row.receiptNumber.toLowerCase().includes(query) ||
        row.material.toLowerCase().includes(query) ||
        row.site.toLowerCase().includes(query),
    );
  }, [records, searchQuery]);

  // --- 📊 Real-Time Grid Computations ---
  const summaryMetrics = useMemo(() => {
    return filteredRecords.reduce(
      (acc, row) => {
        acc.totalTickets += 1;
        acc.totalVolume += row.materialQuantity;
        const mRate = parseFloat(row.materialRate) || 0;
        const rRate = parseFloat(row.royaltyRate) || 0;
        acc.estimatedExposure +=
          row.materialQuantity * mRate + row.royaltyQuantity * rRate;
        return acc;
      },
      { totalTickets: 0, totalVolume: 0, estimatedExposure: 0 },
    );
  }, [filteredRecords]);

  // --- 🎛️ Checkbox Vector Logic ---
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map((r) => r.id));
    }
  };

  const handleToggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleInlineRateChange = (id, value) => {
    setRecords((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, materialRate: value } : row,
      ),
    );
  };

  const handleApplyBulkRate = () => {
    const parsedRate = parseFloat(bulkRateInput);
    if (!bulkRateInput || isNaN(parsedRate) || parsedRate <= 0) {
      alert("Specify a valid numeric rate.");
      return;
    }
    setRecords((prev) =>
      prev.map((row) =>
        selectedIds.includes(row.id)
          ? { ...row, materialRate: bulkRateInput }
          : row,
      ),
    );
  };

  return (
    <div style={ledgerStyles.viewViewportContainer}>
      {/* 🛠️ Standard ERP Minimalist Control Header */}
      <div style={styles.controlHeaderMinimal}>
        {/* <div style={styles.titleGroup}>
          <h2 style={styles.headerMainTitle}>Financial Release Console</h2>
          <span style={styles.headerSubtext}>
            Pending Billing Dispatches Queue
          </span>
        </div> */}

        {/* Inline Metric Badges */}
        <div style={styles.statsInlineGroup}>
          <div style={styles.metricItem}>
            Pending: <b>{summaryMetrics.totalTickets}</b>
          </div>
          <div style={styles.metricItem}>
            Volume: <b>{summaryMetrics.totalVolume} ft³</b>
          </div>
          <div style={styles.metricItem}>
            Est. Value:{" "}
            <b>
              ₹
              {summaryMetrics.estimatedExposure.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </b>
          </div>
        </div>
      </div>

      {/* ⚡ ACTIVE TOOLBELT BAR PANEL */}
      <div style={styles.toolbeltBar}>
        {/* Live Search Input Filter */}
        <div
          className="ledger-search-container"
          style={ledgerStyles.searchContainer}
        >
          <Search size={16} style={ledgerStyles.searchIcon} />
          <input
            type="text"
            placeholder="Search vehicle no, receipt no, customer name, material..."
            value={searchQuery}
            onChange={handleSearchInputChange}
            style={ledgerStyles.searchInput}
          />
        </div>

        {/* Bulk Parameter Injection Controls */}
        <div style={styles.bulkInputContainer}>
          <input
            type="number"
            placeholder="Set Bulk Rate (₹)"
            value={bulkRateInput}
            onChange={(e) => setBulkRateInput(e.target.value)}
            style={styles.bulkRateInputField}
            disabled={isLoading || selectedIds.length === 0}
          />
          <button
            type="button"
            onClick={handleApplyBulkRate}
            disabled={isLoading || selectedIds.length === 0}
            style={{
              ...styles.secondaryActionBtn,
              opacity: selectedIds.length === 0 ? 0.5 : 1,
            }}
          >
            ⚡ Apply Rate to Selected ({selectedIds.length})
          </button>
        </div>

        <button
          type="button"
          onClick={handleReleaseBatch}
          disabled={isLoading || isSubmitting || selectedIds.length === 0}
          style={{
            ...styles.primaryReleaseBtn,
            opacity:
              isLoading || isSubmitting || selectedIds.length === 0 ? 0.6 : 1,
          }}
        >
          {isSubmitting ? "SYNCING LEDGERS..." : "SAVE"}
        </button>
      </div>

      {/* 📊 13-COLUMN HORIZONTAL INTEGRATION MATRIX SHEET */}
      <div style={ledgerStyles.overflowTableScroller}>
        {isLoading ? (
          <div style={ledgerStyles.loadingWrapperGrid}>
            <Loader2
              size={24}
              style={{
                animation: "spin 1s linear infinite",
                color: "#2563eb",
              }}
            />
            <p style={{ marginTop: 12, color: "#64748b", fontSize: "13px" }}>
              CONNECTING TO BACKEND LEDGER ARCHIVES...
            </p>
          </div>
        ) : errorStatus ? (
          <div style={{ ...styles.emptyGridPlaceholderCell, color: "#dc2626" }}>
            ⚠️ {errorStatus}{" "}
            <button
              onClick={fetchUnvaluedData}
              style={{
                marginLeft: "10px",
                padding: "2px 6px",
                fontFamily: "inherit",
              }}
            >
              Retry
            </button>
          </div>
        ) : (
          <table style={ledgerStyles.masterTableElement}>
            <thead style={ledgerStyles.stickyTableHeader}>
              <tr>
                <th
                  style={{
                    ...ledgerStyles.thElement,
                    width: "40px",
                    textAlign: "center",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={
                      filteredRecords.length > 0 &&
                      selectedIds.length === filteredRecords.length
                    }
                    onChange={handleToggleSelectAll}
                    style={styles.checkboxElement}
                  />
                </th>
                <th width="30" style={ledgerStyles.thElement}>
                  R.No.
                </th>
                <th width="60" style={ledgerStyles.thElement}>
                  Shift Date
                </th>
                <th minwidth="100" style={ledgerStyles.thElement}>
                  Customer
                </th>
                <th width="60" style={ledgerStyles.thElement}>
                  V.No
                </th>
                <th minwidth="80" style={ledgerStyles.thElement}>
                  Site
                </th>
                <th width="35" style={ledgerStyles.thElement}>
                  Mat
                </th>
                <th
                  width="40"
                  style={{ ...ledgerStyles.thElement, textAlign: "right" }}
                >
                  M.Qty
                </th>
                <th width="50" style={ledgerStyles.thElement}>
                  M.Rate
                </th>
                <th
                  width="60"
                  style={{ ...ledgerStyles.thElement, textAlign: "right" }}
                >
                  M.Amt
                </th>
                <th
                  width="40"
                  style={{ ...ledgerStyles.thElement, textAlign: "right" }}
                >
                  R.Qty
                </th>
                <th
                  width="50"
                  style={{ ...ledgerStyles.thElement, textAlign: "right" }}
                >
                  R.Rate
                </th>
                <th
                  width="60"
                  style={{ ...ledgerStyles.thElement, textAlign: "right" }}
                >
                  R.Amt
                </th>
                <th
                  width="60"
                  style={{ ...ledgerStyles.thElement, textAlign: "right" }}
                >
                  G.Total
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="14" style={styles.emptyGridPlaceholderCell}>
                    {records.length === 0
                      ? "Exception queue is completely clear."
                      : "No matching unvalued items match filters."}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row) => {
                  const isRowChecked = selectedIds.includes(row.id);
                  const matRate = parseFloat(row.materialRate) || 0;

                  // ERP Financial Value Computation Equations
                  const materialCost = row.materialQuantity * matRate;
                  const royaltyCost = row.royaltyQuantity * row.royaltyRate;
                  const grandTotal = materialCost + royaltyCost;
                  const balance = grandTotal - row.amountPaid;

                  return (
                    <tr
                      key={row.id}
                      style={{
                        ...ledgerStyles.tableBodyRowElement,
                        backgroundColor: isRowChecked ? "#eff6ff" : "#ffffff",
                      }}
                    >
                      <td
                        style={{
                          ...ledgerStyles.tdElement,
                          textAlign: "center",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isRowChecked}
                          onChange={() => handleToggleSelectRow(row.id)}
                          style={styles.checkboxElement}
                        />
                      </td>
                      <td
                        style={{
                          ...ledgerStyles.tdElement,
                          fontWeight: "700",
                          color: "#0f172a",
                        }}
                      >
                        {row.receiptNumber}
                      </td>
                      <td style={ledgerStyles.tdElement}>{row.businessDate}</td>
                      <td
                        style={{
                          ...ledgerStyles.tdElement,
                          cursor: "pointer",
                          color: "#2563eb",
                        }}
                        onClick={() => navigate(`/customers/${row.customerId}`)}
                      >
                        {row.customerName}
                      </td>
                      <td style={ledgerStyles.tdElement}>
                        <span style={styles.vehiclePlateBadge}>
                          {row.vehicleNumber}
                        </span>
                      </td>
                      <td style={ledgerStyles.tdElement}>{row.site}</td>
                      <td style={ledgerStyles.tdElement}>{row.material}</td>
                      <td
                        style={{
                          ...ledgerStyles.tdElement,
                          textAlign: "right",
                          fontWeight: "700",
                        }}
                      >
                        {row.materialQuantity.toFixed(2)}
                      </td>

                      {/* Interactive Rate Entry Point */}
                      <td style={ledgerStyles.tdElement}>
                        <input
                          type="number"
                          placeholder="₹/ft³"
                          value={row.materialRate}
                          onChange={(e) =>
                            handleInlineRateChange(row.id, e.target.value)
                          }
                          style={{
                            ...styles.inlineCellInputField,
                            borderColor: matRate > 0 ? "#16a34a" : "#d97706",
                          }}
                        />
                      </td>
                      <td
                        style={{
                          ...ledgerStyles.tdElement,
                          textAlign: "right",
                          fontWeight: "700",
                          color: matRate > 0 ? "#0f172a" : "#94a3b8",
                        }}
                      >
                        {matRate > 0
                          ? `${(matRate * row.materialQuantity).toFixed(2)}`
                          : "--"}
                      </td>

                      <td
                        style={{
                          ...ledgerStyles.tdElement,
                          textAlign: "right",
                        }}
                      >
                        {row.royaltyQuantity.toFixed(2)}
                      </td>
                      <td
                        style={{
                          ...ledgerStyles.tdElement,
                          textAlign: "right",
                          color: "#64748b",
                        }}
                      >
                        {row.royaltyRate.toFixed(2)}
                      </td>
                      <td
                        style={{
                          ...ledgerStyles.tdElement,
                          textAlign: "right",
                          color: "#64748b",
                        }}
                      >
                        {row.royaltyAmount}
                      </td>

                      {/* Explicit value protection strings preventing structural audit confusion */}
                      <td
                        style={{
                          ...ledgerStyles.tdElement,
                          textAlign: "right",
                          fontWeight: "700",
                          color: matRate > 0 ? "#0f172a" : "#94a3b8",
                        }}
                      >
                        {matRate > 0 ? `${grandTotal.toFixed(2)}` : "--"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// --- 🎨 ERP Industrial Theme Style Sheet Rules ---
const styles = {
  outerWrapperFrame: {
    border: "2px solid #0f172a",
    backgroundColor: "#ffffff",
    fontFamily: "monospace",
    fontSize: "12px",
    width: "100%",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  controlHeader: {
    backgroundColor: "#0f172a",
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#ffffff",
  },
  headerMainTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "700",
    letterSpacing: "0.5px",
  },
  headerSubtext: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "2px",
    display: "block",
  },
  summaryStatsBox: {
    fontSize: "12px",
    backgroundColor: "#1e293b",
    padding: "6px 12px",
    border: "1px solid #334155",
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  divider: { color: "#475569", margin: "0 4px" },
  toolbeltBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 16px",
    backgroundColor: "#e2e8f0",
    borderBottom: "2px solid #cbd5e1",
    gap: "16px",
  },
  searchContainer: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "black",
  },
  searchBarField: {
    padding: "6px 10px",
    width: "300px",
    border: "2px solid #0f172a",
    fontSize: "12px",
    fontFamily: "inherit",
    outline: "none",
    backgroundColor: "#e2e8f0",
    color: "#0d0d0d",
  },
  bulkInputContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginLeft: "auto",
  },
  bulkRateInputField: {
    padding: "6px 10px",
    width: "110px",
    border: "2px solid #0f172a",
    fontSize: "12px",
    fontFamily: "inherit",
    fontWeight: "700",
    outline: "none",
  },
  secondaryActionBtn: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    border: "none",
    padding: "7px 14px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "11px",
    fontFamily: "inherit",
  },
  primaryReleaseBtn: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "1px solid #1d4ed8",
    padding: "7px 16px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "11px",
    fontFamily: "inherit",
  },
  gridOverflowWrapper: {
    overflowX: "auto",
    width: "100%",
    backgroundColor: "#cbd5e1",
    maxHeight: "460px",
    overflowY: "auto",
  }, // Lock layout boundaries to contain bulk rows safely
  matrixTableElement: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1550px",
  },
  thRowStyles: {
    backgroundColor: "#334155",
    borderBottom: "2px solid #0f172a",
    position: "sticky",
    top: 0,
    zIndex: 10,
  }, // Freeze header frame position when scrolling vertically
  thCell: {
    color: "#f8fafc",
    padding: "10px 8px",
    borderRight: "1px solid #475569",
    fontSize: "11px",
    textAlign: "left",
    textTransform: "uppercase",
    fontWeight: "700",
  },
  trDataRowStyles: {
    borderBottom: "1px solid #cbd5e1",
    transition: "background-color 0.1s ease",
  },
  tdCell: {
    padding: "6px 8px",
    borderRight: "1px solid #e2e8f0",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
    color: "#334155",
  },
  checkboxElement: { cursor: "pointer", width: "14px", height: "14px" },
  vehiclePlateBadge: {
    backgroundColor: "#f1f5f9",
    border: "1px solid #cbd5e1",
    padding: "2px 6px",
    fontWeight: "700",
    color: "#0f172a",
  },
  inlineCellInputField: {
    padding: "4px 6px",
    width: "60px",
    border: "2px solid",
    fontSize: "11px",
    fontWeight: "800",
    fontFamily: "inherit",
    outline: "none",
  },
  emptyGridPlaceholderCell: {
    textAlign: "center",
    padding: "40px 0",
    fontSize: "13px",
    color: "#475569",
    backgroundColor: "#f8fafc",
    fontWeight: "700",
  },
  controlHeaderMinimal: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 16px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #cbd5e1",
  },
  titleGroup: {
    display: "flex",
    alignItems: "baseline",
    gap: "10px",
  },
  headerMainTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
    textTransform: "uppercase",
  },
  headerSubtext: {
    fontSize: "11px",
    color: "#64748b",
  },
  statsInlineGroup: {
    display: "flex",
    gap: "16px",
  },
  metricItem: {
    fontSize: "12px",
    color: "#334155",
    backgroundColor: "#f1f5f9",
    padding: "4px 8px",
    border: "1px solid #cbd5e1",
    borderRadius: "2px",
  },
};
