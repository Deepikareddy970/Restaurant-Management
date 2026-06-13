import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import { FileDown, Calendar, AlertCircle } from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar 
} from 'recharts';

const Reports = () => {
  const { addToast } = useSocket();
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState({ pdf: false, excel: false });

  const fetchCharts = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/analytics/charts');
      const data = await res.json();
      if (data.success) {
        setCharts(data.charts);
      } else {
        setError('Could not load detailed reporting graphs.');
      }
    } catch (e) {
      setError('Connection failed. Could not load report figures.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharts();
  }, []);

  const handleDownload = async (format) => {
    try {
      setDownloading((prev) => ({ ...prev, [format]: true }));
      const response = await apiRequest(`/analytics/reports/${format}`, { method: 'GET' });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Operations_Report_${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      addToast(`Report downloaded successfully in ${format.toUpperCase()} format.`, 'success');
    } catch (err) {
      addToast('Failed to generate requested report.', 'error');
    } finally {
      setDownloading((prev) => ({ ...prev, [format]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">
          Analytics & Reporting Studio
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Export full database spreadsheets or compile detailed PDF logs
        </p>
      </div>

      {/* Reports Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Download card */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden flex flex-col justify-between h-56">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
              Corporate PDF Report
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generates a professionally structured PDF document including revenue metrics, top-selling items distribution, order counts, and formatted invoices.
            </p>
          </div>
          <button
            onClick={() => handleDownload('pdf')}
            disabled={downloading.pdf}
            className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700/80 transition duration-150 flex items-center justify-center gap-1.5"
          >
            <FileDown className="w-4 h-4" />
            <span>{downloading.pdf ? 'Compiling PDF File...' : 'Download PDF Report'}</span>
          </button>
        </div>

        {/* Excel Download card */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden flex flex-col justify-between h-56">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
              Operations Excel Ledger
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generates a complete multi-sheet Excel spreadsheet comprising full audit trails, staff attendance history logs, shift durations, and comprehensive order history registries.
            </p>
          </div>
          <button
            onClick={() => handleDownload('excel')}
            disabled={downloading.excel}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/10 transition duration-150 flex items-center justify-center gap-1.5 animate-pulse-soft"
          >
            <FileDown className="w-4 h-4" />
            <span>{downloading.excel ? 'Generating Spreadsheet...' : 'Export Excel Data'}</span>
          </button>
        </div>
      </div>

      {/* Analytics Chart Block */}
      <div className="p-6 rounded-3xl glass-panel">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-6">
          Revenue Distribution Over Time
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={charts?.peakHours || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
              <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              />
              <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;
