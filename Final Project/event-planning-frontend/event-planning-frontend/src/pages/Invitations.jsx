import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getInvitationsByEvent, sendInvitation, getEventsByOrganizer, getFeedbackByEvent, sendFeedbackForms } from '../services/api';

const Invitations = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ guestName: '', guestEmail: '', guestPhone: '' });
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  useEffect(() => {
    getEventsByOrganizer(user.userId).then(r => {
      setEvents(r.data);
      if (r.data.length > 0) setSelectedEvent(r.data[0].eventId);
    });
  }, []);

  useEffect(() => {
    if (!selectedEvent) return;
    getInvitationsByEvent(selectedEvent).then(r => setInvitations(r.data)).catch(() => setInvitations([]));
    getFeedbackByEvent(selectedEvent).then(r => setFeedbacks(r.data)).catch(() => setFeedbacks([]));
    setFeedbackMsg('');
  }, [selectedEvent]);

  const handleSend = async () => {
    setSending(true);
    try {
      await sendInvitation({ ...form, eventId: selectedEvent });
      setSuccessMsg('Invitation sent successfully!');
      setForm({ guestName: '', guestEmail: '', guestPhone: '' });
      getInvitationsByEvent(selectedEvent).then(r => setInvitations(r.data));
      setTimeout(() => { setShowModal(false); setSuccessMsg(''); }, 1500);
    } catch {
      alert('Error sending invitation!');
    } finally {
      setSending(false);
    }
  };

  const rsvpColor = { ACCEPTED: 'success', DECLINED: 'danger', PENDING: 'pending' };
  const selectedEventDetails = events.find(e => String(e.eventId) === String(selectedEvent));
  const eventEnded = selectedEventDetails
    ? selectedEventDetails.status === 'COMPLETED' ||
      (selectedEventDetails.eventDate ? new Date(selectedEventDetails.eventDate) < new Date() : false)
    : false;

  const handleSendFeedback = async () => {
    setSendingFeedback(true);
    try {
      const res = await sendFeedbackForms(selectedEvent);
      const sent = res?.data?.sent ?? 0;
      const skipped = res?.data?.skipped ?? 0;
      setFeedbackMsg(`Feedback form sent. ${sent} sent, ${skipped} skipped.`);
      getFeedbackByEvent(selectedEvent).then(r => setFeedbacks(r.data)).catch(() => setFeedbacks([]));
    } catch {
      setFeedbackMsg('Unable to send feedback forms right now.');
    } finally {
      setSendingFeedback(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="flex-between" style={{ marginBottom: '24px' }}>
          <h2 style={{ marginBottom: 0 }}>Guest Invitations</h2>
          <div className="flex gap-10">
            <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)} style={{ width: 'auto', marginBottom: 0 }}>
              {events.map(e => <option key={e.eventId} value={e.eventId}>{e.eventName}</option>)}
            </select>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Send Invitation</button>
          </div>
        </div>

        <div className="grid-3" style={{ marginBottom: '20px' }}>
          {['ACCEPTED', 'DECLINED', 'PENDING'].map(s => (
            <div className="card" key={s} style={{ textAlign: 'center', marginBottom: 0 }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: s === 'ACCEPTED' ? 'var(--success)' : s === 'DECLINED' ? 'var(--danger)' : 'var(--warning)' }}>
                {invitations.filter(i => i.rsvpStatus === s).length}
              </div>
              <span className={`badge badge-${rsvpColor[s]}`} style={{ marginTop: '6px' }}>{s}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <table>
            <thead>
              <tr><th>Guest Name</th><th>Email</th><th>Phone</th><th>RSVP Status</th><th>RSVP Link</th></tr>
            </thead>
            <tbody>
              {invitations.map(inv => (
                <tr key={inv.invitationId}>
                  <td style={{ fontWeight: 600 }}>{inv.guestName}</td>
                  <td>{inv.guestEmail}</td>
                  <td>{inv.guestPhone}</td>
                  <td><span className={`badge badge-${rsvpColor[inv.rsvpStatus]}`}>{inv.rsvpStatus}</span></td>
                  <td>
                    <a href={`/rsvp/${inv.invitationId}`} target="_blank"
                      style={{ color: 'var(--primary)', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
                      View Link →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invitations.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No invitations sent yet</p>
          )}
        </div>

        <div className="card" style={{ marginTop: '20px' }}>
          <div className="flex-between" style={{ marginBottom: '16px' }}>
            <h3 style={{ marginBottom: 0 }}>Feedback Responses</h3>
            <div className="flex gap-10">
              {!eventEnded && (
                <span className="badge badge-pending">Event not ended yet</span>
              )}
              <button
                className="btn btn-primary"
                onClick={handleSendFeedback}
                disabled={!eventEnded || sendingFeedback}
              >
                {sendingFeedback ? 'Sending...' : 'Send Feedback Form'}
              </button>
            </div>
          </div>
          {feedbackMsg && (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              {feedbackMsg}
            </div>
          )}
          <table>
            <thead>
              <tr><th>Guest</th><th>Email</th><th>Rating</th><th>Comments</th><th>Submitted</th></tr>
            </thead>
            <tbody>
              {feedbacks.map(fb => (
                <tr key={fb.feedbackId}>
                  <td style={{ fontWeight: 600 }}>{fb.guestName}</td>
                  <td>{fb.guestEmail}</td>
                  <td><span className="badge badge-primary">{fb.rating}/5</span></td>
                  <td style={{ maxWidth: '320px' }}>{fb.comments || '-'}</td>
                  <td>{fb.createdAt ? new Date(fb.createdAt).toLocaleString('en-IN') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {feedbacks.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px' }}>
              No feedback received yet.
            </p>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => { if (!sending) { setShowModal(false); setSuccessMsg(''); } }}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="flex-between" style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: 0 }}>Send Invitation</h3>
                <button className="close-btn" onClick={() => { setShowModal(false); setSuccessMsg(''); }}>×</button>
              </div>
              {successMsg ? (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <div className="success" style={{ textAlign: 'center', fontSize: '15px' }}>{successMsg}</div>
                  <p style={{ fontSize: '13px' }}>Email sent to guest!</p>
                </div>
              ) : (
                <>
                  <label>Guest Name</label>
                  <input placeholder="Raj Kumar" value={form.guestName} onChange={e => setForm({ ...form, guestName: e.target.value })} />
                  <label>Guest Email</label>
                  <input type="email" placeholder="raj@example.com" value={form.guestEmail} onChange={e => setForm({ ...form, guestEmail: e.target.value })} />
                  <label>Guest Phone</label>
                  <input placeholder="Phone number" value={form.guestPhone} onChange={e => setForm({ ...form, guestPhone: e.target.value })} />
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSend} disabled={sending}>
                    {sending ? 'Sending...' : 'Send Invitation'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invitations;
