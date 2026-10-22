import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/common/StatCard';
import StockBadge from '../components/common/StockBadge';
import MovementBadge from '../components/common/MovementBadge';
import {
  DollarSign,
  Package,
  Layers,
  AlertTriangle,
  XCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Sliders,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function Dashboard() {
  const { canTransact, canWrite } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [warehouseValues, setWarehouseValues] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, trendRes, whRes, movRes] = await Promise.all([
        axiosClient.get('/dashboard/summary'),
        axiosClient.get('/analytics/movement-trends'),
        axiosClient.get('/analytics/warehouse-values'),
        axiosClient.get('/stock-movements/recent?limit=6'),
      ]);

      setSummary(sumRes.data);
      setTrends(trendRes.data || []);
      setWarehouseValues(whRes.data || []);
      setRecentMovements(movRes.data || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatNumber = (val) => {
    return new Intl.NumberFormat('en-US').format(val || 0);
  };

  // Recharts Custom Dark Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 shadow-xl" style={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.15)' }}>
          <div className="text-secondary small fw-bold mb-1">{label}</div>
          {payload.map((entry, idx) => (
            <div key={`item-${idx}`} className="small d-flex align-items-center gap-2" style={{ color: entry.color }}>
              <span className="pulse-dot" style={{ backgroundColor: entry.color }} />
              <span className="fw-medium">{entry.name}:</span>
              <span className="fw-bold text-white">{entry.value} units</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header Banner */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
        <div>
          <h2 className="fw-bold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>
            Operational Overview
          </h2>
          <p className="text-secondary small mb-0">
            Real-time multi-location inventory levels, velocity metrics, and stock thresholds
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={fetchDashboardData}
            className="btn btn-secondary-dark btn-sm"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          {canTransact() && (
            <button
              onClick={() => navigate('/movements?action=receipt')}
              className="btn btn-brand btn-sm"
            >
              <ArrowDownLeft size={16} />
              <span>Receive Stock</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xl">
          <StatCard
            title="Total Valuation"
            value={formatCurrency(summary?.totalInventoryValue)}
            subtitle="Calculated at unit purchase cost"
            icon={DollarSign}
            color="brand"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl">
          <StatCard
            title="Total In-Stock Units"
            value={formatNumber(summary?.totalUnitsInStock)}
            subtitle="Across 3 distribution centers"
            icon={Package}
            color="emerald"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl">
          <StatCard
            title="Active SKUs"
            value={formatNumber(summary?.activeProductCount)}
            subtitle="Catalog product entries"
            icon={Layers}
            color="cyan"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl">
          <StatCard
            title="Low Stock SKUs"
            value={formatNumber(summary?.lowStockProductCount)}
            subtitle="At or below reorder point"
            icon={AlertTriangle}
            color="amber"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl">
          <StatCard
            title="Depleted SKUs"
            value={formatNumber(summary?.outOfStockProductCount)}
            subtitle="Requires immediate reorder"
            icon={XCircle}
            color="rose"
          />
        </div>
      </div>

      {/* Visual Analytics Row */}
      <div className="row g-4">
        {/* Movement Trends Area Chart */}
        <div className="col-12 col-lg-8">
          <div className="glass-panel p-4 h-100 d-flex flex-column">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="fw-bold text-white mb-0">Stock Velocity & Movement Volume</h5>
                <span className="text-secondary small">Daily Inbound Receipts vs Outbound Dispatches (Past 30 Days)</span>
              </div>
              <span className="badge bg-indigo-900 text-indigo-300 border border-indigo-700 border-opacity-50 px-2 py-1 small">
                30-Day Trend
              </span>
            </div>

            <div style={{ width: '100%', height: '300px' }} className="mt-auto">
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="date"
                      stroke="#6b7280"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => val.slice(5)}
                    />
                    <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Area
                      type="monotone"
                      dataKey="inboundQty"
                      name="Inbound Receipts"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorInbound)"
                    />
                    <Area
                      type="monotone"
                      dataKey="outboundQty"
                      name="Outbound Issues"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorOutbound)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-100 d-flex align-items-center justify-content-center text-secondary small">
                  No movement trends recorded in this time range
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Warehouse Valuation Breakdown */}
        <div className="col-12 col-lg-4">
          <div className="glass-panel p-4 h-100 d-flex flex-column">
            <h5 className="fw-bold text-white mb-1">Hub Stock Distribution</h5>
            <span className="text-secondary small mb-3">Inventory value by warehouse location</span>

            <div style={{ width: '100%', height: '220px' }} className="my-auto">
              {warehouseValues.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={warehouseValues} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      type="number"
                      stroke="#6b7280"
                      fontSize={10}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      dataKey="warehouseCode"
                      type="category"
                      stroke="#9ca3af"
                      fontSize={11}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(val) => [formatCurrency(val), 'Valuation']}
                      contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.15)', borderRadius: '8px' }}
                    />
                    <Bar dataKey="totalValue" name="Valuation" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-100 d-flex align-items-center justify-content-center text-secondary small">
                  Loading warehouse stats...
                </div>
              )}
            </div>

            <div className="d-flex flex-column gap-2 mt-3 pt-3 border-top border-secondary border-opacity-10">
              {warehouseValues.map((w) => (
                <div key={w.warehouseId} className="d-flex justify-content-between align-items-center small">
                  <div className="text-secondary text-truncate me-2">
                    <span className="text-white fw-semibold">{w.warehouseCode}</span> — {w.warehouseName}
                  </div>
                  <span className="text-white fw-bold font-monospace">{formatCurrency(w.totalValue)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Bottom Row: Reorder Alerts & Recent Activity Feed */}
      <div className="row g-4">
        {/* Critical Alerts Table */}
        <div className="col-12 col-xl-7">
          <div className="glass-panel p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold text-white mb-0">Reorder & Depletion Alerts</h5>
                <span className="text-secondary small">Items requiring supplier restocking</span>
              </div>
              <button
                onClick={() => navigate('/inventory?filter=low')}
                className="btn btn-sm btn-secondary-dark"
              >
                View All
              </button>
            </div>

            <div className="table-responsive">
              <table className="table-dark-custom">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>SKU & Product</th>
                    <th>Warehouse</th>
                    <th>Current Qty</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {summary?.alerts && summary.alerts.length > 0 ? (
                    summary.alerts.slice(0, 5).map((alert, i) => (
                      <tr key={i}>
                        <td>
                          <StockBadge status={alert.type} />
                        </td>
                        <td>
                          <div className="fw-bold text-white small">{alert.productSku}</div>
                          <div className="text-secondary text-truncate" style={{ maxWidth: '200px', fontSize: '0.78rem' }}>
                            {alert.productName}
                          </div>
                        </td>
                        <td className="text-secondary small">{alert.warehouseName}</td>
                        <td>
                          <div className="fw-bold font-monospace text-white">{alert.currentQty}</div>
                          <div className="text-secondary" style={{ fontSize: '0.72rem' }}>
                            Reorder: {alert.reorderLevel}
                          </div>
                        </td>
                        <td>
                          {canTransact() && (
                            <button
                              onClick={() => navigate(`/movements?action=receipt&sku=${alert.productSku}&wh=${alert.warehouseId}`)}
                              className="btn btn-sm btn-secondary-dark py-1 px-2"
                              style={{ fontSize: '0.75rem' }}
                            >
                              Restock
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center text-secondary py-4">
                        All inventory items are currently at healthy levels!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Live Movement Ledger Feed */}
        <div className="col-12 col-xl-5">
          <div className="glass-panel p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold text-white mb-0">Recent Movement Ledger</h5>
                <span className="text-secondary small">Audit trail of completed inventory transactions</span>
              </div>
              <button
                onClick={() => navigate('/movements')}
                className="btn btn-sm btn-secondary-dark"
              >
                Full History
              </button>
            </div>

            <div className="d-flex flex-column gap-3">
              {recentMovements.length > 0 ? (
                recentMovements.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-3 d-flex align-items-center justify-content-between"
                    style={{ background: 'rgba(255, 255, 255, 0.025)', border: '1px solid rgba(255, 255, 255, 0.05)' }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <MovementBadge type={m.movementType} />
                      <div>
                        <div className="fw-bold text-white small">
                          {m.product?.sku} — <span className="text-secondary fw-normal">{m.product?.name}</span>
                        </div>
                        <div className="text-secondary" style={{ fontSize: '0.74rem' }}>
                          Ref: <span className="font-monospace text-white">{m.referenceNumber}</span> • By{' '}
                          {m.performedBy?.fullName || 'System'}
                        </div>
                      </div>
                    </div>

                    <div className="text-end">
                      <div className="fw-bold text-white font-monospace">
                        {m.movementType === 'ISSUE' ? '-' : '+'}{m.quantity}
                      </div>
                      <div className="text-secondary" style={{ fontSize: '0.7rem' }}>
                        {new Date(m.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-secondary py-4 small">
                  No recent movements recorded
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
