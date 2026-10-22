import React from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Sliders, RotateCcw } from 'lucide-react';

export default function MovementBadge({ type }) {
  switch (type) {
    case 'RECEIPT':
      return (
        <span className="badge-movement badge-receipt">
          <ArrowDownLeft size={13} />
          RECEIPT
        </span>
      );
    case 'ISSUE':
      return (
        <span className="badge-movement badge-issue">
          <ArrowUpRight size={13} />
          ISSUE
        </span>
      );
    case 'TRANSFER':
      return (
        <span className="badge-movement badge-transfer">
          <ArrowLeftRight size={13} />
          TRANSFER
        </span>
      );
    case 'ADJUSTMENT':
      return (
        <span className="badge-movement badge-adjustment">
          <Sliders size={13} />
          ADJUSTMENT
        </span>
      );
    case 'RETURN':
      return (
        <span className="badge-movement badge-return">
          <RotateCcw size={13} />
          RETURN
        </span>
      );
    default:
      return <span className="badge-movement badge-issue">{type}</span>;
  }
}
