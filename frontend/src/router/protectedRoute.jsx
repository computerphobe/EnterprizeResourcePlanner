// src/components/ProtectedRoute.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectAuth } from '@/redux/auth/selectors';

const ProtectedRoute = ({ allowedRoles, children }) => {
  // Grab the 'current' user object from the auth slice
  const { current } = useSelector(selectAuth);

  // Extract role from current user
  const roleRaw = current?.role || '';
  const role = roleRaw.trim().toLowerCase();
  // If no role found, user is not authenticated, redirect to login
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // Check if the role is allowed for this route
  const allowed = allowedRoles.map(r => r.toLowerCase());
  if (!allowed.includes(role)) {
    // Role not authorized, redirect to home or some other page
    return <Navigate to="/" replace />;
  }

  // Authorized: render the children components
  return children;
};

export default ProtectedRoute;