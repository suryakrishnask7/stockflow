import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Boxes, Lock, User, ArrowRight, Shield, Zap, Sparkles } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  const demoAccounts = [
    { role: 'Administrator', username: 'admin', pass: 'Admin@123', color: '#f43f5e', desc: 'Full system privileges & config' },
    { role: 'Operations Manager', username: 'manager', pass: 'Demo@123', color: '#6366f1', desc: 'Catalog, stock movements & adjustments' },
    { role: 'Warehouse Staff', username: 'staff', pass: 'Demo@123', color: '#10b981', desc: 'Daily receipts, issues & transfers' },
    { role: 'Data Analyst', username: 'analyst', pass: 'Demo@123', color: '#f59e0b', desc: 'Read-only analytics & reporting' },
  ];

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-4">
      <div className="w-100" style={{ maxWidth: '460px' }}>
        {/* Brand Banner */}
        <div className="text-center mb-4">
          <div
            className="rounded-4 d-inline-flex align-items-center justify-content-center text-white mb-3"
            style={{
              width: '56px',
              height: '56px',
              background: 'var(--brand-gradient)',
              boxShadow: '0 0 35px rgba(99, 102, 241, 0.45)',
            }}
          >
            <Boxes size={30} />
          </div>
          <h2 className="fw-extrabold text-white mb-1" style={{ letterSpacing: '-0.03em' }}>
            Stock<span style={{ color: '#818cf8' }}>Flow</span>
          </h2>
          <p className="text-secondary small">Next-Gen Inventory Control & Operational Analytics</p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-4 p-sm-5 shadow-2xl mb-4">
          <h4 className="fw-bold text-white mb-1">Sign in to your account</h4>
          <p className="text-secondary small mb-4">Enter your credentials or choose a pre-configured demo profile</p>

          {error && (
            <div className="alert alert-danger py-2 px-3 small rounded-3 d-flex align-items-center gap-2 mb-4" style={{ backgroundColor: 'rgba(244, 63, 94, 0.15)', borderColor: 'rgba(244, 63, 94, 0.3)', color: '#fb7185' }}>
              <Shield size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
            <div>
              <label className="text-secondary small fw-bold mb-1 d-block">Username</label>
              <div className="position-relative">
                <input
                  type="text"
                  className="form-control-dark ps-5"
                  placeholder="e.g. admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <User size={18} className="text-secondary position-absolute top-50 start-0 translate-middle-y ms-3" />
              </div>
            </div>

            <div>
              <label className="text-secondary small fw-bold mb-1 d-block">Password</label>
              <div className="position-relative">
                <input
                  type="password"
                  className="form-control-dark ps-5"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock size={18} className="text-secondary position-absolute top-50 start-0 translate-middle-y ms-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-brand w-100 justify-content-center py-2 mt-2"
            >
              {loading ? (
                <div className="spinner-border spinner-border-sm text-white" role="status" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo Accounts Card */}
        <div className="glass-panel p-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <Sparkles size={16} className="text-warning" />
            <span className="small fw-bold text-white text-uppercase" style={{ letterSpacing: '0.05em' }}>
              Quick Demo Accounts
            </span>
          </div>

          <div className="d-flex flex-column gap-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.username}
                type="button"
                onClick={() => handleDemoSelect(acc.username, acc.pass)}
                className="btn btn-secondary-dark text-start p-2 d-flex align-items-center justify-content-between border-0 rounded-3"
                style={{
                  backgroundColor: username === acc.username ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: username === acc.username ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                }}
              >
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="pulse-dot" style={{ backgroundColor: acc.color, boxShadow: `0 0 6px ${acc.color}` }} />
                    <span className="fw-semibold text-white small">{acc.role}</span>
                    <span className="text-secondary" style={{ fontSize: '0.72rem' }}>({acc.username})</span>
                  </div>
                  <div className="text-secondary small mt-0.5" style={{ fontSize: '0.72rem' }}>
                    {acc.desc}
                  </div>
                </div>
                <span className="badge bg-dark text-secondary border border-secondary border-opacity-10 py-1 px-2" style={{ fontSize: '0.68rem' }}>
                  Select
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
