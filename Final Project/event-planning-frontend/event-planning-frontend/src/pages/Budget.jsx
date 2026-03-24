import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBudgetByEvent, getEventsByOrganizer, createBudget, createPayment, updatePaymentStatus, getVendorsByEvent } from '../services/api';

const Budget = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [budget, setBudget] = useState(null);
  const [eventVendors, setEventVendors] = useState([]);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ totalBudget: '' });
  const [paymentForm, setPaymentForm] = useState({ vendorId: '', amount: '', paymentMethod: 'Bank Transfer', notes: '' });

  useEffect(() => {
    getEventsByOrganizer(user.userId).then(r => {
      setEvents(r.data);
      if (r.data.length > 0) setSelectedEvent(r.data[0].eventId);
    });
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      getBudgetByEvent(selectedEvent).then(r => setBudget(r.data)).catch(() => setBudget(null));
      getVendorsByEvent(selectedEvent).then(r => setEventVendors(r.data)).catch(() => setEventVendors([]));
    }
  }, [selectedEvent]);

  const handleCreateBudget = async () => {
    await createBudget({ eventId: selectedEvent, totalBudget: budgetForm.totalBudget });
    setShowBudgetModal(false);
    getBudgetByEvent(selectedEvent).then(r => setBudget(r.data));
  };

  const handleCreatePayment = async () => {
    if (!paymentForm.vendorId) { alert('Please select a vendor!'); return; }
    await createPayment({ ...paymentForm, budgetId: budget.budgetId, eventId: selectedEvent });
    setShowPaymentModal(false);
    setPaymentForm({ vendorId: '', amount: '', paymentMethod: 'Bank Transfer', notes: '' });
    getBudgetByEvent(selectedEvent).then(r => setBudget(r.data));
  };

  const handlePaymentStatus = async (id, status) => {
    await updatePaymentStatus(id, status);
    getBudgetByEvent(selectedEvent).then(r => setBudget(r.data));
  };

  const confirmedVendors = eventVendors.filter(ev => ev.contractStatus === 'CONFIRMED');
  const percent = budget ? Math.min(((budget.spentAmount / budget.totalBudget) * 100), 100).toFixed(1) : 0;

  // Budget warning
  const totalVendorAmount = confirmedVendors.reduce((sum, ev) => sum + (ev.agreedAmount || 0), 0);
  const budgetExceeded = budget && totalVendorAmount > budget.totalBudget;
  const lowBudget = budget && !budgetExceeded && (budget.remainingAmount / budget.totalBudget) < 0.2;

  return (
    <div className="page">
      <div className="container">
        <div className="flex-between" style={{ marginBottom: '24px' }}>
          <h2 style={{ marginBottom: 0 }}>Budget Management</h2>
          <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)} style={{ width: 'auto', marginBottom: 0 }}>
            {events.map(e => <option key={e.eventId} value={e.eventId}>{e.eventName}</option>)}
          </select>
        </div>

        {!budget ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
            <p style={{ marginBottom: '16px' }}>No budget set for this event</p>
            <button className="btn btn-primary" onClick={() => setShowBudgetModal(true)}>Set Budget</button>
          </div>
        ) : (
          <>
            <div className="grid-3" style={{ marginBottom: '20px' }}>
              {[
                { label: 'Total Budget', value: budget.totalBudget, color: 'var(--primary)' },
                { label: 'Spent', value: budget.spentAmount, color: 'var(--danger)' },
                { label: 'Remaining', value: budget.remainingAmount, color: 'var(--success)' },
              ].map(({ label, value, color }) => (
                <div className="card" key={label} style={{ borderLeft: `4px solid ${color}`, marginBottom: 0 }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color }}>₹{value?.toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="flex-between" style={{ marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Budget Used</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{percent}%</span>
              </div>
              <div style={{ background: 'var(--border-light)', borderRadius: '99px', height: '10px' }}>
                <div style={{
                  background: percent > 80 ? 'var(--danger)' : 'var(--primary)',
                  width: `${percent}%`, height: '100%', borderRadius: '99px', transition: '0.5s ease'
                }} />
              </div>
            </div>

            {/* Budget Warning */}
            {(budgetExceeded || lowBudget) && (
              <div style={{
                background: budgetExceeded ? '#fff1f0' : '#fff7ed',
                border: `1px solid ${budgetExceeded ? '#ffa39e' : '#fed7aa'}`,
                borderLeft: `4px solid ${budgetExceeded ? 'var(--danger)' : '#f97316'}`,
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <span style={{ fontSize: '20px' }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: 700, color: budgetExceeded ? '#b91c1c' : '#c2410c', fontSize: '14px', marginBottom: '4px' }}>
                    {budgetExceeded ? 'Budget Exceeded!' : 'Low Budget Warning'}
                  </div>
                  <div style={{ fontSize: '13px', color: budgetExceeded ? '#7f1d1d' : '#9a3412' }}>
                    {budgetExceeded
                      ? `Total vendor costs (₹${totalVendorAmount.toLocaleString()}) exceed your budget (₹${budget.totalBudget.toLocaleString()}). Consider revising vendor agreements.`
                      : `Only ₹${budget.remainingAmount.toLocaleString()} remaining (${((budget.remainingAmount / budget.totalBudget) * 100).toFixed(1)}%). Budget is running low.`
                    }
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <div className="flex-between" style={{ marginBottom: '16px' }}>
                <h3 style={{ marginBottom: 0 }}>Payments</h3>
                <div className="flex gap-10">
                  {confirmedVendors.length === 0 && (
                    <span style={{ fontSize: '12px', color: 'var(--warning)' }}>Confirm a vendor contract first</span>
                  )}
                  <button className="btn btn-primary btn-sm" onClick={() => setShowPaymentModal(true)}
                    disabled={confirmedVendors.length === 0}>
                    + Add Payment
                  </button>
                </div>
              </div>
              <table>
                <thead>
                  <tr><th>Vendor</th><th>Amount</th><th>Method</th><th>Notes</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {(!budget.payments || budget.payments.length === 0) && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No payments yet</td></tr>
                  )}
                  {budget.payments?.map(p => (
                    <tr key={p.paymentId}>
                      <td>{p.vendor?.user?.name || `Vendor #${p.vendor?.vendorId}`}</td>
                      <td>₹{p.amount?.toLocaleString()}</td>
                      <td>{p.paymentMethod}</td>
                      <td>{p.notes}</td>
                      <td><span className={`badge badge-${p.paymentStatus === 'PAID' ? 'success' : 'pending'}`}>{p.paymentStatus}</span></td>
                      <td>
                        {p.paymentStatus === 'PENDING' && (
                          <button className="btn btn-success btn-sm" onClick={() => handlePaymentStatus(p.paymentId, 'PAID')}>Mark Paid</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {showBudgetModal && (
          <div className="modal-overlay" onClick={() => setShowBudgetModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="flex-between" style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: 0 }}>Set Budget</h3>
                <button className="close-btn" onClick={() => setShowBudgetModal(false)}>×</button>
              </div>
              <label>Total Budget (₹)</label>
              <input type="number" placeholder="500000" value={budgetForm.totalBudget}
                onChange={e => setBudgetForm({ totalBudget: e.target.value })} />
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCreateBudget}>Set Budget</button>
            </div>
          </div>
        )}

        {showPaymentModal && (
          <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="flex-between" style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: 0 }}>Add Payment</h3>
                <button className="close-btn" onClick={() => setShowPaymentModal(false)}>×</button>
              </div>
              <label>Vendor</label>
              <select value={paymentForm.vendorId} onChange={e => setPaymentForm({ ...paymentForm, vendorId: e.target.value })}>
                <option value="">Select confirmed vendor</option>
                {confirmedVendors.map(ev => (
                  <option key={ev.vendor?.vendorId} value={ev.vendor?.vendorId}>
                    {ev.vendor?.user?.name} - {ev.serviceType}
                  </option>
                ))}
              </select>
              <label>Amount (₹)</label>
              <input type="number" placeholder="25000" value={paymentForm.amount}
                onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
              <label>Payment Method</label>
              <select value={paymentForm.paymentMethod} onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}>
                <option>Bank Transfer</option><option>UPI</option><option>Cash</option><option>Cheque</option>
              </select>
              <label>Notes</label>
              <input placeholder="Advance payment" value={paymentForm.notes}
                onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCreatePayment}>Add Payment</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Budget;