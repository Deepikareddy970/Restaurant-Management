import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  ClipboardList, 
  Users, 
  BarChart3, 
  Clock, 
  Settings, 
  LogOut, 
  X, 
  ShoppingCart, 
  History,
  ShieldCheck
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();

  const getLinksByRole = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { name: 'Admin Dashboard', path: '/admin', icon: Home },
          { name: 'Order Logs', path: '/admin/orders', icon: ClipboardList },
          { name: 'Attendance Monitor', path: '/admin/attendance', icon: Clock },
          { name: 'Analytics Reports', path: '/admin/reports', icon: BarChart3 },
          { name: 'Staff Performance', path: '/admin/staff', icon: Users },
          { name: 'System Audits', path: '/admin/audits', icon: ShieldCheck },
        ];
      case 'MANAGER':
        return [
          { name: 'Manager Dashboard', path: '/manager', icon: Home },
          { name: 'Orders Dispatch', path: '/manager/orders', icon: ClipboardList },
          { name: 'Attendance Tracker', path: '/manager/attendance', icon: Clock },
          { name: 'Reports Console', path: '/manager/reports', icon: BarChart3 },
        ];
      case 'EMPLOYEE':
        return [
          { name: 'Work Dashboard', path: '/employee', icon: Home },
          { name: 'Order Desk', path: '/employee/orders', icon: ClipboardList },
          { name: 'My Attendance Logs', path: '/employee/attendance', icon: Clock },
        ];
      case 'CUSTOMER':
        return [
          { name: 'Menu & Cart', path: '/customer', icon: ShoppingCart },
          { name: 'Order Tracker', path: '/customer/tracker', icon: ClipboardList },
          { name: 'My Order History', path: '/customer/history', icon: History },
        ];
      default:
        return [];
    }
  };

  const navLinks = getLinksByRole();

  const activeStyle = "flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-600/20 dark:shadow-indigo-500/10 transition-all duration-200";
  const inactiveStyle = "flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-medium transition-all duration-200";

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/80 w-64 p-5">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-6 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
            E
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
            EPITOME
          </span>
        </div>
        <button 
          onClick={() => setIsOpen(false)} 
          className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      {/* Profile Overview */}
      <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-950/30 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{user?.name}</h4>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold uppercase">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) => (isActive ? activeStyle : inactiveStyle)}
            end
          >
            <link.icon className="w-5 h-5" />
            <span>{link.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Log Out Button */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/25 font-semibold transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (always visible > md view) */}
      <div className="hidden md:block h-screen sticky top-0">
        {sidebarContent}
      </div>

      {/* Mobile Drawer (visible on click) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            onClick={() => setIsOpen(false)} 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          />
          <div className="relative z-50 flex-1 flex flex-col max-w-xs animate-slide-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
