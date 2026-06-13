import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/Layout';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import OrdersQueue from './pages/Admin/OrdersQueue';
import AttendanceMonitor from './pages/Admin/AttendanceMonitor';
import Reports from './pages/Admin/Reports';
import StaffPerformance from './pages/Admin/StaffPerformance';
import Audits from './pages/Admin/Audits';

// Manager Pages
import ManagerDashboard from './pages/Manager/ManagerDashboard';

// Employee Pages
import EmployeeDashboard from './pages/Employee/EmployeeDashboard';

// Customer Pages
import CustomerMenu from './pages/Customer/CustomerMenu';
import OrderTracker from './pages/Customer/OrderTracker';
import OrderHistory from './pages/Customer/OrderHistory';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <Routes>

              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Admin Routes */}
              <Route element={<Layout allowedRoles={['ADMIN']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/orders" element={<OrdersQueue />} />
                <Route path="/admin/attendance" element={<AttendanceMonitor />} />
                <Route path="/admin/reports" element={<Reports />} />
                <Route path="/admin/staff" element={<StaffPerformance />} />
                <Route path="/admin/audits" element={<Audits />} />
              </Route>

              {/* Manager Routes */}
              <Route element={<Layout allowedRoles={['MANAGER']} />}>
                <Route path="/manager" element={<ManagerDashboard />} />
                <Route path="/manager/orders" element={<ManagerDashboard />} />
                <Route path="/manager/attendance" element={<ManagerDashboard />} />
                <Route path="/manager/reports" element={<Reports />} />
              </Route>

              {/* Employee Routes */}
              <Route element={<Layout allowedRoles={['EMPLOYEE']} />}>
                <Route path="/employee" element={<EmployeeDashboard />} />
                <Route path="/employee/orders" element={<EmployeeDashboard />} />
                <Route path="/employee/attendance" element={<EmployeeDashboard />} />
              </Route>

              {/* Customer Routes */}
              <Route element={<Layout allowedRoles={['CUSTOMER']} />}>
                <Route path="/customer" element={<CustomerMenu />} />
                <Route path="/customer/tracker" element={<OrderTracker />} />
                <Route path="/customer/history" element={<OrderHistory />} />
              </Route>

              {/* Default Redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Catch All */}
              <Route path="*" element={<Navigate to="/login" replace />} />

            </Routes>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;