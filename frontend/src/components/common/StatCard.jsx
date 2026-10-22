import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'brand', trend }) {
  const colorMap = {
    brand: {
      bg: 'rgba(99, 102, 241, 0.12)',
      border: 'rgba(99, 102, 241, 0.25)',
      icon: '#818cf8',
    },
    emerald: {
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.25)',
      icon: '#34d399',
    },
    amber: {
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.25)',
      icon: '#fbbf24',
    },
    rose: {
      bg: 'rgba(244, 63, 94, 0.12)',
      border: 'rgba(244, 63, 94, 0.25)',
      icon: '#fb7185',
    },
    cyan: {
      bg: 'rgba(6, 182, 212, 0.12)',
      border: 'rgba(6, 182, 212, 0.25)',
      icon: '#22d3ee',
    },
  };

  const scheme = colorMap[color] || colorMap.brand;

  return (
    <div className="glass-panel p-4 position-relative overflow-hidden">
      <div className="d-flex justify-content-between align-items-start mb-2">
        <span className="text-secondary small fw-bold text-uppercase" style={{ letterSpacing: '0.06em' }}>
          {title}
        </span>
        {Icon && (
          <div
            className="d-flex align-items-center justify-content-center rounded-3"
            style={{
              width: '38px',
              height: '38px',
              backgroundColor: scheme.bg,
              border: `1px solid ${scheme.border}`,
              color: scheme.icon,
            }}
          >
            <Icon size={19} />
          </div>
        )}
      </div>

      <div className="d-flex align-items-baseline gap-2 mt-1">
        <h3 className="fw-bold mb-0 text-white" style={{ fontSize: '1.75rem', letterSpacing: '-0.02em' }}>
          {value}
        </h3>
        {trend && (
          <span className={`small fw-semibold ${trend.positive ? 'text-success' : 'text-danger'}`}>
            {trend.positive ? '↑' : '↓'} {trend.text}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="text-secondary small mt-2 d-flex align-items-center gap-1">
          {subtitle}
        </div>
      )}
    </div>
  );
}
