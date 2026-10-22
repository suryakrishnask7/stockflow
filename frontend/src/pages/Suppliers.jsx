import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { Truck, Search, Plus, Edit2, Mail, Phone, MapPin, RefreshCw } from 'lucide-react';

export default function Suppliers() {
  const { canWrite } = useAuth();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    country: 'USA',
    notes: '',
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchSuppliers = async (pageIndex = 0) => {
    setLoading(true);
    try {
      const params = {
        page: pageIndex,
        size: 15,
        search: search.trim() || undefined,
        status: status || undefined,
      };

      const res = await axiosClient.get('/suppliers', { params });
      setSuppliers(res.data.content || []);
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
    fetchSuppliers(page);
  }, [status, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchSuppliers(0);
  };

  const openCreateModal = () => {
    setIsEdit(false);
    setEditId(null);
    setFormData({
      code: '',
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      city: '',
      state: '',
      country: 'USA',
      notes: '',
    });
    setModalError('');
    setModalOpen(true);
  };

  const openEditModal = (s) => {
    setIsEdit(true);
    setEditId(s.id);
    setFormData({
      code: s.code,
      name: s.name,
      contactPerson: s.contactPerson || '',
      email: s.email || '',
      phone: s.phone || '',
      city: s.city || '',
      state: s.state || '',
      country: s.country || 'USA',
      notes: s.notes || '',
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
        await axiosClient.put(`/suppliers/${editId}`, formData);
      } else {
        await axiosClient.post('/suppliers', formData);
      }
      setModalOpen(false);
      fetchSuppliers(page);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to save vendor');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
        <div>
          <h2 className="fw-bold text-white mb-1">Vendor & Supplier Directory</h2>
          <p className="text-secondary small mb-0">
            Registered wholesale vendors, primary product suppliers, and procurement contacts
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button onClick={() => fetchSuppliers(page)} className="btn btn-secondary-dark btn-sm">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          {canWrite() && (
            <button onClick={openCreateModal} className="btn btn-brand btn-sm">
              <Plus size={16} />
              <span>Add Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-8">
            <form onSubmit={handleSearchSubmit} className="position-relative">
              <input
                type="text"
                className="form-control-dark ps-5"
                placeholder="Search by vendor name, code, contact or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search size={16} className="text-secondary position-absolute top-50 start-0 translate-middle-y ms-3" />
            </form>
          </div>

          <div className="col-12 col-md-4">
            <select
              className="form-select-dark"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Suppliers</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="glass-panel overflow-hidden">
        <div className="table-responsive">
          <table className="table-dark-custom">
            <thead>
              <tr>
                <th>Status</th>
                <th>Supplier Code</th>
                <th>Vendor Organization</th>
                <th>Primary Contact</th>
                <th>Communications</th>
                <th>Region</th>
                {canWrite() && <th className="text-center">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canWrite() ? '7' : '6'} className="text-center py-5 text-secondary">
                    <div className="spinner-border spinner-border-sm text-indigo-400 me-2" role="status" />
                    Loading suppliers...
                  </td>
                </tr>
              ) : suppliers.length > 0 ? (
                suppliers.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span className={`badge ${s.status === 'ACTIVE' ? 'bg-success bg-opacity-25 text-success border border-success border-opacity-50' : 'bg-secondary'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <span className="font-monospace fw-bold text-white">{s.code}</span>
                    </td>
                    <td>
                      <div className="fw-semibold text-white small">{s.name}</div>
                      <div className="text-secondary text-truncate" style={{ maxWidth: '200px', fontSize: '0.74rem' }}>
                        {s.notes || 'Wholesale supplier'}
                      </div>
                    </td>
                    <td className="text-secondary small">{s.contactPerson || 'Account Rep'}</td>
                    <td>
                      <div className="d-flex flex-column gap-0.5">
                        {s.email && (
                          <div className="small text-secondary d-flex align-items-center gap-1">
                            <Mail size={12} className="text-secondary" />
                            <a href={`mailto:${s.email}`} className="text-secondary text-decoration-none hover-white">
                              {s.email}
                            </a>
                          </div>
                        )}
                        {s.phone && (
                          <div className="small text-secondary d-flex align-items-center gap-1 font-monospace">
                            <Phone size={12} className="text-secondary" />
                            <span>{s.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="text-secondary small">
                      {s.city ? `${s.city}, ${s.state}` : s.country}
                    </td>
                    {canWrite() && (
                      <td className="text-center">
                        <button
                          onClick={() => openEditModal(s)}
                          className="btn btn-sm btn-secondary-dark py-1 px-2"
                          style={{ fontSize: '0.74rem' }}
                          title="Edit Supplier"
                        >
                          <Edit2 size={13} className="me-1" />
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canWrite() ? '7' : '6'} className="text-center py-5 text-secondary">
                    No suppliers found matching criteria.
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

      {/* Create / Edit Supplier Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEdit ? `Edit Supplier: ${formData.code}` : 'Register New Vendor / Supplier'}
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
              <label className="text-secondary small fw-bold mb-1 d-block">Supplier Code</label>
              <input
                type="text"
                className="form-control-dark font-monospace text-uppercase"
                placeholder="e.g. SUP-GLOBAL"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="col-12 col-sm-8">
              <label className="text-secondary small fw-bold mb-1 d-block">Company Name</label>
              <input
                type="text"
                className="form-control-dark"
                placeholder="e.g. Global Tech Distributors LLC"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="row g-3">
            <div className="col-12 col-sm-6">
              <label className="text-secondary small fw-bold mb-1 d-block">Contact Representative</label>
              <input
                type="text"
                className="form-control-dark"
                placeholder="e.g. Alex Morgan"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
            </div>
            <div className="col-12 col-sm-6">
              <label className="text-secondary small fw-bold mb-1 d-block">Email Address</label>
              <input
                type="email"
                className="form-control-dark"
                placeholder="e.g. sales@globaltech.example"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="row g-3">
            <div className="col-12 col-sm-4">
              <label className="text-secondary small fw-bold mb-1 d-block">Phone Number</label>
              <input
                type="text"
                className="form-control-dark font-monospace"
                placeholder="e.g. +1-800-555-0199"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="col-12 col-sm-4">
              <label className="text-secondary small fw-bold mb-1 d-block">City</label>
              <input
                type="text"
                className="form-control-dark"
                placeholder="e.g. Chicago"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="col-12 col-sm-4">
              <label className="text-secondary small fw-bold mb-1 d-block">State</label>
              <input
                type="text"
                className="form-control-dark"
                placeholder="e.g. IL"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
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
              {modalLoading ? 'Saving...' : isEdit ? 'Update Supplier' : 'Register Supplier'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
