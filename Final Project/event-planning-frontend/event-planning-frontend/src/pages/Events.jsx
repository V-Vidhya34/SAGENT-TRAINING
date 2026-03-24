import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEventsByOrganizer, createEvent, deleteEvent, updateEvent } from '../services/api';

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ eventName: '', eventType: '', venue: '', eventDate: '', startTime: '', endTime: '', description: '' });

  const load = () => getEventsByOrganizer(user.userId).then(r => setEvents(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      await createEvent({ ...form, organizerId: user.userId });
      setShowModal(false);
      setForm({ eventName: '', eventType: '', venue: '', eventDate: '', startTime: '', endTime: '', description: '' });
      load();
    } catch { alert('Error creating event!'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return;
    await deleteEvent(id);
    load();
  };

  const parseDateParts = (eventDate) => {
    if (!eventDate) return null;
    const [year, month, day] = eventDate.split('-').map(Number);
    if (!year || !month || !day) return null;
    return { year, month, day };
  };

  const startOfDay = (value) => {
    const d = new Date(value);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const buildDateTime = (eventDate, time) => {
    const parts = parseDateParts(eventDate);
    if (!parts) return null;
    if (!time) return new Date(parts.year, parts.month - 1, parts.day, 23, 59, 59);
    const [hh, mm, ss] = time.split(':').map(Number);
    return new Date(parts.year, parts.month - 1, parts.day, hh || 0, mm || 0, ss || 0);
  };

  const getCompletionInfo = (eventDate, endTime) => {
    if (!eventDate) return { canComplete: true, allowedFromLabel: '' };
    const now = new Date();
    const today = startOfDay(now);
    const eventDay = startOfDay(buildDateTime(eventDate, '00:00:00'));
    const endDateTime = buildDateTime(eventDate, endTime);

    if (eventDay < today) {
      return { canComplete: true, allowedFromLabel: '' };
    }

    if (eventDay.getTime() === today.getTime()) {
      const canComplete = endDateTime ? now >= endDateTime : false;
      const allowedFromLabel = endDateTime
        ? endDateTime.toLocaleString()
        : eventDay.toLocaleDateString();
      return { canComplete, allowedFromLabel };
    }

    const allowedFromLabel = endDateTime
      ? endDateTime.toLocaleString()
      : eventDay.toLocaleDateString();
    return { canComplete: false, allowedFromLabel };
  };

  const handleComplete = async (eventItem) => {
    const { canComplete, allowedFromLabel } = getCompletionInfo(eventItem.eventDate, eventItem.endTime);
    if (!canComplete) {
      alert(`You can mark completed only after ${allowedFromLabel}.`);
      return;
    }
    try {
      const payload = {
        eventId: eventItem.eventId,
        eventName: eventItem.eventName,
        eventType: eventItem.eventType,
        venue: eventItem.venue,
        eventDate: eventItem.eventDate,
        startTime: eventItem.startTime,
        endTime: eventItem.endTime,
        description: eventItem.description,
        status: 'COMPLETED',
        organizerId: eventItem.organizerId ?? eventItem.organizer?.userId ?? user.userId,
      };
      await updateEvent(eventItem.eventId, payload);
      load();
    } catch {
      alert(`You can mark completed only after ${allowedFromLabel}.`);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="flex-between" style={{ marginBottom: '24px' }}>
          <h2 style={{ marginBottom: 0 }}>Events</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create Event</button>
        </div>

        {events.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            No events yet. Create your first event!
          </div>
        )}

        <div className="grid-2">
          {events.map(e => {
            const { canComplete, allowedFromLabel } = getCompletionInfo(e.eventDate, e.endTime);
            return (
              <div className="card" key={e.eventId} style={{ marginBottom: 0 }}>
              <div className="flex-between" style={{ marginBottom: '12px' }}>
                <h3 style={{ marginBottom: 0 }}>{e.eventName}</h3>
                <div className="flex gap-10">
                  {e.status !== 'COMPLETED' && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleComplete(e)}
                      disabled={!canComplete}
                      title={!canComplete ? `You can mark completed after ${allowedFromLabel}` : 'Mark event as completed'}
                    >
                      Mark Completed
                    </button>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e.eventId)}>Delete</button>
                </div>
              </div>
              <p style={{ fontSize: '13px', marginBottom: '12px' }}>{e.description}</p>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>📅 {e.eventDate}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>📍 {e.venue}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>⏰ {e.startTime} - {e.endTime}</div>
              <span className="badge badge-info">{e.eventType} · {e.status}</span>
              </div>
          );
          })}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="flex-between" style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: 0 }}>Create New Event</h3>
                <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
              </div>
              <label>Event Name</label>
              <input placeholder="e.g. Barani Wedding" value={form.eventName} onChange={e => setForm({ ...form, eventName: e.target.value })} />
              <label>Event Type</label>
              <select value={form.eventType} onChange={e => setForm({ ...form, eventType: e.target.value })}>
                <option value="">Select type</option>
                <option>Wedding</option><option>Birthday</option>
                <option>Corporate</option><option>Anniversary</option><option>Conference</option>
              </select>
              <label>Venue</label>
              <input placeholder="e.g. Chennai Grand Hall" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} />
              <label>Event Date</label>
              <input type="date" value={form.eventDate} onChange={e => setForm({ ...form, eventDate: e.target.value })} />
              <div className="grid-2">
                <div>
                  <label>Start Time</label>
                  <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
                </div>
                <div>
                  <label>End Time</label>
                  <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
                </div>
              </div>
              <label>Description</label>
              <textarea rows={3} placeholder="Event description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCreate}>Create Event</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
