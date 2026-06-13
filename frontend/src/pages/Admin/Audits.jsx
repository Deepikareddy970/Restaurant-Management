import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../utils/api';
import { ShieldCheck, Calendar, Info } from 'lucide-react';

const Audits = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/employees/audit-logs');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

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
          System Auditing Vault
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Historical records of operational changes, role permissions, and access logs
        </p>
      </div>

      <div className="p-6 rounded-3xl glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Operator</th>
                <th className="pb-3">Action Perform</th>
                <th className="pb-3">Role Level</th>
                <th className="pb-3">Target / Parameters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">No system actions audited yet.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id}>
                    <td className="py-4 font-semibold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </td>
                    <td className="py-4 font-bold text-slate-800 dark:text-slate-200">
                      {log.userId?.name || 'SYSTEM / AUTO'}
                    </td>
                    <td className="py-4">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 font-medium text-slate-450 uppercase">{log.userId?.role || 'SYSTEM'}</td>
                    <td className="py-4 text-slate-500 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Audits;
