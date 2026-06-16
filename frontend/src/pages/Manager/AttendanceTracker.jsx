import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../utils/api';
import { MapPin, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const STATUS_STYLES = {
  PRESENT: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  ABSENT: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  LATE: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  ON_LEAVE: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const STATUS_ICONS = {
  PRESENT: <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />,
  ABSENT: <XCircle className="w-3.5 h-3.5 text-red-500" />,
  LATE: <AlertCircle className="w-3.5 h-3.5 text-amber-500" />,
  ON_LEAVE: <AlertCircle className="w-3.5 h-3.5 text-slate-400" />,
};

const formatTime = (ts) => {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (ts) => {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDistance = (meters) => {
  if (meters == null) return '—';
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${Math.round(meters)} m`;
};

const AttendanceTracker = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest('/attendance/all');
      const data = await res.json();

      if (data.success) {
        // Backend getAllLogs returns { success, logs }
        const raw = data.logs || data.attendance || data.records || [];

        // Deduplicate: keep only the latest record per userId per calendar day
        const seen = new Map();
        raw.forEach((rec) => {
          const empId = rec.userId?._id || rec.userId || rec._id;
          const clockInTs = rec.clockInTime || rec.clockIn || rec.createdAt;
          const day = rec.date
            ? new Date(rec.date).toDateString()
            : new Date(clockInTs).toDateString();
          const key = `${empId}::${day}`;

          if (!seen.has(key)) {
            seen.set(key, rec);
          } else {
            const existing = seen.get(key);
            const existingIn = new Date(existing.clockInTime || existing.clockIn || 0).getTime();
            const newIn = new Date(rec.clockInTime || rec.clockIn || 0).getTime();
            const recHasClockOut = !!(rec.clockOutTime || rec.clockOut);
            const existingHasClockOut = !!(existing.clockOutTime || existing.clockOut);

            if (recHasClockOut && !existingHasClockOut) {
              seen.set(key, rec);
            } else if (!existingHasClockOut && !recHasClockOut && newIn > existingIn) {
              seen.set(key, rec);
            }
          }
        });

        setRecords([...seen.values()]);
      } else {
        setError('Failed to load attendance records.');
      }
    } catch (err) {
      setError('Something went wrong while loading attendance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
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
          Attendance Tracker
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Today's clock-in and clock-out records for all staff
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-3xl glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Employee Name
                </th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Date
                </th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Clock In
                </th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Clock Out
                </th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Distance from Restaurant
                </th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    No attendance records found for today.
                  </td>
                </tr>
              ) : (
                records.map((rec) => {
                  // Backend populates userId with { name, email, employeeId, role }
                  const name =
                    rec.userId?.name ||
                    rec.employeeId?.name ||
                    rec.employeeName ||
                    rec.name ||
                    '—';

                  // Backend uses clockInTime / clockOutTime
                  const clockIn = rec.clockInTime || rec.clockIn;
                  const clockOut = rec.clockOutTime || rec.clockOut;

                  // Backend uses distanceMeters
                  const distance = rec.distanceMeters ?? rec.distanceFromRestaurant ?? rec.distance;

                  const status = rec.status?.toUpperCase() || 'PRESENT';
                  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.PRESENT;
                  const statusIcon = STATUS_ICONS[status] || STATUS_ICONS.PRESENT;

                  return (
                    <tr
                      key={rec._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Employee Name */}
                      <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                        {name}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
                        {formatDate(clockIn)}
                      </td>

                      {/* Clock In */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="font-medium">{formatTime(clockIn)}</span>
                        </div>
                      </td>

                      {/* Clock Out */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                          <span className={`font-medium ${!clockOut ? 'text-slate-400 italic' : ''}`}>
                            {formatTime(clockOut)}
                          </span>
                        </div>
                      </td>

                      {/* Distance */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="font-medium">
                            {formatDistance(distance)}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${statusStyle}`}
                        >
                          {statusIcon}
                          {status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTracker;
