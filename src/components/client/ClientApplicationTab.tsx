import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Save, User, Briefcase, CreditCard, Home, FileText } from "lucide-react";

interface PreEligibilityData {
  applicant_type: string;
  employment_type: string;
  residency_status: string;
  credit_history: string;
  income_1: number;
  income_2: number | null;
  monthly_commitments: number;
  property_value: number;
  deposit_amount: number;
  first_time_buyer: boolean;
  desired_term: number;
  phone: string | null;
  email: string | null;
}

interface Profile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

interface ClientApplicationTabProps {
  applicationId: string | null;
}

const ClientApplicationTab = ({ applicationId }: ClientApplicationTabProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState("personal");
  const [preEligibilityData, setPreEligibilityData] = useState<PreEligibilityData | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Personal Details
    title: "Mr",
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "Male",
    maritalStatus: "Single",
    nationality: "Irish",
    countryOfBirth: "Ireland",
    ppsNumber: "",
    phone: "",
    email: "",
    address: "",
    yearsAtAddress: "",
    
    // Income & Employment
    employmentStatus: "",
    employerName: "",
    jobTitle: "",
    yearsEmployed: "",
    grossIncome: "",
    netIncome: "",
    otherIncome: "",
    
    // Financial
    monthlyExpenses: "",
    existingLoans: "",
    creditCards: "",
    savings: "",
    
    // Mortgage
    propertyValue: "",
    depositAmount: "",
    loanAmount: "",
    term: "",
    mortgageType: "First Time Buyer",
    
    // Property
    propertyType: "House",
    propertyAddress: "",
    berRating: "",
    yearBuilt: "",
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        // Parse name
        const nameParts = profileData.full_name?.split(' ') || [];
        setFormData(prev => ({
          ...prev,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
        }));
      }

      // Fetch pre-eligibility data
      const { data: preElig } = await supabase
        .from('pre_eligibility_data')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (preElig) {
        setPreEligibilityData(preElig);
        setFormData(prev => ({
          ...prev,
          employmentStatus: preElig.employment_type || '',
          grossIncome: preElig.income_1?.toString() || '',
          otherIncome: preElig.income_2?.toString() || '',
          monthlyExpenses: preElig.monthly_commitments?.toString() || '',
          propertyValue: preElig.property_value?.toString() || '',
          depositAmount: preElig.deposit_amount?.toString() || '',
          loanAmount: (preElig.property_value - preElig.deposit_amount)?.toString() || '',
          term: preElig.desired_term?.toString() || '',
          mortgageType: preElig.first_time_buyer ? 'First Time Buyer' : 'Mover',
          phone: preElig.phone || prev.phone,
          email: preElig.email || prev.email,
        }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: `${formData.firstName} ${formData.lastName}`.trim(),
          phone: formData.phone,
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Update pre-eligibility data if exists
      if (preEligibilityData) {
        const { error: preEligError } = await supabase
          .from('pre_eligibility_data')
          .update({
            employment_type: formData.employmentStatus,
            income_1: parseFloat(formData.grossIncome) || 0,
            income_2: parseFloat(formData.otherIncome) || null,
            monthly_commitments: parseFloat(formData.monthlyExpenses) || 0,
            property_value: parseFloat(formData.propertyValue) || 0,
            deposit_amount: parseFloat(formData.depositAmount) || 0,
            desired_term: parseInt(formData.term) || 25,
            phone: formData.phone,
            email: formData.email,
          })
          .eq('user_id', user?.id);

        if (preEligError) throw preEligError;
      }

      toast({
        title: "Changes saved",
        description: "Your application details have been updated.",
      });
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Sub Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-5 mb-4">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="income" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Income
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="mortgage" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Mortgage
          </TabsTrigger>
          <TabsTrigger value="property" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Property
          </TabsTrigger>
        </TabsList>

        {/* Personal Details Tab */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Select value={formData.title} onValueChange={(v) => handleInputChange('title', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr">Mr</SelectItem>
                      <SelectItem value="Mrs">Mrs</SelectItem>
                      <SelectItem value="Ms">Ms</SelectItem>
                      <SelectItem value="Dr">Dr</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input 
                    value={formData.firstName} 
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="First Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <Input 
                    value={formData.middleName} 
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                    placeholder="Middle Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input 
                    value={formData.lastName} 
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Last Name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input 
                    type="date"
                    value={formData.dateOfBirth} 
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={formData.gender} onValueChange={(v) => handleInputChange('gender', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Marital Status</Label>
                  <Select value={formData.maritalStatus} onValueChange={(v) => handleInputChange('maritalStatus', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Married">Married</SelectItem>
                      <SelectItem value="Divorced">Divorced</SelectItem>
                      <SelectItem value="Widowed">Widowed</SelectItem>
                      <SelectItem value="Civil Partnership">Civil Partnership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <Select value={formData.nationality} onValueChange={(v) => handleInputChange('nationality', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Irish">Irish</SelectItem>
                      <SelectItem value="British">British</SelectItem>
                      <SelectItem value="EU Citizen">EU Citizen</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Country of Birth</Label>
                  <Input 
                    value={formData.countryOfBirth} 
                    onChange={(e) => handleInputChange('countryOfBirth', e.target.value)}
                    placeholder="Country of Birth"
                  />
                </div>
                <div className="space-y-2">
                  <Label>PPS Number</Label>
                  <Input 
                    value={formData.ppsNumber} 
                    onChange={(e) => handleInputChange('ppsNumber', e.target.value)}
                    placeholder="PPS Number"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <Input 
                      value={formData.phone} 
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Phone Number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address *</Label>
                    <Input 
                      type="email"
                      value={formData.email} 
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Email Address"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Current Address</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Textarea 
                      value={formData.address} 
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Full Address"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2 md:w-1/3">
                    <Label>Years at Current Address</Label>
                    <Input 
                      type="number"
                      value={formData.yearsAtAddress} 
                      onChange={(e) => handleInputChange('yearsAtAddress', e.target.value)}
                      placeholder="Years"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Income & Employment Tab */}
        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle>Income & Employment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employment Status *</Label>
                  <Select value={formData.employmentStatus} onValueChange={(v) => handleInputChange('employmentStatus', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employed">Employed (PAYE)</SelectItem>
                      <SelectItem value="self-employed">Self-Employed</SelectItem>
                      <SelectItem value="contractor">Contractor</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                      <SelectItem value="unemployed">Unemployed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Years in Current Employment</Label>
                  <Input 
                    type="number"
                    value={formData.yearsEmployed} 
                    onChange={(e) => handleInputChange('yearsEmployed', e.target.value)}
                    placeholder="Years"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employer Name</Label>
                  <Input 
                    value={formData.employerName} 
                    onChange={(e) => handleInputChange('employerName', e.target.value)}
                    placeholder="Employer Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Job Title / Position</Label>
                  <Input 
                    value={formData.jobTitle} 
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    placeholder="Job Title"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Income Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Gross Annual Income (€) *</Label>
                    <Input 
                      type="number"
                      value={formData.grossIncome} 
                      onChange={(e) => handleInputChange('grossIncome', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Net Monthly Income (€)</Label>
                    <Input 
                      type="number"
                      value={formData.netIncome} 
                      onChange={(e) => handleInputChange('netIncome', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Other Income (€)</Label>
                    <Input 
                      type="number"
                      value={formData.otherIncome} 
                      onChange={(e) => handleInputChange('otherIncome', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle>Financial & Credit History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monthly Expenses / Commitments (€) *</Label>
                  <Input 
                    type="number"
                    value={formData.monthlyExpenses} 
                    onChange={(e) => handleInputChange('monthlyExpenses', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Existing Loans (€)</Label>
                  <Input 
                    type="number"
                    value={formData.existingLoans} 
                    onChange={(e) => handleInputChange('existingLoans', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Credit Card Balance (€)</Label>
                  <Input 
                    type="number"
                    value={formData.creditCards} 
                    onChange={(e) => handleInputChange('creditCards', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Savings (€)</Label>
                  <Input 
                    type="number"
                    value={formData.savings} 
                    onChange={(e) => handleInputChange('savings', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Credit History</h4>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="ccjs" />
                    <Label htmlFor="ccjs">Any CCJs, IVAs, or bankruptcies in the last 6 years?</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="defaults" />
                    <Label htmlFor="defaults">Any missed payments or defaults in the last 3 years?</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="currentDebt" />
                    <Label htmlFor="currentDebt">Are you currently in arrears on any credit agreements?</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mortgage Details Tab */}
        <TabsContent value="mortgage">
          <Card>
            <CardHeader>
              <CardTitle>Mortgage Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mortgage Type</Label>
                  <Select value={formData.mortgageType} onValueChange={(v) => handleInputChange('mortgageType', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First Time Buyer">First Time Buyer</SelectItem>
                      <SelectItem value="Mover">Mover</SelectItem>
                      <SelectItem value="Switcher">Switcher</SelectItem>
                      <SelectItem value="Remortgage">Remortgage</SelectItem>
                      <SelectItem value="Buy to Let">Buy to Let</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mortgage Term (Years) *</Label>
                  <Input 
                    type="number"
                    value={formData.term} 
                    onChange={(e) => handleInputChange('term', e.target.value)}
                    placeholder="25"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Property Value (€) *</Label>
                  <Input 
                    type="number"
                    value={formData.propertyValue} 
                    onChange={(e) => handleInputChange('propertyValue', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deposit Amount (€) *</Label>
                  <Input 
                    type="number"
                    value={formData.depositAmount} 
                    onChange={(e) => handleInputChange('depositAmount', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Loan Amount Required (€)</Label>
                  <Input 
                    type="number"
                    value={formData.loanAmount} 
                    onChange={(e) => handleInputChange('loanAmount', e.target.value)}
                    placeholder="0"
                    className="bg-muted"
                    readOnly
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Loan-to-Value (LTV)</h4>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Calculated LTV:</span>
                    <span className="text-xl font-bold">
                      {formData.propertyValue && formData.depositAmount
                        ? (((parseFloat(formData.propertyValue) - parseFloat(formData.depositAmount)) / parseFloat(formData.propertyValue)) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Property Details Tab */}
        <TabsContent value="property">
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Property Type</Label>
                  <Select value={formData.propertyType} onValueChange={(v) => handleInputChange('propertyType', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="House">House</SelectItem>
                      <SelectItem value="Apartment">Apartment</SelectItem>
                      <SelectItem value="Duplex">Duplex</SelectItem>
                      <SelectItem value="Bungalow">Bungalow</SelectItem>
                      <SelectItem value="Townhouse">Townhouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year Built</Label>
                  <Input 
                    type="number"
                    value={formData.yearBuilt} 
                    onChange={(e) => handleInputChange('yearBuilt', e.target.value)}
                    placeholder="e.g. 2010"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Property Address</Label>
                <Textarea 
                  value={formData.propertyAddress} 
                  onChange={(e) => handleInputChange('propertyAddress', e.target.value)}
                  placeholder="Full property address (if known)"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>BER Rating</Label>
                  <Select value={formData.berRating} onValueChange={(v) => handleInputChange('berRating', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A1">A1</SelectItem>
                      <SelectItem value="A2">A2</SelectItem>
                      <SelectItem value="A3">A3</SelectItem>
                      <SelectItem value="B1">B1</SelectItem>
                      <SelectItem value="B2">B2</SelectItem>
                      <SelectItem value="B3">B3</SelectItem>
                      <SelectItem value="C1">C1</SelectItem>
                      <SelectItem value="C2">C2</SelectItem>
                      <SelectItem value="C3">C3</SelectItem>
                      <SelectItem value="D1">D1</SelectItem>
                      <SelectItem value="D2">D2</SelectItem>
                      <SelectItem value="E1">E1</SelectItem>
                      <SelectItem value="E2">E2</SelectItem>
                      <SelectItem value="F">F</SelectItem>
                      <SelectItem value="G">G</SelectItem>
                      <SelectItem value="Unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Property Features</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="newBuild" />
                    <Label htmlFor="newBuild">New Build</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="selfBuild" />
                    <Label htmlFor="selfBuild">Self Build</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="renovation" />
                    <Label htmlFor="renovation">Needs Renovation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="listed" />
                    <Label htmlFor="listed">Listed Building</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientApplicationTab;
