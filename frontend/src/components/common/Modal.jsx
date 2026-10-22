import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthMap = {
    sm: '420px',
    md: '580px',
    lg: '780px',
    xl: '960px',
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundColor: 'rgba(5, 8, 15, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1050,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel w-100 animate-fade-in position-relative d-flex flex-column"
        style={{
          maxWidth: maxWidthMap[size] || maxWidthMap.md,
          maxHeight: '90vh',
          backgroundColor: '#111827',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between p-4 border-bottom border-secondary border-opacity-10">
          <h5 className="mb-0 fw-bold text-white">{title}</h5>
          <button
            type="button"
            className="btn btn-sm text-secondary p-1 border-0"
            onClick={onClose}
            style={{ background: 'transparent' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
