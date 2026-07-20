import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.code}>404</h1>
        <h2 style={styles.title}>PAGE NOT FOUND</h2>
        <p style={styles.text}>
          The page you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/" style={styles.button}>
          RETURN TO DASHBOARD
        </Link>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    fontFamily: "monospace",
    padding: "20px",
    boxSizing: "border-box",
  },
  card: {
    backgroundColor: "#1e293b",
    border: "2px solid #334155",
    padding: "40px",
    textAlign: "center",
    maxWidth: "480px",
    width: "100%",
  },
  code: {
    fontSize: "64px",
    fontWeight: "800",
    color: "#dc2626",
    margin: "0 0 30px 0",
    letterSpacing: "-2px",
  },
  title: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#ffffff",
    margin: "0 0 12px 0",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  text: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: "0 0 24px 0",
    lineHeight: "1.5",
  },
  button: {
    display: "inline-block",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    padding: "10px 20px",
    textDecoration: "none",
    fontWeight: "700",
    fontSize: "11px",
    letterSpacing: "0.5px",
  },
};
