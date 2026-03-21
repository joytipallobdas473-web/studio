"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Store, Package, ShoppingCart, AlertCircle, Activity, Loader2, BrainCircuit, ShieldAlert, Key, BarChart3, Globe, Zap, ArrowUpRight, Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { analyzeInventory, type InventoryAnalysisOutput } from "@/ai/flows/inventory-analyst";
import { cn } from "@/lib/utils";

// Hardcoded administrative overrides for your UIDs
const ADMIN_OVERRIDES = ["AEGmDwRin2c5sDZdx1Jhk87yF9L2", "cKRTD1vPTOfID6XADH31VVpGYAU2"];

export default function AdminOverview() {
  const db = useFirestore();
  const { user } = useUser();
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

  const { data: stores, isLoading: storesLoading, error: storesError } = useCollection(storesQuery);
  const { data: orders, isLoading: ordersLoading, error: ordersError } = useCollection(ordersQuery);
  const { data: products, isLoading: productsLoading, error: productsError } = useCollection(productsQuery);

  const stats = useMemo(() => {
    const pendingStoresCount = stores?.filter(s => s.status === 'pending')?.length || 0;
    const activeOrdersCount = orders?.filter(o => !['delivered', 'cancelled'].includes(o.status))?.length || 0;
    const lowStockCount = products?.filter(p => (p.stockQuantity || 0) < 10)?.length || 0;

    return [
      { label: "Partner Signals", value: pendingStoresCount.toString(), icon: Store, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
      { label: "Node Inventory", value: (products?.length || 0).toString(), icon: Package, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
      { label: "Transit Flows", value: activeOrdersCount.toString(), icon: ShoppingCart, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
      { label: "Critical Alerts", value: lowStockCount.toString(), icon: AlertCircle, color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20" },
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

  const isExplicitAdmin = user && ADMIN_OVERRIDES.includes(user.uid);
  const hasPermissionError = !isExplicitAdmin && (!!storesError || !!ordersError || !!productsError);

  if (hasPermissionError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] text-center p-20 glass-card rounded-[3rem] border border-white/5 space-y-12 animate-in fade-in duration-1000">
        <div className="relative">
          <div className="absolute inset-0 bg-rose-500/20 blur-[100px] rounded-full" />
          <div className="relative bg-rose-500/10 p-12 rounded-[2.5rem] border border-rose-500/20 shadow-2xl">
            <ShieldAlert className="h-24 w-24 text-rose-500" />
          </div>
        </div>
        <div className="space-y-6">
          <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic text-glow">Identity Refused</h2>
          <p className="text-slate-500 max-w-lg mx-auto leading-relaxed text-sm font-medium">
            Administrative credentials required for terminal access. Please verify your UID in the root security registry.
          </p>
        </div>
        {user && (
          <div className="p-10 bg-black/60 rounded-[2.5rem] border border-white/5 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between text-[10px] font-black uppercase mb-6 tracking-[0.4em] text-slate-600">
              <span className="flex items-center gap-3"><Network className="h-4 w-4 text-primary" /> Root Security Key</span>
              <Badge className="bg-primary/20 text-primary border-none text-[9px]">RESTRICTED</Badge>
            </div>
            <code className="text-sm font-mono break-all block p-6 bg-slate-950 rounded-2xl border border-white/5 text-primary select-all shadow-inner leading-loose">{user.uid}</code>
          </div>
        )}
        <Button onClick={() => window.location.reload()} variant="outline" className="h-16 px-12 rounded-2xl border-white/10 hover:bg-white/5 text-slate-400 font-black uppercase tracking-widest transition-all hover:scale-105">Re-Authenticate Node</Button>
      </div>
    );
  }

  if (storesLoading || ordersLoading || productsLoading) {
    return (
      <div className="flex h-[75vh] items-center justify-center">
        <Loader2 className="h-14 w-14 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-16 animate-in fade-in duration-1000 slide-in-from-bottom-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_15px_#3b82f6] animate-pulse" />
            <span className="text-[10px] font-black tracking-[0.5em] text-primary uppercase">Global Operations Feed</span>
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-white uppercase italic text-glow">Command Console</h1>
          <p className="text-slate-500 text-sm font-medium tracking-wide">Monitoring {stores?.length || 0} active retail nodes across the distributed infrastructure.</p>
        </div>
        <div className="flex gap-6">
          <Button variant="outline" className="h-16 px-10 rounded-[1.5rem] glass-card text-slate-300 hover:text-white transition-all font-black uppercase tracking-widest text-xs">
            <BarChart3 className="mr-3 h-5 w-5" /> Node Analytics
          </Button>
          <Button className="h-16 px-10 rounded-[1.5rem] bg-primary text-white font-black shadow-[0_15px_30px_rgba(59,130,246,0.3)] hover:scale-105 transition-all uppercase tracking-widest text-xs">
            <Zap className="mr-3 h-5 w-5" /> Deploy Sync
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className={cn(
            "relative overflow-hidden border glass-card group hover:bg-white/[0.04] transition-all duration-700 rounded-[2.5rem] p-6 shadow-2xl",
            stat.border
          )}>
            <div className="absolute -right-8 -top-8 h-24 w-24 bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-6 space-y-0">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">{stat.label}</CardTitle>
              <div className={cn(stat.bg, stat.color, "p-4 rounded-2xl group-hover:scale-110 transition-transform duration-700 shadow-xl")}>
                <stat.icon className="h-7 w-7" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-6xl font-black text-white tracking-tighter mb-3">{stat.value}</div>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                <Network className="h-3.5 w-3.5" /> Nominal Status
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <Card className="lg:col-span-2 shadow-2xl glass-card rounded-[3rem] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-10 px-12 pt-12">
            <div className="flex items-center gap-6">
              <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 shadow-inner">
                <Activity className="h-7 w-7 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black text-white tracking-tighter uppercase italic">Network Traffic</CardTitle>
                <CardDescription className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Real-time event stream from global nodes</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="border-primary/20 text-primary text-[9px] font-black px-4 py-1.5 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.2)]">LIVE TELEMETRY</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {orders && orders.length > 0 ? orders.slice(0, 8).map((order, i) => (
                <div key={i} className="flex items-center justify-between px-12 py-8 hover:bg-white/[0.03] transition-all group cursor-pointer">
                  <div className="flex gap-8 items-center">
                    <div className="relative">
                      <div className={cn(
                        "h-3.5 w-3.5 rounded-full shadow-[0_0_12px_currentColor] transition-all duration-500",
                        order.status === 'delivered' ? 'text-emerald-500 bg-emerald-500' : 'text-primary bg-primary'
                      )} />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-base font-black text-white flex items-center gap-4 uppercase italic">
                        {order.storeName || 'Branch Node'}
                        <span className="text-[10px] font-mono text-slate-600 border border-white/5 px-3 py-1 rounded-xl bg-black/60 shadow-inner">LOG-{order.id.substring(0, 6).toUpperCase()}</span>
                      </p>
                      <p className="text-xs text-slate-500 font-medium tracking-tight">Payload: <span className="text-slate-300 font-black uppercase italic">{order.items || 'Standard Logistics'}</span></p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="text-xl font-black text-white tracking-tighter text-glow">${(order.total || 0).toFixed(2)}</p>
                    <Badge className={cn(
                      "text-[9px] font-black tracking-[0.2em] uppercase px-3 py-1 rounded-xl shadow-lg border-none",
                      order.status === 'delivered' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-primary text-white shadow-primary/20'
                    )}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              )) : (
                <div className="py-48 text-center">
                  <Globe className="h-24 w-24 text-slate-900 mx-auto mb-8 animate-spin-slow opacity-20" />
                  <p className="text-slate-700 font-black uppercase tracking-[0.5em] text-sm italic">Awaiting Telemetry Sync...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-12">
          <Card className="bg-gradient-to-br from-primary via-blue-600 to-blue-800 text-primary-foreground shadow-[0_40px_80px_rgba(59,130,246,0.3)] border-none rounded-[3rem] overflow-hidden relative group transition-all duration-700 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/ai-grain/500/500')] opacity-10 mix-blend-overlay pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]" />
            <CardHeader className="relative z-10 pb-6 pt-12 px-10">
              <div className="flex items-center justify-between mb-8">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-2xl shadow-xl">
                  <BrainCircuit className="h-8 w-8 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-none text-[9px] font-black tracking-[0.4em] px-4 py-1.5">AI CORE v5.0</Badge>
              </div>
              <CardTitle className="text-4xl font-black tracking-tighter uppercase italic text-glow">Predictive Synthesis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-10 relative z-10 px-10 pb-12">
              {aiAnalysis ? (
                <div className="space-y-10 animate-in slide-in-from-bottom-12 duration-700">
                  <div className="bg-black/30 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl">
                    <p className="text-sm leading-relaxed font-bold italic opacity-95 tracking-wide">
                      "{aiAnalysis.summary}"
                    </p>
                  </div>
                  <Button 
                    variant="secondary" 
                    className="w-full h-16 text-xs font-black uppercase tracking-[0.3em] bg-white text-primary hover:bg-slate-100 rounded-2xl shadow-3xl transition-all"
                    onClick={handleRunAIAnalysis}
                    disabled={isAnalyzing}
                  >
                    Refresh Synthesis
                  </Button>
                </div>
              ) : (
                <Button 
                  className="w-full h-20 bg-white text-primary hover:bg-slate-50 font-black rounded-[1.8rem] shadow-3xl text-sm uppercase tracking-[0.4em] transition-all group-hover:scale-[1.03] shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
                  onClick={handleRunAIAnalysis}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    "Initialize Synthesis"
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card rounded-[3rem] p-6 shadow-2xl">
             <CardHeader className="pb-8">
               <CardTitle className="text-xs font-black uppercase tracking-[0.4em] text-slate-600">Integrity Protocol</CardTitle>
             </CardHeader>
             <CardContent className="space-y-5">
               {[
                 { label: "Root Services", status: "Nominal", color: "text-emerald-500" },
                 { label: "Data Latency", status: "18ms", color: "text-primary" },
                 { label: "Security Mesh", status: "Encrypted", color: "text-blue-400" }
               ].map((item, i) => (
                 <div key={i} className="flex justify-between items-center p-6 bg-black/40 rounded-3xl border border-white/5 shadow-inner">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                   <span className={cn("text-[10px] font-black uppercase tracking-widest text-glow", item.color)}>{item.status}</span>
                 </div>
               ))}
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}