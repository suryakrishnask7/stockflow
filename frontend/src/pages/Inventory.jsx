import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import StockBadge from '../components/common/StockBadge';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import { Search, Filter, Warehouse, Sliders, ArrowLeftRight, CheckCircle, RefreshCw } from 'lucide-react';

export default function Inventory() {
  const { canWrite, canTransact, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [inventory, setInventory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & filter states
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [status, setStatus] = useState(searchParams.get('filter') === 'low' ? 'LOW_STOCK' : '');

  // Quick Adjustment Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustSuccess, setAdjustSuccess] = useState('');

  const fetchWarehouses = async () => {
    try {
      const res = await axiosClient.get('/warehouses');
      setWarehouses(res.data || []);
    } catch (err) {
      console.error('Failed to fetch warehouses', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axiosClient.get('/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const fetchInventory = async (pageIndex = 0) => {
    setLoading(true);
    try {
      const params = {
        page: pageIndex,
        size: 15,
        search: search.trim() || undefined,
        warehouseId: warehouseId || undefined,
        status: status || undefined,
      };

      const res = await axiosClient.get('/inventory', { params });
      setInventory(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
      setPage(res.data.page || 0);
    } catch (err) {
      console.error('Failed to fetch inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchInventory(page);
  }, [warehouseId, status, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchInventory(0);
  };

  const openAdjustModal = (item) => {
    setSelectedItem(item);
    setAdjustQty('');
    setAdjustReason('Physical inventory audit discrepancy');
    setAdjustSuccess('');
    setAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustQty || !selectedItem) return;

    setAdjustLoading(true);
    try {
      await axiosClient.post('/stock-movements/adjustment', {
        productId: selectedItem.productId,
        destWarehouseId: selectedItem.warehouseId,
        quantity: parseInt(adjustQty, 10),
        reason: adjustReason,
      });

      setAdjustSuccess('Adjustment recorded successfully!');
      setTimeout(() => {
        setAdjustModalOpen(false);
        fetchInventory(page);
      }, 1200);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record adjustment');
    } finally {
      setAdjustLoading(false);
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
          <h2 className="fw-bold text-white mb-1">Inventory Balances</h2>
          <p className="text-secondary small mb-0">
            Real-time stock quantities, safety stock levels, and valuations across distribution facilities
          </p>
        </div>

        <button onClick={() => fetchInventory(page)} className="btn btn-secondary-dark btn-sm">
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh Balances</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-3">
        <div className="row g-2 align-items-center">
          {/* Search Bar */}
          <div className="col-12 col-md-5">
            <form onSubmit={handleSearchSubmit} className="position-relative">
              <input
                type="text"
                className="form-control-dark ps-5"
                placeholder="Search by SKU or product name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search size={16} className="text-secondary position-absolute top-50 start-0 translate-middle-y ms-3" />
            </form>
          </div>

          {/* Warehouse Dropdown */}
          <div className="col-12 col-sm-6 col-md-3">
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

          {/* Status Tabs / Pills */}
          <div className="col-12 col-sm-6 col-md-4 d-flex gap-1 justify-content-md-end">
            {[
              { id: '', label: 'All' },
              { id: 'IN_STOCK', label: 'In Stock' },
              { id: 'LOW_STOCK', label: 'Low' },
              { id: 'OUT_OF_STOCK', label: 'Depleted' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatus(tab.id);
                  setPage(0);
                }}
                className={`btn btn-sm py-1 px-2 border-0 rounded-2 fw-semibold ${
                  status === tab.id ? 'btn-brand' : 'btn-secondary-dark text-secondary'
                }`}
                style={{ fontSize: '0.78rem' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="glass-panel overflow-hidden">
        <div className="table-responsive">
          <table className="table-dark-custom">
            <thead>
              <tr>
                <th>Status</th>
                <th>SKU</th>
                <th>Product Description</th>
                <th>Facility</th>
                <th>Category</th>
                <th className="text-end">On Hand</th>
                <th className="text-end">Threshold</th>
                <th className="text-end">Unit Cost</th>
                <th className="text-end">Total Valuation</th>
                {canWrite() && <th className="text-center">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canWrite() ? '10' : '9'} className="text-center py-5 text-secondary">
                    <div className="spinner-border spinner-border-sm text-indigo-400 me-2" role="status" />
                    Loading inventory records...
                  </td>
                </tr>
              ) : inventory.length > 0 ? (
                inventory.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <StockBadge status={item.status} quantity={item.quantity} reorderLevel={item.reorderLevel} />
                    </td>
                    <td>
                      <span className="fw-bold font-monospace text-white">{item.productSku}</span>
                    </td>
                    <td>
                      <div className="fw-semibold text-white small">{item.productName}</div>
                    </td>
                    <td>
                      <span className="badge bg-dark text-secondary border border-secondary border-opacity-10 font-monospace">
                        {item.warehouseCode}
                      </span>
                    </td>
                    <td className="text-secondary small">{item.categoryName || 'General'}</td>
                    <td className="text-end">
                      <span className={`fw-bold font-monospace fs-6 ${item.quantity === 0 ? 'text-danger' : item.quantity <= item.reorderLevel ? 'text-warning' : 'text-success'}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="text-end text-secondary font-monospace small">
                      {item.reorderLevel}
                    </td>
                    <td className="text-end text-secondary font-monospace small">
                      {formatCurrency(item.unitCost)}
                    </td>
                    <td className="text-end text-white fw-bold font-monospace">
                      {formatCurrency(item.totalValue)}
                    </td>
                    {canWrite() && (
                      <td className="text-center">
                        <button
                          onClick={() => openAdjustModal(item)}
                          className="btn btn-sm btn-secondary-dark py-1 px-2"
                          style={{ fontSize: '0.74rem' }}
                          title="Authorized Stock Adjustment"
                        >
                          <Sliders size={13} className="me-1" />
                          Adjust
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canWrite() ? '10' : '9'} className="text-center py-5 text-secondary">
                    No matching inventory records found for current filters.
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

      {/* Authorized Stock Adjustment Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={`Adjust Stock — ${selectedItem?.productSku}`}
        size="md"
      >
        {adjustSuccess ? (
          <div className="text-center py-4">
            <CheckCircle size={48} className="text-success mb-2" />
            <h5 className="text-white fw-bold">{adjustSuccess}</h5>
          </div>
        ) : (
          <form onSubmit={handleAdjustSubmit} className="d-flex flex-column gap-3">
            <div className="p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="small text-secondary mb-1">Product: <span className="text-white fw-semibold">{selectedItem?.productName}</span></div>
              <div className="small text-secondary mb-1">Warehouse: <span className="text-white fw-semibold">{selectedItem?.warehouseName} ({selectedItem?.warehouseCode})</span></div>
              <div className="small text-secondary">Current Quantity: <span className="text-white fw-bold font-monospace">{selectedItem?.quantity} units</span></div>
            </div>

            <div>
              <label className="text-secondary small fw-bold mb-1 d-block">
                Quantity Delta (+ for surplus, - for shrinkage/write-off)
              </label>
              <input
                type="number"
                className="form-control-dark font-monospace"
                placeholder="e.g. +5 or -2"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                required
              />
              <span className="text-secondary small" style={{ fontSize: '0.74rem' }}>
                Enter positive integer to add stock, or negative integer to reduce count.
              </span>
            </div>

            <div>
              <label className="text-secondary small fw-bold mb-1 d-block">
                Mandatory Audit Reason
              </label>
              <input
                type="text"
                className="form-control-dark"
                placeholder="e.g. Physical inventory cycle count variance"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                required
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                className="btn btn-secondary-dark"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adjustLoading}
                className="btn btn-brand"
              >
                {adjustLoading ? 'Recording...' : 'Confirm Adjustment'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
