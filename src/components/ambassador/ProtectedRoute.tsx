import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAmbassadorAuth } from '../../contexts/AmbassadorAuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAmbassadorAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/ambassador/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;