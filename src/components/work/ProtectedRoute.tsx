import React from 'react';
import { Navigate } from 'react-router-dom';
import { useWorkAuth } from '../../contexts/WorkAuthContext';
import LoadingSpinner from '../shared/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, isLoading, employee } = useWorkAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/work/auth" replace />;
  }

  if (requiredRole && employee?.role !== requiredRole) {
    return <Navigate to="/work/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
