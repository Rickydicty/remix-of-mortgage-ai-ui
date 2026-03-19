import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, ChevronDown, ChevronUp, FileText, Upload, Edit, Send, Download, Calculator, MessageSquare } from "lucide-react";

export const ClientInstructions = () => {
  const [open, setOpen] = useState(false);

  const steps = [
    {
      icon: <Edit className="h-5 w-5 text-primary" />,
      title: "1. Complete Your Forms",
      description: "Navigate through Personal, Employment, Bank, Mortgage, and Property tabs to fill in your details. Forms auto-save after 3 seconds of inactivity.",
    },
    {
      icon: <Upload className="h-5 w-5 text-primary" />,
      title: "2. Upload Documents",
      description: "Go to the Documents tab. Use Smart Upload (AI auto-detects document type) or manual upload. Required documents are marked with a red badge.",
    },
    {
      icon: <Calculator className="h-5 w-5 text-primary" />,
      title: "3. Check Your Numbers",
      description: "Use the Rates & Cashback tab to compare mortgage rates, monthly payments, and cashback offers from Irish lenders.",
    },
    {
      icon: <Send className="h-5 w-5 text-primary" />,
      title: "4. Submit for Review",
      description: "Once all required documents are uploaded, click 'Submit for Review' on the Documents tab. Your broker will review everything.",
    },
    {
      icon: <MessageSquare className="h-5 w-5 text-primary" />,
      title: "5. Communicate with Your Broker",
      description: "Use the Broker Messages tab to send/receive messages. You'll see notifications when your broker responds.",
    },
    {
      icon: <Download className="h-5 w-5 text-primary" />,
      title: "6. Download Your Summary",
      description: "Download a PDF summary of your application at any time from the Documents tab. After AIP, your letter will appear there too.",
    },
    {
      icon: <FileText className="h-5 w-5 text-primary" />,
      title: "7. After AIP & Offer Stages",
      description: "After receiving your AIP, complete the 'After AIP' stage forms. After loan offer, complete Direct Debit, Declarations, and E-Signatures.",
    },
  ];

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="cursor-pointer pb-2" onClick={() => setOpen(!open)}>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            How to Use This Dashboard
          </span>
          <Button variant="ghost" size="sm">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg bg-card border border-border">
                <div className="shrink-0 mt-0.5">{step.icon}</div>
                <div>
                  <p className="font-semibold text-sm">{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export const BrokerInstructions = () => {
  const [open, setOpen] = useState(false);

  const steps = [
    {
      icon: <FileText className="h-5 w-5 text-primary" />,
      title: "1. Review Applications",
      description: "The Web tab shows all client applications. Unassigned ones appear first. Click 'Assign' to take ownership of an application.",
    },
    {
      icon: <Upload className="h-5 w-5 text-primary" />,
      title: "2. Review Documents",
      description: "Click 'Documents' on any application to review uploaded files. You can approve, reject, or request re-uploads.",
    },
    {
      icon: <MessageSquare className="h-5 w-5 text-primary" />,
      title: "3. Message Clients",
      description: "Click 'Message' on any application to communicate directly with the client about their application status or missing items.",
    },
    {
      icon: <Edit className="h-5 w-5 text-primary" />,
      title: "4. View Full Application",
      description: "Click 'View' to see the complete application form data, cover letter, and all details submitted by the client.",
    },
    {
      icon: <Calculator className="h-5 w-5 text-primary" />,
      title: "5. Mortgage Rates",
      description: "Use the Rates tab to compare current mortgage rates from different lenders and find the best option for your client.",
    },
    {
      icon: <Download className="h-5 w-5 text-primary" />,
      title: "6. Library & Resources",
      description: "The Library tab contains useful resources, templates, and reference materials for mortgage processing.",
    },
  ];

  return (
    <Card className="border-primary/20 bg-primary/5 mb-6">
      <CardHeader className="cursor-pointer pb-2" onClick={() => setOpen(!open)}>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Broker Portal Guide
          </span>
          <Button variant="ghost" size="sm">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg bg-card border border-border">
                <div className="shrink-0 mt-0.5">{step.icon}</div>
                <div>
                  <p className="font-semibold text-sm">{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
