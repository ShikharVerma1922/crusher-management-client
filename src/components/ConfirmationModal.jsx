// src/components/ConfirmationModal.jsx
import React from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  actionText,
  isDestructive = false,
}) {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* Upper Header strip */}
        <div style={styles.header}>
          <div style={styles.titleGroup}>
            <div
              style={{
                ...styles.iconContainer,
                backgroundColor: isDestructive ? "#fee2e2" : "#dbeafe",
                color: isDestructive ? "#ef4444" : "#2563eb",
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <h3 style={styles.titleText}>{title}</h3>
          </div>
          <button onClick={onClose} style={styles.closeX}>
            <X size={16} />
          </button>
        </div>

        {/* Informational Core Content Body */}
        <div style={styles.body}>
          <p style={styles.messageText}>{message}</p>
        </div>

        {/* Interactive Action Control Ribbon */}
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              ...styles.confirmBtn,
              backgroundColor: isDestructive ? "#ef4444" : "#2563eb",
            }}
          >
            {actionText}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5000,
  },
  card: {
    backgroundColor: "#ffffff",
    width: "100%",
    maxWidth: "440px",
    margin: "0 16px",
    borderRadius: "12px",
    boxShadow:
      "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    animation: "scaleUp 0.15s ease-out",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #f1f5f9",
  },
  titleGroup: { display: "flex", alignItems: "center", gap: "10px" },
  iconContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "6px",
  },
  titleText: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0,
  },
  closeX: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "4px",
  },
  body: { padding: "20px" },
  messageText: {
    fontSize: "13px",
    color: "#475569",
    lineHeight: "1.6",
    margin: 0,
    whiteSpace: "pre-line",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    padding: "12px 20px",
    backgroundColor: "#f8fafc",
    borderTop: "1px solid #f1f5f9",
  },
  cancelBtn: {
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    color: "#475569",
    fontWeight: "600",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
  confirmBtn: {
    border: "none",
    color: "#ffffff",
    fontWeight: "700",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
};
