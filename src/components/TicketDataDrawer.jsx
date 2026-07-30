import React from "react";
import { useNavigate } from "react-router-dom";

export default function TicketDataDrawer({
  setIsDrawerOpen,
  setSelectedReceiptData,
  selectedReceiptData,
  handleVoidTransaction,
}) {
  console.log(selectedReceiptData);
  const navigate = useNavigate();
  return (
    <div>
      <div style={styles.drawerTitleBand}>
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: "16px",
              color: "#1e80cb",
            }}
          >
            Ticket Details
          </h3>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsDrawerOpen(false);
            setSelectedReceiptData({});
          }}
          style={styles.closeDrawerCrossBtn}
        >
          ✕
        </button>
      </div>
      <div style={styles.drawerBody}>
        <div style={styles.drawerMetaCardField}>
          <span flex={1}>Receipt no.</span>
          <span flex={2}>{selectedReceiptData.receiptNumber}</span>
        </div>
        <div style={styles.drawerMetaCardField}>
          <span>Date</span>
          <span>
            {new Date(selectedReceiptData.businessDate).toLocaleDateString(
              "en-IN",
              { day: "2-digit", month: "2-digit", year: "numeric" },
            )}
          </span>
        </div>
        <div style={styles.drawerMetaCardField}>
          <span>Time</span>
          <span>
            {new Date(selectedReceiptData.createdAt).toLocaleTimeString(
              "en-IN",
              { minute: "2-digit", hour: "numeric" },
            )}
          </span>
        </div>
        <div style={styles.drawerMetaCardField}>
          <span>Customer Name</span>
          <span>{selectedReceiptData.customer?.name}</span>
        </div>
        <div style={styles.drawerMetaCardField}>
          <span>Vehicle No.</span>
          <span>{selectedReceiptData.vehicleNumber}</span>
        </div>
        <div style={styles.drawerMetaCardField}>
          <span>Site</span>
          <span>{selectedReceiptData?.site}</span>
        </div>

        <div style={styles.drawerMetaCardField}>
          <span>Material</span>
          <span>{selectedReceiptData.material?.name}</span>
        </div>
        <div style={styles.drawerMetaCardField}>
          <span>Material Quantity</span>
          <span>{selectedReceiptData.materialQuantity} ft³</span>
        </div>
        <div style={styles.drawerMetaCardField}>
          <span>Material Rate</span>
          <span>
            {selectedReceiptData.rateStatus === "SETTLED"
              ? `₹${selectedReceiptData.materialRate} /ft³`
              : "--"}
          </span>
        </div>
        <div style={styles.drawerMetaCardField}>
          <span>Royalty Quantity</span>
          <span>{selectedReceiptData.royaltyQuantity} m³</span>
        </div>
        <div style={styles.drawerMetaCardField}>
          <span>Royalty Rate</span>
          <span>₹{selectedReceiptData.royaltyRate} /m³</span>
        </div>
        <div style={styles.drawerMetaCardField}>
          <span>Material Amount</span>
          <span>
            {selectedReceiptData.rateStatus === "SETTLED"
              ? `₹${selectedReceiptData.materialAmount}`
              : "--"}
          </span>
        </div>
        <div style={styles.drawerMetaCardField}>
          <span>Royalty Amount</span>
          <span>₹{selectedReceiptData.royaltyAmount}</span>
        </div>
        <div style={styles.drawerMetaCardField}>
          <span>Grand Total</span>
          <span>
            {selectedReceiptData.rateStatus === "SETTLED"
              ? `₹${selectedReceiptData.grandTotal}`
              : "--"}
          </span>
        </div>
        <div style={styles.drawerMetaCardField}>
          <span>Amount Paid</span>
          <span>₹{selectedReceiptData.amountPaid}</span>
        </div>
        <div style={styles.drawerMetaCardField}>
          <span>Payment Mode</span>
          <span>{selectedReceiptData.paymentMode}</span>
        </div>
        <div style={styles.drawerMetaCardField}>
          <span>Balance</span>
          <span>
            {selectedReceiptData.rateStatus === "SETTLED"
              ? `₹${selectedReceiptData.balance}`
              : "--"}
          </span>
        </div>
        <div style={styles.drawerMetaCardField}>
          <span>Clerk Name</span>
          <span>{selectedReceiptData.clerk?.name}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-evenly",
            marginTop: "20px",
          }}
        >
          {selectedReceiptData.rateStatus === "OPEN" && (
            <button
              onClick={() =>
                navigate(
                  `/settlements?search=${selectedReceiptData.receiptNumber}`,
                )
              }
            >
              Settle Rate
            </button>
          )}
          <button
            onClick={() => {
              const confirmed = window.confirm(
                "Are you sure you want to void this ticket? This action cannot be undone.",
              );
              if (!confirmed) return;
              handleVoidTransaction();
            }}
          >
            Void Ticket
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  rightFormInputDrawerPane: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: "320px",
    backgroundColor: "#ffffff",
    borderLeft: "1px solid #e2e8f0",
    boxShadow: "-2px 0 10px rgba(15,23,42,0.08)",
    zIndex: 50,
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.2s ease-in-out", // Glides smoothly from right margin
  },
  drawerBody: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
  },
  drawerFormElement: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    minHeight: "100%",
  },
  drawerTitleBand: {
    backgroundColor: "#ffffff",
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e2e8f0",
  },
  closeDrawerCrossBtn: {
    color: "#475569",
    width: "28px",
    height: "28px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    fontSize: "14px",
    cursor: "pointer",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  drawerMetaCardField: {
    borderRadius: "1px",
    backgroundColor: "#e6e9ec",
    display: "flex",
    color: "#000000",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: "4px",
    padding: "0px 10px",
    fontSize: "12px",
  },
  drawerDivider: {
    border: "none",
    borderTop: "1px solid #e2e8f0",
    margin: 0,
  },
  selectDropdownElement: {
    border: "none",
    backgroundColor: "transparent",
    outline: "none",
    fontSize: "12px",
    fontWeight: "600",
    color: "#1e293b",
    cursor: "pointer",
    padding: "2px 0",
    fontFamily: "inherit",
  },
  dropdownInputGroup: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#ffffff", // Pure white background for clear input contrast
    border: "1px solid #cbd5e1",
    borderRadius: "0px", // Sharp industrial edges
    padding: "0 6px",
    height: "28px", // Reduced frame height matching your header inputs
  },
};
