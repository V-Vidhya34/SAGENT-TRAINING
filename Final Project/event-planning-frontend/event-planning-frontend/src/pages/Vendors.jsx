import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getVendors,
  getEvents,
  getEventsByOrganizer,
  assignVendor,
  getVendorsByEvent,
  updateContractStatus,
  addVendorReview,
  sendVendorRequest,
  getAcceptedVendorIds,
  getNotifications,
  getVendorReviews
} from '../services/api';

const Vendors = () => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [eventVendors, setEventVendors] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [assignForm, setAssignForm] = useState({ vendorId: '', serviceType: '', agreedAmount: '', notes: '' });
  const [reviewForm, setReviewForm] = useState({ rating: '5', comment: '' });
  const [requestForm, setRequestForm] = useState({ taskDetails: '', eventId: '', amount: '' });
  const [requestSent, setRequestSent] = useState(false);
  const [requestedVendors, setRequestedVendors] = useState([]);
  const [acceptedVendors, setAcceptedVendors] = useState([]);
  const [vendorResponses, setVendorResponses] = useState({});
  const [search, setSearch] = useState('');
  const [eventFilterId, setEventFilterId] = useState('');
  const [reviewedVendors, setReviewedVendors] = useState([]);
  const [existingReview, setExistingReview] = useState(null);

  const parseVendorResponseMessage = (message) => {
    const info = { responseReason: '', responseNote: '', counterAmount: '' };
    if (!message) return info;
    const reasonMatch = message.match(/Reason:\s*([^\.]+)/i);
    const noteMatch = message.match(/Note:\s*([^\.]+)/i);
    const counterMatch = message.match(/Counter offer:\s*Rs\.\s*([0-9.]+)/i);
    if (reasonMatch) info.responseReason = reasonMatch[1].trim();
    if (noteMatch) info.responseNote = noteMatch[1].trim();
    if (counterMatch) info.counterAmount = counterMatch[1].trim();
    return info;
  };

  const parseEventNameFromMessage = (message) => {
    if (!message) return '';
    const match = message.match(/Event\s*[:\-]\s*([^\n.|]+)/i);
    return match ? match[1].trim() : '';
  };

  useEffect(() => {
    getVendors().then(r => setVendors(r.data));
    const saved = JSON.parse(localStorage.getItem(`requested_${user.userId}`) || '[]');
    setRequestedVendors(saved);

    if (user?.role === 'TEAM_MEMBER') {
      getAcceptedVendorIds(user.userId).then(r => setAcceptedVendors(r.data)).catch(() => {});
      getEvents().then(r => {
        setAllEvents(r.data);
        if (r.data.length > 0) setEventFilterId(String(r.data[0].eventId));
      }).catch(() => {});
      getNotifications(user.userId).then(r => {
        const map = {};
        r.data
          .filter(n => n.type === 'VENDOR' && n.senderId)
          .forEach(n => {
            const vendorUserId = String(n.senderId);
            const eventId = String(n.eventId || '');
            const parsed = parseVendorResponseMessage(n.message);
            if (!map[vendorUserId]) map[vendorUserId] = {};
            if (!map[vendorUserId][eventId]) {
              map[vendorUserId][eventId] = {
                status: n.actionStatus,
                responseReason: n.responseReason || parsed.responseReason,
                responseNote: n.responseNote || parsed.responseNote,
                counterAmount: n.counterAmount || parsed.counterAmount,
                eventId: n.eventId || null,
                eventName: n.eventName || parseEventNameFromMessage(n.message)
              };
            }
          });
        setVendorResponses(map);
      }).catch(() => {});
    }

    if (user?.role === 'ORGANIZER') {
      getEventsByOrganizer(user.userId).then(r => {
        setEvents(r.data);
        if (r.data.length > 0) setSelectedEvent(r.data[0].eventId);
      });
    }
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      getVendorsByEvent(selectedEvent).then(r => setEventVendors(r.data)).catch(() => setEventVendors([]));
    }
  }, [selectedEvent]);

  const handleAssign = async () => {
    await assignVendor({ ...assignForm, eventId: String(selectedEvent) });
    setShowAssignModal(false);
    getVendorsByEvent(selectedEvent).then(r => setEventVendors(r.data));
  };

  const handleContractStatus = async (id, status) => {
    await updateContractStatus(id, status);
    getVendorsByEvent(selectedEvent).then(r => setEventVendors(r.data));
  };

  const openReviewModal = async (ev) => {
    setSelectedVendor(ev);
    setShowReviewModal(true);
    try {
      const r = await getVendorReviews(ev.vendor.vendorId);
      const myReview = r.data.find(rev => String(rev.event?.eventId) === String(selectedEvent));
      setExistingReview(myReview || null);
      if (myReview) {
        setReviewForm({ rating: String(myReview.rating), comment: myReview.comment });
      } else {
        setReviewForm({ rating: '5', comment: '' });
      }
    } catch { setExistingReview(null); }
  };

  const handleReview = async () => {
    try {
      await addVendorReview(selectedVendor.vendor.vendorId, {
        eventId: String(selectedEvent), organizerId: String(user.userId), ...reviewForm
      });
      setReviewedVendors(prev => [...prev, selectedVendor.eventVendorId]);
      setShowReviewModal(false);
      alert('Review submitted successfully!');
    } catch (e) {
      alert(e.response?.data?.message || 'Already reviewed this vendor for this event!');
    }
  };

  const handleSendRequest = async () => {
    if (!requestForm.taskDetails.trim()) { alert('Please enter the task details.'); return; }
    if (!requestForm.eventId) { alert('Please select an event.'); return; }

    const vendorUserId = String(selectedVendor?.user?.userId);
    const eventId = String(requestForm.eventId);

    const alreadyRequested = requestedVendors.some(
      r => String(r.vendorUserId) === vendorUserId && String(r.eventId) === eventId
    );
    const responseForEvent = vendorResponses[vendorUserId]?.[eventId];
    const canResend = responseForEvent && ['DECLINED', 'COMPLETED'].includes(responseForEvent.status);

    if (alreadyRequested && !canResend) {
      alert('Request already sent for this event.');
      return;
    }

    try {
      await sendVendorRequest({
        vendorUserId: selectedVendor.user.userId,
        senderUserId: user.userId,
        senderName: user.name,
        taskDetails: requestForm.taskDetails,
        eventId: requestForm.eventId,
        amount: requestForm.amount || null
      });

      const updated = [
        ...requestedVendors.filter(r =>
          !(String(r.vendorUserId) === vendorUserId && String(r.eventId) === eventId)
        ),
        { vendorUserId: selectedVendor.user.userId, eventId: requestForm.eventId }
      ];
      setRequestedVendors(updated);
      localStorage.setItem(`requested_${user.userId}`, JSON.stringify(updated));

      if (canResend) {
        setVendorResponses(prev => {
          const copy = { ...prev };
          if (copy[vendorUserId]) {
            const eventsCopy = { ...copy[vendorUserId] };
            delete eventsCopy[eventId];
            copy[vendorUserId] = eventsCopy;
          }
          return copy;
        });
      }

      setRequestSent(true);
      setTimeout(() => {
        setShowRequestModal(false);
        setRequestSent(false);
        setRequestForm({ taskDetails: '', eventId: '', amount: '' });
      }, 2000);
    } catch {
      alert('Error sending request.');
    }
  };

  const normalizedQuery = search.trim().toLowerCase();
  const filteredVendors = vendors.filter(v => {
    if (!normalizedQuery) return true;
    const fields = [v.user?.name, v.user?.email, v.serviceType, v.location]
      .filter(Boolean).map(value => value.toLowerCase());
    return fields.some(value => value.includes(normalizedQuery));
  });

  const formatRating = rating => {
    const value = Number(rating);
    return Number.isFinite(value) ? value.toFixed(1) : 'New';
  };

  const hasRequestForEvent = (vendorUserId, eventId) =>
    requestedVendors.some(
      r => String(r.vendorUserId) === String(vendorUserId) && String(r.eventId) === String(eventId)
    );

  const avatarPalette = [
    { from: '#0f766e', to: '#1d4ed8' },
    { from: '#f97316', to: '#db2777' },
    { from: '#16a34a', to: '#0ea5e9' },
    { from: '#8b5cf6', to: '#ec4899' },
    { from: '#b45309', to: '#0f766e' },
    { from: '#2563eb', to: '#14b8a6' }
  ];

  const getAvatarGradient = name => {
    const safe = (name || 'vendor').trim().toLowerCase();
    let hash = 0;
    for (let i = 0; i < safe.length; i += 1) {
      hash = (hash * 31 + safe.charCodeAt(i)) % 2147483647;
    }
    const palette = avatarPalette[hash % avatarPalette.length];
    return `linear-gradient(140deg, ${palette.from} 0%, ${palette.to} 100%)`;
  };

  // ============ TEAM MEMBER VIEW ============
  if (user?.role === 'TEAM_MEMBER') {
    const availableCount = vendors.filter(v => v.isAvailable).length;
    const busyCount = Math.max(vendors.length - availableCount, 0);
    const visibleVendors = filteredVendors;
    const selectedEventName = allEvents.find(e => String(e.eventId) === String(eventFilterId))?.eventName || '';

    return (
      <div className="page vendors-page">
        <div className="container">
          <div className="vendors-hero">
            <div className="vendors-hero__content">
              <p className="eyebrow">Vendor Hub</p>
              <h1>Find trusted partners fast</h1>
              <p>Explore verified vendors, compare details, and send requests without leaving your event workspace.</p>
              <div className="vendors-hero__stats">
                <div className="stat-chip">
                  <span className="stat-value">{availableCount}</span>
                  <span className="stat-label">Available now</span>
                </div>
                <div className="stat-chip">
                  <span className="stat-value">{busyCount}</span>
                  <span className="stat-label">Booked</span>
                </div>
                <div className="stat-chip">
                  <span className="stat-value">{requestedVendors.length}</span>
                  <span className="stat-label">Requests sent</span>
                </div>
              </div>
            </div>
            <div className="vendors-hero__panel">
              <div className="hero-panel-card">
                <div className="hero-panel-title">Quick tip</div>
                <p>Share clear requirements and dates when requesting services to get faster replies.</p>
                <div className="hero-panel-footer">
                  <span className="pill pill-soft">Team member</span>
                  <span className="pill pill-outline">Live availability</span>
                </div>
              </div>
            </div>
          </div>

          <div className="vendors-toolbar">
            <div className="vendors-search">
              <input type="text" value={search} placeholder="Search by vendor, service, or city"
                onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="vendors-filter">
              <select value={eventFilterId} onChange={e => setEventFilterId(e.target.value)}>
                {allEvents.map(e => (
                  <option key={e.eventId} value={e.eventId}>{e.eventName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="vendor-grid">
            {visibleVendors.map(v => {
              const vendorUserId = String(v.user?.userId);
              const eventScopedResponse = eventFilterId
                ? vendorResponses[vendorUserId]?.[String(eventFilterId)] || null : null;
              const scopedStatus = eventScopedResponse?.status || null;
              const isAccepted = scopedStatus === 'ACCEPTED';
              const isDeclined = scopedStatus === 'DECLINED';
              const isCompleted = scopedStatus === 'COMPLETED';
              const isEventAvailable = v.isAvailable;
              const declineReason = eventScopedResponse?.responseReason;
              const counterAmount = eventScopedResponse?.counterAmount;
              const hasSentForThisEvent = eventFilterId ? hasRequestForEvent(vendorUserId, eventFilterId) : false;
              const isPending = hasSentForThisEvent && !isAccepted && !isDeclined && !isCompleted;
              const isRequestBlocked = isAccepted || isPending;
              const canResend = isDeclined || isCompleted;
              let declineText = '';
              if (isDeclined) {
                declineText = declineReason ? `Declined: ${declineReason}` : 'Declined';
                if (counterAmount) declineText += ` · Counter Rs. ${counterAmount}`;
              }

              return (
                <div key={v.vendorId} className={`vendor-card ${isEventAvailable ? 'is-available' : 'is-busy'}`}>
                  <div className="vendor-card__header">
                    <div className="vendor-avatar" style={{ background: getAvatarGradient(v.user?.name) }}>
                      {(v.user?.name || 'V').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="vendor-name">{v.user?.name}</div>
                      <div className="vendor-meta">{v.user?.email}</div>
                    </div>
                    <span className={`status-pill ${isEventAvailable ? 'status-available' : 'status-busy'}`}>
                      {v.isAvailable ? 'Available' : 'Booked'}
                    </span>
                  </div>
                  <div className="vendor-card__details">
                    <div className="detail"><span className="detail-label">Service</span><span className="detail-value">{v.serviceType || 'Service'}</span></div>
                    <div className="detail"><span className="detail-label">Location</span><span className="detail-value">{v.location || 'Location'}</span></div>
                    <div className="detail"><span className="detail-label">Budget</span><span className="detail-value">Rs. {v.priceRange}</span></div>
                    <div className="detail"><span className="detail-label">Rating</span><span className="detail-value">{formatRating(v.avgRating)}</span></div>
                  </div>
                  <div className="vendor-card__actions">
                    {isAccepted && (
                      <span className="request-state" style={{ color: 'var(--success)', fontWeight: 700 }}>
                        ✓ Accepted{selectedEventName ? ` · ${selectedEventName}` : ''}
                      </span>
                    )}
                    {isPending && <span className="request-state muted">Request sent — awaiting response</span>}
                    {isDeclined && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                        <span className="request-state muted" style={{ fontSize: '12px' }}>{declineText}</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => {
                          setSelectedVendor(v);
                          setRequestForm({ taskDetails: '', eventId: eventFilterId || '', amount: '' });
                          setShowRequestModal(true);
                        }}>Send again</button>
                      </div>
                    )}
                    {isCompleted && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                        <span className="request-state muted" style={{ fontSize: '12px' }}>Completed</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => {
                          setSelectedVendor(v);
                          setRequestForm({ taskDetails: '', eventId: eventFilterId || '', amount: '' });
                          setShowRequestModal(true);
                        }}>Send again</button>
                      </div>
                    )}
                    {!isRequestBlocked && !canResend && (
                      <button className="btn btn-primary btn-sm" onClick={() => {
                        setSelectedVendor(v);
                        setRequestForm({ taskDetails: '', eventId: eventFilterId || '', amount: '' });
                        setShowRequestModal(true);
                      }}>Send request</button>
                    )}
                    {!isEventAvailable && !isAccepted && !isPending && (
                      <span className="request-state muted" style={{ fontSize: '11px', marginTop: '4px' }}>
                        Vendor is booked — you can still send a request
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {visibleVendors.length === 0 && (
            <div className="empty-state">
              <h3>No vendors found</h3>
              <p>Try searching with a different keyword.</p>
              {search && <button className="btn btn-ghost btn-sm" onClick={() => setSearch('')}>Clear filters</button>}
            </div>
          )}

          {showRequestModal && selectedVendor && (
            <div className="modal-overlay" onClick={() => { setShowRequestModal(false); setRequestSent(false); }}>
              <div className="modal vendor-modal" onClick={e => e.stopPropagation()}>
                {requestSent ? (
                  <div className="vendor-modal__success">
                    <div className="success">Request sent successfully.</div>
                    <p>{selectedVendor.user?.name} will respond via notifications.</p>
                  </div>
                ) : (
                  <>
                    <div className="vendor-modal__header">
                      <div><h3>Send service request</h3><p>Share the brief so the vendor can reply quickly.</p></div>
                      <button className="close-btn" onClick={() => setShowRequestModal(false)} aria-label="Close">&times;</button>
                    </div>
                    <div className="vendor-mini">
                      <div className="vendor-avatar" style={{ background: getAvatarGradient(selectedVendor.user?.name) }}>
                        {(selectedVendor.user?.name || 'V').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="vendor-name">{selectedVendor.user?.name}</div>
                        <div className="vendor-meta">{selectedVendor.serviceType} - Rs. {selectedVendor.priceRange}</div>
                      </div>
                    </div>
                    <label>Select Event</label>
                    <select value={requestForm.eventId} onChange={e => setRequestForm({ ...requestForm, eventId: e.target.value })}>
                      <option value="">Select event</option>
                      {allEvents.map(e => <option key={e.eventId} value={e.eventId}>{e.eventName}</option>)}
                    </select>
                    {requestForm.eventId &&
                      hasRequestForEvent(selectedVendor.user?.userId, requestForm.eventId) &&
                      !(['DECLINED', 'COMPLETED'].includes(
                        vendorResponses[String(selectedVendor.user?.userId)]?.[String(requestForm.eventId)]?.status
                      )) && (
                        <p className="vendor-modal__note" style={{ color: '#b45309' }}>
                          Request already sent for this event. Waiting for vendor response.
                        </p>
                      )}
                    <label>Proposed Amount (Rs.)</label>
                    <input type="number" placeholder="e.g. 75000 (optional)" value={requestForm.amount}
                      onChange={e => setRequestForm({ ...requestForm, amount: e.target.value })} />
                    <label>Requirements / Task Details</label>
                    <textarea rows={4} placeholder="Describe what you need..." value={requestForm.taskDetails}
                      onChange={e => setRequestForm({ ...requestForm, taskDetails: e.target.value })} />
                    <p className="vendor-modal__note">The vendor can accept or decline. You will get notified.</p>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSendRequest}>Send request</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ ORGANIZER VIEW ============
  const organizerAvailableCount = vendors.filter(v => v.isAvailable).length;
  const organizerVisible = filteredVendors;

  return (
    <div className="page vendors-page">
      <div className="container">
        <div className="vendors-hero">
          <div className="vendors-hero__content">
            <p className="eyebrow">Organizer Console</p>
            <h1>Vendor management, streamlined</h1>
            <p>Review availability, assign vendors to events, and keep contracts moving in one place.</p>
            <div className="vendors-hero__stats">
              <div className="stat-chip">
                <span className="stat-value">{vendors.length}</span>
                <span className="stat-label">Total vendors</span>
              </div>
              <div className="stat-chip">
                <span className="stat-value">{eventVendors.length}</span>
                <span className="stat-label">Assigned</span>
              </div>
              <div className="stat-chip">
                <span className="stat-value">{organizerAvailableCount}</span>
                <span className="stat-label">Available</span>
              </div>
            </div>
          </div>
          <div className="vendors-hero__panel">
            <div className="hero-panel-card">
              <div className="hero-panel-title">Next steps</div>
              <p>Assign vendors to events early to lock in dates and confirm contracts faster.</p>
              <div className="hero-panel-footer">
                <span className="pill pill-soft">Organizer</span>
                <span className="pill pill-outline">Contracts</span>
              </div>
            </div>
          </div>
        </div>

        <div className="vendors-toolbar">
          <div className="vendors-search">
            <input type="text" value={search} placeholder="Search by vendor, service, or city"
              onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="vendors-section">
          <div className="section-header">
            <div>
              <h3>All Vendors</h3>
              <p className="section-subtitle">Browse your full vendor network at a glance.</p>
            </div>
          </div>
          <div className="vendor-grid">
            {organizerVisible.map(v => {
              const isEventAvailable = v.isAvailable;
              const isAssigned = eventVendors.some(ev => ev.vendor?.vendorId === v.vendorId);
              const assignedVendor = eventVendors.find(ev => ev.vendor?.vendorId === v.vendorId);
              return (
                <div key={v.vendorId} className={`vendor-card ${isEventAvailable ? 'is-available' : 'is-busy'}`}>
                  <div className="vendor-card__header">
                    <div className="vendor-avatar" style={{ background: getAvatarGradient(v.user?.name) }}>
                      {(v.user?.name || 'V').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="vendor-name">{v.user?.name}</div>
                      <div className="vendor-meta">{v.user?.email}</div>
                    </div>
                    <span className={`status-pill ${isEventAvailable ? 'status-available' : 'status-busy'}`}>
                      {v.isAvailable ? 'Available' : 'Booked'}
                    </span>
                  </div>
                  <div className="vendor-card__details">
                    <div className="detail"><span className="detail-label">Service</span><span className="detail-value">{v.serviceType || 'Service'}</span></div>
                    <div className="detail"><span className="detail-label">Location</span><span className="detail-value">{v.location || 'Location'}</span></div>
                    <div className="detail"><span className="detail-label">Budget</span><span className="detail-value">Rs. {v.priceRange}</span></div>
                    <div className="detail"><span className="detail-label">Rating</span><span className="detail-value">{formatRating(v.avgRating)}</span></div>
                  </div>
                  <div className="vendor-card__actions">
                    {isAssigned ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className="request-state" style={{ color: 'var(--success)', fontWeight: 700 }}>
                          ✓ Assigned to this event
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Rs. {assignedVendor?.agreedAmount?.toLocaleString()} · {assignedVendor?.contractStatus}
                        </span>
                      </div>
                    ) : (
                      <span className="request-state muted">
                        {isEventAvailable ? 'Ready to assign' : 'Currently unavailable'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {organizerVisible.length === 0 && (
            <div className="empty-state">
              <h3>No vendors found</h3>
              <p>Try searching with a different keyword.</p>
              {search && <button className="btn btn-ghost btn-sm" onClick={() => setSearch('')}>Clear filters</button>}
            </div>
          )}
        </div>

        <div className="vendors-section">
          <div className="section-header">
            <div>
              <h3>Event Vendors</h3>
              <p className="section-subtitle">Track assignments and contract confirmations.</p>
            </div>
            <div className="section-actions">
              <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
                {events.map(e => <option key={e.eventId} value={e.eventId}>{e.eventName}</option>)}
              </select>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAssignModal(true)}>Assign vendor</button>
            </div>
          </div>
          <div className="card vendors-table-card">
            <table className="vendors-table">
              <thead>
                <tr><th>Vendor</th><th>Service</th><th>Amount</th><th>Contract</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {eventVendors.map(ev => (
                  <tr key={ev.eventVendorId}>
                    <td style={{ fontWeight: 600 }}>{ev.vendor?.user?.name}</td>
                    <td>{ev.serviceType}</td>
                    <td>Rs. {ev.agreedAmount?.toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-${ev.contractStatus === 'CONFIRMED' ? 'success' : 'pending'}`}>
                        {ev.contractStatus}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-10">
                        {ev.contractStatus === 'PENDING' && (
                          <button className="btn btn-success btn-sm"
                            onClick={() => handleContractStatus(ev.eventVendorId, 'CONFIRMED')}>
                            Confirm
                          </button>
                        )}
                        {!reviewedVendors.includes(ev.eventVendorId) ? (
                          <button className="btn btn-ghost btn-sm" onClick={() => openReviewModal(ev)}>
                            Review
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>
                            ✓ Reviewed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {eventVendors.length === 0 && (
                  <tr><td colSpan={5} className="vendors-table__empty">No vendors assigned.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showAssignModal && (
          <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
            <div className="modal vendor-modal" onClick={e => e.stopPropagation()}>
              <div className="vendor-modal__header">
                <div><h3>Assign vendor</h3><p>Connect a vendor to the selected event.</p></div>
                <button className="close-btn" onClick={() => setShowAssignModal(false)}>&times;</button>
              </div>
              <label>Select Vendor</label>
              <select value={assignForm.vendorId} onChange={e => setAssignForm({ ...assignForm, vendorId: e.target.value })}>
                <option value="">Select vendor</option>
                {vendors.map(v => <option key={v.vendorId} value={v.vendorId}>{v.user?.name} - {v.serviceType}</option>)}
              </select>
              <label>Service Type</label>
              <input placeholder="Photography" value={assignForm.serviceType}
                onChange={e => setAssignForm({ ...assignForm, serviceType: e.target.value })} />
              <label>Agreed Amount (Rs.)</label>
              <input type="number" placeholder="75000" value={assignForm.agreedAmount}
                onChange={e => setAssignForm({ ...assignForm, agreedAmount: e.target.value })} />
              <label>Notes</label>
              <input placeholder="Full day coverage" value={assignForm.notes}
                onChange={e => setAssignForm({ ...assignForm, notes: e.target.value })} />
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAssign}>Assign vendor</button>
            </div>
          </div>
        )}

        {showReviewModal && (
          <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
            <div className="modal vendor-modal" onClick={e => e.stopPropagation()}>
              <div className="vendor-modal__header">
                <div><h3>Add review</h3><p>Capture feedback after delivery.</p></div>
                <button className="close-btn" onClick={() => setShowReviewModal(false)}>&times;</button>
              </div>

              {/* Existing Review Info */}
              {existingReview && (
                <div style={{
                  background: 'var(--success-light)',
                  border: '1px solid #bbf7d0',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  fontSize: '13px'
                }}>
                  <div style={{ fontWeight: 600, color: '#15803d', marginBottom: '4px' }}>Already Reviewed</div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Rating: {'★'.repeat(existingReview.rating)}{'☆'.repeat(5 - existingReview.rating)}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{existingReview.comment}</div>
                </div>
              )}

              {!existingReview && (
                <>
                  <label>Rating (1-5)</label>
                  <select value={reviewForm.rating} onChange={e => setReviewForm({ ...reviewForm, rating: e.target.value })}>
                    {[1, 2, 3, 4, 5].map(n => <option key={n}>{n}</option>)}
                  </select>
                  <label>Comment</label>
                  <textarea rows={3} placeholder="Great service!" value={reviewForm.comment}
                    onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} />
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleReview}>
                    Submit review
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

export default Vendors;