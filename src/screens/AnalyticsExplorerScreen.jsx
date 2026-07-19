// src/screens/AnalyticsExplorerScreen.jsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import { AdminContext } from "../context/AdminContext.jsx";
import {
  LineChart as LineChartIcon,
  Calendar,
  RefreshCw,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div style={styles.tooltip}>
      <strong>{label}</strong>

      <div>Revenue: ₹{payload[0].value.toLocaleString("en-IN")}</div>

      <div>
        Quantity:
        {payload[1].value.toLocaleString()}
      </div>
    </div>
  );
};

export default function AnalyticsExplorerScreen() {
  const { adminApi } = useContext(AdminContext);

  const [timePreset, setTimePreset] = useState("last_30_days");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [chartData, setChartData] = useState([]);

  const fetchTimelineData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await adminApi.get(
        `/analytics/trend?preset=${timePreset}`,
      );
      const payload = response.data?.data || response.data;
      if (Array.isArray(payload)) {
        setChartData(Array.isArray(payload) ? payload : []);
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Failed to sync trend metrics.",
      );
    } finally {
      setLoading(false);
    }
  }, [adminApi, timePreset]);

  useEffect(() => {
    fetchTimelineData();
  }, [fetchTimelineData]);

  return (
    <div style={styles.viewViewportContainer}>
      <div style={styles.staticHeaderBlock}>
        <div style={styles.actionHeader}>
          <div>
            <h1 style={styles.pageTitle}>TRENDS</h1>
          </div>
          <div style={styles.controlGroup}>
            <div style={styles.dropdownInputGroup}>
              <Calendar
                size={14}
                style={{ color: "#64748b", marginRight: 6 }}
              />
              <select
                value={timePreset}
                onChange={(e) => setTimePreset(e.target.value)}
                style={styles.selectDropdownElement}
              >
                <option value="last_7_days">Last 7 Days</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="last_6_months">Last 6 Months</option>
              </select>
            </div>
            <button
              onClick={fetchTimelineData}
              style={styles.refreshButton}
              title="Recompute Trends"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      <div style={styles.dynamicScrollBodyWrapper}>
        <div style={styles.analyticsLayoutGrid}>
          <div style={styles.chartPanelCard}>
            <div style={styles.panelHeaderBlock}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <LineChartIcon size={18} />
                <h2 style={styles.panelTitle}>
                  Commercial Throughput Correlation Graph
                </h2>
              </div>
              <div style={styles.legendWrapper}>
                <span style={styles.legendItem}>
                  <span
                    style={{ ...styles.legendDot, backgroundColor: "#16a34a" }}
                  ></span>{" "}
                  Revenue (Left Axis)
                </span>
                <span style={styles.legendItem}>
                  <span
                    style={{ ...styles.legendDot, backgroundColor: "#2563eb" }}
                  ></span>{" "}
                  Quantity (Right Axis)
                </span>
              </div>
            </div>

            {loading ? (
              <div style={styles.loadingWrapperGrid}>
                <div style={styles.spinnerElement}></div>
                <p
                  style={{ marginTop: 12, color: "#64748b", fontSize: "13px" }}
                >
                  Compiling chronological vector matrix...
                </p>
              </div>
            ) : chartData.length < 2 ? (
              <div style={styles.loadingWrapperGrid}>
                <p style={{ color: "#64748b", fontSize: "13px" }}>
                  Insufficient historical transaction logs across this period
                  choice to form vector graphs.
                </p>
              </div>
            ) : (
              <div style={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height={420}>
                  <LineChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 20,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="timelineLabel" />

                    <YAxis
                      yAxisId="revenue"
                      tickFormatter={(v) =>
                        `₹${Number(v).toLocaleString("en-IN")}`
                      }
                    />

                    <YAxis
                      yAxisId="quantity"
                      orientation="right"
                      tickFormatter={(v) => `${v}`}
                    />

                    <Tooltip
                      content={<CustomTooltip />}
                      animationDuration={0}
                    />

                    <Legend />

                    <Line
                      yAxisId="revenue"
                      type="linear"
                      dataKey="revenue"
                      stroke="#16a34a"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5 }}
                      isAnimationActive={false}
                    />

                    <Line
                      yAxisId="quantity"
                      type="linear"
                      dataKey="materialQuantity"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div style={styles.insightsSidebarBlock}>
            <div style={styles.segmentHeadingHeader}>
              <BarChart3 size={16} />
              <span style={styles.segmentTitleLabel}>
                Operational Performance Audits
              </span>
            </div>
            <div style={styles.insightStatsCard}>
              <span style={styles.metaLabelText}>Average Daily Revenue</span>
              <span style={styles.metaValueText}>
                ₹
                {(
                  chartData.reduce(
                    (sum, item) => sum + Number(item.revenue ?? 0),
                    0,
                  ) / (chartData.length || 1)
                ).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div style={styles.insightStatsCard}>
              <span style={styles.metaLabelText}>Peak Output Single Spike</span>
              <span style={{ ...styles.metaValueText, color: "#2563eb" }}>
                {Math.max(
                  ...chartData.map((d) => Number(d.materialQuantity ?? 0)),
                  0,
                ).toLocaleString()}{" "}
                ft<sup>3</sup>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 🎨 COMPREHENSIVE TEXT METRIC RENDERING DESIGNS MAP
const styles = {
  viewViewportContainer: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#f8fafc",
    overflow: "hidden",
    width: "100%",
    boxSizing: "border-box",
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
    flexWrap: "wrap",
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
  controlGroup: { display: "flex", alignItems: "center", gap: "8px" },
  dropdownInputGroup: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    padding: "0 10px",
    height: "34px",
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
  refreshButton: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    height: "34px",
    width: "34px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  dynamicScrollBodyWrapper: {
    flex: 1,
    padding: "0px 24px 24px 24px",
    overflowY: "auto",
    boxSizing: "border-box",
    width: "100%",
  },
  analyticsLayoutGrid: {
    display: "grid",
    gridTemplateColumns: "3.2fr 1fr",
    gap: "20px",
    width: "100%",
    boxSizing: "border-box",
    alignItems: "start",
  },
  chartPanelCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
    paddingRight: "70px",
    position: "relative",
    overflow: "visible",
  },
  panelHeaderBlock: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  panelTitle: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#1e293b",
    margin: 0,
  },
  legendWrapper: { display: "flex", gap: "16px" },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  legendDot: { width: "8px", height: "8px", borderRadius: "50%" },

  chartWrapper: {
    width: "100%",
    height: "420px",
    outline: "none",
  },
  axisLabelText: {
    fontFamily: "monospace",
    fontSize: "11px",
    fontWeight: "700",
  },
  xAxisLabelText: {
    fontFamily: "sans-serif",
    fontSize: "11px",
    fontWeight: "600",
    fill: "#64748b",
  },

  hoverTooltip: {
    position: "absolute",
    bottom: "60px",
    transform: "translateX(-50%)",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    padding: "10px 12px",
    borderRadius: "8px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)",
    pointerEvents: "none",
    zIndex: 10,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: "150px",
    border: "1px solid #1e293b",
  },
  tooltipTimelineTag: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    borderBottom: "1px solid #1e293b",
    paddingBottom: "4px",
    marginBottom: "2px",
  },
  tooltipLineMetric: { fontSize: "12px" },

  insightsSidebarBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    width: "100%",
  },
  segmentHeadingHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#475569",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  segmentTitleLabel: { letterSpacing: "0.3px" },
  insightStatsCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  metaLabelText: {
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metaValueText: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#16a34a",
    letterSpacing: "-0.5px",
  },
  loadingWrapperGrid: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "360px",
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
