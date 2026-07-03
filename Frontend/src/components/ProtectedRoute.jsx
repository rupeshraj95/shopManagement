import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Premium, ultra-clean loader tracking background sync states smoothly
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-zinc-50 flex flex-col items-center justify-center font-sans antialiased">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-9 w-9 rounded-full border border-zinc-200" />
          <div className="h-9 w-9 rounded-full border border-t-zinc-900 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        </div>
        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mt-4 select-none">
          Validating State
        </span>
      </div>
    );
  }

  // Intercept unauthorized requests and map baseline target history references
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;