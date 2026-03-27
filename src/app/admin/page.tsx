"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Store, Package, ShoppingCart, AlertCircle, Loader2, BrainCircuit, Activity, Zap, Share2, Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { analyzeInventory, type InventoryAnalysisOutput } from "@/ai/flows/inventory-analyst";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export default function AdminOverview() {
  const db = useFirestore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<InventoryAnalysisOutput | null>(null);

  const storesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "stores"));
  }, [db]);

  const allOrdersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "orders"));
  }, [db]);

  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, "products");
  }, [db]);

  const { data: stores, isLoading: storesLoading } = useCollection(storesQuery);
  const { data: orders, isLoading: ordersLoading } = useCollection(allOrdersQuery);
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
        recentOrders: orders.slice(0, 20).map(o => ({
          items: o.items || "Unspecified items",
          status: o.status || "pending",
          total: o.total || 0
        }))
      });
      setAiAnalysis(result);
    } catch (error) {
      console.error("AI Analysis failed", error);
      toast({ title: "Analysis Failed", description: "Could not synthesize regional intel.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShareNode = () => {
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    navigator.clipboard.writeText(url);
    toast({
      title: "Protocol Link Copied",
      description: "Regional hub address saved to clipboard.",
    });
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
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Command Central</h1>
          <p className="text-slate-500 text-sm font-medium">Monitoring {stores?.length || 0} North East branch nodes.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none h-12 rounded-xl font-bold border-slate-200" onClick={handleShareNode}>
            <Share2 className="mr-2 h-4 w-4" /> Share Hub
          </Button>
          <Button className="flex-1 md:flex-none h-12 rounded-xl font-bold bg-primary px-8">
            <Zap className="mr-2 h-4 w-4" /> System Sync
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{stat.label}</CardTitle>
              <div className={cn(stat.bg, stat.color, "p-2 rounded-xl")}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-800 tracking-tighter">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-sm rounded-[2.5rem] border-none bg-white overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 py-8 px-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Live Traffic Logs</CardTitle>
              </div>
              <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border-none px-4 py-1">Node Sync Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {orders && orders.length > 0 ? [...orders].sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 10).map((order, i) => (
                <div key={i} className="flex items-center justify-between px-10 py-6 hover:bg-slate-50 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "h-1.5 w-1.5 rounded-full transition-all group-hover:scale-150",
                      order.status === 'delivered' ? 'bg-emerald-500' : 
                      order.status === 'cancelled' ? 'bg-rose-500' : 'bg-primary'
                    )} />
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{order.storeName || 'Branch Node'}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{order.items || 'Restock Payload'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-primary font-mono">${(order.total || 0).toFixed(2)}</p>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest",
                      order.status === 'delivered' ? 'text-emerald-500' : 
                      order.status === 'cancelled' ? 'text-rose-500' : 'text-slate-400'
                    )}>{order.status}</span>
                  </div>
                </div>
              )) : (
                <div className="py-24 text-center text-slate-400 italic font-medium">No recent packet activity detected.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-primary text-white shadow-xl border-none rounded-[2.5rem] overflow-hidden p-8">
            <div className="flex items-center gap-3 mb-8">
              <BrainCircuit className="h-6 w-6 text-accent" />
              <CardTitle className="text-2xl font-black uppercase italic tracking-tighter">Regional Intel</CardTitle>
            </div>
            {aiAnalysis ? (
              <div className="space-y-6">
                <p className="text-sm leading-relaxed opacity-90 italic font-medium">"{aiAnalysis.summary}"</p>
                <div className="space-y-2">
                   {aiAnalysis.recommendations.slice(0, 2).map((rec, idx) => (
                     <div key={idx} className="flex gap-2 items-start text-[10px] opacity-80 font-bold uppercase">
                        <Zap className="h-3 w-3 text-accent shrink-0 mt-0.5" />
                        {rec}
                     </div>
                   ))}
                </div>
                <Button variant="secondary" className="w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-white text-primary hover:bg-accent hover:text-primary transition-all" onClick={handleRunAIAnalysis} disabled={isAnalyzing}>
                  Recalculate Intel
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-xs opacity-70 font-medium leading-relaxed">Synthesize regional stock health and branch reordering patterns for actionable insights.</p>
                <Button 
                  className="w-full h-14 bg-accent text-primary hover:bg-white font-black rounded-2xl shadow-lg transition-all uppercase tracking-widest text-[10px]"
                  onClick={handleRunAIAnalysis}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Generate Synthesis"}
                </Button>
              </div>
            )}
          </Card>

          <Card className="border-none shadow-sm rounded-[2rem] p-8 bg-white space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Grid Telemetry</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-3">
                <span className="text-slate-500 font-medium">Network Status</span>
                <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] px-3">ACTIVE</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Active Nodes</span>
                <span className="font-black text-primary font-mono tracking-tighter">{stores?.length || 0}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}