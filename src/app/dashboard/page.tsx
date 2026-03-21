
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, History, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const stats = [
    { label: "Pending Orders", value: "12", icon: ShoppingCart, color: "text-blue-500" },
    { label: "Delivered", value: "84", icon: Package, color: "text-green-500" },
    { label: "Total Spent", value: "$12,450", icon: TrendingUp, color: "text-purple-500" },
  ];

  const recentOrders = [
    { id: "ORD-7721", date: "2024-05-12", total: "$420.00", status: "In Transit" },
    { id: "ORD-7719", date: "2024-05-10", total: "$1,150.00", status: "Delivered" },
    { id: "ORD-7715", date: "2024-05-08", total: "$89.50", status: "Processing" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Dashboard</h1>
          <p className="text-muted-foreground font-body">Manage your retail stocks and track recent activities.</p>
        </div>
        <Link href="/dashboard/order">
          <Button className="bg-accent text-accent-foreground font-bold hover:bg-accent/90">
            <PlusCircle className="mr-2 h-4 w-4" />
            Place New Order
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="shadow-sm">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                  <div>
                    <p className="font-semibold">{order.id}</p>
                    <p className="text-xs text-muted-foreground">{order.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{order.total}</p>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
              <Link href="/dashboard/history" className="block">
                <Button variant="ghost" className="w-full text-accent hover:text-accent/90 hover:bg-accent/10">
                  View all history <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle>Inventory Quick Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-primary-foreground/80 text-sm">
              Quickly reorder your most frequent stock items with a single click.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" className="justify-start">Electronics (x10)</Button>
              <Button variant="secondary" className="justify-start">Office Supplies (x50)</Button>
              <Button variant="secondary" className="justify-start">Furniture (x5)</Button>
              <Button variant="secondary" className="justify-start">Cleaning (x20)</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PlusCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}
