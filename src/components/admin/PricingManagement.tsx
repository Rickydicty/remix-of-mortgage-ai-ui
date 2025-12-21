import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Edit, Plus, CreditCard, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
}

interface StripePrice {
  id: string;
  product: string;
  unit_amount: number;
  currency: string;
  recurring?: {
    interval: string;
  };
  active: boolean;
}

interface StripeCustomer {
  id: string;
  email: string;
  name: string | null;
  created: number;
}

interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_end: number;
  items: {
    data: Array<{
      price: {
        product: string;
        unit_amount: number;
      };
    }>;
  };
}

const PricingManagement = () => {
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [prices, setPrices] = useState<StripePrice[]>([]);
  const [customers, setCustomers] = useState<StripeCustomer[]>([]);
  const [subscriptions, setSubscriptions] = useState<StripeSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubscriptions: 0,
    totalCustomers: 0,
  });

  useEffect(() => {
    fetchStripeData();
  }, []);

  const fetchStripeData = async () => {
    setLoading(true);
    try {
      // Fetch products
      const { data: productsData, error: productsError } = await supabase.functions.invoke('admin-stripe-data', {
        body: { action: 'list_products' }
      });
      if (!productsError && productsData?.products) {
        setProducts(productsData.products);
      }

      // Fetch prices
      const { data: pricesData, error: pricesError } = await supabase.functions.invoke('admin-stripe-data', {
        body: { action: 'list_prices' }
      });
      if (!pricesError && pricesData?.prices) {
        setPrices(pricesData.prices);
      }

      // Fetch customers
      const { data: customersData, error: customersError } = await supabase.functions.invoke('admin-stripe-data', {
        body: { action: 'list_customers' }
      });
      if (!customersError && customersData?.customers) {
        setCustomers(customersData.customers);
      }

      // Fetch subscriptions
      const { data: subsData, error: subsError } = await supabase.functions.invoke('admin-stripe-data', {
        body: { action: 'list_subscriptions' }
      });
      if (!subsError && subsData?.subscriptions) {
        setSubscriptions(subsData.subscriptions);
        
        // Calculate stats
        const activeSubs = subsData.subscriptions.filter((s: StripeSubscription) => s.status === 'active');
        const monthlyRevenue = activeSubs.reduce((sum: number, sub: StripeSubscription) => {
          return sum + (sub.items.data[0]?.price.unit_amount || 0) / 100;
        }, 0);

        setStats({
          totalRevenue: monthlyRevenue,
          activeSubscriptions: activeSubs.length,
          totalCustomers: customersData?.customers?.length || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching Stripe data:', error);
      toast.error("Failed to load Stripe data");
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || productId;
  };

  const formatCurrency = (amount: number, currency: string = 'eur') => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-IE');
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
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From active subscriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">Recurring payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">In Stripe</p>
          </CardContent>
        </Card>
      </div>

      {/* Products & Prices */}
      <Card>
        <CardHeader>
          <CardTitle>Products & Pricing</CardTitle>
          <CardDescription>Manage your Stripe products and their prices</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map(product => {
                const productPrices = prices.filter(p => p.product === product.id);
                return productPrices.map(price => (
                  <TableRow key={price.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {product.description || '-'}
                    </TableCell>
                    <TableCell>{formatCurrency(price.unit_amount, price.currency)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {price.recurring ? `${price.recurring.interval}ly` : 'One-time'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={price.active ? "default" : "secondary"}>
                        {price.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ));
              })}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No products found. Create products in Stripe Dashboard.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer">
                <Edit className="h-4 w-4 mr-2" />
                Manage in Stripe Dashboard
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Customers</CardTitle>
          <CardDescription>Latest customers in Stripe</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.slice(0, 10).map(customer => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.email}</TableCell>
                  <TableCell>{customer.name || '-'}</TableCell>
                  <TableCell>{formatDate(customer.created)}</TableCell>
                </TableRow>
              ))}
              {customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No customers yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingManagement;
