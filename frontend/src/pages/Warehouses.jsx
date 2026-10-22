import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import { Warehouse as WarehouseIcon, MapPin, Package, DollarSign, Plus, Edit2, ArrowRight, RefreshCw } from 'lucide-react';

export default function Warehouses() {
  const { canWrite } = useAuth();
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'USA',
    notes: '',
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/warehouses');
      // For each warehouse, fetch detailed metrics
      const details = await Promise.all(
        res.data.map(async (wh) => {
          try {
            const d = await axiosClient.get(`/warehouses/${wh.id}`);
            return d.data;
          } catch (e) {
            return wh;
          }
        })
      );
      setWarehouses(details);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const openCreateModal = () => {
    setIsEdit(false);
    setEditId(null);
    setFormData({
      code: '',
      name: '',
      addressLine1: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'USA',
      notes: '',
    });
    setModalError('');
    setModalOpen(true);
  };

  const openEditModal = (wh) => {
    setIsEdit(true);
    setEditId(wh.id);
    setFormData({
      code: wh.code,
      name: wh.name,
      addressLine1: wh.addressLine1 || '',
      city: wh.city || '',
      state: wh.state || '',
      postalCode: wh.postalCode || '',
      country: wh.country || 'USA',
      notes: wh.notes || '',
    });
    setModalError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    try {
      if (isEdit) {
        await axiosClient.put(`/warehouses/${editId}`, formData);
      } else {
        await axiosClient.post('/warehouses', formData);
      }
      setModalOpen(false);
      fetchWarehouses();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to save warehouse');
    } finally {
      setModalLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
        <div>
          <h2 className="fw-bold text-white mb-1">Distribution Hubs & Facilities</h2>
          <p className="text-secondary small mb-0">
            Multi-node warehouse network with utilization, stock allocations, and capacity breakdown
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button onClick={fetchWarehouses} className="btn btn-secondary-dark btn-sm">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          {canWrite() && (
            <button onClick={openCreateModal} className="btn btn-brand btn-sm">
              <Plus size={16} />
              <span>Add Facility</span>
            </button>
          )}
        </div>
      </div>

      {/* Facilities Cards Grid */}
      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-5 text-secondary">
            <div className="spinner-border spinner-border-sm text-indigo-400 me-2" role="status" />
            Loading warehouse facilities...
          </div>
        ) : warehouses.length > 0 ? (
          warehouses.map((wh) => (
            <div key={wh.id} className="col-12 col-lg-4">
              <div className="glass-panel p-4 h-100 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <span className="badge bg-indigo-900 text-indigo-300 font-monospace mb-2 border border-indigo-700 border-opacity-50">
                      {wh.code}
                    </span>
                    <h5 className="fw-bold text-white mb-1">{wh.name}</h5>
                    <div className="text-secondary small d-flex align-items-center gap-1">
                      <MapPin size={14} className="text-secondary flex-shrink-0" />
                      <span>{wh.city}, {wh.state} ({wh.country})</span>
                    </div>
                  </div>

                  {canWrite() && (
                    <button
                      onClick={() => openEditModal(wh)}
                      className="btn btn-sm btn-secondary-dark p-1"
                      title="Edit facility details"
                    >
                      <Edit2 size={15} />
                    </button>
                  )}
                </div>

                <div className="p-3 rounded-3 my-3" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="row g-2 text-center">
                    <div className="col-4 border-end border-secondary border-opacity-10">
                      <div className="text-secondary" style={{ fontSize: '0.7rem' }}>SKUs Stored</div>
                      <div className="fw-bold text-white fs-6 font-monospace">{wh.productCount || 0}</div>
                    </div>
                    <div className="col-4 border-end border-secondary border-opacity-10">
                      <div className="text-secondary" style={{ fontSize: '0.7rem' }}>Total Units</div>
                      <div className="fw-bold text-white fs-6 font-monospace">{wh.totalUnits || 0}</div>
                    </div>
                    <div className="col-4">
                      <div className="text-secondary" style={{ fontSize: '0.7rem' }}>Valuation</div>
                      <div className="fw-bold text-emerald-400 fs-6 font-monospace">{formatCurrency(wh.totalValue)}</div>
                    </div>
                  </div>
                </div>

                <div className="text-secondary small mb-3">
                  {wh.addressLine1} {wh.postalCode && `• ${wh.postalCode}`}
                </div>

                <div className="mt-auto pt-3 border-top border-secondary border-opacity-10 d-flex justify-content-between align-items-center">
                  <span className={`badge ${wh.status === 'ACTIVE' ? 'bg-success bg-opacity-25 text-success border border-success border-opacity-50' : 'bg-secondary'}`}>
                    {wh.status}
                  </span>

                  <button
                    onClick={() => navigate(`/inventory?warehouseId=${wh.id}`)}
                    className="btn btn-sm btn-secondary-dark d-flex align-items-center gap-1"
                    style={{ fontSize: '0.78rem' }}
                  >
                    <span>View Stock</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12 text-center py-5 text-secondary">
            No warehouses registered in the network.
          </div>
        )}
      </div>

      {/* Create / Edit Warehouse Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEdit ? `Edit Facility: ${formData.code}` : 'Register New Warehouse Location'}
        size="md"
      >
        {modalError && (
          <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3" style={{ backgroundColor: 'rgba(244, 63, 94, 0.15)', borderColor: 'rgba(244, 63, 94, 0.3)', color: '#fb7185' }}>
            {modalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          <div className="row g-3">
            <div className="col-12 col-sm-4">
              <label className="text-secondary small fw-bold mb-1 d-block">Facility Code</label>
              <input
                type="text"
                className="form-control-dark font-monospace text-uppercase"
                placeholder="e.g. WH-SOUTH"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="col-12 col-sm-8">
              <label className="text-secondary small fw-bold mb-1 d-block">Facility Name</label>
              <input
                type="text"
                className="form-control-dark"
                placeholder="e.g. Southern Regional Depot"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-secondary small fw-bold mb-1 d-block">Street Address</label>
            <input
              type="text"
              className="form-control-dark"
              placeholder="e.g. 400 Logistics Way"
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              required
            />
          </div>

          <div className="row g-3">
            <div className="col-12 col-sm-4">
              <label className="text-secondary small fw-bold mb-1 d-block">City</label>
              <input
                type="text"
                className="form-control-dark"
                placeholder="e.g. Dallas"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
            <div className="col-12 col-sm-4">
              <label className="text-secondary small fw-bold mb-1 d-block">State / Province</label>
              <input
                type="text"
                className="form-control-dark"
                placeholder="e.g. TX"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
              />
            </div>
            <div className="col-12 col-sm-4">
              <label className="text-secondary small fw-bold mb-1 d-block">Postal Code</label>
              <input
                type="text"
                className="form-control-dark font-monospace"
                placeholder="e.g. 75201"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
            </div>
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
              disabled={modalLoading}
              className="btn btn-brand"
            >
              {modalLoading ? 'Saving...' : isEdit ? 'Update Location' : 'Register Location'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
