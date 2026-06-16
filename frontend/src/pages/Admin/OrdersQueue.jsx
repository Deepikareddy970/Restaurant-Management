import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../utils/api';
import { ClipboardList, Filter } from 'lucide-react';

const OrdersQueue = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error('Error fetching order queue:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const statuses = ['All', 'PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];
  const filteredOrders = filter === 'All' ? orders : orders.filter(o => o.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">
            System Orders Registry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse and search all historical orders, active workflows, and staff assignments
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition ₹{
                filter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-3xl glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3">Order Code</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Items Details</th>
                <th className="pb-3">Assigned Handler</th>
                <th className="pb-3">Assigned Time</th>
                <th className="pb-3">Total Cost</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No orders found matching this filter.</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="py-4 font-extrabold text-indigo-600 dark:text-indigo-400">
                      {order.orderNumber}
                    </td>
                    <td className="py-4 font-bold text-slate-800 dark:text-slate-200">{order.customerName}</td>
                    <td className="py-4 text-slate-500 max-w-xs truncate">
                      {order.items.map((i) => `₹{i.name} (x₹{i.quantity})`).join(', ')}
                    </td>
                    <td className="py-4 font-semibold text-slate-700 dark:text-slate-300">
                      {order.assignedEmployee?.name ? (
                        <span>{order.assignedEmployee.name} ({order.assignedEmployee.employeeId})</span>
                      ) : (
                        <span className="text-amber-500">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 text-slate-400">
                      {order.assignedEmployee?.assignedAt ? (
                        new Date(order.assignedEmployee.assignedAt).toLocaleTimeString()
                      ) : (
                        <span>N/A</span>
                      )}
                    </td>
                    <td className="py-4 font-black">₹{order.totalAmount.toFixed(2)}</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ₹{order.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          order.status === 'PREPARING' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                            order.status === 'READY' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                              order.status === 'DELIVERED' ? 'bg-slate-100 text-slate-705 dark:bg-slate-800 dark:text-slate-300' :
                                'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-350'
                        }`}>
                        {order.status}
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

export default OrdersQueue;
