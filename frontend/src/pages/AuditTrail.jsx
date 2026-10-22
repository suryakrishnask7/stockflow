import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import Pagination from '../components/common/Pagination';
import { History, Shield, Filter, Search, User, RefreshCw } from 'lucide-react';

export default function AuditTrail() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [entityType, setEntityType] = useState('');
  const [eventType, setEventType] = useState('');

  const fetchAuditEvents = async (pageIndex = 0) => {
    setLoading(true);
    try {
      const params = {
        page: pageIndex,
        size: 20,
        entityType: entityType || undefined,
        eventType: eventType || undefined,
      };

      const res = await axiosClient.get('/audit-events', { params });
      setEvents(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
      setPage(res.data.page || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditEvents(page);
  }, [entityType, eventType, page]);

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
        <div>
          <h2 className="fw-bold text-white mb-1">Immutable Audit Trail</h2>
          <p className="text-secondary small mb-0">
            Cryptographic-grade operational log tracking administrative adjustments, creations, and configuration mutations
          </p>
        </div>

        <button onClick={() => fetchAuditEvents(page)} className="btn btn-secondary-dark btn-sm">
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6">
            <select
              className="form-select-dark"
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All Entity Classes</option>
              <option value="Product">Product</option>
              <option value="Warehouse">Warehouse</option>
              <option value="Supplier">Supplier</option>
              <option value="InventoryBalance">Inventory Balance</option>
              <option value="StockMovement">Stock Movement</option>
            </select>
          </div>

          <div className="col-12 col-md-6">
            <select
              className="form-select-dark"
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All Event Types</option>
              <option value="CREATE">Creation Events</option>
              <option value="UPDATE">Update Events</option>
              <option value="STOCK_ADJUSTMENT">Stock Adjustments</option>
              <option value="DELETE">Deactivations</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel overflow-hidden">
        <div className="table-responsive">
          <table className="table-dark-custom">
            <thead>
              <tr>
                <th>Event Type</th>
                <th>Target Entity</th>
                <th>Entity Reference ID</th>
                <th>Action Details & Justification</th>
                <th>Performed By</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-secondary">
                    <div className="spinner-border spinner-border-sm text-indigo-400 me-2" role="status" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : events.length > 0 ? (
                events.map((ev) => (
                  <tr key={ev.id}>
                    <td>
                      <span className="badge bg-indigo-900 text-indigo-300 border border-indigo-700 border-opacity-50 font-monospace">
                        {ev.eventType}
                      </span>
                    </td>
                    <td>
                      <span className="fw-semibold text-white small">{ev.entityType}</span>
                    </td>
                    <td>
                      <span className="font-monospace text-secondary small">{ev.entityId}</span>
                    </td>
                    <td>
                      <div className="text-white small" style={{ maxWidth: '340px' }}>
                        {ev.details || 'System operation executed'}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1.5 small text-white">
                        <User size={13} className="text-secondary" />
                        <span>{ev.performedBy?.fullName || 'System'}</span>
                        <span className="text-secondary" style={{ fontSize: '0.72rem' }}>
                          ({ev.performedBy?.username || 'sys'})
                        </span>
                      </div>
                    </td>
                    <td className="text-secondary small font-monospace">
                      {new Date(ev.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-secondary">
                    No matching audit records in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          onPageChange={(p) => setPage(p)}
        />
      </div>
    </div>
  );
}
