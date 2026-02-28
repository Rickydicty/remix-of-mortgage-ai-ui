import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  Calculator, 
  FileCheck, 
  MessageSquare, 
  FileText, 
  Shield, 
  ArrowRight,
  CheckCircle,
  Sparkles,
  Users,
  Clock,
  TrendingUp
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Calculator,
      title: "Instant Eligibility Check",
      description: "Know your borrowing capacity in minutes with our AI-powered pre-qualification tool.",
    },
    {
      icon: Sparkles,
      title: "AI Document Processing",
      description: "Upload documents once. Our AI extracts, validates and organizes everything automatically.",
    },
    {
      icon: FileCheck,
      title: "Agreement in Principle",
      description: "Track your AIP status, view conditions, and download your approval letter instantly.",
    },
    {
      icon: MessageSquare,
      title: "AI Mortgage Assistant",
      description: "Get answers to your mortgage questions 24/7 with our intelligent chat assistant.",
    },
    {
      icon: TrendingUp,
      title: "Loan Offer Comparison",
      description: "Compare multiple lender offers side-by-side to find the best rates and terms.",
    },
    {
      icon: Shield,
      title: "Secure & Compliant",
      description: "Bank-grade security with full Irish regulatory compliance built-in.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Check Eligibility",
      description: "Answer a few quick questions to see how much you could borrow.",
    },
    {
      number: "02",
      title: "Upload Documents",
      description: "AI analyzes your payslips, bank statements, and ID in seconds.",
    },
    {
      number: "03",
      title: "Broker Review & AIP",
      description: "Your broker reviews your case and submits to lenders for approval.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">HomePath</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Login
            </Button>
            <Button onClick={() => navigate("/signup")}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 -z-10" />
        
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center md:text-left"
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                AI-Powered Mortgage Platform
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Let's Get You <span className="text-primary">Home</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
                From eligibility check to keys in hand. Smart document processing, 
                real-time updates, and expert broker support—all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button size="lg" className="text-lg px-8 py-6 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow" onClick={() => navigate("/pre-eligibility")}>
                  <Calculator className="mr-2 h-5 w-5" />
                  Check Eligibility
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={() => navigate("/login")}>
                  Continue Application
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-border/50">
                <img 
                  src="/bg-img.png" 
                  alt="Modern Mortgage Experience" 
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
              </div>
              
              {/* Floating Elements Animation */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 bg-card p-4 rounded-xl shadow-xl border border-border/50 hidden md:block z-20"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-success/10 p-2 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Eligibility Checked</p>
                    <p className="text-xs text-muted-foreground">Just now</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-8 -left-8 bg-card p-4 rounded-xl shadow-xl border border-border/50 hidden md:block z-20"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Best Rates</p>
                    <p className="text-xs text-muted-foreground">Updated daily</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-muted/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary">5 min</p>
              <p className="text-sm text-muted-foreground mt-1">Eligibility Check</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary">24/7</p>
              <p className="text-sm text-muted-foreground mt-1">AI Assistant</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary">100%</p>
              <p className="text-sm text-muted-foreground mt-1">Digital Process</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary">Secure</p>
              <p className="text-sm text-muted-foreground mt-1">Bank-Grade Security</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Three simple steps to your mortgage journey
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-primary">{step.number}</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(50%+3rem)] w-[calc(100%-6rem)] h-0.5 bg-border" />
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Button variant="outline" size="lg" onClick={() => navigate("/how-it-works")}>
            Learn More About the Process
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A complete digital mortgage experience powered by AI
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="border-border/50 bg-card hover:shadow-lg transition-all hover:-translate-y-1 h-full">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* For Brokers Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Users className="h-4 w-4" />
                For Mortgage Brokers
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Manage Applications Smarter
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                AI-powered insights, automated document extraction, and a complete 
                dashboard to manage your client pipeline efficiently.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "AI document analysis & auto-fill",
                  "Real-time eligibility calculations",
                  "AIP condition tracking",
                  "Client messaging portal",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" onClick={() => navigate("/broker-signup")}>
                Join as a Broker
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 border border-border">
              <div className="space-y-4">
                <div className="bg-card rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-medium text-foreground">Payslip Analysis</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Extracted: €4,500/month</span>
                    <span className="text-success">✓ Verified</span>
                  </div>
                </div>
                <div className="bg-card rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="h-5 w-5 text-secondary" />
                    <span className="font-medium text-foreground">Processing Time</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Average: 2.3 seconds per document
                  </div>
                </div>
                <div className="bg-card rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="h-5 w-5 text-success" />
                    <span className="font-medium text-foreground">Eligibility Score</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-success w-4/5 rounded-full" />
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">85% - Strong candidate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
            Check your eligibility in under 5 minutes. No commitment, no credit check.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8 py-6"
              onClick={() => navigate("/pre-eligibility")}
            >
              <Calculator className="mr-2 h-5 w-5" />
              Check Eligibility Now
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate("/signup")}
            >
              Create Account
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">HomePath</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 HomePath. AI-Powered Mortgage Platform for Ireland.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
