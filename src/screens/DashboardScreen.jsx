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
import { ledgerStyles } from "../styles/ledgerStyles.js";

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
    <div
      className="dashboard-screen"
      style={ledgerStyles.viewViewportContainer}
    >
      {/* 📌 LOCKED STATIC TOP BANNER: This section will NEVER scroll or move */}
      <div
        className="dashboard-static-header"
        style={ledgerStyles.staticHeaderBlock}
      >
        {/* <div style={styles.actionHeader}>
          <div>
            <h1 style={styles.pageTitle}>DASHBOARD</h1>
          </div>
        </div> */}

        <div
          className="dashboard-filter-panel"
          style={{
            ...ledgerStyles.filterControlPanel,
            justifyContent: "space-between",
          }}
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
            style={ledgerStyles.datePickerWrapper}
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
          <div style={ledgerStyles.errorAlertCard}>
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
  dynamicScrollBodyWrapper: {
    flex: 1,
    minHeight: 0,
    padding: "12px 16px 16px 16px",
    overflowY: "auto",
    overflowX: "hidden",
    boxSizing: "border-box",
    width: "100%",
    backgroundColor: "#ffffff",
  },
  dashboardGridRowsArea: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "100%",
    boxSizing: "border-box",
  },
  kpiCardsGridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "8px",
    width: "100%",
    boxSizing: "border-box",
  },
  kpiCardElement: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    boxSizing: "border-box",
  },
  iconBadgeWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#e2e8f0",
    flexShrink: 0,
    marginRight: "10px",
  },
  kpiDataLabelColumn: {
    display: "flex",
    flexDirection: "column",
  },
  kpiMetaTextTitle: {
    fontSize: "10px",
    color: "#64748b",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  kpiValueMetricsValue: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
    marginTop: "2px",
  },

  tableBlockSegmentContainer: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#ffffff",
    border: "2px solid #0f172a",
    padding: "0px", // Flushed internal cell contents directly to frame border limits
    boxSizing: "border-box",
    width: "100%",
  },
  segmentHeadingHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#1e293b",
    padding: "6px 10px",
    margin: 0,
  },
  segmentTitleLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#ffffff",
    textTransform: "uppercase",
    margin: 0,
  },
  tableBorderGridWrapper: {
    overflowX: "auto",
    width: "100%",
    backgroundColor: "#cbd5e1",
  },
  materialDataGridTable: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: "12px",
    fontFamily: "monospace",
  },
  gridHeaderElementRow: {
    backgroundColor: "#334155",
    borderBottom: "2px solid #0f172a",
  },
  tableThCellLabel: {
    padding: "8px 10px",
    color: "#f8fafc",
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: "11px",
    whiteSpace: "nowrap",
    borderRight: "1px solid #475569",
  },
  gridBodyRowMarkupLine: {
    borderBottom: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
  },
  tableTdCellValue: {
    padding: "6px 10px",
    color: "#1e293b",
    whiteSpace: "nowrap",
    borderRight: "1px solid #e2e8f0",
    verticalAlign: "middle",
  },
  loadingWrapperGrid: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "200px",
    width: "100%",
    backgroundColor: "#f8fafc",
    border: "1px dashed #cbd5e1",
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  spinnerElement: {
    display: "none", // Handled clean minimal text placeholders inside industrial ERP frameworks instead of active CSS animation nodes
  },
};
