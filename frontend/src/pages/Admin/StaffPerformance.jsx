import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../utils/api';
import { Users, Award, ShieldAlert, CheckSquare } from 'lucide-react';

const StaffPerformance = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/employees');
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees);
      }
    } catch (e) {
      console.error('Error fetching staff metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
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
          Staff Performance Ledger
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Monitor shift attendances, efficiency markers, and late clock-in counts
        </p>
      </div>

      <div className="p-6 rounded-3xl glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3">Employee ID</th>
                <th className="pb-3">Name</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Orders Handled</th>
                <th className="pb-3">Late Incidents</th>
                <th className="pb-3">Work Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No staff members registered.</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id}>
                    <td className="py-4 font-extrabold text-indigo-600 dark:text-indigo-400">
                      {emp.employeeId}
                    </td>
                    <td className="py-4 font-bold text-slate-800 dark:text-slate-200">
                      {emp.name}
                    </td>
                    <td className="py-4 text-slate-500">{emp.email}</td>
                    <td className="py-4 font-bold flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-emerald-500" />
                      <span>{emp.performance?.totalOrdersHandled || 0} orders</span>
                    </td>
                    <td className="py-4">
                      {emp.performance?.lateClockIns > 0 ? (
                        <span className="inline-flex items-center gap-1 text-rose-500 font-bold">
                          <ShieldAlert className="w-4 h-4" />
                          <span>{emp.performance.lateClockIns} late</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold">0 late</span>
                      )}
                    </td>
                    <td className="py-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-350 text-[10px] font-bold">
                        ACTIVE
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

export default StaffPerformance;
