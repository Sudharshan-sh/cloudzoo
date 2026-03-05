import { useState } from "react";
import "./App.css";

export default function App() {

  const [bill] = useState({
    id: "BILL-2026-0042",
    vendorName: "Speedy Courier Services",
    date: "2026-03-05",
    amount: 450,
    category: "Courier",
    scannedImageUrl:
      "https://media.istockphoto.com/id/889405434/vector/realistic-paper-shop-receipt-vector-cashier-bill-on-white-background.jpg?s=612x612&w=0&k=20&c=M2GxEKh9YJX2W3q76ugKW23JRVrm0aZ5ZwCZwUMBgAg=",
  });

  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [showApprovePopup, setShowApprovePopup] = useState(false);

  return (
    <>
      <div className="container">

        <div className="header">
          <h1>Expense Approval Workflow</h1>
          <span className="role-badge">Accounts Role</span>
        </div>

        <div className="content-split">

          {/* LEFT */}
          <div className="panel document-panel">
            <h2>Scanned Receipt</h2>
            <div className="image-placeholder">
              <img src={bill.scannedImageUrl} alt="Bill" />
            </div>
          </div>

          {/* RIGHT */}
          <div className="data-panel">

            <div className="panel">
              <h2>Extracted Data</h2>

              <div className="info-group">
                <label>Vendor</label>
                <p>{bill.vendorName}</p>
              </div>

              <div className="grid-2">
                <div className="info-group">
                  <label>Date</label>
                  <p>{bill.date}</p>
                </div>

                <div className="info-group">
                  <label>Category</label>
                  <p>{bill.category}</p>
                </div>
              </div>

              <div className="amount-box">
                <label>Total Amount</label>
                <p>₹{bill.amount}</p>
              </div>
            </div>

            <div className="panel">
              <h2>Decision</h2>

              <div className="action-buttons">

                <button
                  className="btn-approve"
                  onClick={() => setShowApprovePopup(true)}
                >
                  {bill.amount > 1000 ? "Route to Manager" : "Approve Bill"}
                </button>

                <button
                  className="btn-reject"
                  onClick={() => setShowRejectPopup(true)}
                >
                  Reject
                </button>

              </div>
            </div>

          </div>
        </div>
      </div>

      {/* APPROVE POPUP */}
      {showApprovePopup && (
        <div className="popup-overlay">
          <div className="popup-box success">
            <h2>Bill Approved ✅</h2>
            <p>Expense request approved successfully.</p>

            <button onClick={() => setShowApprovePopup(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* REJECT POPUP */}
      {showRejectPopup && (
        <div className="popup-overlay">
          <div className="popup-box reject">
            <h2>Bill Rejected ❌</h2>
            <p>This expense request has been rejected.</p>

            <button onClick={() => setShowRejectPopup(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}