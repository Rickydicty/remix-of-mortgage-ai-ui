import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Calculator,
  FileText,
  Upload,
  Search,
  UserCheck,
  Clock,
  CheckCircle,
  ArrowRight,
  Shield,
  FileCheck,
  Home,
  MessageSquare,
} from "lucide-react";

const HowItWorks = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: Calculator,
      number: "01",
      title: "Check Your Eligibility",
      description: "Answer a few quick questions about your income, employment, and deposit. Our AI instantly calculates your borrowing capacity and gives you a clear picture of what you can afford.",
      timeline: "~5 minutes",
      details: [
        "Single or joint application support",
        "Employed & self-employed options",
        "Instant borrowing capacity estimate",
        "No credit check required",
      ],
    },
    {
      icon: Upload,
      number: "02",
      title: "Upload Your Documents",
      description: "Upload your payslips, bank statements, proof of address, and ID. Our AI processes and validates each document automatically—no manual data entry needed.",
      timeline: "~15 minutes",
      details: [
        "AI-powered document analysis",
        "Automatic data extraction",
        "Real-time validation & feedback",
        "Secure encrypted storage",
      ],
    },
    {
      icon: FileText,
      number: "03",
      title: "Complete Your Application",
      description: "Fill in your personal, employment, mortgage, and property details across our staged forms. Progress is auto-saved so you never lose your work.",
      timeline: "~30 minutes",
      details: [
        "Before AIP: Personal, Employment, Bank, Mortgage, Property",
        "After AIP: Additional mortgage & property details",
        "After Offer: Direct debit, declarations, e-signatures",
        "Auto-save on every change",
      ],
    },
    {
      icon: Search,
      number: "04",
      title: "Broker Review",
      description: "Once submitted, a qualified mortgage broker reviews your application. They check documents, verify details, and prepare your case for lender submission.",
      timeline: "1–3 business days",
      details: [
        "Assigned broker reviews all documents",
        "AI flags potential issues for faster resolution",
        "Broker may request additional information",
        "Direct messaging with your broker",
      ],
    },
    {
      icon: FileCheck,
      number: "05",
      title: "Agreement in Principle (AIP)",
      description: "Your broker submits to lenders for an Agreement in Principle. This confirms how much you can borrow, subject to final checks and property valuation.",
      timeline: "3–10 business days",
      details: [
        "Lender assessment of your application",
        "AIP letter issued with approved amount",
        "Valid for 6 months typically",
        "Conditions may apply",
      ],
    },
    {
      icon: Home,
      number: "06",
      title: "Loan Offer & Drawdown",
      description: "After finding your property and completing valuation, your broker secures a formal loan offer. Final steps include solicitor work and drawdown.",
      timeline: "4–8 weeks",
      details: [
        "Property valuation arranged",
        "Formal loan offer from lender",
        "Solicitor handles legal work",
        "Funds released on closing day",
      ],
    },
  ];

  const documents = [
    { name: "Certified Photo ID", description: "Passport or driving licence" },
    { name: "Proof of Address", description: "Utility bill or bank statement (< 6 months)" },
    { name: "Payslips", description: "Last 3 months' payslips" },
    { name: "Bank Statements", description: "Last 6 months' current account statements" },
    { name: "Employment Summary", description: "Employment detail summary / salary cert" },
    { name: "P60 / Tax Returns", description: "Most recent P60 or Form 11 (self-employed)" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="p-2 bg-primary rounded-lg">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">HomePath</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")}>Login</Button>
            <Button onClick={() => navigate("/signup")}>Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 -z-10" />
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              How It Works
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              From your first eligibility check to getting the keys to your new home—here's exactly what to expect at every stage of your mortgage journey.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Timeline Steps */}
      <section className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="bg-primary/5 p-6 md:w-64 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-border">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        <step.icon className="h-7 w-7 text-primary" />
                      </div>
                      <span className="text-sm font-bold text-primary">{step.number}</span>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {step.timeline}
                      </div>
                    </div>
                    <div className="p-6 flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                      <p className="text-muted-foreground mb-4">{step.description}</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {step.details.map((detail) => (
                          <li key={detail} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                            <span className="text-foreground">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Required Documents */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3">Documents You'll Need</h2>
            <p className="text-muted-foreground">Have these ready to speed up your application. Our AI will guide you through each upload.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <Card key={doc.name} className="border-border/50">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Key Info */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-border/50 text-center">
            <CardContent className="p-6">
              <Shield className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">100% Secure</h3>
              <p className="text-sm text-muted-foreground">Bank-grade encryption protects all your data and documents.</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 text-center">
            <CardContent className="p-6">
              <MessageSquare className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Broker Support</h3>
              <p className="text-sm text-muted-foreground">Message your assigned broker directly through the platform.</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 text-center">
            <CardContent className="p-6">
              <UserCheck className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">No Obligation</h3>
              <p className="text-sm text-muted-foreground">Check your eligibility for free. No commitment until you're ready.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Check your eligibility in under 5 minutes. No credit check, no commitment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6" onClick={() => navigate("/pre-eligibility")}>
              <Calculator className="mr-2 h-5 w-5" />
              Check Eligibility
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate("/signup")}>
              Create Account
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <div className="p-2 bg-primary rounded-lg">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">HomePath</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 HomePath. AI-Powered Mortgage Platform for Ireland.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HowItWorks;
