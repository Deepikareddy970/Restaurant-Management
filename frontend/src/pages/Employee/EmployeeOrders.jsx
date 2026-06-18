import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  CheckCircle,
  Play,
  ArrowRight,
  Clock,
  UserCheck,
  Camera,
  AlertTriangle,
  ChevronRight,
  Search
} from 'lucide-react';

const STATUS_FLOW = {
  PENDING: { label: 'Assigned (Pending)', nextStatus: 'ACCEPTED', btnLabel: 'Accept Order', style: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  ACCEPTED: { label: 'Accepted', nextStatus: 'PREPARING', btnLabel: 'Start Preparing', style: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
  PREPARING: { label: 'Preparing', nextStatus: 'READY', btnLabel: 'Mark Ready', style: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' },
  READY: { label: 'Ready', nextStatus: 'DELIVERED', btnLabel: 'Mark Completed', style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  DELIVERED: { label: 'Completed', nextStatus: null, btnLabel: null, style: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' },
  CANCELLED: { label: 'Cancelled', nextStatus: null, btnLabel: null, style: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' }
};

const EmployeeOrders = () => {
  const { user } = useAuth();
  const { socket, addToast } = useSocket();

  const [activeSession, setActiveSession] = useState(null);
  const [checkedSession, setCheckedSession] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'available', 'active', 'completed'

  const checkAttendanceAndFetchOrders = async () => {
    try {
      setLoading(true);
      // 1. Verify if employee has an active clock-in session
      const attRes = await apiRequest('/attendance/history');
      const attData = await attRes.json();

      let isClockedIn = false;
      if (attData.success) {
        const active = attData.logs.find(log => !log.clockOutTime && log.status !== 'REJECTED');
        setActiveSession(active || null);
        isClockedIn = !!active;
      }
      setCheckedSession(true);

      // 2. Fetch orders only if checked-in
      if (isClockedIn) {
        const ordersRes = await apiRequest('/orders?limit=100');
        const ordersData = await ordersRes.json();
        if (ordersData.success) {
          setOrders(ordersData.orders || []);
        }
      }
    } catch (e) {
      console.error('Error fetching employee orders data:', e);
      addToast('Error loading orders desk data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAttendanceAndFetchOrders();
  }, []);

  // Set up socket listeners for real-time order notifications
  useEffect(() => {
    if (!socket || !activeSession) return;

    const handleNewOrder = (data) => {
      addToast(`New order placed: ${data.orderNumber}`, 'info');
      // Refresh orders list
      checkAttendanceAndFetchOrders();
    };

    const handleOrderUpdate = () => {
      // Refresh list
      checkAttendanceAndFetchOrders();
    };

    socket.on('newOrderAlert', handleNewOrder);
    socket.on('orderUpdate', handleOrderUpdate);

    return () => {
      socket.off('newOrderAlert', handleNewOrder);
      socket.off('orderUpdate', handleOrderUpdate);
    };
  }, [socket, activeSession]);

  const handleAcceptOrder = async (orderId) => {
    try {
      const res = await apiRequest(`/orders/${orderId}/assign`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        addToast(`Order accepted successfully.`, 'success');
        checkAttendanceAndFetchOrders();
      } else {
        addToast(data.message || 'Failed to accept order.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Connection error accepting order.', 'error');
    }
  };

  const handleAdvanceStatus = async (orderId, currentStatus) => {
    const nextStatus = STATUS_FLOW[currentStatus]?.nextStatus;
    if (!nextStatus) return;

    try {
      const res = await apiRequest(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Order advanced to: ${STATUS_FLOW[nextStatus]?.label}`, 'success');
        checkAttendanceAndFetchOrders();
      } else {
        addToast(data.message || 'Failed to update order status.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Connection error updating status.', 'error');
    }
  };

  if (loading && !checkedSession) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If check-in required to access orders
  if (checkedSession && !activeSession) {
    return (
      <div className="max-w-md mx-auto p-8 rounded-3xl glass-panel text-center space-y-6 mt-10">
        <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/20 rounded-full flex items-center justify-center mx-auto text-amber-500">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-200">
            Check-In Required
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            To view assigned orders or accept new jobs, you must complete your shift check-in first.
          </p>
        </div>

        <Link
          to="/employee/attendance"
          className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition duration-200 shadow-lg shadow-indigo-600/20"
        >
          <Camera className="w-4 h-4" />
          <span>Go to Check-In Page</span>
        </Link>
      </div>
    );
  }

  // Filter orders by tab
  const getFilteredOrders = () => {
    let list = [...orders];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q)
      );
    }

    switch (activeTab) {
      case 'available':
        // Unassigned PENDING orders
        return list.filter(o => !o.assignedEmployee?.id && o.status === 'PENDING');
      case 'active':
        // Assigned to current employee and status is in PENDING, ACCEPTED, PREPARING, or READY
        return list.filter(o =>
          o.assignedEmployee?.id === user?.id &&
          ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)
        );
      case 'completed':
        // Assigned to current employee and status is DELIVERED/COMPLETED
        return list.filter(o =>
          o.assignedEmployee?.id === user?.id &&
          ['DELIVERED', 'COMPLETED'].includes(o.status)
        );
      default:
        return list;
    }
  };

  const filteredOrders = getFilteredOrders();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">
            Orders Desk
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Accept incoming orders, process culinary updates, and log completions
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${activeTab === 'active'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
        >
          My Active Tasks ({orders.filter(o => o.assignedEmployee?.id === user?.id && ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)).length})
        </button>
        <button
          onClick={() => setActiveTab('available')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${activeTab === 'available'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
        >
          Available Pool ({orders.filter(o => !o.assignedEmployee?.id && o.status === 'PENDING').length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${activeTab === 'completed'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
        >
          My Completions ({orders.filter(o => o.assignedEmployee?.id === user?.id && ['DELIVERED', 'COMPLETED'].includes(o.status)).length})
        </button>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 rounded-3xl glass-panel text-center text-xs text-slate-400 space-y-2">
          <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
          <p>No orders found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOrders.map((order) => {
            const flow = STATUS_FLOW[order.status] || STATUS_FLOW.PENDING;
            const isMyOrder = order.assignedEmployee?.id === user?.id;

            return (
              <div
                key={order._id}
                className="p-5 rounded-3xl glass-panel border border-slate-100 dark:border-slate-800/60 flex flex-col justify-between space-y-4 hover:shadow-md transition duration-200"
              >
                {/* Order Top Summary */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-slate-450 font-bold uppercase">Order Code</span>
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{order.orderNumber}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Cust: {order.customerName}</p>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${flow.style}`}>
                    {flow.label}
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-2 py-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Ordered Items</span>
                  <div className="divide-y divide-slate-100/50 dark:divide-slate-800/50 max-h-36 overflow-y-auto pr-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-2 flex justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                          {item.name} <span className="text-slate-400 text-[10px]">x{item.quantity}</span>
                        </span>
                        <span className="text-slate-400 font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Total Amt</span>
                    <span className="font-black text-indigo-600 dark:text-indigo-400">₹{order.totalAmount.toFixed(2)}</span>
                  </div>

                  <div>
                    {!isMyOrder ? (
                      <button
                        onClick={() => handleAcceptOrder(order._id)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center gap-1"
                      >
                        <span>Accept Job</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      flow.nextStatus && (
                        <button
                          onClick={() => handleAdvanceStatus(order._id, order.status)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1"
                        >
                          {order.status === 'READY' ? <CheckCircle className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          <span>{flow.btnLabel}</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmployeeOrders;
