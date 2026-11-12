import React, { useState, useEffect, useMemo } from "react";
import { adminApi } from "../lib/axiosApi";
import { ledgerStyles } from "../styles/ledgerStyles";
import { ChevronDown, ChevronUp, Loader2, Package, Search } from "lucide-react";
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
  const [selectedMaterial, setSelectedMaterial] = useState("");

  // System Status Triggers
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);

  const [sortConfig, setSortConfig] = useState({
    key: "receiptNumber",
    direction: "asc",
  });

  const navigate = useNavigate();

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

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

  // Fetch outstanding unvalued transactions
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

  useEffect(() => {
    fetchUnvaluedData();
  }, []);

  // 2. Commit Action: Transmit completed rate payload batch to database
  const handleReleaseBatch = async () => {
    if (selectedIds.length === 0) return;

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
  const materialOptions = useMemo(() => {
  return [...new Set(records.map((row) => row.material).filter(Boolean))].sort(
    (a, b) => String(a).localeCompare(String(b)),
  );
}, [records]);

const filteredRecords = useMemo(() => {
  const query = searchQuery.toLowerCase().trim();

  return records.filter((row) => {
    const matchesSearch =
      !query ||
      [
        row.customerName,
        row.vehicleNumber,
        row.receiptNumber,
        row.material,
        row.site,
      ].some((value) => String(value ?? "").toLowerCase().includes(query));

    const matchesMaterial =
      !selectedMaterial || row.material === selectedMaterial;

    return matchesSearch && matchesMaterial;
  });
}, [records, searchQuery, selectedMaterial]);

  const sortedRecords = useMemo(() => {
    const rows = [...filteredRecords];

    rows.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle nulls
      if (aValue == null) aValue = "";
      if (bValue == null) bValue = "";

      // Numbers
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      // Numeric strings (receipt number, rates, quantities)
      if (!isNaN(aValue) && !isNaN(bValue)) {
        return sortConfig.direction === "asc"
          ? Number(aValue) - Number(bValue)
          : Number(bValue) - Number(aValue);
      }

      // Strings
      return sortConfig.direction === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    return rows;
  }, [filteredRecords, sortConfig]);

  // --- 📊 Real-Time Grid Computations ---
  const summaryMetrics = useMemo(() => {
    return sortedRecords.reduce(
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
  }, [sortedRecords]);

  // --- 🎛️ Checkbox Vector Logic ---
  const handleToggleSelectAll = () => {
    if (selectedIds.length === sortedRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedRecords.map((r) => r.id));
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
     <div style={styles.toolbar}>
  {/* Row 1: filters + summary */}
  <div style={styles.row}>
    <div style={styles.filters} role="search">
      <label style={styles.searchField}>
        <Search size={16} style={styles.fieldIcon} aria-hidden="true" />
        <input
          type="search"
          placeholder="Search vehicle no, receipt no, customer"
          aria-label="Search by vehicle number, receipt number or customer name"
          value={searchQuery}
          onChange={handleSearchInputChange}
          style={styles.searchInput}
        />
      </label>

      <label
        style={{
          ...styles.selectField,
          ...(selectedMaterial !== "" ? styles.selectFieldActive : {}),
        }}
      >
        <Package size={14} style={styles.fieldIcon} aria-hidden="true" />
        <select
          value={selectedMaterial}
          onChange={(e) => setSelectedMaterial(e.target.value)}
          aria-label="Filter by material"
          style={styles.select}
        >
          <option value="">All materials</option>
          {materialOptions.map((material) => (
            <option key={material} value={material}>
              {material}
            </option>
          ))}
        </select>
      </label>
    </div>

    <dl style={styles.summary} aria-label="Pending settlement summary">
      <div style={{ ...styles.metric, ...styles.metricFirst }}>
        <dt style={styles.metricLabel}>Pending tickets</dt>
        <dd style={styles.metricValue}>{summaryMetrics.totalTickets}</dd>
      </div>
      <div style={styles.metric}>
        <dt style={styles.metricLabel}>Volume</dt>
        <dd style={styles.metricValue}>
          {summaryMetrics.totalVolume}
          <span style={styles.metricUnit}>ft³</span>
        </dd>
      </div>
      <div style={{ ...styles.metric, ...styles.metricLast }}>
        <dt style={styles.metricLabel}>Estimated value</dt>
        <dd style={styles.metricValue}>
          ₹
          {summaryMetrics.estimatedExposure.toLocaleString("en-IN", {
            maximumFractionDigits: 2,
          })}
        </dd>
      </div>
    </dl>
  </div>

  {/* Row 2: bulk actions */}
  <div
    style={{
      ...styles.bulkBar,
      ...(selectedIds.length > 0 ? styles.bulkBarActive : {}),
    }}
  >
    <span
      style={{
        ...styles.selectedCount,
        ...(selectedIds.length > 0 ? styles.selectedCountActive : {}),
      }}
      aria-live="polite"
    >
      {selectedIds.length > 0 ? `${selectedIds.length} selected` : "None selected"}
    </span>

    <label style={styles.rateField}>
      <span style={styles.ratePrefix} aria-hidden="true">₹</span>
      <input
        type="number"
        min="0"
        step="1"
        inputMode="decimal"
        placeholder="Rate"
        aria-label="Bulk rate in rupees"
        value={bulkRateInput}
        onChange={(e) => setBulkRateInput(e.target.value)}
        disabled={isLoading || selectedIds.length === 0}
        style={styles.rateInput}
      />
    </label>

    <button
      type="button"
      onClick={handleApplyBulkRate}
      disabled={isLoading || selectedIds.length === 0 || bulkRateInput === ""}
      style={{
        ...styles.btn,
        ...(isLoading || selectedIds.length === 0 || bulkRateInput === ""
          ? styles.btnDisabled
          : {backgroundColor: "#a2f3a6"}),
      }}
    >
      Apply to selected
    </button>

    <span style={styles.spacer} />

    <button
      type="button"
      onClick={handleReleaseBatch}
      disabled={isLoading || isSubmitting || selectedIds.length === 0}
      style={{
        ...styles.btn,
        ...styles.btnPrimary,
        ...(isLoading || isSubmitting || selectedIds.length === 0
          ? styles.btnDisabled
          : {}),
      }}
    >
      {isSubmitting ? "Saving..." : "Save rates"}
    </button>
  </div>
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
                      sortedRecords.length > 0 &&
                      selectedIds.length === sortedRecords.length
                    }
                    onChange={handleToggleSelectAll}
                    style={styles.checkboxElement}
                  />
                </th>
                <th
                  style={{
                    ...ledgerStyles.thElement,
                  }}
                  onClick={() => handleSort("receiptNumber")}
                >
                  <div style={ledgerStyles.sortHeader}>
                    <span>R.No.</span>

                    {sortConfig.key === "receiptNumber" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp size={15} />
                      ) : (
                        <ChevronDown size={15} />
                      ))}
                  </div>
                </th>
                 <th width="35" style={ledgerStyles.thElement}>
                  Slip
                </th>
                <th
                  style={ledgerStyles.thElement}
                  onClick={() => handleSort("businessDate")}
                >
                  <div style={ledgerStyles.sortHeader}>
                    <span>Shift Date</span>

                    {sortConfig.key === "businessDate" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp size={15} />
                      ) : (
                        <ChevronDown size={15} />
                      ))}
                  </div>
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
              {sortedRecords.length === 0 ? (
                <tr>
                  <td colSpan="14" style={styles.emptyGridPlaceholderCell}>
                    {records.length === 0
                      ? "Exception queue is completely clear."
                      : "No matching unvalued items match filters."}
                  </td>
                </tr>
              ) : (
                sortedRecords.map((row) => {
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
                      <td style={ledgerStyles.tdElement}>{row.slipNumber}</td>
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
    flexDirection: "column",
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
  searchAndFilterGroup: {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
},

materialFilterSelect: {
  height: "32px",
  minWidth: "145px",
  padding: "0 8px",
  border: "1px solid #cbd5e1",
  borderRadius: "4px",
  backgroundColor: "#ffffff",
  color: "#334155",
  fontSize: "12px",
  fontFamily: "inherit",
  cursor: "pointer",
  outline: "none",
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
    flexDirection: "column",
    border: "1px solid #cbd5e1",
    justifyContent: "left",
    gap: "2px",
  },
  metricItem: {
    fontSize: "12px",
    color: "#334155",
    backgroundColor: "#f1f5f9",
    padding: "0px 8px",
    
    borderRadius: "2px",
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
  toolbar: {
    width: "100%",
    boxSizing: "border-box",
    background: "#ffffff",
    border: "1px solid #d9e0e8",
    // borderRadius: 8,
    color: "#1e293b",
    fontSize: 13,
  },

  /* Row 1 */
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px 24px",
    padding: "6px 16px",
  },
  filters: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    flex: "1 1 480px",
    minWidth: 0,
  },

  /* Search + select fields */
  searchField: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    flex: "1 1 280px",
    maxWidth: 420,
    height: 36,
    background: "#ffffff",
    border: "1px solid #d9e0e8",
    // borderRadius: 6,
    boxSizing: "border-box",
  },
  fieldIcon: {
    position: "absolute",
    left: 10,
    color: "#64748b",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    height: "100%",
    padding: "0 10px 0 32px",
    border: 0,
    outline: "none",
    background: "transparent",
    color: "#1e293b",
    font: "inherit",
  },
  selectField: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    height: 36,
    background: "#ffffff",
    border: "1px solid #d9e0e8",
    // borderRadius: 6,
    boxSizing: "border-box",
  },
  selectFieldActive: {
    borderColor: "#1d4ed8",
    background: "#eff4ff",
  },
  select: {
    height: "100%",
    minWidth: 160,
    padding: "0 28px 0 32px",
    border: 0,
    outline: "none",
    background: "transparent",
    color: "#1e293b",
    font: "inherit",
    cursor: "pointer",
  },

  /* Summary metrics */
  summary: {
    display: "flex",
    alignItems: "stretch",
    margin: 0,
    flex: "0 0 auto",
  },
  metric: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    padding: "0 20px",
    borderLeft: "1px solid #d9e0e8",
  },
  metricFirst: { borderLeft: 0, paddingLeft: 0 },
  metricLast: { paddingRight: 0 },
  metricLabel: {
    margin: 0,
    fontSize: 12,
    color: "#64748b",
  },
  metricValue: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
  },
  metricUnit: {
    marginLeft: 2,
    fontSize: 12,
    fontWeight: 400,
    color: "#64748b",
  },

  /* Row 2: bulk bar */
  bulkBar: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px 12px",
    padding: "10px 16px",
    background: "#f8fafc",
    borderTop: "1px solid #d9e0e8",
    borderRadius: "0 0 8px 8px",
  },
  bulkBarActive: { background: "#eff4ff" },
  selectedCount: {
    minWidth: 90,
    marginRight: 4,
    fontWeight: 600,
    color: "#64748b",
  },
  selectedCountActive: { color: "#1d4ed8" },
  rateField: {
    display: "flex",
    alignItems: "center",
    height: 36,
    background: "#ffffff",
    border: "1px solid #d9e0e8",
    // borderRadius: 6,
    boxSizing: "border-box",
  },
  ratePrefix: {
    paddingLeft: 10,
    color: "#64748b",
  },
  rateInput: {
    width: 120,
    height: "100%",
    padding: "0 10px",
    border: 0,
    outline: "none",
    background: "transparent",
    color: "#1e293b",
    font: "inherit",
    textAlign: "left",
    fontVariantNumeric: "tabular-nums",
  },
  spacer: { flex: "1 1 0" },

  /* Buttons */
  btn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 36,
    padding: "0 14px",
    border: "1px solid #d9e0e8",
    // borderRadius: 6,
    background: "#ffffff",
    color: "#233b1e",
    font: "inherit",
    fontWeight: 500,
    whiteSpace: "nowrap",
    cursor: "pointer",
  },
  btnPrimary: {
    minWidth: 96,
    background: "#1d4ed8",
    borderColor: "#1d4ed8",
    color: "#ffffff",
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};
