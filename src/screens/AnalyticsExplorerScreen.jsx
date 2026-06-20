// src/screens/AnalyticsExplorerScreen.jsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import { AdminContext } from "../context/AdminContext.jsx";
import {
  LineChart,
  Calendar,
  RefreshCw,
  AlertCircle,
  BarChart3,
} from "lucide-react";

export default function AnalyticsExplorerScreen() {
  const { adminApi } = useContext(AdminContext);

  const [timePreset, setTimePreset] = useState("last_30_days");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [chartData, setChartData] = useState([]);
  const [hoveredDataPoint, setHoveredDataPoint] = useState(null);

  const fetchTimelineData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await adminApi.get(
        `/analytics/trend?preset=${timePreset}`,
      );
      const payload = response.data?.data || response.data;
      if (Array.isArray(payload)) {
        setChartData(payload);
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

  // 🎨 CONFIGURABLE GRAPH PADDING MATRICES
  const svgWidth = 850; // Expanded width to hold left Y-axis labels cleanly
  const svgHeight = 360; // Expanded height to accommodate bottom X-axis tags
  const paddingLeft = 85;
  const paddingRight = 40;
  const paddingTop = 30;
  const paddingBottom = 45;

  const chartInnerWidth = svgWidth - paddingLeft - paddingRight;
  const chartInnerHeight = svgHeight - paddingTop - paddingBottom;

  // 📐 INTERCEPT AXIS MAX VALUES
  const maxRevenue =
    chartData.length > 0
      ? Math.max(...chartData.map((d) => d.revenue), 10000)
      : 10000;
  const maxTonnage =
    chartData.length > 0
      ? Math.max(...chartData.map((d) => d.tonnage), 10)
      : 10;

  // 📐 MAP COORDINATE VECTORS TO INNER CANVAS PIXELS
  const computeSvgPathCoordinates = (metricKey, maxValue) => {
    if (chartData.length < 2) return [];

    return chartData.map((point, index) => {
      const x =
        paddingLeft + (index / (chartData.length - 1)) * chartInnerWidth;
      const normalizedY = point[metricKey] / maxValue;
      const y = svgHeight - paddingBottom - normalizedY * chartInnerHeight;
      return { x, y, data: point };
    });
  };

  const revenueCoordinates = computeSvgPathCoordinates("revenue", maxRevenue);
  const tonnageCoordinates = computeSvgPathCoordinates("tonnage", maxTonnage);
  const buildSvgLineString = (coords) =>
    coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");

  // 🎛️ SMART X-AXIS DENSITY REDUCER (Skips ticks so labels don't overlap on 30-day view)
  const getFilteredXAxisTicks = () => {
    if (chartData.length <= 8)
      return chartData.map((d, i) => ({ index: i, label: d.timelineLabel }));

    // Choose an interval step sizes dynamically to prevent clutter
    const step = Math.ceil(chartData.length / 6);
    const ticks = [];
    for (let i = 0; i < chartData.length; i += step) {
      ticks.push({ index: i, label: chartData[i].timelineLabel });
    }
    // Guarantee that the final date marker is always drawn at the right end wall boundary
    if (ticks[ticks.length - 1].index !== chartData.length - 1) {
      ticks.push({
        index: chartData.length - 1,
        label: chartData[chartData.length - 1].timelineLabel,
      });
    }
    return ticks;
  };

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
                <option value="last_7_days">Last 7 Operating Days</option>
                <option value="last_30_days">
                  Last 30 Days (Monthly Tonal Breakdown)
                </option>
                <option value="last_6_months">
                  Last 6 Months (Macro Quotas)
                </option>
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
                <LineChart size={18} style={{ color: "#2563eb" }} />
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
                  Tonnage (Right Axis)
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
              <div style={styles.svgCanvasFrame}>
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* 📊 DYNAMIC HORIZONTAL GRID LINES & DUAL Y-AXIS LABELS */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const yPos = paddingTop + ratio * chartInnerHeight;
                    // Invert calculation because SVG renders top-down
                    const revenueValue = Math.round(maxRevenue * (1 - ratio));
                    const tonnageValue = Math.round(maxTonnage * (1 - ratio));

                    return (
                      <g key={ratio}>
                        {/* Background Grid Row Line */}
                        <line
                          x1={paddingLeft}
                          y1={yPos}
                          x2={svgWidth - paddingRight}
                          y2={yPos}
                          stroke="#f1f5f9"
                          strokeWidth="1"
                        />

                        {/* LEFT Y-AXIS LABEL TEXT: Revenue (INR) */}
                        <text
                          x={paddingLeft - 12}
                          y={yPos + 4}
                          textAnchor="end"
                          style={styles.axisLabelText}
                          fill="#16a34a"
                        >
                          ₹
                          {revenueValue >= 100000
                            ? `${(revenueValue / 100000).toFixed(1)}L`
                            : revenueValue.toLocaleString("en-IN")}
                        </text>

                        {/* RIGHT Y-AXIS LABEL TEXT: Tonnage (MT) */}
                        <text
                          x={svgWidth - paddingRight + 12}
                          y={yPos + 4}
                          textAnchor="start"
                          style={styles.axisLabelText}
                          fill="#2563eb"
                        >
                          {tonnageValue.toLocaleString()} MT
                        </text>
                      </g>
                    );
                  })}

                  {/* 🛣️ SOLID CORE AXIS BORDER LINES */}
                  <line
                    x1={paddingLeft}
                    y1={paddingTop}
                    x2={paddingLeft}
                    y2={svgHeight - paddingBottom}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                  />
                  <line
                    x1={paddingLeft}
                    y1={svgHeight - paddingBottom}
                    x2={svgWidth - paddingRight}
                    y2={svgHeight - paddingBottom}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                  />
                  <line
                    x1={svgWidth - paddingRight}
                    y1={paddingTop}
                    x2={svgWidth - paddingRight}
                    y2={svgHeight - paddingBottom}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                  />

                  {/* 🗓️ DYNAMIC FILTER-BASED X-AXIS LABELS */}
                  {getFilteredXAxisTicks().map((tick) => {
                    const xPos =
                      paddingLeft +
                      (tick.index / (chartData.length - 1)) * chartInnerWidth;
                    return (
                      <g key={tick.index}>
                        {/* Tiny notch index tick marker on axis line */}
                        <line
                          x1={xPos}
                          y1={svgHeight - paddingBottom}
                          x2={xPos}
                          y2={svgHeight - paddingBottom + 5}
                          stroke="#cbd5e1"
                          strokeWidth="1"
                        />
                        {/* Text Date String Label */}
                        <text
                          x={xPos}
                          y={svgHeight - paddingBottom + 20}
                          textAnchor="middle"
                          style={styles.xAxisLabelText}
                        >
                          {tick.label}
                        </text>
                      </g>
                    );
                  })}

                  {/* 📈 COMPILATION DATA PATH LINES */}
                  <path
                    d={buildSvgLineString(revenueCoordinates)}
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={buildSvgLineString(tonnageCoordinates)}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* 🎯 INVISIBLE ACTIVE ANCHOR INTERCEPTION HOVER NODES */}
                  {revenueCoordinates.map((pt, idx) => {
                    const xPercent =
                      ((pt.x - paddingLeft) / chartInnerWidth) * 100;
                    return (
                      <g key={idx}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={hoveredDataPoint?.index === idx ? 6 : 0}
                          fill="#16a34a"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        <circle
                          cx={tonnageCoordinates[idx].x}
                          cy={tonnageCoordinates[idx].y}
                          r={hoveredDataPoint?.index === idx ? 6 : 0}
                          fill="#2563eb"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        <circle
                          cx={pt.x}
                          cy={(pt.y + tonnageCoordinates[idx].y) / 2}
                          r={24}
                          fill="transparent"
                          style={{ cursor: "pointer" }}
                          onMouseEnter={() =>
                            setHoveredDataPoint({
                              index: idx,
                              xPct: xPercent,
                              ...pt.data,
                            })
                          }
                          onMouseLeave={() => setHoveredDataPoint(null)}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* 🏷️ FIXED FLUID OVERLAY DATA MODAL ON HOVER */}
                {hoveredDataPoint && (
                  <div
                    style={{
                      ...styles.hoverTooltip,
                      left: `calc(${paddingLeft}px + ${hoveredDataPoint.xPct}%)`,
                    }}
                  >
                    <div style={styles.tooltipTimelineTag}>
                      {hoveredDataPoint.timelineLabel}
                    </div>
                    <div
                      style={{ ...styles.tooltipLineMetric, color: "#16a34a" }}
                    >
                      Revenue:{" "}
                      <strong>
                        ₹{hoveredDataPoint.revenue.toLocaleString("en-IN")}
                      </strong>
                    </div>
                    <div
                      style={{ ...styles.tooltipLineMetric, color: "#2563eb" }}
                    >
                      Volume:{" "}
                      <strong>
                        {hoveredDataPoint.tonnage.toLocaleString()} MT
                      </strong>
                    </div>
                  </div>
                )}
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
                  chartData.reduce((acc, curr) => acc + curr.revenue, 0) /
                  (chartData.length || 1)
                ).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div style={styles.insightStatsCard}>
              <span style={styles.metaLabelText}>Peak Output Single Spike</span>
              <span style={{ ...styles.metaValueText, color: "#2563eb" }}>
                {Math.max(
                  ...chartData.map((d) => d.tonnage),
                  0,
                ).toLocaleString()}{" "}
                MT
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
    position: "absolute",
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

  svgCanvasFrame: {
    width: "100%",
    position: "relative",
    display: "block",
    backgroundColor: "#ffffff",
    minHeight: "360px",
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
