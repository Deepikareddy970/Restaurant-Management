import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../utils/api';
import { ShoppingBag, Users } from 'lucide-react';

const ManagerDashboard = () => {
  const [summary, setSummary] = useState({ dailyOrders: 0, activeEmployees: 0 });
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const summaryRes = await apiRequest('/analytics/summary');
      const sData = await summaryRes.json();
      if (sData.success) setSummary(sData.summary);
    } catch (err) {
      console.error('Error fetching manager summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">
          Manager Dashboard
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Today's operational snapshot
        </p>
      </div>

      {/* Metrics Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl glass-panel flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Orders</p>
            <h3 className="text-2xl font-black text-slate-850 dark:text-slate-100 mt-1">
              {summary.dailyOrders}
            </h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Staff Clocked In</p>
            <h3 className="text-2xl font-black text-slate-850 dark:text-slate-100 mt-1">
              {summary.activeEmployees}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
