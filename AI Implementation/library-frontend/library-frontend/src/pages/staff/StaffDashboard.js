import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getBooks, getBorrowsByMember, getFines } from '../../api';
import '../student/Dashboard.css';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ books: 0, borrows: 0, activeBorrows: 0, unpaidFines: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([getBooks(), getBorrowsByMember(user.id), getFines()])
      .then(([b, br, f]) => {
        const borrows = br.status === 'fulfilled' ? br.value.data : [];
        const fines = f.status === 'fulfilled' ? f.value.data : [];
        setStats({
          books: b.status === 'fulfilled' ? b.value.data.length : 0,
          borrows: borrows.length,
          activeBorrows: borrows.filter(bw => bw.boStatus !== 'RETURNED').length,
          unpaidFines: fines.filter(fn => fn.paidStatus === 'NOT_PAID').length,
        });
        setLoading(false);
      });
  }, [user.id]);

  const cards = [
    { icon: '📚', label: 'Total Books',    value: stats.books,        color: '#4a6741', bg: '#f0fdf4' },
    { icon: '🔄', label: 'My Borrows',     value: stats.borrows,      color: '#1e40af', bg: '#eff6ff' },
    { icon: '⏳', label: 'Active Borrows', value: stats.activeBorrows, color: '#b45309', bg: '#fffbeb' },
    { icon: '💰', label: 'Unpaid Fines',   value: stats.unpaidFines,  color: '#dc2626', bg: '#fef2f2' },
  ];

  return (
    <div className="dashboard fade-up">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Welcome, <span>{user.name?.split(' ')[0]}</span> 👋</h1>
          <p className="dashboard-subtitle">Your personal library dashboard</p>
        </div>
        <div className="dashboard-badge staff-badge">🏢 Staff</div>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="stat-grid">
          {cards.map(c => (
            <div key={c.label} className="stat-card card" style={{ background: c.bg, borderColor: c.color + '30' }}>
              <div className="stat-icon" style={{ background: c.color + '15', color: c.color }}>{c.icon}</div>
              <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card dash-card">
          <h3>📋 Quick Guide</h3>
          <ul className="guide-list">
            <li>📚 Go to <strong>Browse Books</strong> to search and borrow books</li>
            <li>📖 View <strong>My Borrows</strong> to track your borrowed books</li>
            <li>💰 Check <strong>My Fines</strong> to pay any overdue fines</li>
            <li>🔔 See <strong>Notifications</strong> for messages from librarian</li>
          </ul>
        </div>
        <div className="card dash-card">
          <h3>📌 Your Profile</h3>
          <div className="profile-display">
            <div className="profile-display-avatar" style={{ background: '#1e40af' }}>
              {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user.name}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{user.email}</div>
              <span className="badge badge-blue" style={{ marginTop: 6, display: 'inline-block' }}>
                🏢 Staff
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}