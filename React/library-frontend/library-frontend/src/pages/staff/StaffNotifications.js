import React, { useEffect, useState } from 'react';
import { getNotifications } from '../../api';
import { useAuth } from '../../context/AuthContext';
import '../student/Dashboard.css';

export default function StaffNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getNotifications()
      .then(r => {
        // Filter only this staff member's notifications
        const myNotifs = r.data.filter(n =>
          n.member?.id === user.id
        );
        setNotifications(myNotifs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user.id]);

  return (
    <div className="dashboard fade-up">
      <div className="page-header">
        <h1 className="page-title">🔔 My Notifications</h1>
      </div>
      <div className="card" style={{ padding: 16 }}>
        {loading ? <div className="spinner" /> : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔕</div>
            <p>No notifications yet.</p>
          </div>
        ) : (
          notifications.map((n, i) => (
            <div key={n.id || i} style={{
              padding: '14px 16px',
              background: 'var(--parchment)',
              borderRadius: '8px',
              marginBottom: '10px',
              borderLeft: '4px solid #1e40af',
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                🔔 Notification #{i + 1}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                {n.message || 'No message content'}
              </div>
              {n.sentDate && (
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 6 }}>
                  📅 {new Date(n.sentDate).toLocaleDateString()}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}