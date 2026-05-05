import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from './store';
import { fetchMeAsync } from './store/slices/authSlice';
import useAuth from './hooks/useAuth';
import Layout from './components/common/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Bills from './pages/Bills';
import CreateBill from './pages/CreateBill';
import BillDetail from './pages/BillDetail';
import Payments from './pages/Payments';
import PaymentDetail from './pages/PaymentDetail';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import Cashier from './pages/Cashier';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Users from './pages/admin/Users';
import Fees from './pages/admin/Fees';
import FeeCategories from './pages/admin/FeeCategories';
import PenaltyRules from './pages/admin/PenaltyRules';
import AuditLogs from './pages/admin/AuditLogs';
import Departments from './pages/admin/Departments';
import Ledger from './pages/admin/Ledger';

const STAFF = ['admin', 'cashier', 'department_viewer'];
const STAFF_RESIDENT = ['admin', 'cashier', 'department_viewer', 'resident'];
const ADMIN_CASHIER = ['admin', 'cashier'];
const ADMIN_ONLY = ['admin'];

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) dispatch(fetchMeAsync());
  }, [dispatch]);

  if (isLoading) return <LoadingSpinner fullPage />;

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth-callback" element={<AuthCallback />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-failed" element={<PaymentFailed />} />

      {/* Protected shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />

          <Route path="/bills" element={<ProtectedRoute allowedRoles={STAFF_RESIDENT} />}>
            <Route index element={<Bills />} />
          </Route>
          <Route path="/bills/create" element={<ProtectedRoute allowedRoles={ADMIN_CASHIER} />}>
            <Route index element={<CreateBill />} />
          </Route>
          <Route path="/bills/:id" element={<BillDetail />} />

          <Route path="/payments" element={<ProtectedRoute allowedRoles={STAFF_RESIDENT} />}>
            <Route index element={<Payments />} />
          </Route>
          <Route path="/payments/:id" element={<PaymentDetail />} />

          <Route path="/cashier" element={<ProtectedRoute allowedRoles={ADMIN_CASHIER} />}>
            <Route index element={<Cashier />} />
          </Route>

          <Route path="/reports" element={<ProtectedRoute allowedRoles={STAFF} />}>
            <Route index element={<Reports />} />
          </Route>

          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={ADMIN_ONLY} />}>
            <Route index element={<Users />} />
          </Route>
          <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={ADMIN_ONLY} />}>
            <Route index element={<Fees />} />
          </Route>
          <Route path="/admin/penalty-rules" element={<ProtectedRoute allowedRoles={ADMIN_ONLY} />}>
            <Route index element={<PenaltyRules />} />
          </Route>
          <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={ADMIN_ONLY} />}>
            <Route index element={<AuditLogs />} />
          </Route>
          <Route path="/admin/departments" element={<ProtectedRoute allowedRoles={ADMIN_ONLY} />}>
            <Route index element={<Departments />} />
          </Route>
          <Route path="/admin/fee-categories" element={<ProtectedRoute allowedRoles={ADMIN_ONLY} />}>
            <Route index element={<FeeCategories />} />
          </Route>
          <Route path="/admin/ledger" element={<ProtectedRoute allowedRoles={ADMIN_ONLY} />}>
            <Route index element={<Ledger />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
