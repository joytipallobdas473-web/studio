
"use client";

import { useState, useMemo, useEffect } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, limit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Package, ShoppingCart, AlertCircle, Loader2, BrainCircuit, Activity, Zap, Share2, Globe, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { analyzeInventory, type InventoryAnalysisOutput } from "@/ai/flows/inventory-analyst";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
      { label: "New Requests", value: pendingStoresCount.toString(), icon: Store, color: "text-blue-400", bg: "bg-blue-400/10" },
      { label: "Active SKUs", value: (products?.length || 0).toString(), icon: Package, color: "text-emerald-400", bg: "bg-emerald-400/10" },
      { label: "Live Traffic", value: activeOrdersCount.toString(), icon: ShoppingCart, color: "text-accent", bg: "bg-accent/10" },
      { label: "Risk Nodes", value: lowStockCount.toString(), icon: AlertCircle, color: "text-rose-400", bg: "bg-rose-400/10" },
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
        <Loader2 className="h-12 w-12 animate-spin text-accent opacity-50" />
      </div>
    );
  }

  const sortedOrders = orders ? [...orders].sort((a, b) => {
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  }).slice(0, 10) : [];

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="h-2 w-2 rounded-full bg-accent neon-glow" />
             <span className="text-[11px] font-black tracking-[0.5em] text-accent uppercase">Global Protocol v2.8</span>
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic leading-none">Grid Overview</h1>
          <p className="text-muted-foreground text-lg font-medium tracking-tight">Orchestrating {stores?.length || 0} regional nodes across the North East.</p>
        </div>
        <div className="flex gap-4 w-full xl:w-auto">
          <Button variant="outline" className="flex-1 xl:flex-none h-16 px-10 rounded-2xl font-black border-border/50 bg-white/5 hover:bg-white/10 uppercase tracking-widest text-[10px]" onClick={() => toast({ title: "Grid Synchronized" })}>
            <Zap className="mr-3 h-5 w-5 text-accent" /> System Sync
          </Button>
          <Button className="flex-1 xl:flex-none h-16 px-12 rounded-2xl font-black command-gradient text-white uppercase tracking-[0.2em] text-[10px] shadow-[0_0_30px_rgba(38,205,242,0.3)]">
            <Globe className="mr-3 h-5 w-5" /> Live Map
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="glass-panel rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all duration-500">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">{stat.label}</CardTitle>
              <div className={cn(stat.bg, stat.color, "p-3 rounded-2xl border border-white/5")}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-white tracking-tighter italic">{stat.value}</div>
              <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-accent/60 uppercase tracking-widest">
                <ArrowUpRight className="h-3 w-3" /> Node Pulse Optimal
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 glass-panel rounded-[3rem] overflow-hidden">
          <CardHeader className="border-b border-white/5 py-10 px-12 bg-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Activity className="h-6 w-6 text-accent" />
                <CardTitle className="text-2xl font-black uppercase italic tracking-tighter text-white">Grid Traffic Logs</CardTitle>
              </div>
              <Badge className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-6 py-2 rounded-full">Telemetry Online</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {sortedOrders.length > 0 ? sortedOrders.map((order, i) => (
                <div key={i} className="flex items-center justify-between px-12 py-8 hover:bg-white/5 transition-all group">
                  <div className="flex items-center gap-8">
                    <div className={cn(
                      "h-3 w-3 rounded-full transition-all group-hover:scale-150 group-hover:neon-glow",
                      order.status === 'delivered' ? 'bg-emerald-500' : 
                      order.status === 'cancelled' ? 'bg-rose-500' : 'bg-accent'
                    )} />
                    <div>
                      <p className="text-lg font-black text-white uppercase italic tracking-tight leading-none">{order.storeName || 'Branch Node'}</p>
                      <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mt-3 flex items-center gap-2">
                        <Package className="h-3 w-3 opacity-30" /> {order.items || 'Restock Payload'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-accent font-mono tracking-tighter">${(order.total || 0).toFixed(2)}</p>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em] mt-2 block",
                      order.status === 'delivered' ? 'text-emerald-400' : 
                      order.status === 'cancelled' ? 'text-rose-400' : 'text-muted-foreground/60'
                    )}>{order.status}</span>
                  </div>
                </div>
              )) : (
                <div className="py-32 text-center text-muted-foreground/30 font-black uppercase text-xs tracking-[0.5em] italic">Awaiting grid telemetry...</div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="command-gradient text-white shadow-2xl rounded-[3rem] overflow-hidden p-10 relative group">
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-4">
                <BrainCircuit className="h-8 w-8 text-white" />
                <CardTitle className="text-3xl font-black uppercase italic tracking-tighter">AI Synthesis</CardTitle>
              </div>
              {aiAnalysis ? (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                  <p className="text-sm leading-relaxed font-bold italic opacity-90 border-l-2 border-white/30 pl-6">"{aiAnalysis.summary}"</p>
                  <div className="space-y-4">
                     {aiAnalysis.recommendations.map((rec, idx) => (
                       <div key={idx} className="flex gap-4 items-start text-[11px] font-black uppercase tracking-wide leading-snug opacity-80">
                          <Zap className="h-4 w-4 text-white shrink-0 mt-0.5" />
                          <span>{rec}</span>
                       </div>
                     ))}
                  </div>
                  <Button variant="secondary" className="w-full h-16 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] bg-white text-primary hover:bg-black hover:text-white transition-all shadow-xl" onClick={handleRunAIAnalysis} disabled={isAnalyzing}>
                    {isAnalyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Refresh Intelligence"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-8">
                  <p className="text-sm font-bold opacity-80 leading-relaxed">Synthesize regional stock health and branch reordering patterns for actionable grid intelligence.</p>
                  <Button 
                    className="w-full h-16 bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-primary font-black rounded-2xl shadow-xl transition-all uppercase tracking-[0.3em] text-[10px] border border-white/20"
                    onClick={handleRunAIAnalysis}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? <Loader2 className="h-6 w-6 animate-spin" /> : "Begin Synthesis"}
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card className="glass-panel rounded-[2.5rem] p-10 space-y-6">
            <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.5em]">Network Telemetry</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <span className="text-muted-foreground/60 font-black uppercase text-[10px] tracking-widest">Node Status</span>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black text-[10px] px-4 py-1">ENCRYPTED</Badge>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <span className="text-muted-foreground/60 font-black uppercase text-[10px] tracking-widest">Uptime</span>
                <span className="font-black text-white font-mono text-sm uppercase">99.98%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground/60 font-black uppercase text-[10px] tracking-widest">Active Nodes</span>
                <span className="font-black text-accent font-mono text-xl tracking-tighter">{stores?.length || 0}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
