import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, totalElements, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="d-flex align-items-center justify-content-between p-3 border-top border-secondary border-opacity-10 text-secondary small">
      <div>
        Showing page <span className="text-white fw-bold">{page + 1}</span> of{' '}
        <span className="text-white fw-bold">{totalPages}</span> ({totalElements} total entries)
      </div>

      <div className="d-flex align-items-center gap-2">
        <button
          className="btn btn-sm btn-secondary-dark p-2"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          style={{ opacity: page === 0 ? 0.4 : 1 }}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          className="btn btn-sm btn-secondary-dark p-2"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          style={{ opacity: page >= totalPages - 1 ? 0.4 : 1 }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
