
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Package, ShoppingCart, AlertCircle, ArrowUpRight, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminOverview() {
  const stats = [
    { label: "Pending Registrations", value: "3", icon: Store, color: "text-orange-600", bg: "bg-orange-50", trend: "+1 today" },
    { label: "Total Products", value: "142", icon: Package, color: "text-blue-600", bg: "bg-blue-50", trend: "Stable" },
    { label: "Active Orders", value: "28", icon: ShoppingCart, color: "text-green-600", bg: "bg-green-50", trend: "+5 this week" },
    { label: "Low Stock Alerts", value: "5", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", trend: "Action required" },
  ];

  const activities = [
    { title: "New store registration", target: "Downtown BK", time: "2 hours ago", status: "pending" },
    { title: "Stock adjustment", target: "USB-C Hubs", time: "5 hours ago", status: "completed" },
    { title: "Order shipped", target: "ORD-9903", time: "1 day ago", status: "completed" },
    { title: "Price update", target: "Dell 27 Monitor", time: "2 days ago", status: "completed" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-primary md:text-3xl">Administration Overview</h1>
        <p className="text-muted-foreground text-sm md:text-base">Real-time status of your retail network and inventory.</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="relative overflow-hidden border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</CardTitle>
              <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2 border-b">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Recent System Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {activities.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex gap-3 items-start">
                    <div className="mt-1 h-2 w-2 rounded-full bg-accent shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">{item.title}: <span className="text-primary">{item.target}</span></p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                  <Badge variant={item.status === 'pending' ? 'outline' : 'secondary'} className="text-[10px] capitalize">
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Admin Quick Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-primary-foreground/90 text-sm leading-relaxed">
                Review pending registrations daily to ensure new store managers can start ordering stock without delays.
              </p>
              <p className="text-primary-foreground/90 text-sm leading-relaxed">
                Check low stock alerts to maintain global availability and prevent order cancellations.
              </p>
            </div>
            <div className="pt-4 border-t border-primary-foreground/20">
              <div className="flex items-center justify-between text-xs">
                <span>System Health</span>
                <span className="font-bold">Optimal</span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-primary-foreground/20 rounded-full overflow-hidden">
                <div className="h-full w-[95%] bg-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
