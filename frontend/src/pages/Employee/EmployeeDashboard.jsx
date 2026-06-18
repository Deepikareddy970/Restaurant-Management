import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';
import {
  Clock,
  ClipboardList,
  CheckCircle,
  UserCheck,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Camera
} from 'lucide-react';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const { socket, addToast } = useSocket();
  const [history, setHistory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [historyRes, ordersRes] = await Promise.all([
        apiRequest('/attendance/history'),
        apiRequest('/orders')
      ]);

      const hData = await historyRes.json();
      const oData = await ordersRes.json();

      if (hData.success) {
        setHistory(hData.logs || []);
      }
      if (oData.success) {
        setOrders(oData.orders || []);
      }
    } catch (e) {
      console.error('Error fetching employee dashboard stats:', e);
      addToast('Error loading performance data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update stats automatically via Socket updates
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchData();
    };

    socket.on('orderUpdate', handleUpdate);
    socket.on('newOrderAlert', handleUpdate);

    return () => {
      socket.off('orderUpdate', handleUpdate);
      socket.off('newOrderAlert', handleUpdate);
    };
  }, [socket]);

  // Compute Statistics automatically
  const todayString = new Date().toDateString();

  const todayLog = history.find(
    (log) => new Date(log.clockInTime).toDateString() === todayString
  );

  const todayAttendanceStatus = todayLog ? todayLog.status : 'NOT CHECKED IN';

  const lastCheckInTime = history.length > 0
    ? new Date(history[0].clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'N/A';

  const ordersAcceptedToday = orders.filter((o) =>
    o.assignedEmployee?.id === user?.id &&
    o.assignedEmployee?.assignedAt &&
    new Date(o.assignedEmployee.assignedAt).toDateString() === todayString
  ).length;

  const ordersCompletedToday = orders.filter((o) =>
    o.assignedEmployee?.id === user?.id &&
    ['DELIVERED', 'COMPLETED'].includes(o.status) &&
    o.history?.some((h) =>
      ['DELIVERED', 'COMPLETED'].includes(h.status) &&
      h.timestamp &&
      new Date(h.timestamp).toDateString() === todayString
    )
  ).length;

  const totalOrdersCompleted = orders.filter((o) =>
    o.assignedEmployee?.id === user?.id &&
    ['DELIVERED', 'COMPLETED'].includes(o.status)
  ).length;

  if (loading && history.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">
            Welcome Back, {user?.name}!
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Role: Employee | Employee ID: {user?.employeeId}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-900/35 rounded-2xl text-xs font-bold text-indigo-600 dark:text-indigo-400">
          <Calendar className="w-4 h-4" />
          <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Attendance */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">
              Today's Presence
            </span>
            <h3 className={`text-lg font-black mt-2 ${todayAttendanceStatus === 'PRESENT' ? 'text-emerald-600 dark:text-emerald-400' :
              todayAttendanceStatus === 'LATE' ? 'text-amber-600 dark:text-amber-400' :
                'text-rose-600 dark:text-rose-450'
              }`}>
              {todayAttendanceStatus}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mt-6">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Today's Orders Accepted */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">
              Today's Accepted
            </span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">
              {ordersAcceptedToday}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mt-6">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        {/* Today's Orders Completed */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">
              Today's Completed
            </span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">
              {ordersCompletedToday}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mt-6">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Last Check-In Time */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">
              Last Check-In
            </span>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mt-2">
              {lastCheckInTime}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mt-6">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Employee Performance Summary & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Statistics */}
        <div className="p-6 rounded-3xl glass-panel lg:col-span-2 space-y-6">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <span>Employee Performance Summary</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-2xl flex justify-between items-center">
              <span>Orders Accepted Today:</span>
              <span className="font-extrabold text-indigo-650 dark:text-indigo-400 text-sm">{ordersAcceptedToday}</span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-2xl flex justify-between items-center">
              <span>Orders Completed Today:</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{ordersCompletedToday}</span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-2xl flex justify-between items-center">
              <span>Total Orders Completed:</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-205 text-sm">{totalOrdersCompleted}</span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-2xl flex justify-between items-center">
              <span>Attendance Status Today:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${todayAttendanceStatus === 'PRESENT' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                todayAttendanceStatus === 'LATE' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                  'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-350'
                }`}>
                {todayAttendanceStatus}
              </span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-2xl flex justify-between items-center md:col-span-2">
              <span>Last Clock-In Registered:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{lastCheckInTime}</span>
            </div>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Quick Navigation
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {/* Orders Desk */}
            <Link
              to="/employee/orders"
              className="p-5 rounded-3xl glass-panel border border-slate-100 dark:border-slate-850 flex items-center justify-between group hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Order Desk</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Accept and prepare active orders</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-450 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Check In / Out */}
            <Link
              to="/employee/attendance"
              className="p-5 rounded-3xl glass-panel border border-slate-100 dark:border-slate-850 flex items-center justify-between group hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Check In/Out</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Selfie & GPS location check-in</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-450 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Log History */}
            <Link
              to="/employee/log-history"
              className="p-5 rounded-3xl glass-panel border border-slate-100 dark:border-slate-850 flex items-center justify-between group hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Log History</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Review shift logs and history</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-450 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
