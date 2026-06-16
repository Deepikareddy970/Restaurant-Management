import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiRequest } from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import {
  CheckCircle,
  Clock,
  ChefHat,
  BellRing,
  Check,
  ArrowLeft
} from 'lucide-react';

const STEPS = [
  { status: 'PENDING', label: 'Order Placed', desc: 'Sent to the kitchen queue', icon: BellRing },
  { status: 'PREPARING', label: 'Preparing', desc: 'Chefs are crafting your dish', icon: ChefHat },
  { status: 'READY', label: 'Ready to Serve', desc: 'Dishes hot and plated', icon: Clock },
  { status: 'DELIVERED', label: 'Served', desc: 'Enjoy your culinary experience', icon: CheckCircle }
];

const OrderTracker = () => {
  const { socket, addToast } = useSocket();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const orderId = searchParams.get('orderId');

  const fetchOrderDetails = async () => {
    if (!orderId) {
      setError('No order specified to track.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await apiRequest(`/orders/₹{orderId}/history`);
      const data = await res.json();
      if (data.success) {
        setOrder(data.order);
      } else {
        setError(data.message || 'Could not load order tracking.');
      }
    } catch (err) {
      setError('Connection failure loading tracking metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  // Set up socket listeners for live tracking updates
  useEffect(() => {
    if (!socket || !orderId) return;

    // Join room for this specific order
    socket.emit('trackOrder', orderId);

    const handleOrderUpdate = (data) => {
      // Check if update relates to this order
      if (data.orderId === orderId) {
        addToast(`Order update: ₹{data.notes || data.status}`, 'info');
        setOrder((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            status: data.status,
            assignedEmployee: data.assignedEmployee || prev.assignedEmployee,
            history: data.history || prev.history,
          };
        });
      }
    };

    socket.on('orderUpdate', handleOrderUpdate);

    return () => {
      socket.off('orderUpdate', handleOrderUpdate);
    };
  }, [socket, orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 rounded-3xl glass-panel text-center max-w-md mx-auto space-y-4">
        <p className="text-slate-400 font-semibold">{error || 'No active tracking sessions.'}</p>
        <Link
          to="/customer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse Menu</span>
        </Link>
      </div>
    );
  }

  // Calculate active index steps
  const activeIndex = STEPS.findIndex((s) => s.status === order.status);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Tracker Card Head */}
      <div className="glass-panel p-6 rounded-3xl flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-450 font-bold">Order Tracking ID</span>
          <h2 className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{order.orderNumber}</h2>
        </div>
        <Link
          to="/customer"
          className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </Link>
      </div>

      {/* Visual Timeline Stepper */}
      <div className="glass-panel p-8 rounded-3xl">
        <div className="relative flex flex-col md:flex-row md:justify-between gap-8 md:gap-4">
          {/* Timeline connecting line (desktop) */}
          <div className="absolute top-[26px] left-8 right-8 h-0.5 bg-slate-200 dark:bg-slate-800 hidden md:block z-0">
            <div
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{ width: `₹{(activeIndex / (STEPS.length - 1)) * 100}%` }}
            />
          </div>

          {STEPS.map((step, idx) => {
            const isCompleted = idx < activeIndex;
            const isActive = idx === activeIndex;
            const isFuture = idx > activeIndex;

            return (
              <div key={step.status} className="flex md:flex-col items-start md:items-center gap-4 md:gap-2 flex-1 relative z-10">
                {/* Stepper badge */}
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ₹{
                  isActive ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' :
                  isCompleted ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600' :
                  'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400'
                }`}>
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[3px]" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>

                {/* Text details */}
                <div className="md:text-center text-xs">
                  <h4 className={`font-bold text-sm ₹{isActive || isCompleted ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                    {step.label}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed max-w-[140px] md:mx-auto">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Employee assignment summary */}
      {order.assignedEmployee?.name && (
        <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/25 border border-indigo-100/30 dark:border-indigo-950/30 text-xs flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-350">Handled by Employee</p>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Name: {order.assignedEmployee.name} ({order.assignedEmployee.employeeId})
            </p>
          </div>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-100/40 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
            Assigned: {new Date(order.assignedEmployee.assignedAt).toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Order Summary details */}
      <div className="glass-panel p-6 rounded-3xl">
        <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Order Invoice Details</h3>
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
          {order.items.map((item, idx) => (
            <div key={idx} className="py-3 flex justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-305">{item.name} <span className="text-slate-400 font-semibold">x{item.quantity}</span></span>
              <span className="font-black text-slate-700 dark:text-slate-305">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="pt-3 flex justify-between font-bold text-slate-800 dark:text-slate-200">
            <span>Total Bill Amount</span>
            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">₹{order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracker;
