
"use client";

import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Package, ShoppingCart, AlertCircle, ArrowUpRight, Activity, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function AdminOverview() {
  const db = useFirestore();

  // Fetch data for real-time overview
  const { data: stores, loading: storesLoading } = useCollection(db ? collection(db, "stores") : null);
  const { data: orders, loading: ordersLoading } = useCollection(db ? collection(db, "orders") : null);
  const { data: products } = useCollection(db ? collection(db, "inventory") : null);

  const pendingStoresCount = stores?.filter(s => s.status === 'pending').length || 0;
  const activeOrdersCount = orders?.filter(o => !['delivered', 'cancelled'].includes(o.status)).length || 0;
  const lowStockCount = products?.filter(p => p.currentStock < 10).length || 0;

  const stats = [
    { label: "Pending Registrations", value: pendingStoresCount.toString(), icon: Store, color: "text-orange-600", bg: "bg-orange-50", trend: "Approval needed" },
    { label: "Total Products", value: products?.length.toString() || "0", icon: Package, color: "text-blue-600", bg: "bg-blue-50", trend: "Global catalog" },
    { label: "Active Orders", value: activeOrdersCount.toString(), icon: ShoppingCart, color: "text-green-600", bg: "bg-green-50", trend: "Ongoing requests" },
    { label: "Low Stock Alerts", value: lowStockCount.toString(), icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", trend: lowStockCount > 0 ? "Action required" : "Healthy" },
  ];

  // Combined activity feed
  const recentActivities = [
    ...(stores?.map(s => ({
      title: "New store registration",
      target: s.name,
      time: s.createdAt?.toDate ? format(s.createdAt.toDate(), 'MMM dd, h:mm a') : 'Recently',
      status: s.status,
      timestamp: s.createdAt?.toMillis() || 0
    })) || []),
    ...(orders?.map(o => ({
      title: "New order placed",
      target: `${o.storeName} (${o.items})`,
      time: o.createdAt?.toDate ? format(o.createdAt.toDate(), 'MMM dd, h:mm a') : 'Recently',
      status: o.status,
      timestamp: o.createdAt?.toMillis() || 0
    })) || [])
  ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

  if (storesLoading || ordersLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
              {recentActivities.length > 0 ? recentActivities.map((item, i) => (
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
              )) : (
                <div className="p-8 text-center text-muted-foreground">No recent system activity.</div>
              )}
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
