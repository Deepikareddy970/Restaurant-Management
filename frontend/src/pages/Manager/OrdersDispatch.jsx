import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../utils/api';
import { ShoppingBag, UserCheck, Clock } from 'lucide-react';

const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  PREPARING: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  READY: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  DELIVERED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
};

const ACTIVE_STATUSES = ['PENDING', 'PREPARING', 'READY'];

const OrdersDispatch = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest('/orders?limit=100');
      const data = await res.json();
      if (data.success) {
        // Keep only active orders
        const active = (data.orders || []).filter((o) =>
          ACTIVE_STATUSES.includes(o.status)
        );
        setOrders(active);
      } else {
        setError('Failed to load orders.');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Something went wrong while loading orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const handleOrderUpdate = () => fetchOrders();
    window.addEventListener('newOrderAlert', handleOrderUpdate);
    return () => window.removeEventListener('newOrderAlert', handleOrderUpdate);
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
          Orders Dispatch
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Live view of active orders and staff assignments
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
                  Order ID
                </th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Customer
                </th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Ordered Items
                </th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Accepted By
                </th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Accepted Time
                </th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    No active orders at the moment.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const employee = order.assignedEmployee;
                  const acceptedName = employee?.name || '—';
                  const acceptedTime = employee?.assignedAt
                    ? new Date(employee.assignedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    : '—';

                  const itemsSummary = (order.items || [])
                    .map((i) => `₹{i.name} ×₹{i.quantity}`)
                    .join(', ');

                  return (
                    <tr
                      key={order._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Order ID */}
                      <td className="px-5 py-4 font-extrabold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          {order.orderNumber}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {order.customerName || '—'}
                      </td>

                      {/* Items */}
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400 max-w-[220px]">
                        <span className="line-clamp-2 leading-relaxed">{itemsSummary || '—'}</span>
                      </td>

                      {/* Accepted By */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <UserCheck
                            className={`w-3.5 h-3.5 shrink-0 ₹{
                              employee?.name
                                ? 'text-emerald-500'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                          <span
                            className={`font-semibold ₹{
                              employee?.name
                                ? 'text-slate-700 dark:text-slate-200'
                                : 'text-slate-400 dark:text-slate-600 italic'
                            }`}
                          >
                            {acceptedName}
                          </span>
                        </div>
                      </td>

                      {/* Accepted Time */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
                          {acceptedTime}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full ₹{
                            STATUS_STYLES[order.status] || STATUS_STYLES.DELIVERED
                          }`}
                        >
                          {order.status}
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

export default OrdersDispatch;
