"use client";

import { useState, useMemo, useEffect } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Package, ShoppingCart, AlertCircle, Loader2, BrainCircuit, Activity, Zap, Globe, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { analyzeInventory, type InventoryAnalysisOutput } from "@/ai/flows/inventory-analyst";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

const MASTER_ADMIN_UID = "j96izCkggNcL002AHiJjzGb18Bf2";

export default function AdminOverview() {
  const db = useFirestore();
  const { user } = useUser();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<InventoryAnalysisOutput | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isAdmin = useMemo(() => {
    return user?.email?.toLowerCase().includes("admin") || user?.uid === MASTER_ADMIN_UID;
  }, [user]);

  const storesQuery = useMemoFirebase(() => {
    if (!db || !user || !isAdmin) return null;
    return query(collection(db, "stores"));
  }, [db, user, isAdmin]);

  const allOrdersQuery = useMemoFirebase(() => {
    if (!db || !user || !isAdmin) return null;
    return query(collection(db, "orders"));
  }, [db, user, isAdmin]);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !user || !isAdmin) return null;
    return collection(db, "products");
  }, [db, user, isAdmin]);

  const { data: stores, isLoading: storesLoading } = useCollection(storesQuery);
  const { data: orders, isLoading: ordersLoading } = useCollection(allOrdersQuery);
  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);

  const stats = useMemo(() => {
    const pendingStoresCount = stores?.filter(s => s.status === 'pending')?.length || 0;
    const activeOrdersCount = orders?.filter(o => !['delivered', 'cancelled'].includes(o.status))?.length || 0;
    const lowStockCount = products?.filter(p => (p.stockQuantity || 0) < 10)?.length || 0;

    return [
      { label: "Pending Nodes", value: pendingStoresCount.toString(), icon: Store, color: "text-blue-500", bg: "bg-blue-500/10" },
      { label: "Catalog SKUs", value: (products?.length || 0).toString(), icon: Package, color: "text-primary", bg: "bg-primary/10" },
      { label: "Active Traffic", value: activeOrdersCount.toString(), icon: ShoppingCart, color: "text-amber-500", bg: "bg-amber-500/10" },
      { label: "Critical Risk", value: lowStockCount.toString(), icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
    ];
  }, [stores, orders, products]);

  const lowStockItems = useMemo(() => {
    return products?.filter(p => (p.stockQuantity || 0) < 10).slice(0, 5) || [];
  }, [products]);

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
      toast({ title: "Intelligence Synthesized" });
    } catch (error) {
      toast({ title: "Analysis Failed", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isClient || !isAdmin) return null;

  if (storesLoading || ordersLoading || productsLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-30" />
      </div>
    );
  }

  const sortedOrders = orders ? [...orders].sort((a, b) => {
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  }).slice(0, 8) : [];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
             <span className="text-[10px] font-black tracking-[0.4em] text-primary uppercase">Regional Command v3.0</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Grid Overview</h1>
          <p className="text-muted-foreground text-sm font-medium">Orchestrating {stores?.length || 0} branch nodes across the regional grid.</p>
        </div>
        <div className="flex gap-4 w-full lg:w-auto">
          <Button variant="outline" className="flex-1 lg:flex-none h-14 px-8 rounded-xl font-black border-white/10 bg-white/5 hover:bg-white/10 text-[10px] uppercase tracking-widest text-white shadow-sm" onClick={() => toast({ title: "Grid Synchronized" })}>
            <Zap className="mr-2 h-4 w-4 text-amber-500" /> Grid Sync
          </Button>
          <Button className="flex-1 lg:flex-none h-14 px-8 rounded-xl font-black bg-primary text-background text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
            <Globe className="mr-2 h-4 w-4" /> Global Map
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="glass-card border-none rounded-2xl overflow-hidden group hover:translate-y-[-4px] transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                <div className={cn(stat.bg, stat.color, "p-2.5 rounded-xl border border-white/5")}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-white tracking-tighter italic">{stat.value}</div>
              <div className="flex items-center gap-1.5 mt-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                <TrendingUp className="h-3 w-3 text-emerald-500" /> Optimal Flow
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <Card className="glass-card border-none rounded-[2rem] overflow-hidden">
            <CardHeader className="border-b border-white/5 py-8 px-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-white">Traffic Telemetry</CardTitle>
                </div>
                <Badge className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-none px-4 py-1.5 rounded-lg">LIVE GRID</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {sortedOrders.length > 0 ? sortedOrders.map((order, i) => (
                  <div key={i} className="flex items-center justify-between px-10 py-6 hover:bg-white/5 transition-all group">
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "h-2 w-2 rounded-full transition-all group-hover:scale-150",
                        order.status === 'delivered' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                        order.status === 'cancelled' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-primary shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                      )} />
                      <div>
                        <p className="text-sm font-black text-white uppercase italic tracking-tight">{order.storeName || 'Branch Node'}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                          <Package className="h-3 w-3 opacity-30" /> {order.items || 'Payload Cluster'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-primary font-mono">${(order.total || 0).toFixed(2)}</p>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest mt-1 block",
                        order.status === 'delivered' ? 'text-emerald-500' : 
                        order.status === 'cancelled' ? 'text-rose-500' : 'text-muted-foreground'
                      )}>{order.status}</span>
                    </div>
                  </div>
                )) : (
                  <div className="py-24 text-center text-muted-foreground font-black uppercase text-[10px] tracking-[0.4em] italic">Awaiting grid telemetry...</div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="glass-card border-none rounded-[2rem] p-10 space-y-8">
              <div className="flex items-center gap-4">
                <AlertTriangle className="h-6 w-6 text-rose-500" />
                <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-white">Critical SKU Alerts</CardTitle>
              </div>
              <div className="space-y-4">
                {lowStockItems.length > 0 ? lowStockItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                    <div>
                      <p className="text-xs font-black text-white uppercase italic">{item.name}</p>
                      <p className="text-[9px] text-rose-500/70 font-mono uppercase tracking-widest mt-1">Density: {item.stockQuantity}</p>
                    </div>
                    <Link href="/admin/inventory">
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-500/20">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )) : (
                  <div className="text-center py-10">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">All SKU Densities Optimal</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="glass-card border-none rounded-[2rem] p-10 space-y-6">
              <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Network Telemetry</h3>
              <div className="space-y-5">
                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                  <span className="text-muted-foreground font-bold uppercase text-[9px]">Uptime</span>
                  <span className="font-black text-white font-mono text-xs">99.9%</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                  <span className="text-muted-foreground font-bold uppercase text-[9px]">Encryption</span>
                  <Badge className="bg-primary/10 text-primary border-none font-black text-[8px] px-3 py-0.5">AES-256</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-bold uppercase text-[9px]">Active Nodes</span>
                  <span className="font-black text-primary font-mono text-lg">{stores?.length || 0}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="command-gradient text-background border-none shadow-xl rounded-[2.5rem] p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-4">
                <BrainCircuit className="h-7 w-7 text-background" />
                <CardTitle className="text-2xl font-black uppercase italic tracking-tighter">AI synthesis</CardTitle>
              </div>
              {aiAnalysis ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                  <div className="p-5 bg-background/10 rounded-2xl border border-background/10">
                    <p className="text-xs leading-relaxed font-bold italic opacity-90">"{aiAnalysis.summary}"</p>
                  </div>
                  <div className="space-y-3">
                     {aiAnalysis.recommendations.map((rec, idx) => (
                       <div key={idx} className="flex gap-3 items-start text-[10px] font-black uppercase tracking-wide leading-snug opacity-80">
                          <Zap className="h-3 w-3 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                       </div>
                     ))}
                  </div>
                  <Button variant="secondary" className="w-full h-14 rounded-xl font-black text-[9px] uppercase tracking-widest bg-background text-primary hover:bg-background/90 transition-all shadow-lg" onClick={handleRunAIAnalysis} disabled={isAnalyzing}>
                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh analysis"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-xs font-bold opacity-80 leading-relaxed">Synthesize regional stock patterns and branch reordering for grid intelligence.</p>
                  <Button 
                    className="w-full h-14 bg-background/15 backdrop-blur-sm text-background hover:bg-background hover:text-primary font-black rounded-xl shadow-lg transition-all uppercase tracking-widest text-[9px] border border-background/20"
                    onClick={handleRunAIAnalysis}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Begin synthesis"}
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card className="glass-card border-none rounded-[2rem] p-10 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Flow Activity</h3>
              <Activity className="h-4 w-4 text-primary animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[75%] animate-pulse" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Regional Bandwidth: 75%</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
