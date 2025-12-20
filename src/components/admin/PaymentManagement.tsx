import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StripeCustomer {
  id: string;
  email: string;
  name: string | null;
  created: number;
}

interface StripePayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  customer: string | null;
}

const PaymentManagement = () => {
  const [customers, setCustomers] = useState<StripeCustomer[]>([]);
  const [payments, setPayments] = useState<StripePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalPayments: 0,
    totalCustomers: 0,
  });

  useEffect(() => {
    fetchStripeData();
  }, []);

  const fetchStripeData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-stripe-data');
      
      if (error) throw error;

      if (data) {
        setCustomers(data.customers || []);
        setPayments(data.payments || []);
        
        // Calculate stats from one-time payments only
        const totalRevenue = (data.payments || [])
          .filter((p: StripePayment) => p.status === 'succeeded')
          .reduce((sum: number, p: StripePayment) => sum + p.amount, 0);
        
        setStats({
          totalRevenue: totalRevenue / 100, // Convert from cents
          totalPayments: (data.payments || []).filter((p: StripePayment) => p.status === 'succeeded').length,
          totalCustomers: (data.customers || []).length,
        });
      }
    } catch (error) {
      console.error('Error fetching Stripe data:', error);
      toast.error("Failed to load payment data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-IE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From application fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPayments}</div>
            <p className="text-xs text-muted-foreground">Successful payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Registered in Stripe</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No payments found
                  </TableCell>
                </TableRow>
              ) : (
                payments.slice(0, 10).map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.created)}</TableCell>
                    <TableCell>{formatCurrency(payment.amount / 100)}</TableCell>
                    <TableCell>
                      <Badge variant={payment.status === 'succeeded' ? 'default' : 'secondary'}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{payment.id}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                customers.slice(0, 10).map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.name || '-'}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{formatDate(customer.created)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentManagement;
