import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import StatCard from '../components/common/StatCard';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  Warehouse,
  PieChart as PieIcon,
  Calendar,
  Layers,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

export default function Analytics() {
  const [trends, setTrends] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [warehouseValues, setWarehouseValues] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [warehouseId, setWarehouseId] = useState('');
  const [days, setDays] = useState(30);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(toDate.getDate() - Number(days));

      const fromStr = fromDate.toISOString().split('T')[0];
      const toStr = toDate.toISOString().split('T')[0];

      const params = {
        from: fromStr,
        to: toStr,
        warehouseId: warehouseId || undefined,
      };

      const [trendRes, topRes, whRes, sumRes] = await Promise.all([
        axiosClient.get('/analytics/movement-trends', { params }),
        axiosClient.get('/analytics/top-products', { params: { ...params, limit: 8 } }),
        axiosClient.get('/analytics/warehouse-values'),
        axiosClient.get('/dashboard/summary'),
      ]);

      setTrends(trendRes.data || []);
      setTopProducts(topRes.data || []);
      setWarehouseValues(whRes.data || []);
      setSummary(sumRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await axiosClient.get('/warehouses');
      setWarehouses(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [warehouseId, days]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

  // Stock health pie data
  const healthData = summary
    ? [
        {
          name: 'Healthy Stock',
          value:
            (summary.activeProductCount || 0) -
            (summary.lowStockProductCount || 0) -
            (summary.outOfStockProductCount || 0),
          color: '#10b981',
        },
        { name: 'Low Stock', value: summary.lowStockProductCount || 0, color: '#f59e0b' },
        { name: 'Depleted', value: summary.outOfStockProductCount || 0, color: '#f43f5e' },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
        <div>
          <h2 className="fw-bold text-white mb-1">Inventory & Turnover Analytics</h2>
          <p className="text-secondary small mb-0">
            Advanced operational intelligence: dispatch velocity, SKU turnover ranking, and valuation distribution
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Warehouse Filter */}
          <select
            className="form-select-dark btn-sm"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="">All Warehouses</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.code}
              </option>
            ))}
          </select>

          {/* Timeframe Buttons */}
          <div className="d-flex bg-dark bg-opacity-50 rounded-2 p-0.5 border border-secondary border-opacity-15">
            {[14, 30, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`btn btn-sm py-1 px-2 border-0 rounded-2 fw-semibold ${
                  days === d ? 'btn-brand text-white' : 'text-secondary'
                }`}
                style={{ fontSize: '0.74rem' }}
              >
                {d}D
              </button>
            ))}
          </div>

          <button onClick={fetchAnalytics} className="btn btn-secondary-dark btn-sm">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Movement Velocity Area Chart */}
      <div className="glass-panel p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="fw-bold text-white mb-0">Daily Movement Velocity (Units)</h5>
            <span className="text-secondary small">Comparison of incoming purchase receipts vs outgoing order dispatches</span>
          </div>
          <span className="badge bg-indigo-900 text-indigo-300 font-monospace border border-indigo-700 border-opacity-50 px-2 py-1 small">
            Last {days} Days
          </span>
        </div>

        <div style={{ width: '100%', height: '320px' }}>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="#6b7280" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.15)', borderRadius: '8px' }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="inboundQty"
                  name="Inbound Receipts"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#inboundGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="outboundQty"
                  name="Outbound Issues"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#outboundGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-100 d-flex align-items-center justify-content-center text-secondary small">
              No trend data available for this range
            </div>
          )}
        </div>
      </div>

      {/* Two Column Grid: Top Dispatched Products & Stock Health Composition */}
      <div className="row g-4">
        {/* Top Outbound Products */}
        <div className="col-12 col-lg-7">
          <div className="glass-panel p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold text-white mb-0">Highest Velocity SKUs</h5>
                <span className="text-secondary small">Top products ranked by total outbound dispatched units</span>
              </div>
              <ArrowUpRight size={18} className="text-indigo-400" />
            </div>

            <div style={{ width: '100%', height: '280px' }}>
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis type="number" stroke="#6b7280" fontSize={11} />
                    <YAxis dataKey="sku" type="category" stroke="#9ca3af" fontSize={11} tickLine={false} />
                    <Tooltip
                      formatter={(val, name, props) => [`${val} units (${formatCurrency(props.payload.totalValue)})`, 'Dispatched']}
                      contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.15)', borderRadius: '8px' }}
                    />
                    <Bar dataKey="totalQty" name="Dispatched Units" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-100 d-flex align-items-center justify-content-center text-secondary small">
                  No outbound movements in this timeframe
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stock Health Composition */}
        <div className="col-12 col-lg-5">
          <div className="glass-panel p-4 h-100 d-flex flex-column">
            <h5 className="fw-bold text-white mb-0">Catalog Stock Health Ratio</h5>
            <span className="text-secondary small mb-3">Healthy stock vs safety threshold alerts</span>

            <div style={{ width: '100%', height: '220px' }} className="my-auto">
              {healthData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={healthData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {healthData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.15)', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-100 d-flex align-items-center justify-content-center text-secondary small">
                  Loading health data...
                </div>
              )}
            </div>

            <div className="d-flex justify-content-around pt-3 border-top border-secondary border-opacity-10 text-center">
              {healthData.map((d) => (
                <div key={d.name}>
                  <div className="d-flex align-items-center justify-content-center gap-1 mb-1">
                    <span className="pulse-dot" style={{ backgroundColor: d.color }} />
                    <span className="text-secondary small">{d.name}</span>
                  </div>
                  <div className="fw-bold text-white font-monospace fs-6">{d.value} SKUs</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
