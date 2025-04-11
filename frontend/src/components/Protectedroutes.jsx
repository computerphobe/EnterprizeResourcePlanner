// src/components/Protectedroutes.jsx
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectAuth } from '@/redux/auth/selectors';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { auth } = useSelector(selectAuth);
  const role = auth?.user?.role;

  // ⛔ Not logged in at all
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // ⛔ Logged in but unauthorized
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  // ✅ Authorized
  return children;
};

export default ProtectedRoute;
