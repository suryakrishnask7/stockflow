import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import MovementBadge from '../components/common/MovementBadge';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Sliders,
  RotateCcw,
  Plus,
  Search,
  CheckCircle,
  FileText,
  User,
  RefreshCw,
} from 'lucide-react';

export default function Movements() {
  const { canTransact, canWrite, user } = useAuth();
  const [searchParams] = useSearchParams();

  const [movements, setMovements] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filters
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedType, setSelectedType] = useState('');
  const [warehouseId, setWarehouseId] = useState(searchParams.get('wh') || '');

  // Transaction Wizard Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [txType, setTxType] = useState(searchParams.get('action')?.toUpperCase() || 'RECEIPT');
  const [txData, setTxData] = useState({
    productId: '',
    sourceWarehouseId: '',
    destWarehouseId: searchParams.get('wh') || '',
    supplierId: '',
    quantity: '',
    unitCost: '',
    reason: '',
    externalReference: '',
    notes: '',
  });
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState('');
  const [txSuccess, setTxSuccess] = useState('');

  const fetchWarehouses = async () => {
    try {
      const res = await axiosClient.get('/warehouses');
      setWarehouses(res.data || []);
      if (!txData.destWarehouseId && res.data?.length > 0) {
        setTxData((prev) => ({ ...prev, destWarehouseId: res.data[0].id }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axiosClient.get('/products?size=100');
      setProducts(res.data.content || []);
      if (res.data.content?.length > 0) {
        setTxData((prev) => ({ ...prev, productId: res.data.content[0].id }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axiosClient.get('/suppliers/active');
      setSuppliers(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMovements = async (pageIndex = 0) => {
    setLoading(true);
    try {
      const params = {
        page: pageIndex,
        size: 20,
        type: selectedType || undefined,
        warehouseId: warehouseId || undefined,
      };

      const res = await axiosClient.get('/stock-movements', { params });
      setMovements(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
      setPage(res.data.page || 0);
    } catch (e) {
      console.error('Failed to fetch stock movements', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchProducts();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    fetchMovements(page);
  }, [selectedType, warehouseId, page]);

  // Open modal if action query param is present on mount
  useEffect(() => {
    if (searchParams.get('action')) {
      const act = searchParams.get('action').toUpperCase();
      setTxType(act);
      setModalOpen(true);
    }
  }, [searchParams]);

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setTxLoading(true);
    setTxError('');

    try {
      let endpoint = '/stock-movements/receipt';
      if (txType === 'ISSUE') endpoint = '/stock-movements/issue';
      if (txType === 'TRANSFER') endpoint = '/stock-movements/transfer';
      if (txType === 'ADJUSTMENT') endpoint = '/stock-movements/adjustment';
      if (txType === 'RETURN') endpoint = '/stock-movements/return';

      const payload = {
        productId: Number(txData.productId),
        quantity: parseInt(txData.quantity, 10),
        reason: txData.reason,
        externalReference: txData.externalReference,
        notes: txData.notes,
        idempotencyKey: `TX-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      };

      if (txType === 'RECEIPT') {
        payload.destWarehouseId = Number(txData.destWarehouseId);
        if (txData.supplierId) payload.supplierId = Number(txData.supplierId);
        if (txData.unitCost) payload.unitCost = Number(txData.unitCost);
      } else if (txType === 'ISSUE') {
        payload.sourceWarehouseId = Number(txData.sourceWarehouseId);
      } else if (txType === 'TRANSFER') {
        payload.sourceWarehouseId = Number(txData.sourceWarehouseId);
        payload.destWarehouseId = Number(txData.destWarehouseId);
      } else if (txType === 'ADJUSTMENT') {
        payload.destWarehouseId = Number(txData.destWarehouseId);
      } else if (txType === 'RETURN') {
        payload.destWarehouseId = Number(txData.destWarehouseId);
      }

      const res = await axiosClient.post(endpoint, payload);

      setTxSuccess(`Transaction ${res.data.referenceNumber} processed successfully!`);
      setTimeout(() => {
        setModalOpen(false);
        setTxSuccess('');
        fetchMovements(0);
      }, 1200);
    } catch (err) {
      setTxError(err.response?.data?.message || 'Transaction failed. Please check inputs.');
    } finally {
      setTxLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val || 0);
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
        <div>
          <h2 className="fw-bold text-white mb-1">Stock Movement Ledger</h2>
          <p className="text-secondary small mb-0">
            Immutable transaction record: receipts, order dispatches, warehouse transfers, and cycle count adjustments
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button onClick={() => fetchMovements(page)} className="btn btn-secondary-dark btn-sm">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          {canTransact() && (
            <button
              onClick={() => {
                setTxType('RECEIPT');
                setTxError('');
                setTxSuccess('');
                setModalOpen(true);
              }}
              className="btn btn-brand btn-sm"
            >
              <Plus size={16} />
              <span>Record Transaction</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-3">
        <div className="row g-2 align-items-center">
          {/* Movement Type Filter Tabs */}
          <div className="col-12 col-md-8 d-flex flex-wrap gap-1">
            {[
              { id: '', label: 'All Transactions' },
              { id: 'RECEIPT', label: 'Receipts' },
              { id: 'ISSUE', label: 'Issues' },
              { id: 'TRANSFER', label: 'Transfers' },
              { id: 'ADJUSTMENT', label: 'Adjustments' },
              { id: 'RETURN', label: 'Returns' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedType(tab.id);
                  setPage(0);
                }}
                className={`btn btn-sm py-1 px-3 border-0 rounded-2 fw-semibold ${
                  selectedType === tab.id ? 'btn-brand' : 'btn-secondary-dark text-secondary'
                }`}
                style={{ fontSize: '0.78rem' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Warehouse Selector */}
          <div className="col-12 col-md-4">
            <select
              className="form-select-dark"
              value={warehouseId}
              onChange={(e) => {
                setWarehouseId(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.code} - {wh.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="glass-panel overflow-hidden">
        <div className="table-responsive">
          <table className="table-dark-custom">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Type</th>
                <th>Product & SKU</th>
                <th>Facility Flow</th>
                <th className="text-end">Units</th>
                <th className="text-end">Valuation</th>
                <th>Reason / PO Ref</th>
                <th>Performed By</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-secondary">
                    <div className="spinner-border spinner-border-sm text-indigo-400 me-2" role="status" />
                    Loading movement records...
                  </td>
                </tr>
              ) : movements.length > 0 ? (
                movements.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <span className="font-monospace fw-bold text-white small">{m.referenceNumber}</span>
                    </td>
                    <td>
                      <MovementBadge type={m.movementType} />
                    </td>
                    <td>
                      <div className="fw-semibold text-white small">{m.product?.sku}</div>
                      <div className="text-secondary text-truncate" style={{ maxWidth: '180px', fontSize: '0.74rem' }}>
                        {m.product?.name}
                      </div>
                    </td>
                    <td className="small">
                      {m.movementType === 'RECEIPT' && (
                        <span className="text-secondary">
                          Supplier → <span className="text-white font-monospace">{m.destWarehouse?.code}</span>
                        </span>
                      )}
                      {m.movementType === 'ISSUE' && (
                        <span className="text-secondary">
                          <span className="text-white font-monospace">{m.sourceWarehouse?.code}</span> → Outbound
                        </span>
                      )}
                      {m.movementType === 'TRANSFER' && (
                        <span className="text-secondary">
                          <span className="text-white font-monospace">{m.sourceWarehouse?.code}</span> →{' '}
                          <span className="text-white font-monospace">{m.destWarehouse?.code}</span>
                        </span>
                      )}
                      {m.movementType === 'ADJUSTMENT' && (
                        <span className="text-secondary">
                          Audit at <span className="text-white font-monospace">{m.destWarehouse?.code}</span>
                        </span>
                      )}
                      {m.movementType === 'RETURN' && (
                        <span className="text-secondary">
                          Return to <span className="text-white font-monospace">{m.destWarehouse?.code}</span>
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      <span className={`fw-bold font-monospace fs-6 ${m.movementType === 'ISSUE' ? 'text-danger' : 'text-success'}`}>
                        {m.movementType === 'ISSUE' ? '-' : '+'}{m.quantity}
                      </span>
                    </td>
                    <td className="text-end text-secondary font-monospace small">
                      {formatCurrency(m.totalValue)}
                    </td>
                    <td className="text-secondary small">
                      {m.externalReference && <div className="text-white font-monospace">{m.externalReference}</div>}
                      <div className="text-truncate" style={{ maxWidth: '160px' }}>
                        {m.reason || 'Standard operational flow'}
                      </div>
                    </td>
                    <td>
                      <div className="small text-white fw-medium">{m.performedBy?.fullName || 'System'}</div>
                      <span className="badge bg-dark text-secondary border border-secondary border-opacity-10 py-0 px-1" style={{ fontSize: '0.66rem' }}>
                        {m.performedBy?.username}
                      </span>
                    </td>
                    <td className="text-secondary small font-monospace">
                      {new Date(m.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-secondary">
                    No matching stock movement logs found.
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

      {/* Transaction Wizard Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Stock Movement Transaction"
        size="lg"
      >
        {txSuccess ? (
          <div className="text-center py-4">
            <CheckCircle size={48} className="text-success mb-2" />
            <h5 className="text-white fw-bold mb-1">{txSuccess}</h5>
            <p className="text-secondary small">Inventory balances updated across facilities</p>
          </div>
        ) : (
          <form onSubmit={handleTransactionSubmit} className="d-flex flex-column gap-3">
            {/* Transaction Type Tabs */}
            <div className="d-flex gap-1 p-1 bg-dark bg-opacity-50 rounded-3 border border-secondary border-opacity-15">
              {[
                { id: 'RECEIPT', label: 'Receipt (Inbound)' },
                { id: 'ISSUE', label: 'Issue (Outbound)' },
                { id: 'TRANSFER', label: 'Warehouse Transfer' },
                ...(canWrite() ? [{ id: 'ADJUSTMENT', label: 'Cycle Adjustment' }] : []),
                { id: 'RETURN', label: 'Return' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTxType(t.id)}
                  className={`btn btn-sm flex-grow-1 py-2 border-0 fw-bold rounded-2 ${
                    txType === t.id ? 'btn-brand text-white' : 'text-secondary'
                  }`}
                  style={{ fontSize: '0.78rem' }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {txError && (
              <div className="alert alert-danger py-2 px-3 small rounded-3" style={{ backgroundColor: 'rgba(244, 63, 94, 0.15)', borderColor: 'rgba(244, 63, 94, 0.3)', color: '#fb7185' }}>
                {txError}
              </div>
            )}

            {/* Product Selector */}
            <div>
              <label className="text-secondary small fw-bold mb-1 d-block">Target Product SKU</label>
              <select
                className="form-select-dark"
                value={txData.productId}
                onChange={(e) => setTxData({ ...txData, productId: e.target.value })}
                required
              >
                <option value="">Select SKU from Catalog...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.name} (On hand: {p.totalQuantity})
                  </option>
                ))}
              </select>
            </div>

            {/* Facility Inputs based on Transaction Type */}
            <div className="row g-3">
              {(txType === 'ISSUE' || txType === 'TRANSFER') && (
                <div className="col-12 col-md-6">
                  <label className="text-secondary small fw-bold mb-1 d-block">Source Facility (Outbound)</label>
                  <select
                    className="form-select-dark"
                    value={txData.sourceWarehouseId}
                    onChange={(e) => setTxData({ ...txData, sourceWarehouseId: e.target.value })}
                    required
                  >
                    <option value="">Select Source Hub...</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.code} - {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(txType === 'RECEIPT' || txType === 'TRANSFER' || txType === 'ADJUSTMENT' || txType === 'RETURN') && (
                <div className={`col-12 ${txType === 'TRANSFER' ? 'col-md-6' : 'col-md-12'}`}>
                  <label className="text-secondary small fw-bold mb-1 d-block">
                    {txType === 'TRANSFER' ? 'Destination Facility (Inbound)' : 'Warehouse Facility'}
                  </label>
                  <select
                    className="form-select-dark"
                    value={txData.destWarehouseId}
                    onChange={(e) => setTxData({ ...txData, destWarehouseId: e.target.value })}
                    required
                  >
                    <option value="">Select Warehouse...</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.code} - {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Receipt-specific supplier & cost */}
            {txType === 'RECEIPT' && (
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="text-secondary small fw-bold mb-1 d-block">Supplier / Vendor</label>
                  <select
                    className="form-select-dark"
                    value={txData.supplierId}
                    onChange={(e) => setTxData({ ...txData, supplierId: e.target.value })}
                  >
                    <option value="">Select Supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-6">
                  <label className="text-secondary small fw-bold mb-1 d-block">Purchase Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control-dark font-monospace"
                    placeholder="Auto-defaults to product cost"
                    value={txData.unitCost}
                    onChange={(e) => setTxData({ ...txData, unitCost: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Quantity and External Ref */}
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="text-secondary small fw-bold mb-1 d-block">
                  Quantity ({txType === 'ADJUSTMENT' ? '+/- count' : 'positive integer'})
                </label>
                <input
                  type="number"
                  className="form-control-dark font-monospace"
                  placeholder="e.g. 50"
                  value={txData.quantity}
                  onChange={(e) => setTxData({ ...txData, quantity: e.target.value })}
                  required
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="text-secondary small fw-bold mb-1 d-block">External Ref / PO Number</label>
                <input
                  type="text"
                  className="form-control-dark font-monospace"
                  placeholder="e.g. PO-89214 or SO-4421"
                  value={txData.externalReference}
                  onChange={(e) => setTxData({ ...txData, externalReference: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-secondary small fw-bold mb-1 d-block">
                Reason / Operational Notes {txType === 'ADJUSTMENT' && <span className="text-warning">* (Required for adjustment audit)</span>}
              </label>
              <input
                type="text"
                className="form-control-dark"
                placeholder={txType === 'ADJUSTMENT' ? 'Physical cycle count variance justification...' : 'Optional notes or tracking comments...'}
                value={txData.reason}
                onChange={(e) => setTxData({ ...txData, reason: e.target.value })}
                required={txType === 'ADJUSTMENT'}
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top border-secondary border-opacity-10">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn btn-secondary-dark"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={txLoading}
                className="btn btn-brand"
              >
                {txLoading ? 'Processing...' : 'Confirm Transaction'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
