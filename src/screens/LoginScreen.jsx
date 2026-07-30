// src/screens/LoginScreen.jsx
import React, { useState, useContext } from "react";
import { AdminContext } from "../context/AdminContext.jsx";
import { Lock, User, AlertTriangle, Loader2 } from "lucide-react";

export default function LoginScreen() {
  const { adminLogin, globalLoading } = useContext(AdminContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorNotice, setErrorNotice] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setErrorNotice("");

      if (!username.trim() || !password.trim()) {
        setErrorNotice("Both Username and Password are required.");
        return;
      }

      setIsLoggingIn(true);
      const result = await adminLogin(username.trim(), password.trim());

      if (!result?.success) {
        setErrorNotice(result?.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div style={styles.viewWrapper}>
      <div style={styles.loginCard}>
        <div style={styles.cardHeader}>
          <img width="50" height="50" src="/logo.png" alt="logo" />
          <h2 style={styles.mainTitle}>Mandar Enterprise Console</h2>
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
            <div style={styles.inputIconWrapper}>
              <User size={18} style={styles.inputIcon} />
              <input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.textInputField}
                disabled={globalLoading}
                autoFocus
              />
            </div>
          </div>

          <div style={styles.inputLabelFieldPair}>
            <div style={styles.inputIconWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type="password"
                placeholder="password"
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
            disabled={globalLoading || isLoggingIn}
          >
            {globalLoading || isLoggingIn ? (
              <>
                <Loader2 size={18} style={styles.spinner} /> Authenticating
                Session...
              </>
            ) : (
              "Login"
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
    padding: "24px",
    fontFamily: "Inter, sans-serif",
    background:
      "radial-gradient(circle at top left, rgba(99,102,241,0.18), transparent 28%), radial-gradient(circle at top right, rgba(14,165,233,0.16), transparent 26%), linear-gradient(135deg, #0f172a 0%, #111827 45%, #0b1220 100%)",
  },

  loginCard: {
    width: "100%",
    maxWidth: "420px",
    padding: "40px 36px",
    // borderRadius: "24px",
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    boxShadow: "0 24px 80px rgba(0, 0, 0, 0.35)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    position: "relative",
    overflow: "hidden",
  },

  cardHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "24px",
  },

  mainTitle: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "800",
    color: "#f8fafc",
    letterSpacing: "-0.03em",
  },

  subTitle: {
    marginTop: "10px",
    fontSize: "14px",
    color: "rgba(226, 232, 240, 0.75)",
    textAlign: "center",
    lineHeight: 1.6,
    maxWidth: "300px",
  },

  errorBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "14px 16px",
    marginBottom: "22px",
    background: "rgba(251, 146, 60, 0.12)",
    border: "1px solid rgba(251, 146, 60, 0.25)",
    color: "#fed7aa",
    fontSize: "13px",
    // borderRadius: "14px",
    backdropFilter: "blur(10px)",
  },

  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  inputLabelFieldPair: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  inputLabelText: {
    fontSize: "11px",
    fontWeight: "700",
    color: "rgba(226, 232, 240, 0.72)",
    letterSpacing: "1.2px",
    textTransform: "uppercase",
  },

  inputIconWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "rgba(15, 23, 42, 0.55)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    // borderRadius: "14px",
    padding: "0 14px",
    transition: "all 0.2s ease",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  },

  inputIcon: {
    color: "#94a3b8",
    flexShrink: 0,
  },

  textInputField: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    padding: "14px 0",
    fontSize: "15px",
    color: "#f8fafc",
    fontWeight: "500",
    caretColor: "#60a5fa",
  },

  actionSubmitBtn: {
    marginTop: "8px",
    width: "100%",
    height: "50px",
    border: "none",
    // borderRadius: "14px",
    background: "rgba(37,99,235,1)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "700",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease",
    // boxShadow: "0 14px 30px rgba(37, 99, 235, 0.35)",
  },

  spinner: {
    animation: "spin 1s linear infinite",
  },
};
