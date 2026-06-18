import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../utils/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  IndianRupee,
  ShoppingBag,
  Users,
  Clock,
  FileDown,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

const AdminDashboard = () => {
  const { addToast } = useSocket();
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState({ pdf: false, excel: false });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryRes, chartsRes] = await Promise.all([
        apiRequest('/analytics/summary'),
        apiRequest('/analytics/charts')
      ]);

      const summaryData = await summaryRes.json();
      const chartsData = await chartsRes.json();

      if (summaryData.success && chartsData.success) {
        setSummary(summaryData.summary);
        setCharts(chartsData.charts);
      } else {
        setError('Failed to fetch analytics statistics.');
      }
    } catch (err) {
      setError('Connection failed. Could not load dashboard analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDownload = async (format) => {
    try {
      setDownloading((prev) => ({ ...prev, [format]: true }));
      const response = await apiRequest(`/analytics/reports/${format}`, {
        method: 'GET',
      });
      if (!response.ok) throw new Error('Network error');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Guramrit_Report_${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`);

      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      addToast(`${format.toUpperCase()} report downloaded successfully.`, 'success');
    } catch (err) {
      addToast(`Failed to generate ${format.toUpperCase()} report.`, 'error');
    } finally {
      setDownloading((prev) => ({ ...prev, [format]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-3">
        <AlertCircle className="w-5 h-5" />
        <span className="font-semibold text-sm">{error}</span>
      </div>
    );
  }

  // Prepping charts formats
  const topSellingItems = charts?.topSellingItems || [];
  const peakHours = charts?.peakHours || [];
  const customerStats = charts?.customerStats || {};

  return (
    <div className="space-y-6">
      {/* Dashboard Top Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Guramrit Admin Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics, revenue distribution, and workforce metrics
          </p>
        </div>

        {/* Download Reports Options */}
        <div className="flex gap-2">
          <button
            onClick={() => handleDownload('pdf')}
            disabled={downloading.pdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition duration-200 text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <FileDown className="w-4 h-4" />
            <span>{downloading.pdf ? 'Compiling PDF...' : 'Download PDF'}</span>
          </button>
          <button
            onClick={() => handleDownload('excel')}
            disabled={downloading.excel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition duration-200 shadow-md shadow-indigo-600/15"
          >
            <FileDown className="w-4 h-4" />
            <span>{downloading.excel ? 'Compiling Excel...' : 'Export Excel'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Daily Revenue */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden glow-indigo">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Revenue</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-4">
            ₹{summary?.dailyRevenue?.toFixed(2)}
          </h2>
          <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Active Operations</span>
          </div>
        </div>

        {/* Card 2: Daily Orders */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden glow-emerald">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Orders</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-4">
            {summary?.dailyOrders}
          </h2>
          <p className="text-[10px] text-slate-400 font-semibold mt-2">
            Total historical orders: {summary?.totalOrders}
          </p>
        </div>

        {/* Card 3: Weekly Revenue */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Weekly Revenue</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-4">
            ₹{summary?.weeklyRevenue?.toFixed(2)}
          </h2>
          <p className="text-[10px] text-slate-400 font-semibold mt-2">
            Weekly orders volume: {summary?.weeklyOrders}
          </p>
        </div>

        {/* Card 4: Active Employees */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Staff</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-4">
            {summary?.activeEmployees}
          </h2>
          <p className="text-[10px] text-slate-400 font-semibold mt-2">
            Staff compliance calculated in attendance logs
          </p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Top Selling Items */}
        <div className="p-6 rounded-3xl glass-panel">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-150 uppercase tracking-wider mb-6">
            Top Selling Dishes (Quantity)
          </h3>
          <div className="h-80 w-full">
            {topSellingItems.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No order history available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSellingItems} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    labelClassName="font-bold text-xs"
                    itemStyle={{ fontSize: '11px', color: '#4f46e5' }}
                  />
                  <Bar dataKey="quantity" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Peak Order Hours */}
        <div className="p-6 rounded-3xl glass-panel">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-150 uppercase tracking-wider mb-6">
            Peak Order Hours (Distribution)
          </h3>
          <div className="h-80 w-full">
            {peakHours.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No order logs today</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={peakHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                  <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Customer Insights and Actions */}
      <div className="p-6 rounded-3xl glass-panel grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-150 uppercase tracking-wider mb-4">
            Customer Demographics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-semibold">Registered Accounts</span>
              <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{customerStats?.totalRegisteredCustomers || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-semibold">Average Orders per Customer</span>
              <span className="text-sm font-extrabold text-emerald-500">{customerStats?.averageOrdersPerCustomer || 0} orders</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-150 uppercase tracking-wider mb-4">
            Operations Status
          </h3>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
            <Clock className="w-5 h-5 text-indigo-500 mt-0.5" />
            <div className="text-xs leading-relaxed text-slate-550 dark:text-slate-400">
              <p className="font-bold text-slate-800 dark:text-slate-200">Real-time Sockets Active</p>
              <p className="mt-1">Order flows, delivery state tracking, and employee clock-in alerts are broadcasting live over Socket.IO.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
