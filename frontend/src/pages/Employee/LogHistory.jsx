import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import { Clock, Navigation, MapPin } from 'lucide-react';

const LogHistory = () => {
  const { addToast } = useSocket();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/attendance/history');
      const data = await res.json();
      if (data.success) {
        setHistory(data.logs || []);
      } else {
        addToast(data.message || 'Failed to fetch logs.', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Error loading log history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
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
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">
          Attendance Log History
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review your historically clocked shifts, timestamps, and locations
        </p>
      </div>

      {/* History Grid Panel */}
      <div className="p-6 rounded-3xl glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 px-2">Date</th>
                <th className="pb-3 px-2">Clock In Time</th>
                <th className="pb-3 px-2">Clock Out Time</th>
                <th className="pb-3 px-2">GPS Location (Lat, Lng)</th>
                <th className="pb-3 px-2">Shift Hours</th>
                <th className="pb-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/85">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-450 font-semibold">
                    No logged shifts found.
                  </td>
                </tr>
              ) : (
                history.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                    {/* Date */}
                    <td className="py-4 px-2 font-bold text-slate-700 dark:text-slate-300">
                      {new Date(log.clockInTime).toLocaleDateString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Clock In */}
                    <td className="py-4 px-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                      {new Date(log.clockInTime).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    {/* Clock Out */}
                    <td className="py-4 px-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                      {log.clockOutTime ? (
                        new Date(log.clockOutTime).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      ) : (
                        <span className="text-amber-500 font-bold italic">Active Session</span>
                      )}
                    </td>

                    {/* GPS Coordinates */}
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="font-semibold text-[11px] truncate max-w-[150px]">
                          {log.latitude?.toFixed(5) || '0.00000'}, {log.longitude?.toFixed(5) || '0.00000'}
                        </span>
                      </div>
                    </td>

                    {/* Shift Hours */}
                    <td className="py-4 px-2 font-extrabold text-slate-700 dark:text-slate-205">
                      {log.workHours !== undefined ? `${log.workHours.toFixed(2)} hrs` : '—'}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          log.status === 'LATE' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-350'
                        }`}>
                        {log.status}
                      </span>
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

export default LogHistory;
