import React from "react";
import { SlidersHorizontal, RefreshCw, Download } from "lucide-react";
import { exportToExcelFormat } from "../utils/excel";

/**
 * High Density Date Filter Control Bar Component
 */
export default function DateRangeFilter({
  dateRangePreset,
  setDateRangePreset,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onFetchData,
  isLoading = false,
}) {
  return (
    <div className="date-range-filter" style={styles.datePickerWrapper}>
      {/* 🌟 PRESET TIMELINE QUICK DROPDOWN */}
      <div className="date-range-dropdown" style={styles.dropdownInputGroup}>
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

      {/* 📅 MANUAL CALENDAR OVERRIDES - START DATE */}
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
          className="custom-date-input"
        />
      </div>

      <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "bold" }}>
        to
      </span>

      {/* 📅 MANUAL CALENDAR OVERRIDES - END DATE */}
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
          className="custom-date-input"
        />
      </div>

      {/* 🔄 FORCE SYNC ACTION BUTTON */}
      <button
        className="date-range-refresh-button"
        onClick={onFetchData}
        style={styles.refreshButton}
        title="Force Reload Data"
        disabled={isLoading}
      >
        <RefreshCw
          size={14}
          style={isLoading ? { animation: "spin 1s linear infinite" } : null}
        />
      </button>
    </div>
  );
}

const styles = {
  datePickerWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
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
  selectDropdownElement: {
    border: "none",
    backgroundColor: "transparent",
    outline: "none",
    fontSize: "12px", // Tightened text scale
    fontWeight: "600",
    color: "#1e293b", // High-contrast navy text
    cursor: "pointer",
    padding: "2px 0",
    fontFamily: "inherit", // Inherits the JetBrains/monospace family configuration
  },
  dateInputGroup: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "0px", // Flat system UI geometry
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
    backgroundColor: "#475569", // Neutral functional steel grey
    color: "#ffffff",
    height: "28px",
    padding: "0 10px", // Text button style instead of single icon square
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
};
