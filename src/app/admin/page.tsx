"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Store, Package, ShoppingCart, AlertCircle, Activity, Loader2, BrainCircuit, ShieldAlert, Key, BarChart3, Globe, Zap, ArrowUpRight } from "lucide-react";
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
      { label: "Partner Requests", value: pendingStoresCount.toString(), icon: Store, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
      { label: "Active Stock SKU", value: (products?.length || 0).toString(), icon: Package, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
      { label: "In-Flight Orders", value: activeOrdersCount.toString(), icon: ShoppingCart, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-16 bg-slate-950/50 rounded-[2.5rem] border border-white/5 space-y-10 animate-in fade-in duration-1000">
        <div className="relative">
          <div className="absolute inset-0 bg-rose-500/20 blur-[80px] rounded-full" />
          <div className="relative bg-rose-500/10 p-10 rounded-full border border-rose-500/20">
            <ShieldAlert className="h-20 w-20 text-rose-500" />
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Access Refused</h2>
          <p className="text-slate-500 max-w-lg mx-auto leading-relaxed text-sm font-medium">
            Root privileges required. Please register your administrative UID in the secure registry collection.
          </p>
        </div>
        {user && (
          <div className="p-8 bg-black/40 rounded-3xl border border-white/5 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase mb-4 tracking-[0.3em] text-slate-600">
              <span className="flex items-center gap-2"><Key className="h-3 w-3" /> System Identity</span>
              <Badge className="bg-primary/20 text-primary border-primary/20">PROTECTED</Badge>
            </div>
            <code className="text-sm font-mono break-all block p-4 bg-slate-950 rounded-2xl border border-white/5 text-primary select-all">{user.uid}</code>
          </div>
        )}
        <Button onClick={() => window.location.reload()} variant="outline" className="h-14 px-10 rounded-2xl border-white/10 hover:bg-white/5 text-slate-400">Restart Session</Button>
      </div>
    );
  }

  if (storesLoading || ordersLoading || productsLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_#3b82f6]" />
            <span className="text-[10px] font-black tracking-[0.4em] text-primary uppercase">Global Monitoring</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">Command Center</h1>
          <p className="text-slate-500 text-sm font-medium tracking-wide">Monitoring {stores?.length || 0} active retail nodes across the infrastructure.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="h-14 px-8 rounded-2xl bg-white/5 border-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-all">
            <BarChart3 className="mr-2 h-5 w-5" /> Analytics
          </Button>
          <Button className="h-14 px-8 rounded-2xl bg-primary text-white font-black shadow-[0_10px_30px_rgba(var(--primary),0.3)] hover:scale-105 transition-all uppercase tracking-widest">
            <Zap className="mr-2 h-5 w-5" /> Deploy Actions
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className={cn(
            "relative overflow-hidden border bg-slate-950/40 backdrop-blur-3xl group hover:bg-slate-900/60 transition-all duration-500 rounded-[2rem] p-4",
            stat.border
          )}>
            <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{stat.label}</CardTitle>
              <div className={cn(stat.bg, stat.color, "p-3.5 rounded-2xl group-hover:scale-110 transition-transform duration-500")}>
                <stat.icon className="h-6 w-6" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black text-white tracking-tighter mb-2">{stat.value}</div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase">
                <ArrowUpRight className="h-3 w-3" /> System Synchronized
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Card className="lg:col-span-2 shadow-2xl border-white/5 bg-slate-950/30 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-8 px-10 pt-10">
            <div className="flex items-center gap-5">
              <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20">
                <Activity className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-white tracking-tight uppercase italic">Live Activity Feed</CardTitle>
                <CardDescription className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Real-time event stream from global nodes</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="border-white/10 text-slate-500 text-[10px] font-bold px-3 py-1">REAL-TIME</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {orders && orders.length > 0 ? orders.slice(0, 7).map((order, i) => (
                <div key={i} className="flex items-center justify-between px-10 py-6 hover:bg-white/[0.03] transition-all group cursor-pointer">
                  <div className="flex gap-6 items-center">
                    <div className="relative">
                      <div className={cn(
                        "h-3 w-3 rounded-full shadow-[0_0_10px_currentColor]",
                        order.status === 'delivered' ? 'text-emerald-500 bg-emerald-500' : 'text-primary bg-primary'
                      )} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-white flex items-center gap-3">
                        {order.storeName || 'Branch Node'}
                        <span className="text-[10px] font-mono text-slate-600 border border-white/5 px-2 py-0.5 rounded-lg bg-black/40">#{order.id.substring(0, 6).toUpperCase()}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">Payload: <span className="text-slate-300 font-bold uppercase tracking-tight">{order.items || 'Standard Logistics'}</span></p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="text-base font-black text-white tracking-tighter">${(order.total || 0).toFixed(2)}</p>
                    <Badge className={cn(
                      "text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md",
                      order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'
                    )}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              )) : (
                <div className="py-40 text-center">
                  <Globe className="h-16 w-16 text-slate-800 mx-auto mb-6 animate-pulse" />
                  <p className="text-slate-600 font-black uppercase tracking-[0.2em] text-xs italic">Awaiting telemetry synchronization...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-10">
          <Card className="bg-gradient-to-br from-primary via-primary/90 to-[#2563eb] text-primary-foreground shadow-[0_30px_60px_rgba(var(--primary),0.3)] border-none rounded-[2.5rem] overflow-hidden relative group">
            <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/ai-noise/400/400')] opacity-10 mix-blend-overlay" />
            <CardHeader className="relative z-10 pb-4 pt-10 px-8">
              <div className="flex items-center justify-between mb-6">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                  <BrainCircuit className="h-7 w-7 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-none text-[9px] font-black tracking-widest">AI CORE v4.0</Badge>
              </div>
              <CardTitle className="text-3xl font-black tracking-tighter uppercase italic">Predictive Synthesis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 relative z-10 px-8 pb-10">
              {aiAnalysis ? (
                <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                  <div className="bg-black/20 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 space-y-4">
                    <p className="text-sm leading-relaxed font-bold italic opacity-90">
                      "{aiAnalysis.summary}"
                    </p>
                  </div>
                  <Button 
                    variant="secondary" 
                    className="w-full h-14 text-xs font-black uppercase tracking-widest bg-white text-primary hover:bg-slate-100 rounded-2xl shadow-2xl transition-all"
                    onClick={handleRunAIAnalysis}
                    disabled={isAnalyzing}
                  >
                    Refresh Synthesis
                  </Button>
                </div>
              ) : (
                <Button 
                  className="w-full h-16 bg-white text-primary hover:bg-slate-100 font-black rounded-[1.5rem] shadow-2xl text-sm uppercase tracking-[0.2em] transition-all group-hover:scale-[1.02]"
                  onClick={handleRunAIAnalysis}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    "Initialize Synthesis"
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-4">
             <CardHeader>
               <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">System Integrity</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               {[
                 { label: "Core Services", status: "Nominal", color: "text-emerald-500" },
                 { label: "Data Latency", status: "24ms", color: "text-primary" },
                 { label: "Security Hub", status: "Active", color: "text-emerald-500" }
               ].map((item, i) => (
                 <div key={i} className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                   <span className={cn("text-[10px] font-black uppercase tracking-wider", item.color)}>{item.status}</span>
                 </div>
               ))}
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
