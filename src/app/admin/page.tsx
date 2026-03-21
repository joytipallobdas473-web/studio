
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Package, ShoppingCart, AlertCircle } from "lucide-react";

export default function AdminOverview() {
  const stats = [
    { label: "Pending Registrations", value: "3", icon: Store, color: "text-orange-500" },
    { label: "Total Products", value: "142", icon: Package, color: "text-blue-500" },
    { label: "Active Orders", value: "28", icon: ShoppingCart, color: "text-green-500" },
    { label: "Low Stock Alerts", value: "5", icon: AlertCircle, color: "text-red-500" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Administration Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Recent actions across the retail network.</p>
            <div className="mt-4 space-y-4">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg border bg-background">
                  <div className="h-2 w-2 rounded-full bg-accent" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">New store registration: Downtown BK</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
