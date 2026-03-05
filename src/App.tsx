import React, { useState } from 'react';
import './App.css';

type ViewState = 'dashboard' | 'upload' | 'review';

type BillStatus = 'Pending Accounts' | 'Pending MD' | 'Approved' | 'Rejected';

interface Bill {
  id: string;
  vendor: string;
  date: string;
  amount: number;
  status: BillStatus;
  rejectReason?: string;
}

const initialMockBills: Bill[] = [
  { id: 'B-1001', vendor: 'Amazon Web Services', date: '2023-10-01', amount: 45000, status: 'Pending Accounts' },
  { id: 'B-1002', vendor: 'BlueDart Courier', date: '2023-10-02', amount: 1250, status: 'Approved' },
  { id: 'B-1003', vendor: 'Reliance Digital', date: '2023-10-03', amount: 120000, status: 'Pending MD' },
  { id: 'B-1004', vendor: 'Office Supplies Co.', date: '2023-10-04', amount: 8500, status: 'Rejected', rejectReason: 'Missing GST number' },
  { id: 'B-1005', vendor: 'Uber Travel', date: '2023-10-05', amount: 3200, status: 'Pending Accounts' },
];

export default function App() {
  const [bills, setBills] = useState<Bill[]>(initialMockBills);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  const handleNavigate = (view: ViewState, billId: string | null = null) => {
    setCurrentView(view);
    setSelectedBillId(billId);
  };

  const handleUpdateStatus = (billId: string, status: BillStatus, reason?: string) => {
    setBills(prev => prev.map(b => b.id === billId ? { ...b, status, rejectReason: reason } : b));
    setCurrentView('dashboard');
  };

  const selectedBill = bills.find(b => b.id === selectedBillId);

  return (
    <div className="app-container">
      {/* 1. Global Navigation Bar */}
      <nav className="global-nav">
        <div className="nav-brand">CloudZoo ERP</div>
        <div className="nav-links">
          <button
            className={`nav-button ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavigate('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`nav-button ${currentView === 'upload' ? 'active' : ''}`}
            onClick={() => handleNavigate('upload')}
          >
            Upload New Bill
          </button>
          <button
            className={`nav-button ${currentView === 'review' ? 'active' : ''}`}
            onClick={() => handleNavigate('review')}
          >
            Review Bill
          </button>
        </div>
        <div className="nav-profile">
          <div className="avatar">A</div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        {currentView === 'dashboard' && <DashboardView bills={bills} onNavigate={handleNavigate} />}
        {currentView === 'upload' && <UploadView />}
        {currentView === 'review' && <ReviewView bill={selectedBill} onNavigate={handleNavigate} onUpdateStatus={handleUpdateStatus} />}
      </main>
    </div>
  );
}

// -----------------------------------------
// View A: The Dashboard (Inbox)
// -----------------------------------------
function DashboardView({ bills, onNavigate }: { bills: Bill[], onNavigate: (view: ViewState, billId: string | null) => void }) {
  const getBadgeClass = (status: BillStatus) => {
    switch (status) {
      case 'Pending Accounts': return 'badge-yellow';
      case 'Pending MD': return 'badge-orange';
      case 'Approved': return 'badge-green';
      case 'Rejected': return 'badge-red';
      default: return '';
    }
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <h2>Dashboard (Inbox)</h2>
        <p>Manage and track all vendor bills.</p>
      </div>

      <div className="table-card">
        <table className="bills-table">
          <thead>
            <tr>
              <th>Bill ID</th>
              <th>Vendor</th>
              <th>Date</th>
              <th>Amount (₹)</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => (
              <tr key={bill.id}>
                <td className="font-medium text-dark">{bill.id}</td>
                <td>{bill.vendor}</td>
                <td>{bill.date}</td>
                <td>₹{bill.amount.toLocaleString('en-IN')}</td>
                <td>
                  <span className={`status-badge ${getBadgeClass(bill.status)}`}>
                    {bill.status}
                  </span>
                </td>
                <td>
                  <button
                    className="action-button view-btn"
                    onClick={() => onNavigate('review', bill.id)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -----------------------------------------
// View B: The Scan & Upload Form
// -----------------------------------------
function UploadView() {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file first!');
      return;
    }
    alert('Bill submitted successfully to Accounts!');
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleZoneClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="view-container upload-container">
      <div className="view-header">
        <h2>Scan & Upload Bill</h2>
        <p>Upload new vendor bills and enter details for approval.</p>
      </div>

      <div className="upload-card">
        {/* Drag & Drop Box */}
        <div className="drag-drop-zone" onClick={handleZoneClick} style={{ cursor: 'pointer' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,application/pdf"
            style={{ display: 'none' }}
          />
          <div className="upload-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          {selectedFile ? (
            <div style={{ marginTop: '1rem', color: 'var(--primary-color)', fontWeight: 500 }}>
              Selected: {selectedFile.name}
            </div>
          ) : (
            <>
              <h3>Drag & Drop Scanned Image</h3>
              <p>or <span className="text-primary cursor-pointer">click to browse files</span></p>
              <span className="file-hint">Supports PDF, JPG, PNG up to 10MB</span>
            </>
          )}
        </div>

        {/* HTML Form */}
        <form className="upload-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="vendorName">Vendor Name</label>
              <input type="text" id="vendorName" placeholder="e.g. Amazon Web Services" required />
            </div>

            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input type="date" id="date" required />
            </div>

            <div className="form-group">
              <label htmlFor="amount">Amount (₹)</label>
              <input type="number" id="amount" placeholder="0.00" min="0" step="0.01" required />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select id="category" required defaultValue="">
                <option value="" disabled>Select category...</option>
                <option value="Courier">Courier</option>
                <option value="Repair">Repair</option>
                <option value="Travel">Travel</option>
                <option value="Supplies">Supplies</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button">Submit to Accounts</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -----------------------------------------
// View C: Review Bill
// -----------------------------------------
function ReviewView({
  bill,
  onNavigate,
  onUpdateStatus
}: {
  bill: Bill | undefined;
  onNavigate: (view: ViewState) => void;
  onUpdateStatus: (billId: string, status: BillStatus, reason?: string) => void;
}) {
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState('');

  if (!bill) {
    return (
      <div className="view-container">
        <button className="back-button" onClick={() => onNavigate('dashboard')}>
          &larr; Back to Dashboard
        </button>
        <div className="view-header" style={{ marginTop: '1rem' }}>
          <h2>Bill Not Found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container">
      <button className="back-button" onClick={() => onNavigate('dashboard')}>
        &larr; Back to Dashboard
      </button>
      <div className="view-header" style={{ marginTop: '1rem' }}>
        <h2>Review Bill</h2>
        <p>Reviewing details for Bill ID: {bill.id}</p>
      </div>
      <div className="review-card" style={{ backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
        <div className="bill-details" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Vendor</p>
            <p className="font-medium">{bill.vendor}</p>
          </div>
          <div>
            <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Date</p>
            <p className="font-medium">{bill.date}</p>
          </div>
          <div>
            <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Amount</p>
            <p className="font-medium" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>₹{bill.amount.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Status</p>
            <p className="font-medium">{bill.status}</p>
          </div>
        </div>

        {bill.status === 'Rejected' && bill.rejectReason && (
          <div className="reject-reason-box" style={{ padding: '1rem', backgroundColor: '#fff3f3', borderRadius: '8px', border: '1px solid #ffcdd2', marginBottom: '2rem', color: '#d32f2f' }}>
            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Rejection Reason:</strong>
            {bill.rejectReason}
          </div>
        )}

        {bill.status !== 'Rejected' && bill.status !== 'Approved' && (
          <div className="review-actions" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
            {!rejectMode ? (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  className="action-button"
                  style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                  onClick={() => onUpdateStatus(bill.id, 'Approved')}
                >
                  Approve
                </button>
                <button
                  className="action-button"
                  style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                  onClick={() => setRejectMode(true)}
                >
                  Reject
                </button>
              </div>
            ) : (
              <div className="reject-form" style={{ padding: '1.5rem', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                <label htmlFor="reason" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#991b1b' }}>
                  Reason for Rejection <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please provide a clear reason for rejecting this bill..."
                  style={{ width: '100%', padding: '0.75rem', minHeight: '100px', borderRadius: '6px', border: '1px solid #fca5a5', marginBottom: '1rem', fontFamily: 'inherit', resize: 'vertical' }}
                  required
                />
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    className="action-button"
                    style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                    onClick={() => {
                      if (reason.trim()) {
                        onUpdateStatus(bill.id, 'Rejected', reason);
                      } else {
                        alert('Please provide a reason for rejection.');
                      }
                    }}
                  >
                    Confirm Reject
                  </button>
                  <button
                    className="action-button"
                    style={{ backgroundColor: 'transparent', color: '#4b5563', border: '1px solid #d1d5db', padding: '0.5rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                    onClick={() => {
                      setRejectMode(false);
                      setReason('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}