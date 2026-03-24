import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';

const Register = () => {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    role: 'ORGANIZER', serviceType: '', location: '', priceRange: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await register(form);
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (e) {
      setError(e.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleDescriptions = {
    ORGANIZER: 'Create and manage events, assign tasks, handle budgets',
    TEAM_MEMBER: 'Collaborate on events, manage assigned tasks',
    VENDOR: 'Offer services and work with event organizers',
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-bg" />
        <div className="auth-left-overlay" />
        <div className="auth-left-logo">
          <span style={{ fontSize: '22px' }}>✦</span>
          EventPlan
        </div>
        <div className="auth-left-content">
          <h1>Join the team.<br />Make it happen.</h1>
          <p>Whether you're an organizer, team member, or vendor — EventPlan keeps everyone connected.</p>
          <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { role: 'Organizer', desc: 'Create events & manage the full team' },
              { role: 'Team Member', desc: 'Handle tasks and coordinate with vendors' },
              { role: 'Vendor', desc: 'Get hired and manage your bookings' },
            ].map(({ role, desc }) => (
              <div key={role} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
                <div>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: '13px' }}>{role}</div>
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-box" style={{ maxWidth: '440px' }}>
          <h2>Create account</h2>
          <p className="auth-subtitle">Get started with EventPlan today</p>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          <label>Full Name</label>
          <input placeholder="Your full name" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
          <label>Email Address</label>
          <input type="email" placeholder="you@example.com" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} />
          <label>Phone Number</label>
          <input placeholder="10-digit mobile number" value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })} />
          <label>Password</label>
          <input type="password" placeholder="Create a strong password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })} />
          <label>Role</label>
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="ORGANIZER">Organizer</option>
            <option value="TEAM_MEMBER">Team Member</option>
            <option value="VENDOR">Vendor</option>
          </select>
          {form.role && (
            <div style={{
              background: 'var(--primary-light)', border: '1px solid #c4bbff',
              borderRadius: 'var(--radius-md)', padding: '10px 14px',
              fontSize: '12px', color: 'var(--primary)', marginBottom: '14px', marginTop: '-8px'
            }}>
              {roleDescriptions[form.role]}
            </div>
          )}
          {form.role === 'VENDOR' && (
            <>
              <label>Service Type</label>
              <input placeholder="e.g. Photography, Catering" value={form.serviceType}
                onChange={e => setForm({ ...form, serviceType: e.target.value })} />
              <label>Location / City</label>
              <input placeholder="e.g. Chennai" value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })} />
              <label>Price Range (₹)</label>
              <input placeholder="e.g. 50000-100000" value={form.priceRange}
                onChange={e => setForm({ ...form, priceRange: e.target.value })} />
            </>
          )}
          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '4px' }}
            onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#9ca3af' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;