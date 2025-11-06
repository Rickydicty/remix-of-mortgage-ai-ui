import { useAuth } from '@/contexts/AuthContext';
import { useUserRole, UserRole } from '@/hooks/useUserRole';
import { Navigate } from 'react-router-dom';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const RoleBasedRoute = ({ children, allowedRoles }: RoleBasedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard based on role
    if (role === 'admin') return <Navigate to="/dashboard/admin" replace />;
    if (role === 'broker') return <Navigate to="/dashboard/broker" replace />;
    if (role === 'client') return <Navigate to="/dashboard/client" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
