import React, { useEffect, useState } from 'react';
import { apiRequest, FILE_BASE_URL } from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import { 
  ShoppingBag, 
  DollarSign, 
  Users, 
  Clock, 
  CheckCircle, 
  UserPlus, 
  MapPin, 
  FileDown, 
  Check 
} from 'lucide-react';

const ManagerDashboard = () => {
  const { addToast } = useSocket();
  const [orders, setOrders] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState({ dailyRevenue: 0, dailyOrders: 0, activeEmployees: 0 });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningOrderId, setAssigningOrderId] = useState(null);
  const [selectedEmpId, setSelectedEmpId] = useState('');

  const fetchManagerData = async () => {
    try {
      setLoading(true);
      const [ordersRes, attendanceRes, summaryRes, employeesRes] = await Promise.all([
        apiRequest('/orders?limit=25'),
        apiRequest('/attendance/all?limit=10'),
        apiRequest('/analytics/summary'),
        apiRequest('/employees')
      ]);

      const oData = await ordersRes.json();
      const aData = await attendanceRes.json();
      const sData = await summaryRes.json();
      const eData = await employeesRes.json();

      if (oData.success) setOrders(oData.orders);
      if (aData.success) setAttendance(aData.logs);
      if (sData.success) setSummary(sData.summary);
      if (eData.success) setEmployees(eData.employees);
    } catch (err) {
      console.error('Error fetching manager data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagerData();

    // Listen to real-time events via global SocketContext or window event listener
    const handleOrderUpdate = () => {
      fetchManagerData();
    };

    window.addEventListener('newOrderAlert', handleOrderUpdate);
    window.addEventListener('attendanceAlert', handleOrderUpdate);

    return () => {
      window.removeEventListener('newOrderAlert', handleOrderUpdate);
      window.removeEventListener('attendanceAlert', handleOrderUpdate);
    };
  }, []);

  const handleUpdateStatus = async (orderId, status) => {
    try {
      const res = await apiRequest(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Order updated to ${status}.`, 'success');
        fetchManagerData();
      }
    } catch (err) {
      addToast('Failed to update order status.', 'error');
    }
  };

  const handleAssignSubmit = async (orderId) => {
    if (!selectedEmpId) return;
    try {
      const res = await apiRequest(`/orders/${orderId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ employeeId: selectedEmpId }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('Employee assigned to order successfully.', 'success');
        setAssigningOrderId(null);
        setSelectedEmpId('');
        fetchManagerData();
      }
    } catch (err) {
      addToast('Failed to assign employee.', 'error');
    }
  };

  const downloadReport = async (format) => {
    try {
      const response = await apiRequest(`/analytics/reports/${format}`, { method: 'GET' });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Manager_Report_${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      addToast(`Manager ${format.toUpperCase()} report downloaded.`, 'success');
    } catch (e) {
      addToast('Download failed.', 'error');
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">
            Manager Control Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track daily restaurant operations, assign staff, and audit shift clock-ins
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => downloadReport('pdf')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <FileDown className="w-4 h-4" />
            <span>PDF Report</span>
          </button>
          <button
            onClick={() => downloadReport('excel')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/10"
          >
            <FileDown className="w-4 h-4" />
            <span>Excel Logs</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-panel flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Revenue</p>
            <h3 className="text-2xl font-black text-slate-850 dark:text-slate-100 mt-1">
              ${summary.dailyRevenue.toFixed(2)}
            </h3>
          </div>
        </div>

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

      {/* Orders and Attendance Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Active Orders dispatch list */}
        <div className="xl:col-span-2 p-6 rounded-3xl glass-panel">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
            Active Orders Queue
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[500px] overflow-y-auto pr-1">
            {orders.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No active orders placed.</div>
            ) : (
              orders.map((order) => (
                <div key={order._id} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{order.orderNumber}</span>
                      <span className="text-xs text-slate-400 ml-2 font-medium">({order.customerName})</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      order.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                      order.status === 'PREPARING' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                      order.status === 'READY' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {order.items.map((i, idx) => (
                      <span key={idx} className="mr-3 font-semibold">
                        {i.name} x{i.quantity}
                      </span>
                    ))}
                  </div>

                  {/* Action row (Employee Details, assignment & updates) */}
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div>
                      {order.assignedEmployee?.name ? (
                        <div className="text-slate-450 leading-none">
                          <p className="font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1">
                            <span>Handler:</span> 
                            <span>{order.assignedEmployee.name} ({order.assignedEmployee.employeeId})</span>
                          </p>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            Assigned: {new Date(order.assignedEmployee.assignedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-amber-500 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Unassigned</span>
                        </p>
                      )}
                    </div>

                    <div className="flex gap-1">
                      {/* Assign button */}
                      {!order.assignedEmployee?.name && (
                        <div>
                          {assigningOrderId === order._id ? (
                            <div className="flex gap-1 items-center">
                              <select
                                className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                                value={selectedEmpId}
                                onChange={(e) => setSelectedEmpId(e.target.value)}
                              >
                                <option value="">Select Staff</option>
                                {employees.map((emp) => (
                                  <option key={emp._id} value={emp.employeeId}>
                                    {emp.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleAssignSubmit(order._id)}
                                className="p-1.5 rounded-lg bg-emerald-600 text-white"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAssigningOrderId(order._id)}
                              className="px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Assign Staff</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Status quick adjust dropdown */}
                      <select
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-700 dark:text-slate-350 focus:outline-none"
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PREPARING">Preparing</option>
                        <option value="READY">Ready</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Attendance monitor */}
        <div className="p-6 rounded-3xl glass-panel">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
            Today's Attendance
          </h3>

          <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-1">
            {attendance.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No shift check-ins recorded today.</div>
            ) : (
              attendance.map((log) => (
                <div key={log._id} className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-3 relative overflow-hidden">
                  {/* Selfie Preview Image */}
                  <img
                    src={`${FILE_BASE_URL}${log.photoUrl}`}
                    alt="selfie checkin"
                    className="w-11 h-11 rounded-xl object-cover bg-slate-100 border border-slate-200"
                    onError={(e) => {
                      // Fallback if image path seed / missing
                      e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120';
                    }}
                  />

                  {/* Clock Details */}
                  <div className="flex-1 min-w-0 text-xs">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">{log.userId?.name}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">{log.userId?.employeeId || 'Staff'}</p>
                    
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-450 mt-1 font-semibold flex-wrap">
                      <span className="flex items-center gap-0.5 text-indigo-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(log.clockInTime).toLocaleTimeString()}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-emerald-500">
                        <MapPin className="w-3 h-3" />
                        <span>{log.distanceMeters}m away</span>
                      </span>
                    </div>
                  </div>

                  {/* Status Banner */}
                  <div className="flex flex-col items-end justify-between">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      log.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      log.status === 'LATE' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                      'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
