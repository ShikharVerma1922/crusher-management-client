import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { adminApi } from "../lib/axiosApi.js";

// Static database of issued certificates
const CERTIFICATE_DATABASE = {
  "ME-INT-2026-001": {
    certId: "ME-INT-2026-001",
    studentName: "Shikhar Verma",
    credential: "Software Engineering Internship",
    project: "Weighbridge ERP & Digital Sales Ledger Platform",
    duration: "May 15, 2026 – July 15, 2026",
    durationLabel: "2 Months",
    issueDate: "July 15, 2026",
    issuer: "Mandar Enterprises",
    issuingAuthority: "Neeraj Singh, HR Manager",
    status: "Verified",
  },
};

export default function VerifyCertificate() {
  const { id } = useParams();
  const normalizedId = id ? id.toUpperCase() : "";
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCertifateDetails = async () => {
    if (!id) {
      setError("No Certificate ID provided.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const response = await adminApi.get(`/certificate/${normalizedId}`);
      const result = response.data;
      console.log(response);
      console.log(result);
      if (response.status == 200) {
        setCertificate(result.data);
      } else {
        setError(result.message || "Record not found or invalid.");
      }
    } catch (error) {
      setError(
        "Unable to connect to verification server. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertifateDetails();
  }, [id]);

  if (loading) {
    return (
      <div style={styles.pageBackground}>
        <div style={styles.cardContainer}>
          <div style={styles.centerMessage}>
            <div style={styles.spinner}></div>
            <p style={{ marginTop: "16px", color: "#64748b" }}>
              Verifying credential with server...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .certificate-verification-page {
          min-height: 100vh;
        }

        @media (max-width: 640px) {
          .certificate-verification-page {
            padding: 20px 14px !important;
            align-items: flex-start !important;
          }
          .certificate-verification-card {
            border-radius: 10px !important;
          }
          .certificate-verification-header,
          .certificate-verification-status,
          .certificate-details-grid,
          .certificate-verification-error,
          .certificate-verification-footer {
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
          .certificate-details-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div
        style={styles.pageBackground}
        className="certificate-verification-page"
      >
        <div
          style={styles.cardContainer}
          className="certificate-verification-card"
        >
          {/* Header Section */}
          {/* <div
            style={styles.header}
            className="certificate-verification-header"
          >
            <div>
              <div style={styles.companyTitle}>Mandar Enterprises</div>
              <div style={styles.headerSubtitle}>Certificate Verification</div>
            </div>
          </div> */}

          {/* Dynamic Content Body */}
          {certificate && !loading ? (
            <div>
              {/* Status Banner */}
              <div
                style={styles.successBanner}
                className="certificate-verification-status"
              >
                <div style={styles.statusIcon}>✓</div>
                <div style={styles.statusContent}>
                  <div style={styles.statusTitle}>Certificate Verified</div>
                  {/* <div style={styles.statusText}>
                    This certificate has been verified against the records of
                    Mandar Enterprises.
                  </div> */}
                </div>
              </div>

              {/* Metadata Grid */}
              <div
                style={styles.detailsGrid}
                className="certificate-details-grid"
              >
                <div style={styles.gridItemFull}>
                  <span style={styles.label}>Certificate ID</span>
                  <span style={styles.valueHighlight}>
                    {certificate.certId}
                  </span>
                </div>

                <div style={styles.gridItem}>
                  <span style={styles.label}>Issued To</span>
                  <span style={styles.valueBold}>{certificate.internName}</span>
                </div>

                <div style={styles.gridItem}>
                  <span style={styles.label}>Credential</span>
                  <span style={styles.value}>{certificate.role}</span>
                </div>

                <div style={styles.gridItemFull}>
                  <span style={styles.label}>Project Undertaken</span>
                  <span style={styles.value}>{certificate.project}</span>
                </div>

                <div style={styles.gridItem}>
                  <span style={styles.label}>Internship Period</span>
                  <span style={styles.value}>{certificate.duration}</span>
                </div>

                <div style={styles.gridItem}>
                  <span style={styles.label}>Duration</span>
                  <span style={styles.value}>{certificate.durationLabel}</span>
                </div>

                <div style={styles.gridItem}>
                  <span style={styles.label}>Issuing Organization</span>
                  <span style={styles.value}>{certificate.issuer}</span>
                </div>

                <div style={styles.gridItem}>
                  <span style={styles.label}>Issue Date</span>
                  <span style={styles.value}>{certificate.issueDate}</span>
                </div>

                <div style={styles.gridItemFull}>
                  <span style={styles.label}>Authorized Signatory</span>
                  <span style={styles.value}>
                    {certificate.issuingAuthority}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Error State when ID is not found */
            <div
              style={styles.errorBanner}
              className="certificate-verification-error"
            >
              <div style={styles.errorIcon}>!</div>
              <h3 style={styles.errorTitle}>Certificate Not Found</h3>
              <p style={styles.errorText}>
                We could not find an official certificate matching reference ID{" "}
                <strong>{id || "NONE"}</strong>.
              </p>
              <p style={styles.errorHint}>
                Please check the Certificate ID printed on the certificate and
                try again.
              </p>
            </div>
          )}

          {/* Footer Support Info */}
          <div
            style={styles.footer}
            className="certificate-verification-footer"
          >
            <p style={styles.footerText}>
              This page is provided for verification of credentials issued by
              Mandar Enterprises.
            </p>
            <p style={styles.footerContact}>
              For verification inquiries:{" "}
              <strong>contact@mandarenterprises.com</strong>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// Inline Styles (Responsive, Modern Style)
const styles = {
  pageBackground: {
    minHeight: "100vh",
    boxSizing: "border-box",
    backgroundColor: "#f5f6f8",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "32px 20px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: "#111827",
  },
  cardContainer: {
    backgroundColor: "#ffffff",
    maxWidth: "720px",
    width: "100%",
    borderRadius: "10px",
    boxShadow: "0 4px 20px rgba(17, 24, 39, 0.06)",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
  },
  header: {
    backgroundColor: "#ffffff",
    padding: "24px 28px",
    borderBottom: "1px solid #e5e7eb",
  },
  companyTitle: {
    margin: 0,
    fontSize: "17px",
    letterSpacing: "-0.2px",
    fontWeight: "650",
    color: "#111827",
  },
  headerSubtitle: {
    margin: "3px 0 0",
    fontSize: "12px",
    color: "#6b7280",
  },
  successBanner: {
    backgroundColor: "#f7faf8",
    padding: "18px 28px",
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
    borderBottom: "1px solid #e5e7eb",
  },
  statusIcon: {
    width: "22px",
    height: "22px",
    border: "1px solid #86efac",
    color: "#15803d",
    backgroundColor: "#ffffff",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "700",
    flexShrink: 0,
    marginTop: "1px",
  },
  statusContent: {
    minWidth: 0,
    flex: 1,
  },
  statusTitle: {
    margin: 0,
    fontSize: "13px",
    color: "#166534",
    fontWeight: "600",
  },
  statusText: {
    margin: "3px 0 0",
    fontSize: "12px",
    lineHeight: 1.5,
    color: "#4b6354",
  },
  detailsGrid: {
    padding: "0 28px",
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    columnGap: "32px",
    borderTop: "1px solid #e5e7eb",
  },
  gridItem: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    padding: "17px 0",
    minWidth: 0,
    borderBottom: "1px solid #e5e7eb",
  },
  gridItemFull: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    padding: "17px 0",
    minWidth: 0,
    borderBottom: "1px solid #e5e7eb",
  },
  label: {
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    color: "#6b7280",
    fontWeight: "600",
  },
  value: {
    fontSize: "14px",
    lineHeight: 1.5,
    color: "#1f2937",
    overflowWrap: "anywhere",
  },
  valueBold: {
    fontSize: "14px",
    lineHeight: 1.5,
    color: "#111827",
    fontWeight: "600",
  },
  valueHighlight: {
    fontSize: "13px",
    lineHeight: 1.5,
    color: "#374151",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontWeight: "600",
    overflowWrap: "anywhere",
  },
  errorBanner: {
    padding: "56px 28px",
    textAlign: "center",
    backgroundColor: "#ffffff",
  },
  errorIcon: {
    width: "32px",
    height: "32px",
    backgroundColor: "#ffffff",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "700",
    margin: "0 auto 14px",
  },
  errorTitle: {
    margin: 0,
    fontSize: "15px",
    color: "#374151",
    fontWeight: "600",
  },
  errorText: {
    maxWidth: "480px",
    margin: "7px auto 0",
    fontSize: "13px",
    lineHeight: 1.55,
    color: "#6b7280",
  },
  errorHint: {
    maxWidth: "480px",
    margin: "5px auto 0",
    fontSize: "12px",
    lineHeight: 1.5,
    color: "#9ca3af",
  },
  footer: {
    backgroundColor: "#fafafa",
    padding: "16px 28px",
    textAlign: "center",
    borderTop: "1px solid #e5e7eb",
  },
  footerText: {
    margin: 0,
    fontSize: "11px",
    lineHeight: 1.5,
    color: "#9ca3af",
  },
  footerContact: {
    margin: "4px 0 0",
    fontSize: "11px",
    lineHeight: 1.5,
    color: "#6b7280",
    overflowWrap: "anywhere",
  },
};
