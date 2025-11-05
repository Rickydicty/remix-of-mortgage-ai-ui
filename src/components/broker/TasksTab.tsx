import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Bell, Bot } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

const BrokerTasksTab = () => {
  const tasks = [
    {
      id: "1",
      client: "John Doe",
      task: "Review bank statements",
      priority: "high",
      dueDate: "Today",
      status: "pending" as const,
      aiAdded: true,
    },
    {
      id: "2",
      client: "Emma Walsh",
      task: "Request additional payslips",
      priority: "medium",
      dueDate: "Tomorrow",
      status: "pending" as const,
      aiAdded: false,
    },
    {
      id: "3",
      client: "Michael Ryan",
      task: "Schedule valuation",
      priority: "high",
      dueDate: "Dec 20",
      status: "in-progress" as const,
      aiAdded: false,
    },
    {
      id: "4",
      client: "Sarah Johnson",
      task: "Clarify employment gap",
      priority: "low",
      dueDate: "Dec 22",
      status: "pending" as const,
      aiAdded: true,
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-destructive";
      case "medium":
        return "text-warning";
      case "low":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Task Search & Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Task Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tasks or filter by client..." className="pl-10" />
            </div>
            <Button variant="outline">
              <Bot className="h-4 w-4 mr-2" />
              AI Prioritize
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Tasks</CardTitle>
            <Button size="sm">Add Task</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Table Header */}
            <div className="grid grid-cols-6 gap-4 pb-3 border-b border-border text-sm font-medium text-muted-foreground">
              <div>Client</div>
              <div className="col-span-2">Task</div>
              <div>Priority</div>
              <div>Due Date</div>
              <div>Actions</div>
            </div>

            {/* Task Rows */}
            {tasks.map((task) => (
              <div
                key={task.id}
                className="grid grid-cols-6 gap-4 py-3 items-center border-b border-border last:border-0 hover:bg-accent/50 transition-colors rounded-lg px-2"
              >
                <div className="font-medium">{task.client}</div>
                <div className="col-span-2 flex items-center gap-2">
                  <span className="text-sm">{task.task}</span>
                  {task.aiAdded && (
                    <span className="inline-flex items-center gap-1 text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded">
                      <Bot className="h-3 w-3" />
                      AI
                    </span>
                  )}
                </div>
                <div>
                  <span className={`text-sm font-medium capitalize ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                <div className="text-sm">{task.dueDate}</div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={task.status} />
                  <Button size="sm" variant="outline">
                    <Bell className="h-3 w-3 mr-1" />
                    Remind
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Task Assistant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-secondary" />
            AI Task Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 bg-secondary/10 rounded-lg">
            <h4 className="font-medium mb-2">Suggested Actions</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-secondary">•</span>
                <span>3 clients need payslip follow-up this week</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-secondary">•</span>
                <span>2 applications approaching AIP deadline</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-secondary">•</span>
                <span>5 bank statements ready for review</span>
              </li>
            </ul>
          </div>
          <Button className="w-full" variant="outline">
            View All AI Suggestions
          </Button>
        </CardContent>
      </Card>

      {/* Auto-Reminders */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-Reminders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <p className="font-medium text-sm">John Doe - Bank Statements</p>
              <p className="text-xs text-muted-foreground">Reminder scheduled for today at 3 PM</p>
            </div>
            <Button size="sm" variant="outline">
              Send Now
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <p className="font-medium text-sm">Emma Walsh - Payslips</p>
              <p className="text-xs text-muted-foreground">Reminder scheduled for tomorrow at 10 AM</p>
            </div>
            <Button size="sm" variant="outline">
              Send Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrokerTasksTab;
