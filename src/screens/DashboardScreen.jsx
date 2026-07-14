// src/screens/DashboardScreen.jsx (Fully Fixed Viewport Structure)
import React, { useState, useEffect, useContext, useCallback } from "react";
import { AdminContext } from "../context/AdminContext.jsx";
import {
  TrendingUp,
  Scale,
  Truck,
  Radio,
  Calendar,
  SlidersHorizontal,
  RefreshCw,
  AlertCircle,
  Layers,
} from "lucide-react";
import DateRangeFilter from "../components/DateRangeFilter.jsx";

export default function DashboardScreen() {
  const { adminApi } = useContext(AdminContext);

  const [vitals, setVitals] = useState({
    totalRevenue: 0,
    totalQuantity: 0,
    totalTrucksCleared: 0,
    activeOpenShifts: 0,
  });
  const [materialsBreakdown, setMaterialsBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [dateRangePreset, setDateRangePreset] = useState("this_month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const formatLocalCalendarDate = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

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
          9,
          0,
          0,
          0,
        );
    }
    setStartDate(formatLocalCalendarDate(start));
    setEndDate(formatLocalCalendarDate(end));
  }, []);

  useEffect(() => {
    calculatePresetBoundaries(dateRangePreset);
  }, [dateRangePreset, calculatePresetBoundaries]);

  const fetchDashboardAnalytics = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const shiftStart = new Date(startDate);
      shiftStart.setHours(9, 0, 0, 0);

      const shiftEnd = new Date(endDate);
      shiftEnd.setDate(shiftEnd.getDate() + 1);
      shiftEnd.setHours(8, 59, 59, 999);

      const absoluteStartDate = shiftStart.toISOString();
      const absoluteEndDate = shiftEnd.toISOString();
      const queryParams = new URLSearchParams({
        startDate: absoluteStartDate,
        endDate: absoluteEndDate,
      });
      const response = await adminApi.get(
        `/analytics/summary?${queryParams.toString()}`,
      );
      const payload = response.data?.data;
      if (response.data && payload) {
        setVitals({
          totalRevenue: payload.summary?.totalRevenue || 0,
          totalQuantity: payload.summary?.totalQuantity || 0,
          totalTrucksCleared: payload.summary?.totalTrucksCleared || 0,
          activeOpenShifts: payload.summary?.activeOpenShifts || 0,
        });
        setMaterialsBreakdown(payload.materials || []);
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Failed to load dashboard parameters.",
      );
    } finally {
      setLoading(false);
    }
  }, [adminApi, startDate, endDate]);

  useEffect(() => {
    fetchDashboardAnalytics();
  }, [startDate, endDate, fetchDashboardAnalytics]);

  return (
    <div className="dashboard-screen" style={styles.viewViewportContainer}>
      {/* 📌 LOCKED STATIC TOP BANNER: This section will NEVER scroll or move */}
      <div className="dashboard-static-header" style={styles.staticHeaderBlock}>
        {/* <div style={styles.actionHeader}>
          <div>
            <h1 style={styles.pageTitle}>DASHBOARD</h1>
          </div>
        </div> */}

        <div
          className="dashboard-filter-panel"
          style={styles.filterControlPanel}
        >
          <div
            className="dashboard-window-label"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#475569",
              fontSize: "13px",
              fontWeight: "700",
            }}
          >
            <Calendar size={16} /> Operational Window Context
          </div>

          <div
            className="dashboard-date-picker-wrapper"
            style={styles.datePickerWrapper}
          >
            <DateRangeFilter
              dateRangePreset={dateRangePreset}
              setDateRangePreset={setDateRangePreset}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              onFetchData={() => fetchDashboardAnalytics()}
            />
          </div>
        </div>

        {errorMessage && (
          <div style={styles.errorAlertCard}>
            <AlertCircle size={18} style={{ marginRight: 8 }} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* 🌊 ISOLATED SCROLL SHELL AREA: Only the metrics below will scroll vertically */}
      <div
        className="dashboard-scroll-body"
        style={styles.dynamicScrollBodyWrapper}
      >
        {loading ? (
          <div style={styles.loadingWrapperGrid}>
            <div style={styles.spinnerElement}></div>
            <p style={{ marginTop: 12, color: "#64748b", fontSize: "13px" }}>
              Compiling crusher metrics registers...
            </p>
          </div>
        ) : (
          <div style={styles.dashboardGridRowsArea}>
            {/* KPI METRICS OVERVIEW CARD LAYOUT GRID */}
            <div
              className="dashboard-kpi-grid"
              style={styles.kpiCardsGridContainer}
            >
              <div className="dashboard-kpi-card" style={styles.kpiCardElement}>
                <div
                  style={{
                    ...styles.iconBadgeWrapper,
                    backgroundColor: "#dcfce7",
                    color: "#16a34a",
                  }}
                >
                  <TrendingUp size={20} />
                </div>
                <div style={styles.kpiDataLabelColumn}>
                  <span style={styles.kpiMetaTextTitle}>
                    Total Revenue Gross
                  </span>
                  <span
                    style={{ ...styles.kpiValueMetricsValue, color: "#16a34a" }}
                  >
                    ₹{vitals.totalRevenue.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div style={styles.kpiCardElement}>
                <div
                  style={{
                    ...styles.iconBadgeWrapper,
                    backgroundColor: "#dbeafe",
                    color: "#2563eb",
                  }}
                >
                  <Scale size={20} />
                </div>
                <div style={styles.kpiDataLabelColumn}>
                  <span style={styles.kpiMetaTextTitle}>Total quantity</span>
                  <span style={styles.kpiValueMetricsValue}>
                    {vitals.totalQuantity.toLocaleString()}{" "}
                    <span style={{ fontSize: "13px", color: "#64748b" }}>
                      {" "}
                      ft<sup>3</sup>
                    </span>
                  </span>
                </div>
              </div>

              <div style={styles.kpiCardElement}>
                <div
                  style={{
                    ...styles.iconBadgeWrapper,
                    backgroundColor: "#fef3c7",
                    color: "#d97706",
                  }}
                >
                  <Truck size={20} />
                </div>
                <div style={styles.kpiDataLabelColumn}>
                  <span style={styles.kpiMetaTextTitle}>
                    Truck Log Dispatches
                  </span>
                  <span style={styles.kpiValueMetricsValue}>
                    {vitals.totalTrucksCleared.toLocaleString()}{" "}
                    <span style={{ fontSize: "13px", color: "#64748b" }}>
                      Loads
                    </span>
                  </span>
                </div>
              </div>

              <div style={styles.kpiCardElement}>
                <div
                  style={{
                    ...styles.iconBadgeWrapper,
                    backgroundColor:
                      vitals.activeOpenShifts > 0 ? "#ffedd5" : "#f1f5f9",
                    color: vitals.activeOpenShifts > 0 ? "#ea580c" : "#64748b",
                  }}
                >
                  <Radio size={20} />
                </div>
                <div style={styles.kpiDataLabelColumn}>
                  <span style={styles.kpiMetaTextTitle}>
                    Active Cabin Shifts
                  </span>
                  <span style={styles.kpiValueMetricsValue}>
                    {vitals.activeOpenShifts}{" "}
                    <span style={{ fontSize: "13px", color: "#64748b" }}>
                      Live
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* MATERIAL DISPATCH BREAKDOWN TARGET MATRIX DATA TABLE */}
            <div
              className="dashboard-table-card"
              style={styles.tableBlockSegmentContainer}
            >
              <div style={styles.segmentHeadingHeader}>
                <Layers size={18} style={{ color: "#475569" }} />
                <h2 style={styles.segmentTitleLabel}>Production Breakdown</h2>
              </div>

              <div
                className="dashboard-table-wrapper"
                style={styles.tableBorderGridWrapper}
              >
                <table
                  className="dashboard-table"
                  style={styles.materialDataGridTable}
                >
                  <thead>
                    <tr style={styles.gridHeaderElementRow}>
                      <th style={styles.tableThCellLabel}>
                        Material Identification Category
                      </th>
                      <th style={styles.tableThCellLabel}>Truck Dispatches</th>
                      <th style={styles.tableThCellLabel}>
                        Net Volumetric Qyantity
                      </th>
                      <th style={styles.tableThCellLabel}>
                        Commercial Revenue Realized
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialsBreakdown.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          style={{
                            padding: "24px",
                            textAlign: "center",
                            color: "#64748b",
                          }}
                        >
                          No dispatch transactions logged across this window
                          context.
                        </td>
                      </tr>
                    ) : (
                      materialsBreakdown.map((row) => (
                        <tr
                          key={row.materialId}
                          style={styles.gridBodyRowMarkupLine}
                        >
                          <td
                            style={{
                              ...styles.tableTdCellValue,
                              fontWeight: "700",
                              color: "#0f172a",
                            }}
                          >
                            {row.materialName}
                          </td>
                          <td style={styles.tableTdCellValue}>
                            {row.truckCount.toLocaleString()} Trucks
                          </td>
                          <td
                            style={{
                              ...styles.tableTdCellValue,
                              fontWeight: "600",
                            }}
                          >
                            {row.totalQuantity.toLocaleString()}
                          </td>
                          <td
                            style={{
                              ...styles.tableTdCellValue,
                              fontWeight: "800",
                              color: "#16a34a",
                            }}
                          >
                            ₹{row.revenueGenerated.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 🎨 CORE STABILIZED RESPONSIVE GRID CSS PROPERTY MATRIX MAP
const styles = {
  viewViewportContainer: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    height: "100vh",
    minHeight: "100vh",
    overflowY: "auto",
    overflowX: "hidden",
    backgroundColor: "#f8fafc",
    width: "100%",
    boxSizing: "border-box",
  },
  staticHeaderBlock: {
    padding: "10px 24px 16px 24px",
    flexShrink: 0,
    width: "100%",
    boxSizing: "border-box",
    backgroundColor: "#f8fafc",
    zIndex: 20,
    position: "sticky",
    top: 0,
  },
  actionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
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
  filterControlPanel: {
    display: "flex",
    backgroundColor: "#ffffff",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    alignItems: "center",
    justifyContent: "space-between",
    boxSizing: "border-box",
    width: "100%",
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
    fontWeight: "700",
    color: "#334155",
    cursor: "pointer",
  },
  dateInputGroupReadOnly: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    padding: "0 8px",
    height: "32px",
  },
  dateField: {
    border: "none",
    backgroundColor: "transparent",
    outline: "none",
    padding: "4px 0",
    color: "#475569",
    fontSize: "13px",
    width: "110px",
    fontFamily: "inherit",
    textAlign: "center",
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

  // Isolate Scroller Sheet Configurations
  dynamicScrollBodyWrapper: {
    flex: 1,
    minHeight: 0,
    padding: "0px 24px 24px 24px",
    overflowY: "auto", // 🌟 CRITICAL 2: Scrolling constraints are applied EXCLUSIVELY to data components below the navigation headers
    overflowX: "hidden", // Slaughters horizontal layout visual breaks completely
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    boxSizing: "border-box",
    width: "100%",
  },
  dashboardGridRowsArea: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    width: "100%",
    boxSizing: "border-box",
    paddingBottom: "12px",
  },
  kpiCardsGridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", // Dynamically stretches column width values to fill screen matrix cleanly
    gap: "16px",
    width: "100%",
    boxSizing: "border-box",
  },
  kpiCardElement: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 2px 0 rgba(0,0,0,0.02)",
    boxSizing: "border-box",
  },
  iconBadgeWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "44px",
    height: "44px",
    borderRadius: "8px",
    flexShrink: 0,
    marginRight: "16px",
  },
  kpiDataLabelColumn: { display: "flex", flexDirection: "column" },
  kpiMetaTextTitle: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  kpiValueMetricsValue: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
    marginTop: "4px",
    letterSpacing: "-0.5px",
  },

  tableBlockSegmentContainer: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "20px",
    boxShadow: "0 1px 2px 0 rgba(0,0,0,0.02)",
    boxSizing: "border-box",
    width: "100%",
  },
  segmentHeadingHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
  },
  segmentTitleLabel: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#1e293b",
    margin: 0,
  },
  tableBorderGridWrapper: {
    border: "1px solid #f1f5f9",
    borderRadius: "8px",
    overflowX: "auto",
    width: "100%",
  },
  materialDataGridTable: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: "13px",
  },
  gridHeaderElementRow: {
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },
  tableThCellLabel: {
    padding: "12px 16px",
    color: "#475569",
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: "11px",
    whiteSpace: "nowrap",
  },
  gridBodyRowMarkupLine: { borderBottom: "1px solid #f1f5f9" },
  tableTdCellValue: {
    padding: "14px 16px",
    color: "#334155",
    whiteSpace: "nowrap",
  },
  loadingWrapperGrid: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "300px",
    width: "100%",
  },
  spinnerElement: {
    width: "28px",
    height: "28px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};
