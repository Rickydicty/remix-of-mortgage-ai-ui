import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, FileText, CheckCircle, Clock, TrendingUp, 
  AlertTriangle, Home, PenTool, BarChart3
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const AnalyticsDashboard = () => {
  // Fetch all analytics data
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: totalApplications },
        { data: applications },
        { data: documents },
        { data: signatures },
        { data: valuations },
        { data: loanOffers },
        { data: userRoles },
        { data: preEligibility }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('applications').select('*', { count: 'exact', head: true }),
        supabase.from('applications').select('id, status, aip_status, created_at, aip_approved_amount'),
        supabase.from('documents').select('id, status, document_type, created_at'),
        supabase.from('signatures').select('id, document_type, signed_at'),
        supabase.from('valuations').select('id, status, valuation_amount, created_at'),
        supabase.from('loan_offers').select('id, status, offer_amount, lender_name, created_at'),
        supabase.from('user_roles').select('id, role, created_at'),
        supabase.from('pre_eligibility_data').select('id, eligibility_score, borrowing_capacity_high, created_at')
      ]);

      return {
        totalUsers: totalUsers || 0,
        totalApplications: totalApplications || 0,
        applications: applications || [],
        documents: documents || [],
        signatures: signatures || [],
        valuations: valuations || [],
        loanOffers: loanOffers || [],
        userRoles: userRoles || [],
        preEligibility: preEligibility || []
      };
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Calculate metrics
  const pendingApplications = stats?.applications.filter(a => a.status === 'pending' || a.status === 'draft').length || 0;
  const approvedApplications = stats?.applications.filter(a => a.aip_status === 'approved').length || 0;
  const inReviewApplications = stats?.applications.filter(a => a.status === 'in_review' || a.status === 'pending_review').length || 0;
  
  const totalDocuments = stats?.documents.length || 0;
  const approvedDocs = stats?.documents.filter(d => d.status === 'approved').length || 0;
  const pendingDocs = stats?.documents.filter(d => d.status === 'pending').length || 0;
  
  const totalSignatures = stats?.signatures.length || 0;
  const completedValuations = stats?.valuations.filter(v => v.status === 'completed').length || 0;
  
  const totalLoanValue = stats?.loanOffers.reduce((sum, o) => sum + (o.offer_amount || 0), 0) || 0;
  const totalAIPValue = stats?.applications.reduce((sum, a) => sum + (a.aip_approved_amount || 0), 0) || 0;
  
  // Role distribution
  const roleData = [
    { name: 'Clients', value: stats?.userRoles.filter(r => r.role === 'client').length || 0 },
    { name: 'Brokers', value: stats?.userRoles.filter(r => r.role === 'broker').length || 0 },
    { name: 'Admins', value: stats?.userRoles.filter(r => r.role === 'admin').length || 0 }
  ].filter(r => r.value > 0);

  // Application status distribution
  const applicationStatusData = [
    { name: 'Draft', value: stats?.applications.filter(a => a.status === 'draft').length || 0 },
    { name: 'Pending', value: stats?.applications.filter(a => a.status === 'pending').length || 0 },
    { name: 'In Review', value: inReviewApplications },
    { name: 'AIP Approved', value: approvedApplications }
  ].filter(s => s.value > 0);

  // Document type distribution
  const docTypes = stats?.documents.reduce((acc, doc) => {
    const type = doc.document_type || 'Other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const documentTypeData = Object.entries(docTypes).map(([name, value]) => ({ name, value })).slice(0, 6);

  // Applications over last 30 days
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date()
  });

  const applicationsOverTime = last30Days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const count = stats?.applications.filter(a => 
      format(new Date(a.created_at), 'yyyy-MM-dd') === dayStr
    ).length || 0;
    return { date: format(day, 'MMM dd'), applications: count };
  });

  // Eligibility score distribution
  const eligibilityRanges = [
    { range: '0-40', min: 0, max: 40 },
    { range: '41-60', min: 41, max: 60 },
    { range: '61-80', min: 61, max: 80 },
    { range: '81-100', min: 81, max: 100 }
  ];

  const eligibilityData = eligibilityRanges.map(({ range, min, max }) => ({
    range,
    count: stats?.preEligibility.filter(p => 
      (p.eligibility_score || 0) >= min && (p.eligibility_score || 0) <= max
    ).length || 0
  }));

  // Lender distribution
  const lenderCounts = stats?.loanOffers.reduce((acc, offer) => {
    const lender = offer.lender_name || 'Unknown';
    acc[lender] = (acc[lender] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const lenderData = Object.entries(lenderCounts)
    .map(([name, value]) => ({ name, offers: value }))
    .sort((a, b) => b.offers - a.offers)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold text-foreground">{stats?.totalUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {roleData.find(r => r.name === 'Clients')?.value || 0} clients, {roleData.find(r => r.name === 'Brokers')?.value || 0} brokers
                </p>
              </div>
              <Users className="h-10 w-10 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Applications</p>
                <p className="text-3xl font-bold text-foreground">{stats?.totalApplications}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {approvedApplications} approved, {pendingApplications} pending
                </p>
              </div>
              <FileText className="h-10 w-10 text-chart-2/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-3">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total AIP Value</p>
                <p className="text-3xl font-bold text-foreground">€{(totalAIPValue / 1000000).toFixed(2)}M</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {approvedApplications} approved AIPs
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-chart-3/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Documents</p>
                <p className="text-3xl font-bold text-foreground">{totalDocuments}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {approvedDocs} approved, {pendingDocs} pending
                </p>
              </div>
              <FileText className="h-10 w-10 text-chart-4/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <PenTool className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">E-Signatures</p>
                <p className="text-2xl font-bold">{totalSignatures}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-2/10 rounded-lg">
                <Home className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valuations</p>
                <p className="text-2xl font-bold">{completedValuations}/{stats?.valuations.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-3/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Loan Offers</p>
                <p className="text-2xl font-bold">{stats?.loanOffers.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-4/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pre-Eligibility Checks</p>
                <p className="text-2xl font-bold">{stats?.preEligibility.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Applications (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={applicationsOverTime}>
                  <defs>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                    className="text-muted-foreground"
                  />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="applications" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorApps)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center">
              {roleData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {roleData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground">No user data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* More Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Application Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {applicationStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={applicationStatusData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-muted-foreground" />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No application data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Eligibility Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Eligibility Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eligibilityData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="range" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document and Lender Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Documents by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {documentTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={documentTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name.substring(0, 10)}...: ${value}`}
                    >
                      {documentTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No document data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Loan Offers by Lender</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {lenderData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lenderData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="offers" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No loan offer data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
