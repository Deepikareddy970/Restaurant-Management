import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-semibold text-sm animate-pulse">Loading Guramrit Restaurant...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect if role is unauthorized for this route path
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to fallback default page for their role
    if (user.role === 'CUSTOMER') return <Navigate to="/customer" replace />;
    if (user.role === 'EMPLOYEE') return <Navigate to="/employee" replace />;
    if (user.role === 'MANAGER') return <Navigate to="/manager" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* Sidebar for desktop & drawer for mobile */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <Navbar setSidebarOpen={setSidebarOpen} />

        {/* Page Workspace Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
