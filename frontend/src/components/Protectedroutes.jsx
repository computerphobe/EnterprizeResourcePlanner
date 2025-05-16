// src/components/Protectedroutes.jsx
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectAuth } from '@/redux/auth/selectors';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { auth } = useSelector(selectAuth);
  const roleRaw = auth?.user?.role || '';
  const role = roleRaw.trim().toLowerCase();

  console.log('User role:', role);  // Debug: see actual role in console
  const allowed = allowedRoles.map(r => r.toLowerCase());

  // Not logged in at all
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but unauthorized
  if (!allowed.includes(role)) {
    return <Navigate to="/" replace />;
  }

  // Authorized
  return children;
};

export default ProtectedRoute;
