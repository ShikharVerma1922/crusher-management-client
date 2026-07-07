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
          <img width="50" height="50" src="src/assets/mandar_logo_2.png" />
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
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#111827",
    padding: "32px",
    fontFamily: "Inter, sans-serif",
  },

  loginCard: {
    width: "100%",
    maxWidth: "380px",
    background: "#d1cfcf",
    borderRadius: "12px",
    padding: "36px 32px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
  },

  cardHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "36px",
  },

  badgeElement: {
    width: "56px",
    height: "56px",
    borderRadius: "12px",
    background: "#1f2937",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "700",
    marginBottom: "18px",
  },

  mainTitle: {
    margin: 0,
    fontSize: "26px",
    fontWeight: "700",
    color: "#111827",
    letterSpacing: "-0.5px",
  },

  subTitle: {
    marginTop: "8px",
    fontSize: "13px",
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 1.5,
    maxWidth: "240px",
  },

  errorBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "12px 14px",
    marginBottom: "24px",
    background: "#fff7ed",
    borderLeft: "4px solid #ea580c",
    color: "#9a3412",
    fontSize: "13px",
    borderRadius: "6px",
  },

  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "22px",
  },

  inputLabelFieldPair: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  inputLabelText: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#6b7280",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },

  inputIconWrapper: {
    display: "flex",
    alignItems: "center",
    background: "#f9fafb",
    borderBottom: "2px solid #d1d5db",
    padding: "0 4px",
    transition: "all .2s ease",
  },

  inputIcon: {
    color: "#6b7280",
    marginRight: "12px",
  },

  textInputField: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    padding: "14px 0",
    fontSize: "15px",
    color: "#111827",
    fontWeight: "500",
  },

  actionSubmitBtn: {
    marginTop: "8px",
    width: "100%",
    height: "48px",
    border: "none",
    borderRadius: "8px",
    background: "#111827",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    transition: "0.2s ease",
  },

  spinner: {
    animation: "spin 1s linear infinite",
  },
};
