import React from 'react';

export default function StockBadge({ status, quantity, reorderLevel }) {
  let badgeClass = 'badge-in-stock';
  let label = 'In Stock';
  let dotClass = 'pulse-dot-emerald';

  if (status === 'OUT_OF_STOCK' || quantity === 0) {
    badgeClass = 'badge-out-of-stock';
    label = 'Out of Stock';
    dotClass = 'pulse-dot-rose';
  } else if (status === 'LOW_STOCK' || (reorderLevel !== undefined && quantity <= reorderLevel)) {
    badgeClass = 'badge-low-stock';
    label = 'Low Stock';
    dotClass = 'pulse-dot-amber';
  }

  return (
    <span className={`badge-stock ${badgeClass}`}>
      <span className={`pulse-dot ${dotClass}`} />
      {label}
    </span>
  );
}
