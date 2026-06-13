import React, { useEffect, useState } from 'react';
import { apiRequest, FILE_BASE_URL } from '../../utils/api';
import { Clock, MapPin, Eye } from 'lucide-react';

const AttendanceMonitor = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/attendance/all?limit=50');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error('Error fetching attendance logs:', e);
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
          Attendance Compliance Center
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review live webcam verification photos, geofenced GPS proximity checks, and work hours
        </p>
      </div>

      <div className="p-6 rounded-3xl glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3">Selfie Photo</th>
                <th className="pb-3">Employee</th>
                <th className="pb-3">Clock In</th>
                <th className="pb-3">Clock Out</th>
                <th className="pb-3">Proximity (Meters)</th>
                <th className="pb-3">GPS Coords</th>
                <th className="pb-3">Hours</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">No attendance clock-ins filed.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id}>
                    <td className="py-3.5">
                      <img
                        src={`${FILE_BASE_URL}${log.photoUrl}`}
                        alt="Selfie"
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100';
                        }}
                      />
                    </td>
                    <td className="py-3.5">
                      <p className="font-bold text-slate-850 dark:text-slate-100">{log.userId?.name || 'Staff'}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{log.userId?.employeeId || 'EMP-XXXX'}</p>
                    </td>
                    <td className="py-3.5 font-medium text-slate-700 dark:text-slate-350">
                      {new Date(log.clockInTime).toLocaleTimeString()}
                    </td>
                    <td className="py-3.5 font-medium text-slate-500">
                      {log.clockOutTime ? new Date(log.clockOutTime).toLocaleTimeString() : 'Active'}
                    </td>
                    <td className="py-3.5 font-bold text-emerald-500">
                      {log.distanceMeters}m
                    </td>
                    <td className="py-3.5 text-slate-400 font-medium">
                      {log.loc?.coordinates ? (
                        <span>{log.loc.coordinates[1].toFixed(5)}, {log.loc.coordinates[0].toFixed(5)}</span>
                      ) : (
                        <span>N/A</span>
                      )}
                    </td>
                    <td className="py-3.5 font-bold">{log.workHours ? `${log.workHours} hrs` : 'N/A'}</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        log.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
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

export default AttendanceMonitor;
