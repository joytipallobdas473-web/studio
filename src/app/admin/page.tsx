"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Store, Package, ShoppingCart, AlertCircle, Loader2, BrainCircuit, Activity, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { analyzeInventory, type InventoryAnalysisOutput } from "@/ai/flows/inventory-analyst";
import { cn } from "@/lib/utils";

export default function AdminOverview() {
  const db = useFirestore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<InventoryAnalysisOutput | null>(null);

  const storesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "stores"), orderBy("createdAt", "desc"));
  }, [db]);

  const ordersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(10));
  }, [db]);

  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, "products");
  }, [db]);

  const { data: stores, isLoading: storesLoading } = useCollection(storesQuery);
  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery);
  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);

  const stats = useMemo(() => {
    const pendingStoresCount = stores?.filter(s => s.status === 'pending')?.length || 0;
    const activeOrdersCount = orders?.filter(o => !['delivered', 'cancelled'].includes(o.status))?.length || 0;
    const lowStockCount = products?.filter(p => (p.stockQuantity || 0) < 10)?.length || 0;

    return [
      { label: "New Requests", value: pendingStoresCount.toString(), icon: Store, color: "text-blue-600", bg: "bg-blue-50" },
      { label: "Total SKUs", value: (products?.length || 0).toString(), icon: Package, color: "text-slate-600", bg: "bg-slate-50" },
      { label: "Active Orders", value: activeOrdersCount.toString(), icon: ShoppingCart, color: "text-accent", bg: "bg-accent/5" },
      { label: "Low Stock", value: lowStockCount.toString(), icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-50" },
    ];
  }, [stores, orders, products]);

  const handleRunAIAnalysis = async () => {
    if (!products || !orders) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeInventory({
        products: products.map(p => ({
          name: p.name || "Unknown",
          currentStock: p.stockQuantity || 0,
          category: p.category || "General",
          mrp: p.price || 0
        })),
        recentOrders: orders.map(o => ({
          items: o.items || "Unspecified items",
          status: o.status || "pending",
          total: o.total || 0
        }))
      });
      setAiAnalysis(result);
    } catch (error) {
      console.error("AI Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (storesLoading || ordersLoading || productsLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Regional Overview</h1>
          <p className="text-slate-500 text-sm font-medium">Monitoring {stores?.length || 0} North East branch nodes.</p>
        </div>
        <Button className="font-bold bg-primary">
          <Zap className="mr-2 h-4 w-4" /> System Sync
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.label}</CardTitle>
              <div className={cn(stat.bg, stat.color, "p-2 rounded-xl")}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800 tracking-tight">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-sm rounded-3xl border-none">
          <CardHeader className="border-b pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-bold">Recent Transit Activity</CardTitle>
              </div>
              <Badge variant="secondary" className="text-[10px] font-bold uppercase">Live Data</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {orders && orders.length > 0 ? orders.slice(0, 5).map((order, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      order.status === 'delivered' ? 'bg-emerald-500' : 'bg-primary'
                    )} />
                    <div>
                      <p className="text-sm font-bold text-slate-800">{order.storeName || 'Branch Node'}</p>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">{order.items || 'Restock Payload'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">${(order.total || 0).toFixed(2)}</p>
                    <span className="text-[10px] font-bold text-primary uppercase">{order.status}</span>
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center text-slate-400 text-sm">No recent activity detected.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-primary text-white shadow-lg border-none rounded-3xl overflow-hidden p-6">
            <div className="flex items-center gap-3 mb-6">
              <BrainCircuit className="h-6 w-6 text-accent" />
              <CardTitle className="text-xl font-bold tracking-tight">Regional Intel</CardTitle>
            </div>
            {aiAnalysis ? (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed opacity-90 italic">"{aiAnalysis.summary}"</p>
                <Button variant="secondary" className="w-full font-bold text-xs" onClick={handleRunAIAnalysis} disabled={isAnalyzing}>
                  Refresh Intel
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs opacity-70">Run AI synthesis for stock health and reordering insights.</p>
                <Button 
                  className="w-full bg-accent text-primary hover:bg-white font-bold rounded-xl"
                  onClick={handleRunAIAnalysis}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Analysis"}
                </Button>
              </div>
            )}
          </Card>

          <Card className="border-none shadow-sm rounded-3xl p-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Grid Health</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Service Status</span>
                <span className="text-emerald-500 font-bold">Online</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Sync Latency</span>
                <span className="font-bold text-primary">24ms</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}