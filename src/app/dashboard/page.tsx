
"use client";

import { useFirestore, useCollection, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, orderBy, limit, doc, where } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, ArrowRight, Clock, Truck, PackageCheck, XCircle, PlusCircle, Activity, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const db = useFirestore();
  const { user, isUserLoading: authLoading } = useUser();

  const storeRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "stores", user.uid);
  }, [db, user]);

  const { data: store, isLoading: storeLoading } = useDoc(storeRef);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "orders"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"), 
      limit(10)
    );
  }, [db, user]);

  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "products"), orderBy("name"), limit(5));
  }, [db]);

  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery);
  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);

  const stats = useMemo(() => [
    { 
      label: "Pending", 
      value: orders?.filter(o => o.status === 'pending')?.length?.toString() || "0", 
      icon: ShoppingCart, 
      color: "text-blue-500", 
      bg: "bg-blue-50" 
    },
    { 
      label: "In Transit", 
      value: orders?.filter(o => o.status === 'shipped')?.length?.toString() || "0", 
      icon: Truck, 
      color: "text-purple-500", 
      bg: "bg-purple-50" 
    },
    { 
      label: "Delivered", 
      value: orders?.filter(o => o.status === 'delivered')?.length?.toString() || "0", 
      icon: PackageCheck, 
      color: "text-green-500", 
      bg: "bg-green-50" 
    },
  ], [orders]);

  const getStatusColor = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "delivered": return "text-green-700 bg-green-50 border-green-200";
      case "processing": return "text-blue-700 bg-blue-50 border-blue-200";
      case "pending": return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "shipped": return "text-purple-700 bg-purple-50 border-purple-200";
      case "cancelled": return "text-red-700 bg-red-50 border-red-200";
      default: return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  if (authLoading || storeLoading || ordersLoading || productsLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-primary">Store Overview</h1>
            {store && (
              <Badge variant="outline" className="font-bold text-[9px] uppercase tracking-widest">
                {store.status}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground font-medium">
            Monitoring {store?.name || "your branch node"}.
          </p>
        </div>
        <Link href="/dashboard/order">
          <Button className="bg-accent text-primary font-black hover:bg-primary hover:text-white shadow-md h-12 rounded-xl px-6 transition-all uppercase tracking-widest text-xs">
            <PlusCircle className="mr-2 h-5 w-5" />
            New Order
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm overflow-hidden bg-white rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-400">{stat.label}</CardTitle>
              <div className={`${stat.bg} ${stat.color} p-2 rounded-xl`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-sm border-none bg-white rounded-3xl overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <Activity className="h-5 w-5" />
                <CardTitle className="text-lg font-bold">Recent Orders</CardTitle>
              </div>
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter bg-emerald-50 text-emerald-700">
                Live Status
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {orders && orders.length > 0 ? orders.map((order) => (
                <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-slate-50 transition-colors gap-4">
                  <div>
                    <p className="font-bold text-primary flex items-center gap-2 uppercase italic text-xs">
                      {order.id.substring(0, 8)}
                      <span className="text-[9px] font-mono text-slate-400 shrink-0">• {(order.createdAt as any)?.toDate ? format((order.createdAt as any).toDate(), 'MMM dd, h:mm a') : 'Syncing'}</span>
                    </p>
                    <p className="text-sm font-semibold text-slate-700 truncate">{order.items || 'Stock Items'}</p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <p className="text-sm font-black text-slate-900 tracking-tight">${(order.total || 0).toFixed(2)}</p>
                    <Badge className={`capitalize h-8 px-4 font-bold rounded-xl text-[10px] ${getStatusColor(order.status)}`}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              )) : (
                <div className="p-20 text-center text-slate-400 font-medium italic">No recent orders.</div>
              )}
            </div>
            <div className="p-4 border-t border-slate-50 bg-slate-50/30">
              <Link href="/dashboard/history" className="block">
                <Button variant="ghost" className="w-full text-primary font-bold">
                  View Full History <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground shadow-lg border-none rounded-3xl overflow-hidden">
          <CardHeader className="bg-white/10">
            <CardTitle className="text-lg font-bold flex items-center gap-2 uppercase italic">
              <Package className="h-5 w-5" />
              Regional Catalog
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {products && products.length > 0 ? products.map((product) => (
              <Link key={product.id} href="/dashboard/order">
                <Button variant="secondary" className="w-full justify-start text-xs font-bold h-14 bg-white/5 hover:bg-white/10 text-white rounded-xl">
                  <div className="flex flex-col items-start min-w-0">
                    <span className="truncate w-full uppercase tracking-tight italic">{product.name}</span>
                    <span className="text-[9px] opacity-60 font-mono">${(product.price || 0).toFixed(2)}</span>
                  </div>
                </Button>
              </Link>
            )) : (
              <p className="text-xs text-center opacity-70">No products available.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
