import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Package,
  ArrowLeftRight,
  Warehouse,
  Truck,
  BarChart3,
  History,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, hasRole } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/inventory', label: 'Inventory Balances', icon: Boxes },
    { to: '/products', label: 'Product Catalog', icon: Package },
    { to: '/movements', label: 'Stock Movements', icon: ArrowLeftRight },
    { to: '/warehouses', label: 'Warehouses', icon: Warehouse },
    { to: '/suppliers', label: 'Suppliers', icon: Truck },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/audit-trail', label: 'Audit Trail', icon: History, minRole: ['ADMIN', 'MANAGER'] },
  ];

  return (
    <aside
      className="d-flex flex-column border-end border-secondary border-opacity-10 position-sticky top-0"
      style={{
        width: collapsed ? '80px' : '260px',
        height: '100vh',
        backgroundColor: '#0d131f',
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 100,
      }}
    >
      {/* Brand Header */}
      <div className="d-flex align-items-center justify-content-between p-4 border-bottom border-secondary border-opacity-10">
        {!collapsed ? (
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center text-white"
              style={{
                width: '36px',
                height: '36px',
                background: 'var(--brand-gradient)',
                boxShadow: 'var(--brand-glow)',
              }}
            >
              <Boxes size={20} />
            </div>
            <div>
              <div className="fw-extrabold text-white lh-1" style={{ fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
                Stock<span style={{ color: '#818cf8' }}>Flow</span>
              </div>
              <span className="text-secondary" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                ENTERPRISE
              </span>
            </div>
          </div>
        ) : (
          <div
            className="rounded-3 d-flex align-items-center justify-content-center text-white mx-auto"
            style={{
              width: '36px',
              height: '36px',
              background: 'var(--brand-gradient)',
            }}
          >
            <Boxes size={20} />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn btn-sm btn-secondary-dark p-1 border-0 d-none d-lg-flex align-items-center justify-content-center"
          style={{ width: '28px', height: '28px' }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-grow-1 p-3 overflow-y-auto">
        <ul className="list-unstyled d-flex flex-column gap-1 mb-0">
          {navItems.map((item) => {
            if (item.minRole && !hasRole(...item.minRole)) return null;
            const Icon = item.icon;

            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none transition-all ${
                      isActive
                        ? 'text-white fw-semibold'
                        : 'text-secondary hover-white'
                    }`
                  }
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                    color: isActive ? '#fff' : '#9ca3af',
                  })}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    size={20}
                    style={{
                      flexShrink: 0,
                      color: 'inherit',
                    }}
                  />
                  {!collapsed && <span className="small">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Role Card */}
      {!collapsed && (
        <div className="p-3 border-top border-secondary border-opacity-10 m-2 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
          <div className="d-flex align-items-center gap-2">
            <ShieldCheck size={18} className="text-indigo-400" />
            <div className="small">
              <div className="fw-semibold text-white" style={{ fontSize: '0.8rem' }}>
                {user?.role} Access
              </div>
              <div className="text-secondary" style={{ fontSize: '0.7rem' }}>
                Signed in as {user?.username}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
