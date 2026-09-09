import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface Props {
  children: React.ReactElement;
}

export default function PrivateRoute({ children }: Props) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
