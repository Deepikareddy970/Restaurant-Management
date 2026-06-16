import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Create toast notification helper
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const addNotification = (notif) => {
    const newNotif = {
      id: Date.now() + Math.random(),
      time: new Date(),
      read: false,
      ...notif,
    };
    setNotifications((prev) => [newNotif, ...prev].slice(0, 50)); // Cap at 50 logs
  };

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Initialize socket connection
    const socketUrl = 'https://://restaurant-management-backend-28nv.onrender.com';
    console.log(`[Socket.IO] Connecting to ${socketUrl}`);
    const newSocket = io(socketUrl);

    setSocket(newSocket);

    // Join room based on user role
    newSocket.on('connect', () => {
      console.log(`[Socket.IO] Connected. Joining room: ${user.role}`);
      newSocket.emit('joinRoom', user.role);
    });

    // Listen for new orders (available to Admin, Manager, and Employee)
    if (['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(user.role)) {
      newSocket.on('newOrderAlert', (data) => {
        const msg = `New order ${data.orderNumber} placed by ${data.customerName} for $${data.totalAmount.toFixed(2)}`;
        addToast(msg, 'success');
        addNotification({
          title: 'New Order Received',
          message: msg,
          type: 'ORDER',
          metadata: { orderId: data.orderId },
        });
      });

      // Attendance Alert (Managers/Admins only)
      if (['ADMIN', 'MANAGER'].includes(user.role)) {
        newSocket.on('attendanceAlert', (data) => {
          const isLate = data.status === 'LATE';
          const msg = `${data.employeeName} (${data.employeeId}) clocked in ${isLate ? 'LATE' : 'REJECTED (Geofence)'} at ${new Date(data.time).toLocaleTimeString()}`;
          addToast(msg, isLate ? 'warning' : 'error');
          addNotification({
            title: isLate ? 'Late Arrival Alert' : 'Clock-In Rejected',
            message: msg,
            type: 'ATTENDANCE',
            metadata: data,
          });
        });
      }
    }

    // Global order status update listener
    newSocket.on('orderUpdate', (data) => {
      const msg = `Order ${data.orderNumber} status updated to ${data.status}`;

      // If Customer: show alert only if it's their order
      // If Admin/Manager: always show
      // If Employee: show if assigned to it
      if (user.role === 'CUSTOMER') {
        const localUser = JSON.parse(localStorage.getItem('user'));
        // Triggered inside component trackers as well
      } else {
        addToast(msg, 'info');
        addNotification({
          title: 'Order Status Updated',
          message: msg,
          type: 'ORDER_UPDATE',
          metadata: data,
        });
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        toasts,
        addToast,
        clearNotifications,
        markAllAsRead,
      }}
    >
      {children}

      {/* Toast notifications rendering layer */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-xl shadow-2xl border transition-all duration-300 transform translate-y-0 slide-in glass-panel flex items-start gap-3 ${toast.type === 'success'
              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300'
              : toast.type === 'warning'
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-300'
                : toast.type === 'error'
                  ? 'border-rose-500/50 bg-rose-500/10 text-rose-900 dark:text-rose-300'
                  : 'border-indigo-500/50 bg-indigo-500/10 text-indigo-900 dark:text-indigo-300'
              }`}
          >
            <div className="flex-1 text-sm font-semibold">{toast.message}</div>
          </div>
        ))}
      </div>
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
