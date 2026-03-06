import React, { useState, useEffect, useRef } from 'react';
import './App.css';

type ViewState = 'dashboard' | 'upload' | 'review';
type BillStatus = 'Pending Accounts' | 'Pending MD' | 'Approved' | 'Rejected';

interface Bill {
  id: string;
  vendor: string;
  date: string;
  amount: number;
  category?: string;
  status: BillStatus;
  rejectReason?: string;
  image_url: string;
}

const API_BASE_URL = 'http://localhost:8000/api';

export default function App() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  const fetchBills = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/bills`);
      if (res.ok) {
        const data = await res.json();
        setBills(data);
      }
    } catch (error) {
      console.error("Failed to fetch bills:", error);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleNavigate = (view: ViewState, billId: string | null = null) => {
    setCurrentView(view);
    setSelectedBillId(billId);
  };

  const handleUploadSuccess = () => {
    fetchBills();
    handleNavigate('dashboard');
  };

  const handleUpdateStatus = async (billId: string, status: string, reason?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/bills/${billId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, reason })
      });
      if (res.ok) {
        fetchBills();
        handleNavigate('dashboard');
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
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
        </div>
        <div className="nav-profile">
          <div className="avatar">A</div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        {currentView === 'dashboard' && <DashboardView bills={bills} onNavigate={handleNavigate} />}
        {currentView === 'upload' && <UploadView onUploadSuccess={handleUploadSuccess} />}
        {currentView === 'review' && <ReviewView bill={selectedBill} onNavigate={handleNavigate} onUpdateStatus={handleUpdateStatus} />}
      </main>
    </div>
  );
}

// -----------------------------------------
// View A: The Dashboard (Inbox)
// -----------------------------------------
function DashboardView({ bills, onNavigate }: { bills: Bill[], onNavigate: (view: ViewState, billId: string | null) => void }) {
  const getBadgeClass = (status: string) => {
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
                <td>₹{bill.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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
            {bills.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No bills exist in the database yet. Upload a new bill to get started!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -----------------------------------------
// View B: The Scan & Upload Form
// -----------------------------------------
function UploadView({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file first!');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('vendor', vendor);
    formData.append('amount', amount);
    formData.append('date', date);
    formData.append('category', category || 'Uncategorized');

    setUploading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/upload-bill`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        alert('Bill submitted successfully to Accounts!');
        setSelectedFile(null);
        setVendor('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setCategory('');
        onUploadSuccess();
      } else {
        alert("Failed to upload bill");
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to the backend server. Is it running?');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Attempt Auto-Extraction
      setExtracting(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch(`${API_BASE_URL}/extract-bill-data`, {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.vendor) setVendor(data.vendor);
          if (data.amount) setAmount(data.amount);

          // Reformat date to YYYY-MM-DD if needed, but our date field expects this format:
          if (data.date) {
            // Heuristic: if we got DD-MM-YYYY or similar
            const parts = data.date.split(/[\/\-]/);
            if (parts.length === 3) {
              // rough date correction for form field if it's DD-MM-YYYY
              if (parts[0].length <= 2 && parts[2].length === 4) {
                setDate(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
              } else {
                setDate(data.date);
              }
            }
          }
          if (data.category) setCategory(data.category);
        }
      } catch (err) {
        console.error("Extraction failed", err);
      } finally {
        setExtracting(false);
      }
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
          {extracting ? (
            <div style={{ marginTop: '1rem', color: 'var(--primary-color)', fontWeight: 500 }}>
              <span className="animate-pulse">✨ Analyzing Receipt with OCR...</span>
            </div>
          ) : selectedFile ? (
            <div style={{ marginTop: '1rem', color: 'var(--text-main)', fontWeight: 500 }}>
              Selected File: <span className="text-primary">{selectedFile.name}</span>
            </div>
          ) : (
            <>
              <h3>Drag & Drop Scanned Image</h3>
              <p>or <span className="text-primary cursor-pointer">click to browse files</span></p>
              <span className="file-hint">Supports PDF, JPG, PNG up to 10MB</span>
            </>
          )}
        </div>

        {/* HTML Form - Only shown after file is selected and extracted */}
        {selectedFile && !extracting && (
          <form className="upload-form" onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
            <div className="form-grid">
              <div className="form-group">
                <label>Vendor Name *</label>
                <input type="text" value={vendor} onChange={e => setVendor(e.target.value)} required placeholder="e.g. Office Supplies Co." />
              </div>
              <div className="form-group">
                <label>Amount (₹) *</label>
                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="e.g. 1500.00" />
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Supplies" />
              </div>
            </div>
            <div className="form-actions" style={{ justifyContent: 'flex-end', borderTop: 'none', paddingTop: 0 }}>
              <button type="submit" className="submit-button" disabled={uploading}>
                {uploading ? 'Processing & Uploading...' : 'Confirm Details & Upload Bill'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------
// View C: Review Bill (Split Screen UI)
// -----------------------------------------
function ReviewView({
  bill,
  onNavigate,
  onUpdateStatus
}: {
  bill: Bill | undefined;
  onNavigate: (view: ViewState) => void;
  onUpdateStatus: (billId: string, status: string, reason?: string) => void;
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

  // Determine correct image URL by prefixing with localhost backend if relative
  const imageUrl = bill.image_url.startsWith('http') ? bill.image_url : `http://localhost:8000${bill.image_url}`;

  return (
    <div className="view-container review-split-container">
      <div className="review-header-full">
        <button className="back-button" onClick={() => onNavigate('dashboard')}>
          &larr; Back to Dashboard
        </button>
        <div className="view-header" style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
          <h2>Review Bill</h2>
          <p>Reviewing details for Bill ID: {bill.id}</p>
        </div>
      </div>

      <div className="split-view">
        {/* Left window: The document / receipt image */}
        <div className="split-left image-preview-panel">
          <h3>Scanned Receipt</h3>
          <div className="image-wrapper">
            <img src={imageUrl} alt={`Receipt from ${bill.vendor}`} onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x600.png?text=Preview+Image+Not+Found';
            }} />
          </div>
        </div>

        {/* Right window: Review details, approve / reject features */}
        <div className="split-right data-panel">
          <div className="review-card">
            <h3>Extracted Data</h3>

            <div className="data-grid">
              <div className="data-item">
                <span className="data-label">Vendor</span>
                <span className="data-value">{bill.vendor}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Date</span>
                <span className="data-value">{bill.date}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Category</span>
                <span className="data-value">{bill.category || 'Uncategorized'}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Status</span>
                <span className="data-value">{bill.status}</span>
              </div>
              <div className="data-item full-width mt-2">
                <span className="data-label">Amount</span>
                <span className="data-value amount-highlight">₹{bill.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {bill.status === 'Rejected' && bill.rejectReason && (
              <div className="reject-reason-box mt-4">
                <strong>Rejection Reason:</strong>
                <p>{bill.rejectReason}</p>
              </div>
            )}

            {bill.status !== 'Rejected' && bill.status !== 'Approved' && (
              <div className="review-actions mt-4">
                {!rejectMode ? (
                  <div className="action-buttons-row">
                    <button
                      className="btn-approve"
                      onClick={() => onUpdateStatus(bill.id, 'Approved')}
                    >
                      Approve
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => setRejectMode(true)}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="reject-form">
                    <label htmlFor="reason">Reason for Rejection <span>*</span></label>
                    <textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Please provide a clear reason for rejecting this bill..."
                      required
                    />
                    <div className="action-buttons-row">
                      <button
                        className="btn-confirm-reject"
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
                        className="btn-cancel"
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

            {(bill.status === 'Rejected' || bill.status === 'Approved') && (
              <div className="status-resolved-msg mt-4">
                This bill has been {bill.status.toLowerCase()}. No further actions are required.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}