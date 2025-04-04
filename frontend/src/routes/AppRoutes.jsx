import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Components for different roles
import AdminDashboard from '@/modules/DashboardModule/AdminDashboard';
import DoctorDashboard from '@/modules/DashboardModule/DoctorDashboard';
import OrderList from '@/modules/OrderModule/OrderList';
import OrderForm from '@/modules/OrderModule/OrderForm';
import ReturnList from '@/modules/ReturnModule/ReturnList';
import ReturnForm from '@/modules/ReturnModule/ReturnForm';

const AppRoutes = () => {
  const { current: currentUser } = useSelector((state) => state.auth);

  const RoleBasedDashboard = () => {
    switch (currentUser?.role) {
      case 'doctor':
        return <DoctorDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <Navigate to="/login" />;
    }
  };

  return (
    <Routes>
      <Route path="/" element={<RoleBasedDashboard />} />
      
      {/* Doctor Routes */}
      {currentUser?.role === 'doctor' && (
        <>
          <Route path="/orders" element={<OrderList userRole="doctor" />} />
          <Route path="/orders/new" element={<OrderForm userRole="doctor" />} />
          <Route path="/returns" element={<ReturnList userRole="doctor" />} />
          <Route path="/returns/new" element={<ReturnForm userRole="doctor" />} />
        </>
      )}

      {/* Admin Routes */}
      {currentUser?.role === 'admin' && (
        <>
          <Route path="/admin/*" element={<AdminRoutes />} />
        </>
      )}
    </Routes>
  );
};

export default AppRoutes; 