import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await login(form);
      loginUser({ userId: res.data.userId, name: res.data.name, role: res.data.role }, res.data.token);
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
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
          <h1>Plan every moment.<br />Perfectly.</h1>
          <p>Manage events, coordinate your team, track vendors and budgets — all in one place.</p>
          <div style={{ display: 'flex', gap: '24px', marginTop: '28px' }}>
            {[['500+', 'Events Managed'], ['98%', 'Client Satisfaction'], ['50+', 'Vendors']].map(([val, label]) => (
              <div key={label}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'white' }}>{val}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-box">
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Sign in to your EventPlan account</p>
          {error && <div className="error">{error}</div>}
          <label>Email Address</label>
          <input type="email" placeholder="you@example.com" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          <label>Password</label>
          <input type="password" placeholder="Enter your password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '4px' }}
            onClick={handleSubmit} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#9ca3af' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;