import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Upload, FileText, Bot } from "lucide-react";

const BrokerLibraryTab = () => {
  // TODO: Fetch document templates from database or storage
  const templates: any[] = [];

  return (
    <div className="space-y-6">
      {/* Search & Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Document Library</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search templates, checklists, forms..." className="pl-10" />
            </div>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Template Categories */}
      {templates.map((category) => (
        <Card key={category.category}>
          <CardHeader>
            <CardTitle className="text-lg">{category.category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {category.items.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.type}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                  <Button size="sm" variant="outline">
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* AI Smart Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-secondary" />
            AI Smart Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate custom documents using AI based on client data
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-medium mb-2">Generate Cover Letter</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Auto-generate lender submission cover letter with client details
              </p>
              <Button size="sm" className="w-full">
                Generate
              </Button>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-medium mb-2">Create Client Summary</h4>
              <p className="text-sm text-muted-foreground mb-3">
                AI-powered application summary for internal use
              </p>
              <Button size="sm" className="w-full">
                Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Training Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Training & FAQ Bot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Quick Help</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Ask the AI assistant about lender criteria, processes, or compliance
            </p>
            <Input placeholder="e.g., What documents does Haven need for self-employed?" />
            <Button size="sm" className="mt-2">
              Ask AI
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrokerLibraryTab;
