import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { Bell, Menu, Moon, Sun, Check } from 'lucide-react';

const Navbar = ({ setSidebarOpen }) => {
  const { isDark, toggleTheme } = useTheme();
  const { notifications, markAllAsRead } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/60 p-4 flex items-center justify-between">
      {/* Mobile Sidebar Hamburger Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
        >
          <Menu className="w-5 h-5" />
        </button>

      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        {/* Light/Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-500 animate-pulse" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200 relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full animate-bounce"></span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <>
              <div
                onClick={() => setShowNotifications(false)}
                className="fixed inset-0 z-40 bg-transparent"
              />
              <div className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto z-50 glass-panel rounded-2xl p-4 shadow-2xl animate-slide-in">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-850">
                  <h3 className="font-bold text-sm text-slate-850 dark:text-slate-100">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        markAllAsRead();
                        setShowNotifications(false);
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-2.5 rounded-xl border transition-colors ${notif.read
                          ? 'border-slate-100 dark:border-slate-800/40 bg-transparent'
                          : 'border-indigo-100 dark:border-indigo-950/20 bg-indigo-50/20 dark:bg-indigo-950/10'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${notif.type === 'ORDER'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            }`}>
                            {notif.type}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(notif.time).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-650 dark:text-slate-300 mt-1">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
