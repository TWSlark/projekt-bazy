import { Outlet, Navigate } from 'react-router-dom';

const ProtectedRoute = () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  if (!accessToken) {
    return <Navigate to="/" replace />;
  }

  if (!refreshToken) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;