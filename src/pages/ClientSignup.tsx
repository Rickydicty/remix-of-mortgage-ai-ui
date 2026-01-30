import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { emailTemplates } from "@/lib/emailTemplates";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface EligibilityData {
  applicantType: string;
  employmentType: string;
  income1: number;
  income2: number | null;
  monthlyCommitments: number;
  depositAmount: number;
  propertyValue: number;
  residencyStatus: string;
  creditHistory: string;
  firstTimeBuyer: boolean;
  desiredTerm: number;
  phone: string | null;
  email: string | null;
  borrowingCapacityLow: number;
  borrowingCapacityHigh: number;
  estimatedMonthlyPayment: number;
  eligibilityScore: number;
}

const ClientSignup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [eligibilityData, setEligibilityData] = useState<EligibilityData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dashboard/client");
      return;
    }

    // Check for eligibility data
    const storedData = localStorage.getItem('pendingEligibilityData');
    if (!storedData) {
      toast({
        title: "Eligibility check required",
        description: "Please complete the eligibility check first.",
        variant: "destructive",
      });
      navigate("/pre-eligibility");
      return;
    }

    try {
      const data = JSON.parse(storedData) as EligibilityData;
      if (data.eligibilityScore < 50) {
        toast({
          title: "Not eligible",
          description: "You don't meet the minimum eligibility requirements.",
          variant: "destructive",
        });
        navigate("/pre-eligibility");
        return;
      }
      setEligibilityData(data);
      // Pre-fill email and phone if provided in eligibility
      if (data.email) {
        setFormData(prev => ({ ...prev, email: data.email! }));
      }
      if (data.phone) {
        setFormData(prev => ({ ...prev, phone: data.phone! }));
      }
    } catch {
      navigate("/pre-eligibility");
    }
  }, [user, navigate, toast]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eligibilityData) {
      toast({
        title: "Error",
        description: "Eligibility data not found. Please complete the eligibility check.",
        variant: "destructive",
      });
      navigate("/pre-eligibility");
      return;
    }

    try {
      const validated = signupSchema.parse(formData);
      setLoading(true);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            full_name: validated.name,
            phone: validated.phone,
            role: 'client',
          },
        },
      });

      if (authError) {
        toast({
          title: "Signup failed",
          description: authError.message,
          variant: "destructive",
        });
        return;
      }

      // Send notification emails via SendGrid
      // 1. Send welcome email to the user
      try {
        console.log('Sending welcome email to user...');
        await supabase.functions.invoke('send-notification', {
          body: {
            notification_type: 'user_welcome',
            recipient_email: validated.email,
            subject: 'Welcome to YourKey Mortgages!',
            html_content: `
              <h2>Welcome to YourKey Mortgages, ${validated.name}!</h2>
              <p>Thank you for signing up. Your account has been successfully created.</p>
              <h3>Your Details:</h3>
              <ul>
                <li><strong>Email:</strong> ${validated.email}</li>
                <li><strong>Eligibility Score:</strong> ${eligibilityData.eligibilityScore}%</li>
                <li><strong>Borrowing Capacity:</strong> €${eligibilityData.borrowingCapacityLow.toLocaleString()} - €${eligibilityData.borrowingCapacityHigh.toLocaleString()}</li>
              </ul>
              <p>You can now log in to your dashboard to continue your mortgage application.</p>
              <p><a href="${window.location.origin}/login">Log in to your account</a></p>
              <p>If you have any questions, please don't hesitate to contact us.</p>
              <p>Best regards,<br>The YourKey Team</p>
            `,
          },
        });
        console.log('Welcome email sent to user');
      } catch (error) {
        console.error('Failed to send welcome email:', error);
      }

      // 2. Send admin notification
      try {
        console.log('Sending admin notification...');
        const { data: notificationData, error: notificationError } = await supabase.functions.invoke('send-notification', {
          body: {
            notification_type: 'new_client_signup',
            subject: `New Client Signup: ${validated.name}`,
            html_content: emailTemplates.newClientSignup({
              clientName: validated.name,
              clientEmail: validated.email,
              clientPhone: validated.phone,
              eligibilityScore: eligibilityData.eligibilityScore,
              applicantType: eligibilityData.applicantType,
              employmentType: eligibilityData.employmentType,
              borrowingCapacityLow: eligibilityData.borrowingCapacityLow,
              borrowingCapacityHigh: eligibilityData.borrowingCapacityHigh,
              propertyValue: eligibilityData.propertyValue,
              depositAmount: eligibilityData.depositAmount,
              firstTimeBuyer: eligibilityData.firstTimeBuyer,
              dashboardUrl: `${window.location.origin}/login`,
            }),
            event_data: {
              client_name: validated.name,
              client_email: validated.email,
              client_phone: validated.phone,
              eligibility_score: eligibilityData.eligibilityScore,
            },
          },
        });
        
        if (notificationError) {
          console.error('Admin notification error:', notificationError);
        } else {
          console.log('Admin notification sent:', notificationData);
        }
      } catch (error) {
        console.error('Failed to send admin notification:', error);
      }

      // If user was created, save the eligibility data
      if (authData.user) {
        const { error: eligibilityError } = await supabase
          .from('pre_eligibility_data')
          .insert({
            user_id: authData.user.id,
            applicant_type: eligibilityData.applicantType,
            employment_type: eligibilityData.employmentType,
            income_1: eligibilityData.income1,
            income_2: eligibilityData.income2,
            monthly_commitments: eligibilityData.monthlyCommitments,
            deposit_amount: eligibilityData.depositAmount,
            property_value: eligibilityData.propertyValue,
            residency_status: eligibilityData.residencyStatus,
            credit_history: eligibilityData.creditHistory,
            first_time_buyer: eligibilityData.firstTimeBuyer,
            desired_term: eligibilityData.desiredTerm,
            phone: validated.phone,
            email: validated.email,
            borrowing_capacity_low: eligibilityData.borrowingCapacityLow,
            borrowing_capacity_high: eligibilityData.borrowingCapacityHigh,
            estimated_monthly_payment: eligibilityData.estimatedMonthlyPayment,
            eligibility_score: eligibilityData.eligibilityScore,
          });

        if (eligibilityError) {
          console.error("Error saving eligibility data:", eligibilityError);
          // Don't block signup if this fails, but log it
        }
      }

      // Clear the stored eligibility data
      localStorage.removeItem('pendingEligibilityData');

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
      
      navigate("/login");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!eligibilityData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center relative">
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute left-4 top-4"
            onClick={() => navigate("/pre-eligibility")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Home className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle>Client Registration</CardTitle>
          <CardDescription>Complete your registration to continue</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Eligibility Summary */}
          <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="font-medium text-success">Eligibility Confirmed</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Score: <span className="font-medium">{eligibilityData.eligibilityScore}%</span></p>
              <p>Borrowing Capacity: <span className="font-medium">€{eligibilityData.borrowingCapacityLow.toLocaleString()} - €{eligibilityData.borrowingCapacityHigh.toLocaleString()}</span></p>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+353 123 456 789"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Client Account"}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button variant="link" className="p-0" onClick={() => navigate("/login")}>
                Sign in
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientSignup;
