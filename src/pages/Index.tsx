import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Building2, Calculator, Users, TrendingUp } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">AI Mortgage Platform</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Login
            </Button>
            <Button onClick={() => navigate("/signup")}>
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-foreground mb-6">
          Get Your Mortgage Approved Faster with AI
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Instant eligibility checks, smart document processing, and real-time lender matching. 
          Experience the future of mortgage applications.
        </p>
        <Button size="lg" onClick={() => navigate("/pre-eligibility")}>
          <Calculator className="mr-2 h-5 w-5" />
          Check Eligibility Now
        </Button>
      </section>

      {/* Features */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <Calculator className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Instant Pre-Approval</h3>
              <p className="text-muted-foreground">
                Get your borrowing capacity and indicative rates in seconds with our AI-powered eligibility checker.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <TrendingUp className="h-12 w-12 text-secondary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Smart Lender Matching</h3>
              <p className="text-muted-foreground">
                Our AI analyzes your profile against all lenders to find your best mortgage options automatically.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <Users className="h-12 w-12 text-success mb-4" />
              <h3 className="text-xl font-semibold mb-2">Expert Support</h3>
              <p className="text-muted-foreground">
                Work with experienced brokers backed by AI tools to streamline your entire mortgage journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
        <p className="text-muted-foreground mb-8">Takes less than 5 minutes</p>
        <Button size="lg" onClick={() => navigate("/pre-eligibility")}>
          Start Your Application
        </Button>
      </section>
    </div>
  );
};

export default Index;
