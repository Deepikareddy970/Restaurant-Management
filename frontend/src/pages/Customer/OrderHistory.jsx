import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../utils/api';
import { ClipboardList, ExternalLink } from 'lucide-react';

const OrderHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/orders');
      const data = await res.json();
      if (data.success) {
        setHistory(data.orders);
      }
    } catch (e) {
      console.error('Error fetching order histories:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
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
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">
          My Order History
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review all gourmet purchases and dine-in tracking details
        </p>
      </div>

      {/* Orders List Grid */}
      <div className="p-6 rounded-3xl glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3">Date</th>
                <th className="pb-3">Order Code</th>
                <th className="pb-3">Dishes</th>
                <th className="pb-3">Total Amount</th>
                <th className="pb-3">Payment</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Track</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">You have not placed any orders yet.</td>
                </tr>
              ) : (
                history.map((order) => (
                  <tr key={order._id}>
                    <td className="py-4 font-semibold">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 font-extrabold text-indigo-600 dark:text-indigo-400">
                      {order.orderNumber}
                    </td>
                    <td className="py-4 text-slate-500 dark:text-slate-400 font-medium">
                      {order.items.map((i) => `₹{i.name} (x₹{i.quantity})`).join(', ')}
                    </td>
                    <td className="py-4 font-black">₹{order.totalAmount.toFixed(2)}</td>
                    <td className="py-4">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {order.paymentMethod || 'Cash'}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ₹{order.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        order.status === 'PREPARING' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                          order.status === 'READY' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            order.status === 'DELIVERED' ? 'bg-slate-105 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                              'bg-rose-100 text-rose-805 dark:bg-rose-950 dark:text-rose-350'
                        }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <Link
                        to={`/customer/tracker?orderId=₹{order._id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-[10px] font-bold text-slate-700 dark:text-slate-300"
                      >
                        <span>View progress</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
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

export default OrderHistory;
