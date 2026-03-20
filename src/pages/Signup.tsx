import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

const Signup = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!authLoading && user && !roleLoading && role) {
      if (role === 'admin') navigate("/dashboard/admin", { replace: true });
      else if (role === 'broker') navigate("/dashboard/broker", { replace: true });
      else navigate("/dashboard/client", { replace: true });
      return;
    }
    // If not logged in, redirect straight to client signup
    if (!authLoading && !user) {
      navigate("/signup/client", { replace: true });
    }
  }, [user, role, authLoading, roleLoading, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
};

export default Signup;
