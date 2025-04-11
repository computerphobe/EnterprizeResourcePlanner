import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';

// Updated ProtectedRoute to use Redux state for role checking
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { current: user, isLoggedIn } = useSelector(selectAuth);
  console.log('ProtectedRoute checking access:', { user, isLoggedIn, allowedRoles });
  
  // If not logged in, redirect to login
  if (!isLoggedIn || !user) {
    console.log('User not logged in, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // If no specific roles required or user has allowed role, grant access
  if (allowedRoles.length === 0 || allowedRoles.includes(user.role)) {
    console.log('Access granted to route');
    return children;
  }
  
  // User doesn't have required role, redirect to default page
  console.log('Access denied - user role:', user.role, 'required:', allowedRoles);
  return <Navigate to="/" replace />;
};

export default ProtectedRoute;
