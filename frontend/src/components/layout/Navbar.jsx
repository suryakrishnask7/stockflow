import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon, Shield, Sparkles, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const { user, logout, quickLogin } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-50 px-2 py-1">ADMIN</span>;
      case 'MANAGER':
        return <span className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-50 px-2 py-1">MANAGER</span>;
      case 'STAFF':
        return <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50 px-2 py-1">STAFF</span>;
      case 'ANALYST':
        return <span className="badge bg-warning bg-opacity-25 text-warning border border-warning border-opacity-50 px-2 py-1">ANALYST</span>;
      default:
        return <span className="badge bg-secondary">{role}</span>;
    }
  };

  return (
    <header className="glass-header px-4 py-3 d-flex align-items-center justify-content-between position-sticky top-0 z-3">
      {/* Left: Quick Environment Indicator */}
      <div className="d-flex align-items-center gap-3">
        <div className="d-flex align-items-center gap-2 text-secondary small">
          <span className="pulse-dot pulse-dot-emerald" />
          <span className="text-muted fw-semibold">Live System:</span>
          <span className="text-white fw-medium">PostgreSQL • 3 Hubs Connected</span>
        </div>
      </div>

      {/* Right: Quick Role Switcher + User Profile */}
      <div className="d-flex align-items-center gap-3">
        {/* Quick Demo Switcher */}
        <div className="d-none d-md-flex align-items-center gap-1 bg-dark bg-opacity-50 border border-secondary border-opacity-15 rounded-3 p-1">
          <span className="text-secondary small px-2 fw-medium d-flex align-items-center gap-1">
            <Sparkles size={13} className="text-warning" /> Switch Role:
          </span>
          {['ADMIN', 'MANAGER', 'STAFF', 'ANALYST'].map((role) => (
            <button
              key={role}
              onClick={() => quickLogin(role)}
              className={`btn btn-sm py-1 px-2 border-0 fw-semibold rounded-2 ${
                user?.role === role ? 'btn-brand text-white' : 'text-secondary hover-white'
              }`}
              style={{ fontSize: '0.72rem' }}
            >
              {role}
            </button>
          ))}
        </div>

        {/* User Dropdown */}
        <div className="position-relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="btn btn-secondary-dark py-1 px-2 d-flex align-items-center gap-2 border-0"
          >
            <div
              className="rounded-circle d-flex align-items-center justify-content-center bg-indigo-900 text-indigo-200 fw-bold"
              style={{ width: '32px', height: '32px', background: 'rgba(99, 102, 241, 0.25)', border: '1px solid rgba(99, 102, 241, 0.4)' }}
            >
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="text-start d-none d-sm-block">
              <div className="small fw-bold text-white lh-1">{user?.fullName || 'User'}</div>
              <div className="text-secondary" style={{ fontSize: '0.7rem' }}>
                {user?.role}
              </div>
            </div>
            <ChevronDown size={14} className="text-secondary" />
          </button>

          {dropdownOpen && (
            <div
              className="position-absolute end-0 mt-2 glass-panel p-2 shadow-xl animate-fade-in"
              style={{ width: '220px', zIndex: 1000, backgroundColor: '#111827' }}
            >
              <div className="p-2 border-bottom border-secondary border-opacity-10 mb-1">
                <div className="fw-bold text-white small">{user?.fullName}</div>
                <div className="text-secondary small text-truncate">{user?.email}</div>
                <div className="mt-1">{getRoleBadge(user?.role)}</div>
              </div>

              <div className="d-md-none border-bottom border-secondary border-opacity-10 pb-2 mb-1">
                <div className="small text-secondary px-2 py-1">Switch Demo Role:</div>
                <div className="d-flex flex-wrap gap-1 px-2">
                  {['ADMIN', 'MANAGER', 'STAFF', 'ANALYST'].map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        quickLogin(role);
                        setDropdownOpen(false);
                      }}
                      className="btn btn-sm btn-secondary-dark py-0 px-2"
                      style={{ fontSize: '0.7rem' }}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="btn btn-sm text-danger w-100 d-flex align-items-center gap-2 p-2 hover-bg-danger rounded-2 border-0 text-start"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
