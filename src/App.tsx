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
}

const mockBills: Bill[] = [
  { id: 'B-1001', vendor: 'Amazon Web Services', date: '2023-10-01', amount: 45000, status: 'Pending Accounts' },
  { id: 'B-1002', vendor: 'BlueDart Courier', date: '2023-10-02', amount: 1250, status: 'Approved' },
  { id: 'B-1003', vendor: 'Reliance Digital', date: '2023-10-03', amount: 120000, status: 'Pending MD' },
  { id: 'B-1004', vendor: 'Office Supplies Co.', date: '2023-10-04', amount: 8500, status: 'Rejected' },
  { id: 'B-1005', vendor: 'Uber Travel', date: '2023-10-05', amount: 3200, status: 'Pending Accounts' },
];

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  const handleNavigate = (view: ViewState, billId: string | null = null) => {
    setCurrentView(view);
    setSelectedBillId(billId);
  };

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
        {currentView === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}
        {currentView === 'upload' && <UploadView />}
        {currentView === 'review' && <ReviewView billId={selectedBillId} onNavigate={handleNavigate} />}
      </main>
    </div>
  );
}

// -----------------------------------------
// View A: The Dashboard (Inbox)
// -----------------------------------------
function DashboardView({ onNavigate }: { onNavigate: (view: ViewState, billId: string | null) => void }) {
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
            {mockBills.map((bill) => (
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Bill submitted successfully to Accounts!');
  };

  return (
    <div className="view-container upload-container">
      <div className="view-header">
        <h2>Scan & Upload Bill</h2>
        <p>Upload new vendor bills and enter details for approval.</p>
      </div>

      <div className="upload-card">
        {/* Drag & Drop Box */}
        <div className="drag-drop-zone">
          <div className="upload-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <h3>Drag & Drop Scanned Image</h3>
          <p>or <span className="text-primary cursor-pointer" style={{ cursor: 'pointer' }}>click to browse files</span></p>
          <span className="file-hint">Supports PDF, JPG, PNG up to 10MB</span>
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
// View C: Review Bill (Placeholder since not fully specified)
// -----------------------------------------
function ReviewView({ billId, onNavigate }: { billId: string | null; onNavigate: (view: ViewState) => void }) {
  return (
    <div className="view-container">
      <button className="back-button" onClick={() => onNavigate('dashboard')}>
        &larr; Back to Dashboard
      </button>
      <div className="view-header" style={{ marginTop: '1rem' }}>
        <h2>Review Bill</h2>
        <p>Reviewing details for Bill ID: {billId || 'None selected'}</p>
      </div>
      <div className="placeholder-card">
        <p>Review interface goes here. This would typically show the scanned document alongside the entered data for verification.</p>
      </div>
    </div>
  );
}