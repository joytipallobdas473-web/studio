
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, History, TrendingUp, ArrowRight, Clock, Truck, PackageCheck, XCircle, PlusCircle, Activity } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const stats = [
    { label: "Pending Orders", value: "12", icon: ShoppingCart, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "In Transit", value: "3", icon: Truck, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Delivered", value: "84", icon: PackageCheck, color: "text-green-500", bg: "bg-green-50" },
  ];

  const recentOrders = [
    { id: "ORD-9901", date: "Today, 11:20 AM", items: "Logitech MX Master 3 (x5)", total: "$495.00", status: "pending" },
    { id: "ORD-9902", date: "Yesterday", items: "Dell 27 Monitor (x2)", total: "$579.00", status: "processing" },
    { id: "ORD-9903", date: "May 14", items: "USB-C Hubs (x10)", total: "$350.00", status: "shipped" },
    { id: "ORD-9904", date: "May 13", items: "Office Chairs (x4)", total: "$1,200.00", status: "delivered" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered": return <PackageCheck className="h-3 w-3 mr-1" />;
      case "processing": return <Clock className="h-3 w-3 mr-1" />;
      case "pending": return <Clock className="h-3 w-3 mr-1" />;
      case "shipped": return <Truck className="h-3 w-3 mr-1" />;
      case "cancelled": return <XCircle className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered": return "text-green-700 bg-green-50 border-green-200";
      case "processing": return "text-blue-700 bg-blue-50 border-blue-200";
      case "pending": return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "shipped": return "text-purple-700 bg-purple-50 border-purple-200";
      case "cancelled": return "text-red-700 bg-red-50 border-red-200";
      default: return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Store Overview</h1>
          <p className="text-muted-foreground font-body">Real-time tracking of your stock requests and deliveries.</p>
        </div>
        <Link href="/dashboard/order">
          <Button className="bg-accent text-accent-foreground font-bold hover:bg-accent/90 shadow-md">
            <PlusCircle className="mr-2 h-4 w-4" />
            Place New Order
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</CardTitle>
              <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-md border-none">
          <CardHeader className="border-b bg-card/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Live Order Status</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] animate-pulse bg-green-50 text-green-700 border-green-200">
                Live Updates
              </Badge>
            </div>
            <CardDescription>Status updates directly from the central warehouse admin.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                      order.status === 'delivered' ? 'bg-green-500' : 
                      order.status === 'shipped' ? 'bg-purple-500' : 
                      'bg-accent animate-pulse'
                    }`} />
                    <div>
                      <p className="font-bold text-primary flex items-center gap-2">
                        {order.id}
                        <span className="text-xs font-normal text-muted-foreground">• {order.date}</span>
                      </p>
                      <p className="text-sm text-foreground/80">{order.items}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-right">
                      <p className="text-sm font-bold">{order.total}</p>
                    </div>
                    <Badge variant="outline" className={`capitalize flex items-center h-7 px-3 ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-muted/20">
              <Link href="/dashboard/history">
                <Button variant="ghost" className="w-full text-accent hover:text-accent/90 hover:bg-accent/10">
                  View Full Order History <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-primary text-primary-foreground shadow-lg border-none">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Quick Reorder
              </CardTitle>
              <CardDescription className="text-primary-foreground/70">Frequent stock items.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="secondary" className="w-full justify-start text-xs font-semibold h-11">
                <div className="flex flex-col items-start">
                  <span>Electronics Bundle (x10)</span>
                  <span className="text-[10px] opacity-70">Last ordered 2 days ago</span>
                </div>
              </Button>
              <Button variant="secondary" className="w-full justify-start text-xs font-semibold h-11">
                <div className="flex flex-col items-start">
                  <span>Office Stationery (x50)</span>
                  <span className="text-[10px] opacity-70">Last ordered 1 week ago</span>
                </div>
              </Button>
              <Button variant="secondary" className="w-full justify-start text-xs font-semibold h-11">
                <div className="flex flex-col items-start">
                  <span>Cleaning Supplies (x20)</span>
                  <span className="text-[10px] opacity-70">Popular in your store</span>
                </div>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-dashed border-2 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                If your order status hasn't updated in 24 hours, please contact the regional warehouse manager.
              </p>
              <Button variant="outline" size="sm" className="w-full text-xs">Contact Support</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
