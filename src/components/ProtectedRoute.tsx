
import React from 'react';
import { Navigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading, needsProfileSetup } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <MapPin className="h-10 w-10 text-wanderblue animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (needsProfileSetup) {
    return <Navigate to="/profile-setup" replace />;
  }
  
  return <>{children}</>;
};
