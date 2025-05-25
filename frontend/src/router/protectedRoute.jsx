import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { current: user, isLoggedIn } = useSelector(selectAuth);
  const location = useLocation();

  // Redirect to login if not logged in
  if (!isLoggedIn || !user) {
    return (
      <Navigate 
        to="/login" // ✅ <-- make sure this matches your login route
        state={{ from: location }}
        replace 
      />
    );
  }

  // Allow access if role is valid or no restriction
  if (allowedRoles.length === 0 || allowedRoles.includes(user.role)) {
    return children;
  }

  // Role not allowed
  return <Navigate to="/" replace />;
};

export default ProtectedRoute;
