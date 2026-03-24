import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markAllRead, respondToVendorRequest } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineTarget, setDeclineTarget] = useState(null);
  const [declineReason, setDeclineReason] = useState('Budget too low');
  const [declineNote, setDeclineNote] = useState('');
  const [counterAmount, setCounterAmount] = useState('');

  const load = () => getNotifications(user.userId).then(r => setNotifications(r.data));

  useEffect(() => { load(); markAllRead(user.userId); }, []);

  const handleRespond = async (notifId, status, senderUserId) => {
    try {
      await respondToVendorRequest(notifId, { status });
      if (status === 'ACCEPTED') navigate(`/chat?dmUserId=${senderUserId}`);
      else load();
    } catch { alert('Error responding!'); }
  };

  const handleDeclineSubmit = async () => {
    if (!declineTarget) return;
    try {
      await respondToVendorRequest(declineTarget.notificationId, {
        status: 'DECLINED',
        responseReason: declineReason,
        declineReason,
        responseNote: declineNote.trim() || null,
        declineNote: declineNote.trim() || null,
        counterAmount: counterAmount || null
      });
      setShowDeclineModal(false);
      setDeclineTarget(null);
      setDeclineNote('');
      setCounterAmount('');
      load();
    } catch {
      alert('Error responding!');
    }
  };

  const typeColor = {
    TASK: 'var(--primary)', PAYMENT: 'var(--success)', INVITE: 'var(--warning)',
    CHAT: '#13c2c2', VENDOR: 'var(--danger)', GENERAL: 'var(--text-muted)'
  };

  const typeLabel = { TASK: 'Task', PAYMENT: 'Payment', INVITE: 'Invite', CHAT: 'Chat', VENDOR: 'Vendor', GENERAL: 'General' };
  const extractVendorDetails = (notification) => {
    const info = {
      responseReason: notification.responseReason || '',
      responseNote: notification.responseNote || '',
      counterAmount: notification.counterAmount || ''
    };

    const message = notification.message || '';
    if (!info.responseReason) {
      const reasonMatch = message.match(/Reason:\s*([^\.]+)/i);
      if (reasonMatch) info.responseReason = reasonMatch[1].trim();
    }
    if (!info.responseNote) {
      const noteMatch = message.match(/Note:\s*([^\.]+)/i);
      if (noteMatch) info.responseNote = noteMatch[1].trim();
    }
    if (!info.counterAmount) {
      const counterMatch = message.match(/Counter offer:\s*Rs\.\s*([0-9.]+)/i);
      if (counterMatch) info.counterAmount = counterMatch[1].trim();
    }

    return info;
  };

  return (
    <div className="page">
      <div className="container">
        <h2>Notifications</h2>

        {notifications.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            No notifications yet
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.map(n => {
            const vendorInfo = n.type === 'VENDOR' ? extractVendorDetails(n) : null;
            return (
              <div key={n.notificationId} className="card" style={{
              borderLeft: `4px solid ${typeColor[n.type] || 'var(--text-muted)'}`,
              opacity: n.isRead ? 0.7 : 1,
              marginBottom: 0, padding: '16px 20px'
            }}>
              <div className="flex-between" style={{ alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="badge badge-primary" style={{ background: typeColor[n.type] + '20', color: typeColor[n.type] }}>
                      {typeLabel[n.type] || 'General'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5 }}>{n.message}</div>

                  {n.type === 'VENDOR' && n.actionStatus === 'PENDING' && user?.role === 'VENDOR' && (
                    <div className="flex gap-10" style={{ marginTop: '12px' }}>
                      <button className="btn btn-success btn-sm" onClick={() => handleRespond(n.notificationId, 'ACCEPTED', n.senderId)}>
                        Accept
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => { setDeclineTarget(n); setShowDeclineModal(true); }}>
                        Decline
                      </button>
                    </div>
                  )}

                  {n.type === 'VENDOR' && n.actionStatus === 'ACCEPTED' && user?.role === 'TEAM_MEMBER' && n.senderId && (
                    <button className="btn btn-primary btn-sm" style={{ marginTop: '10px' }}
                      onClick={() => navigate(`/chat?dmUserId=${n.senderId}`)}>
                      Open Chat
                    </button>
                  )}

                  {n.type === 'VENDOR' && n.actionStatus && n.actionStatus !== 'NONE' && n.actionStatus !== 'PENDING' && (
                    <span className={`badge badge-${n.actionStatus === 'ACCEPTED' ? 'success' : 'danger'}`} style={{ marginTop: '8px', display: 'inline-block' }}>
                      {n.actionStatus}
                    </span>
                  )}

                  {vendorInfo && (vendorInfo.responseReason || vendorInfo.responseNote || vendorInfo.counterAmount) && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {vendorInfo.responseReason && <div>Reason: {vendorInfo.responseReason}</div>}
                      {vendorInfo.responseNote && <div>Note: {vendorInfo.responseNote}</div>}
                      {vendorInfo.counterAmount && <div>Counter offer: Rs. {vendorInfo.counterAmount}</div>}
                    </div>
                  )}
                </div>
                {!n.isRead && (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: '6px' }} />
                )}
              </div>
              </div>
            );
          })}
        </div>
      </div>

      {showDeclineModal && (
        <div className="modal-overlay" onClick={() => setShowDeclineModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: 0 }}>Decline request</h3>
              <button className="close-btn" onClick={() => setShowDeclineModal(false)}>X</button>
            </div>
            <label>Reason</label>
            <select value={declineReason} onChange={e => setDeclineReason(e.target.value)}>
              <option>Budget too low</option>
              <option>Date not available</option>
              <option>Scope unclear</option>
              <option>Not my service</option>
              <option>Other</option>
            </select>
            <label>Optional note</label>
            <textarea rows={3} placeholder="Add a short note (optional)" value={declineNote}
              onChange={e => setDeclineNote(e.target.value)} />
            <label>Counter offer (optional)</label>
            <input type="number" placeholder="e.g. 40000" value={counterAmount}
              onChange={e => setCounterAmount(e.target.value)} />
            <button className="btn btn-danger" style={{ width: '100%' }} onClick={handleDeclineSubmit}>
              Send response
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
