import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Globe, Activity, FileText, TrendingUp, BookOpen, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Tab Components
import BrokerWebTab from "@/components/broker/WebTab";
import BrokerTrackerTab from "@/components/broker/TrackerTab";
import BrokerApplicationTab from "@/components/broker/ApplicationTab";
import BrokerRatesTab from "@/components/broker/RatesTab";
import BrokerLibraryTab from "@/components/broker/LibraryTab";
import BrokerAIPPage from "@/pages/BrokerAIPPage";

const BrokerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  };

  const tabs = [
    { id: "web", label: "Web", icon: Globe, path: "/dashboard/broker" },
    { id: "tracker", label: "Tracker", icon: Activity, path: "/dashboard/broker/tracker" },
    { id: "application", label: "Application", icon: FileText, path: "/dashboard/broker/application" },
    { id: "rates", label: "Mortgage Rates", icon: TrendingUp, path: "/dashboard/broker/rates" },
    { id: "library", label: "Library", icon: BookOpen, path: "/dashboard/broker/library" },
  ];

  const isActiveTab = (path: string) => {
    if (path === "/dashboard/broker") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Broker Portal</h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-border bg-card sticky top-[73px] z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActiveTab(tab.path);
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route index element={<BrokerWebTab />} />
          <Route path="tracker" element={<BrokerTrackerTab />} />
          <Route path="application/*" element={<BrokerApplicationTab />} />
          <Route path="aip/:applicationId" element={<BrokerAIPPage />} />
          <Route path="rates" element={<BrokerRatesTab />} />
          <Route path="library" element={<BrokerLibraryTab />} />
        </Routes>
      </div>
    </div>
  );
};

export default BrokerDashboard;
