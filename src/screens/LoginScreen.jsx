// src/screens/LoginScreen.jsx
import React, { useState, useContext } from "react";
import { AdminContext } from "../context/AdminContext.jsx";
import { Lock, User, AlertTriangle, Loader2 } from "lucide-react";

export default function LoginScreen() {
  const { adminLogin, globalLoading } = useContext(AdminContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorNotice, setErrorNotice] = useState("");

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorNotice("");

    if (!username.trim() || !password.trim()) {
      setErrorNotice("Please fill out both management credential lines.");
      return;
    }

    // 🔐 The secure login call. Pass the credentials directly.
    // If your backend expects a SHA-256 hash, we can hash it here or let the context wrap it.
    const result = await adminLogin(username.trim(), password.trim());

    if (!result?.success) {
      setErrorNotice(result?.message);
    }
  };

  return (
    <div style={styles.viewWrapper}>
      <div style={styles.loginCard}>
        <div style={styles.cardHeader}>
          <div style={styles.badgeElement}>M</div>
          <h2 style={styles.mainTitle}>Mandar Crusher</h2>
          <p style={styles.subTitle}>Administrative Control Access Gateway</p>
        </div>

        {errorNotice && (
          <div style={styles.errorBanner}>
            <AlertTriangle
              size={18}
              style={{ marginRight: 8, flexShrink: 0 }}
            />
            <span>{errorNotice}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} style={styles.formContainer}>
          <div style={styles.inputLabelFieldPair}>
            <label style={styles.inputLabelText}>Username</label>
            <div style={styles.inputIconWrapper}>
              <User size={18} style={styles.inputIcon} />
              <input
                type="text"
                placeholder="e.g. admin_owner"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.textInputField}
                disabled={globalLoading}
              />
            </div>
          </div>

          <div style={styles.inputLabelFieldPair}>
            <label style={styles.inputLabelText}>Password</label>
            <div style={styles.inputIconWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.textInputField}
                disabled={globalLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            style={styles.actionSubmitBtn}
            disabled={globalLoading}
          >
            {globalLoading ? (
              <>
                <Loader2 size={18} style={styles.spinner} /> Authenticating
                Session Vault...
              </>
            ) : (
              "Unlock Administrative Ledger"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  viewWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#0f172a",
  },
  loginCard: {
    backgroundColor: "#ffffff",
    padding: "40px",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
  },
  cardHeader: { textAlign: "center", marginBottom: "32px" },
  badgeElement: {
    backgroundColor: "#16a34a",
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: "900",
    width: "48px",
    height: "48px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    marginBottom: "16px",
  },
  mainTitle: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0,
  },
  subTitle: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "6px",
    margin: 0,
    fontWeight: "500",
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    border: "1px solid #fee2e2",
    color: "#991b1b",
    padding: "12px 14px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "13px",
    fontWeight: "500",
  },
  formContainer: { display: "flex", flexDirection: "column", gap: "20px" },
  inputLabelFieldPair: { display: "flex", flexDirection: "column", gap: "6px" },
  inputLabelText: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  inputIconWrapper: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "0 12px",
    transition: "border-color 0.15s",
  },
  inputIcon: { color: "#94a3b8", marginRight: "10px" },
  textInputField: {
    backgroundColor: "transparent",
    border: "none",
    outline: "none",
    width: "100%",
    padding: "12px 0",
    fontSize: "14px",
    color: "#1e293b",
  },
  actionSubmitBtn: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "14px",
    padding: "14px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)",
    transition: "background-color 0.15s",
  },
  spinner: { animation: "spin 1s linear infinite" },
};
