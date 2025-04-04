import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Function to get user role from token (Modify this as per your auth system)
const getUserRole = () => {
  const token = localStorage.getItem('token'); 
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1])); // Decoding JWT token
    return payload.role || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

t
const ProtectedRoute = ({ allowedRoles }) => {
  const userRole = getUserRole();
  
  if (!userRole) return <Navigate to="/login" replace />; // Redirect if not logged in
  if (!allowedRoles.includes(userRole)) return <Navigate to="/unauthorized" replace />; // Redirect if unauthorized

  return <Outlet />; 
};

export default ProtectedRoute;
