import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux/auth/selectors';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { current: user, isLoggedIn } = useSelector(selectAuth);

  if (!isLoggedIn || !user) {
    return <Navigate to="/your-login-url" replace />;  // update this path
  }

  if (allowedRoles.length === 0 || allowedRoles.includes(user.role)) {
    return children;
  }

  return <Navigate to="/" replace />;
};

export default ProtectedRoute;
