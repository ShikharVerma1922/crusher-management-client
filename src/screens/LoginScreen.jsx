// src/screens/LoginScreen.jsx
import React, { useState, useContext } from "react";
import { AdminContext } from "../context/AdminContext.jsx";
import { Lock, User, AlertTriangle, Loader2, Factory } from "lucide-react";

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

  const loginLoading = globalLoading || isLoggingIn;

  return (
    <div style={styles.viewWrapper}>
      <section
        style={styles.sitePanel}
        aria-label="Mandar Enterprise crusher plant"
      >
        <div style={styles.siteImage} />
        <div style={styles.siteOverlay} />
        <div style={styles.siteContent}>
          <div style={styles.brandMark}>
            <img
              src="/logo.png"
              width="56"
              height="56"
              alt="Mandar Enterprise logo"
              style={{ borderRadius: "50%", objectFit: "contain" }}
            />
          </div>

          <div style={styles.brandCopy}>
            <p style={styles.eyebrow}>MANDAR ENTERPRISES</p>
            <h1 style={styles.siteTitle}>Crusher Management System</h1>
          </div>

          <div style={styles.siteFooter}>
            {/* <span style={styles.footerLine} /> */}
            <span>CMS · v1.0</span>
          </div>
        </div>
      </section>

      <section style={styles.loginPanel}>
        <div style={styles.loginContent}>
          <div style={styles.mobileBrand}>
            <img
              src="/logo.png"
              width="42"
              height="42"
              alt="Mandar Enterprise logo"
              style={{ borderRadius: "50%", objectFit: "contain" }}
            />
            <span>MANDAR ENTERPRISE</span>
          </div>

          <div style={styles.cardHeader}>
            {/* <div style={styles.loginIcon}>
              <Factory size={20} strokeWidth={1.8} />
            </div> */}
            <p style={styles.loginEyebrow}>ADMINISTRATIVE ACCESS</p>
            <h2 style={styles.mainTitle}>Welcome back</h2>
            <p style={styles.subTitle}>
              Sign in to access the management console.
            </p>
          </div>

          {errorNotice && (
            <div style={styles.errorBanner} role="alert">
              <AlertTriangle size={17} style={{ flexShrink: 0 }} />
              <span>{errorNotice}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} style={styles.formContainer}>
            <div style={styles.inputLabelFieldPair}>
              <label style={styles.inputLabelText} htmlFor="username">
                Username
              </label>
              <div style={styles.inputIconWrapper}>
                <User size={18} style={styles.inputIcon} />
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={styles.textInputField}
                  disabled={loginLoading}
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            <div style={styles.inputLabelFieldPair}>
              <label style={styles.inputLabelText} htmlFor="password">
                Password
              </label>
              <div style={styles.inputIconWrapper}>
                <Lock size={18} style={styles.inputIcon} />
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.textInputField}
                  disabled={loginLoading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              style={styles.actionSubmitBtn}
              disabled={loginLoading}
            >
              {loginLoading ? (
                <>
                  <Loader2 size={18} style={styles.spinner} />
                  Authenticating...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p style={styles.securityNote}>
            Authorized personnel only. Your session is secured by the system.
          </p>
        </div>
      </section>
    </div>
  );
}

const styles = {
  viewWrapper: {
    height: "100vh",
    boxSizing: "border-box",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.05fr) minmax(420px, 0.95fr)",
    background: "#f7f7f5",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  sitePanel: {
    position: "relative",
    minHeight: "100vh",
    boxSizing: "border-box",
    overflow: "hidden",
    background: "#1c1917",
  },

  siteImage: {
    position: "absolute",
    inset: 0,
    backgroundImage: "url('/crusher-site.jpeg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    transform: "scale(1.02)",
  },

  siteOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(90deg, rgba(15, 23, 42, 0.82) 0%, rgba(15, 23, 42, 0.52) 52%, rgba(15, 23, 42, 0.18) 100%), linear-gradient(0deg, rgba(15, 23, 42, 0.78) 0%, rgba(15, 23, 42, 0.06) 65%)",
  },

  siteContent: {
    position: "relative",
    zIndex: 1,
    minHeight: "100vh",
    boxSizing: "border-box",
    padding: "52px clamp(40px, 7vw, 96px)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    color: "#ffffff",
  },

  brandMark: {
    width: "56px",
    height: "56px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    // background: "rgba(255, 255, 255, 0.95)",
    border: "1px solid rgba(255, 255, 255, 0.7)",
    borderRadius: "50%",
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.2)",
  },

  brandCopy: {
    width: "100%",
    maxWidth: "620px",
    marginTop: "auto",
    marginBottom: "auto",
    // paddingTop: "80px",
    marginLeft: "auto",
    marginRight: "auto",
  },

  eyebrow: {
    margin: "0 0 14px",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.18em",
    color: "rgba(255, 255, 255, 0.78)",
  },

  siteTitle: {
    margin: 0,
    fontSize: "clamp(34px, 3.5vw, 52px)",
    lineHeight: 1.05,
    letterSpacing: "-0.04em",
    fontWeight: "750",
    maxWidth: "560px",
  },

  siteDescription: {
    margin: 0,
    maxWidth: "500px",
    fontSize: "15px",
    lineHeight: 1.75,
    color: "rgba(255, 255, 255, 0.78)",
  },

  siteFooter: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "rgba(255, 255, 255, 0.58)",
  },

  footerLine: {
    width: "14px",
    height: "1px",
    background: "rgba(255, 255, 255, 0.45)",
  },

  loginPanel: {
    minHeight: "100vh",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px",
    background: "#f7f7f5",
    borderLeft: "1px solid #e7e5e4",
  },

  loginContent: {
    width: "100%",
    maxWidth: "410px",
  },

  mobileBrand: {
    display: "none",
    alignItems: "center",
    gap: "10px",
    marginBottom: "48px",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.1em",
    color: "#292524",
  },

  cardHeader: {
    marginBottom: "34px",
  },

  loginIcon: {
    width: "42px",
    height: "42px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "22px",
    color: "#44403c",
    background: "#e7e5e4",
    borderRadius: "10px",
  },

  loginEyebrow: {
    margin: "0 0 8px",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "0.13em",
    color: "#78716c",
  },

  mainTitle: {
    margin: 0,
    fontSize: "32px",
    lineHeight: 1.15,
    fontWeight: "750",
    letterSpacing: "-0.035em",
    color: "#1c1917",
  },

  subTitle: {
    margin: "10px 0 0",
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#78716c",
  },

  errorBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "12px 14px",
    marginBottom: "22px",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: "8px",
    color: "#9a3412",
    fontSize: "13px",
    lineHeight: 1.45,
  },

  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  inputLabelFieldPair: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  inputLabelText: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#44403c",
  },

  inputIconWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    height: "50px",
    padding: "0 14px",
    background: "#ffffff",
    border: "1px solid #d6d3d1",
    borderRadius: "8px",
    boxSizing: "border-box",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  },

  inputIcon: {
    color: "#a8a29e",
    flexShrink: 0,
  },

  textInputField: {
    width: "100%",
    minWidth: 0,
    border: "none",
    outline: "none",
    background: "transparent",
    padding: "0",
    fontSize: "14px",
    color: "#292524",
    fontWeight: "500",
    caretColor: "#292524",
  },

  actionSubmitBtn: {
    marginTop: "6px",
    width: "100%",
    height: "50px",
    border: "none",
    borderRadius: "8px",
    background: "#292524",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    transition: "background 0.2s ease, opacity 0.2s ease",
  },

  securityNote: {
    margin: "28px 0 0",
    textAlign: "center",
    fontSize: "11px",
    lineHeight: 1.5,
    color: "#a8a29e",
  },

  spinner: {
    animation: "spin 1s linear infinite",
  },

  "@media (max-width: 900px)": {
    viewWrapper: {
      gridTemplateColumns: "1fr",
    },
    sitePanel: {
      display: "none",
    },
    loginPanel: {
      borderLeft: "none",
      padding: "32px 24px",
    },
    mobileBrand: {
      display: "flex",
    },
  },
};
