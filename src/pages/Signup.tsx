import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Building2, Home, Briefcase, ArrowRight } from "lucide-react";
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
    }
  }, [user, role, authLoading, roleLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Create Your Account</h1>
          <p className="text-muted-foreground">Choose how you'd like to join us</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Client Card */}
          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate("/signup/client")}>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                  <Home className="h-10 w-10 text-primary" />
                </div>
              </div>
              <CardTitle className="text-xl">I'm a Client</CardTitle>
              <CardDescription>
                Looking to get a mortgage for my property
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  Apply for mortgage pre-approval
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  Upload and manage documents
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  Track your application status
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  Compare loan offers
                </li>
              </ul>
              <Button className="w-full group-hover:bg-primary/90">
                Sign Up as Client
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Broker Card */}
          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate("/signup/broker")}>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-secondary/50 rounded-full group-hover:bg-secondary/70 transition-colors">
                  <Briefcase className="h-10 w-10 text-secondary-foreground" />
                </div>
              </div>
              <CardTitle className="text-xl">I'm a Broker</CardTitle>
              <CardDescription>
                Mortgage professional looking to manage clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-secondary-foreground" />
                  Manage client applications
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-secondary-foreground" />
                  Review and approve documents
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-secondary-foreground" />
                  Upload loan offers
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-secondary-foreground" />
                  Commission-based earnings
                </li>
              </ul>
              <Button variant="secondary" className="w-full">
                Sign Up as Broker
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Button variant="link" className="p-0" onClick={() => navigate("/login")}>
            Sign in
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
