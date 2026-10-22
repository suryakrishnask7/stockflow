import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import StockBadge from '../components/common/StockBadge';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import { Plus, Search, Package, Edit2, Eye, CheckCircle, Warehouse, RefreshCw } from 'lucide-react';

export default function Products() {
  const { canWrite } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');

  // Create / Edit Modal State
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    categoryId: '',
    primarySupplierId: '',
    unitCost: '',
    sellingPrice: '',
    reorderLevel: '10',
    reorderQuantity: '50',
    unitOfMeasure: 'Each',
    barcode: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Warehouse Breakdown Modal State
  const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productInventory, setProductInventory] = useState([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await axiosClient.get('/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axiosClient.get('/suppliers/active');
      setSuppliers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async (pageIndex = 0) => {
    setLoading(true);
    try {
      const params = {
        page: pageIndex,
        size: 15,
        search: search.trim() || undefined,
        categoryId: categoryId || undefined,
        status: status || undefined,
      };

      const res = await axiosClient.get('/products', { params });
      setProducts(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
      setPage(res.data.page || 0);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    fetchProducts(page);
  }, [categoryId, status, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchProducts(0);
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setEditProductId(null);
    setFormData({
      sku: '',
      name: '',
      description: '',
      categoryId: categories[0]?.id || '',
      primarySupplierId: suppliers[0]?.id || '',
      unitCost: '',
      sellingPrice: '',
      reorderLevel: '10',
      reorderQuantity: '50',
      unitOfMeasure: 'Each',
      barcode: '',
    });
    setFormError('');
    setFormModalOpen(true);
  };

  const openEditModal = (p) => {
    setIsEditMode(true);
    setEditProductId(p.id);
    setFormData({
      sku: p.sku,
      name: p.name,
      description: p.description || '',
      categoryId: p.category?.id || '',
      primarySupplierId: p.primarySupplier?.id || '',
      unitCost: p.unitCost,
      sellingPrice: p.sellingPrice || '',
      reorderLevel: p.reorderLevel,
      reorderQuantity: p.reorderQuantity,
      unitOfMeasure: p.unitOfMeasure,
      barcode: p.barcode || '',
    });
    setFormError('');
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const payload = {
        ...formData,
        categoryId: Number(formData.categoryId),
        primarySupplierId: formData.primarySupplierId ? Number(formData.primarySupplierId) : null,
        unitCost: Number(formData.unitCost),
        sellingPrice: formData.sellingPrice ? Number(formData.sellingPrice) : null,
        reorderLevel: Number(formData.reorderLevel),
        reorderQuantity: Number(formData.reorderQuantity),
      };

      if (isEditMode) {
        await axiosClient.put(`/products/${editProductId}`, payload);
      } else {
        await axiosClient.post('/products', payload);
      }

      setFormModalOpen(false);
      fetchProducts(page);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save product details');
    } finally {
      setFormLoading(false);
    }
  };

  const openBreakdown = async (product) => {
    setSelectedProduct(product);
    setBreakdownModalOpen(true);
    setBreakdownLoading(true);

    try {
      const res = await axiosClient.get(`/products/${product.id}/inventory`);
      setProductInventory(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setBreakdownLoading(false);
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
          <h2 className="fw-bold text-white mb-1">Product Catalog</h2>
          <p className="text-secondary small mb-0">
            Enterprise SKU master directory with margins, category taxonomy, and reorder levels
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button onClick={() => fetchProducts(page)} className="btn btn-secondary-dark btn-sm">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          {canWrite() && (
            <button onClick={openCreateModal} className="btn btn-brand btn-sm">
              <Plus size={16} />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <form onSubmit={handleSearchSubmit} className="position-relative">
              <input
                type="text"
                className="form-control-dark ps-5"
                placeholder="Search by SKU, title or specification..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search size={16} className="text-secondary position-absolute top-50 start-0 translate-middle-y ms-3" />
            </form>
          </div>

          <div className="col-12 col-sm-6 col-md-3">
            <select
              className="form-select-dark"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-sm-6 col-md-4">
            <select
              className="form-select-dark"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Catalog Items</option>
              <option value="INACTIVE">Inactive / Hidden</option>
              <option value="DISCONTINUED">Discontinued</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-panel overflow-hidden">
        <div className="table-responsive">
          <table className="table-dark-custom">
            <thead>
              <tr>
                <th>Status</th>
                <th>SKU</th>
                <th>Product Name & Specification</th>
                <th>Category</th>
                <th>Supplier</th>
                <th className="text-end">Cost Price</th>
                <th className="text-end">Selling Price</th>
                <th className="text-end">Total On-Hand</th>
                <th className="text-center">Breakdown</th>
                {canWrite() && <th className="text-center">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canWrite() ? '10' : '9'} className="text-center py-5 text-secondary">
                    <div className="spinner-border spinner-border-sm text-indigo-400 me-2" role="status" />
                    Loading products...
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => {
                  const margin =
                    p.sellingPrice && p.unitCost
                      ? Math.round(((p.sellingPrice - p.unitCost) / p.sellingPrice) * 100)
                      : null;

                  return (
                    <tr key={p.id}>
                      <td>
                        <StockBadge
                          status={p.status === 'ACTIVE' ? (p.totalQuantity === 0 ? 'OUT_OF_STOCK' : p.totalQuantity <= p.reorderLevel ? 'LOW_STOCK' : 'IN_STOCK') : 'INACTIVE'}
                          quantity={p.totalQuantity}
                          reorderLevel={p.reorderLevel}
                        />
                      </td>
                      <td>
                        <span className="fw-bold font-monospace text-white">{p.sku}</span>
                      </td>
                      <td>
                        <div className="fw-semibold text-white small">{p.name}</div>
                        <div className="text-secondary text-truncate" style={{ maxWidth: '240px', fontSize: '0.74rem' }}>
                          {p.description || 'No detailed specifications'}
                        </div>
                      </td>
                      <td className="text-secondary small">{p.category?.name || '—'}</td>
                      <td className="text-secondary small">{p.primarySupplier?.name || '—'}</td>
                      <td className="text-end text-white font-monospace small">
                        {formatCurrency(p.unitCost)}
                      </td>
                      <td className="text-end text-white font-monospace small">
                        {p.sellingPrice ? (
                          <div>
                            <div>{formatCurrency(p.sellingPrice)}</div>
                            {margin !== null && (
                              <span className="badge bg-emerald-900 text-emerald-300 font-sans" style={{ fontSize: '0.66rem' }}>
                                {margin}% margin
                              </span>
                            )}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="text-end">
                        <span className={`fw-bold font-monospace fs-6 ${p.totalQuantity === 0 ? 'text-danger' : p.totalQuantity <= p.reorderLevel ? 'text-warning' : 'text-success'}`}>
                          {p.totalQuantity}
                        </span>
                        <div className="text-secondary" style={{ fontSize: '0.68rem' }}>
                          Min: {p.reorderLevel}
                        </div>
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => openBreakdown(p)}
                          className="btn btn-sm btn-secondary-dark py-1 px-2"
                          style={{ fontSize: '0.74rem' }}
                          title="View Warehouse Breakdown"
                        >
                          <Warehouse size={13} className="me-1" />
                          Hubs
                        </button>
                      </td>
                      {canWrite() && (
                        <td className="text-center">
                          <button
                            onClick={() => openEditModal(p)}
                            className="btn btn-sm btn-secondary-dark py-1 px-2"
                            style={{ fontSize: '0.74rem' }}
                            title="Edit Product"
                          >
                            <Edit2 size={13} className="me-1" />
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={canWrite() ? '10' : '9'} className="text-center py-5 text-secondary">
                    No products found matching the criteria.
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

      {/* Warehouse Stock Breakdown Modal */}
      <Modal
        isOpen={breakdownModalOpen}
        onClose={() => setBreakdownModalOpen(false)}
        title={`Warehouse Distribution — ${selectedProduct?.sku}`}
        size="md"
      >
        <div className="d-flex flex-column gap-3">
          <div className="p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <h6 className="text-white fw-bold mb-1">{selectedProduct?.name}</h6>
            <div className="text-secondary small">Reorder Threshold: {selectedProduct?.reorderLevel} units | Standard Batch: {selectedProduct?.reorderQuantity} units</div>
          </div>

          <div className="table-responsive">
            <table className="table-dark-custom">
              <thead>
                <tr>
                  <th>Facility</th>
                  <th>Status</th>
                  <th className="text-end">On Hand</th>
                  <th className="text-end">Valuation</th>
                </tr>
              </thead>
              <tbody>
                {breakdownLoading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-secondary">
                      Loading inventory levels...
                    </td>
                  </tr>
                ) : productInventory.length > 0 ? (
                  productInventory.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="fw-bold text-white small">{item.warehouseName}</div>
                        <div className="text-secondary small font-monospace">{item.warehouseCode}</div>
                      </td>
                      <td>
                        <StockBadge status={item.status} quantity={item.quantity} reorderLevel={selectedProduct?.reorderLevel} />
                      </td>
                      <td className="text-end font-monospace fw-bold text-white">
                        {item.quantity}
                      </td>
                      <td className="text-end font-monospace text-secondary">
                        {formatCurrency(item.totalValue)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-3 text-secondary small">
                      No stock records found for this product.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Create / Edit Product Modal */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={isEditMode ? `Edit Product: ${formData.sku}` : 'Add New Catalog Product'}
        size="lg"
      >
        {formError && (
          <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3" style={{ backgroundColor: 'rgba(244, 63, 94, 0.15)', borderColor: 'rgba(244, 63, 94, 0.3)', color: '#fb7185' }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="d-flex flex-column gap-3">
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <label className="text-secondary small fw-bold mb-1 d-block">SKU (Unique)</label>
              <input
                type="text"
                className="form-control-dark font-monospace text-uppercase"
                placeholder="e.g. ELEC-009"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="col-12 col-md-8">
              <label className="text-secondary small fw-bold mb-1 d-block">Product Title</label>
              <input
                type="text"
                className="form-control-dark"
                placeholder="e.g. 34-Inch Curved Ultrawide Monitor"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-secondary small fw-bold mb-1 d-block">Description & Specifications</label>
            <textarea
              className="form-control-dark"
              rows="2"
              placeholder="Full item specification, technical attributes, compatibility..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="text-secondary small fw-bold mb-1 d-block">Category</label>
              <select
                className="form-select-dark"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                required
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="text-secondary small fw-bold mb-1 d-block">Primary Supplier</label>
              <select
                className="form-select-dark"
                value={formData.primarySupplierId}
                onChange={(e) => setFormData({ ...formData, primarySupplierId: e.target.value })}
              >
                <option value="">Select Supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-3">
              <label className="text-secondary small fw-bold mb-1 d-block">Unit Cost ($)</label>
              <input
                type="number"
                step="0.01"
                className="form-control-dark font-monospace"
                placeholder="0.00"
                value={formData.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                required
              />
            </div>
            <div className="col-12 col-md-3">
              <label className="text-secondary small fw-bold mb-1 d-block">Selling Price ($)</label>
              <input
                type="number"
                step="0.01"
                className="form-control-dark font-monospace"
                placeholder="0.00"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
              />
            </div>
            <div className="col-12 col-md-3">
              <label className="text-secondary small fw-bold mb-1 d-block">Reorder Point</label>
              <input
                type="number"
                className="form-control-dark font-monospace"
                placeholder="10"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                required
              />
            </div>
            <div className="col-12 col-md-3">
              <label className="text-secondary small fw-bold mb-1 d-block">Reorder Quantity</label>
              <input
                type="number"
                className="form-control-dark font-monospace"
                placeholder="50"
                value={formData.reorderQuantity}
                onChange={(e) => setFormData({ ...formData, reorderQuantity: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top border-secondary border-opacity-10">
            <button
              type="button"
              onClick={() => setFormModalOpen(false)}
              className="btn btn-secondary-dark"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="btn btn-brand"
            >
              {formLoading ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
