"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Store, Package, ShoppingCart, AlertCircle, Activity, Loader2, BrainCircuit, ShieldAlert, BarChart3, Globe, Zap, Network, Mountain, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { analyzeInventory, type InventoryAnalysisOutput } from "@/ai/flows/inventory-analyst";
import { cn } from "@/lib/utils";

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
      { label: "Pending Nodes", value: pendingStoresCount.toString(), icon: Store, color: "text-primary", bg: "bg-primary/5", border: "border-primary/10" },
      { label: "Active SKUs", value: (products?.length || 0).toString(), icon: Package, color: "text-accent", bg: "bg-accent/5", border: "border-accent/10" },
      { label: "Transit Units", value: activeOrdersCount.toString(), icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-600/5", border: "border-blue-600/10" },
      { label: "Risk Nodes", value: lowStockCount.toString(), icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/5", border: "border-rose-500/10" },
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-16 glass-card rounded-[3rem] border border-white space-y-10 animate-in fade-in duration-700">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <div className="relative bg-white p-10 rounded-[2.5rem] border border-primary/20 shadow-xl">
            <ShieldAlert className="h-16 w-16 text-primary" />
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-primary tracking-tighter uppercase italic">Bypass Required</h2>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed text-sm font-medium">
            Administrative terminal access is restricted to the root grid registry. Ensure your Node ID is authorized.
          </p>
        </div>
        {user && (
          <div className="p-8 bg-secondary/50 rounded-[2rem] border w-full max-w-lg shadow-inner">
            <div className="flex items-center justify-between text-[9px] font-black uppercase mb-4 tracking-[0.3em] text-muted-foreground">
              <span className="flex items-center gap-2"><Network className="h-3 w-3 text-primary" /> Authority Key</span>
              <Badge variant="outline" className="border-primary/20 text-primary text-[8px]">RESTRICTED</Badge>
            </div>
            <code className="text-xs font-mono break-all block p-5 bg-white rounded-xl border text-primary select-all leading-relaxed shadow-sm">{user.uid}</code>
          </div>
        )}
        <Button onClick={() => window.location.reload()} className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest transition-all hover:scale-105">Re-Authorize Node</Button>
      </div>
    );
  }

  if (storesLoading || ordersLoading || productsLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_10px_var(--accent)] animate-pulse" />
            <span className="text-[10px] font-black tracking-[0.4em] text-primary uppercase">NE Regional Hub</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-primary uppercase italic text-glow">Grid Command</h1>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">Orchestrating {stores?.length || 0} regional nodes across the NE Sector network.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="h-14 px-8 rounded-2xl border-primary/20 bg-white text-primary font-black uppercase tracking-widest text-[10px] hover:bg-secondary">
            <BarChart3 className="mr-3 h-4 w-4" /> Global Logs
          </Button>
          <Button className="h-14 px-8 rounded-2xl bg-primary text-white font-black shadow-lg hover:scale-105 transition-all uppercase tracking-widest text-[10px]">
            <Zap className="mr-3 h-4 w-4" /> Force Sync
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className={cn(
            "relative overflow-hidden border glass-card group hover:scale-[1.02] transition-all duration-300 rounded-[2rem] p-6",
            stat.border
          )}>
            <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
              <CardTitle className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">{stat.label}</CardTitle>
              <div className={cn(stat.bg, stat.color, "p-3 rounded-xl transition-transform group-hover:scale-110 shadow-sm")}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-primary tracking-tighter mb-2">{stat.value}</div>
              <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                <TrendingUp className="h-3 w-3 text-accent" /> Nominal Flow
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Card className="lg:col-span-2 shadow-xl glass-card rounded-[2.5rem] overflow-hidden border-none">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-white/50 pb-8 px-10 pt-10">
            <div className="flex items-center gap-5">
              <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-primary tracking-tight uppercase italic">Transit Stream</CardTitle>
                <CardDescription className="text-muted-foreground text-[9px] font-black uppercase tracking-[0.2em] mt-1">Real-time packet telemetry</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="border-primary/20 text-primary text-[8px] font-black px-3 py-1 rounded-full uppercase">Live Sync</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-secondary/50">
              {orders && orders.length > 0 ? orders.slice(0, 6).map((order, i) => (
                <div key={i} className="flex items-center justify-between px-10 py-6 hover:bg-secondary/30 transition-all group cursor-pointer">
                  <div className="flex gap-6 items-center">
                    <div className={cn(
                      "h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor]",
                      order.status === 'delivered' ? 'text-accent bg-accent' : 'text-primary bg-primary'
                    )} />
                    <div className="space-y-1">
                      <p className="text-sm font-black text-primary flex items-center gap-3 uppercase italic">
                        {order.storeName || 'Branch Node'}
                        <span className="text-[9px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded-lg border">NE-{order.id.substring(0, 6).toUpperCase()}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium">Payload: <span className="text-primary font-bold uppercase">{order.items || 'Standard SKU'}</span></p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-base font-black text-primary tracking-tight">₹{(order.total || 0).toFixed(2)}</p>
                    <Badge variant="outline" className={cn(
                      "text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-lg border-none",
                      order.status === 'delivered' ? 'bg-accent text-primary' : 'bg-primary text-white'
                    )}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              )) : (
                <div className="py-32 text-center opacity-30">
                  <Globe className="h-16 w-16 mx-auto mb-4 animate-spin-slow" />
                  <p className="font-black uppercase tracking-[0.4em] text-[10px]">Searching for Transit Packets...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="bg-primary text-white shadow-2xl border-none rounded-[2.5rem] overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <CardHeader className="relative z-10 pb-4 pt-10 px-8">
              <div className="flex items-center justify-between mb-6">
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
                  <BrainCircuit className="h-7 w-7 text-accent" />
                </div>
                <Badge className="bg-accent text-primary border-none text-[8px] font-black tracking-widest px-3 py-1">NE AI v2</Badge>
              </div>
              <CardTitle className="text-3xl font-black tracking-tighter uppercase italic">Regional Intel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 relative z-10 px-8 pb-10">
              {aiAnalysis ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
                  <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                    <p className="text-xs leading-relaxed font-bold italic text-white/90">
                      "{aiAnalysis.summary}"
                    </p>
                  </div>
                  <Button 
                    variant="secondary" 
                    className="w-full h-14 text-[9px] font-black uppercase tracking-widest bg-white text-primary hover:bg-accent rounded-xl"
                    onClick={handleRunAIAnalysis}
                    disabled={isAnalyzing}
                  >
                    Refresh Synthesis
                  </Button>
                </div>
              ) : (
                <Button 
                  className="w-full h-16 bg-accent text-primary hover:bg-white font-black rounded-2xl shadow-lg text-[10px] uppercase tracking-widest transition-all group-hover:scale-[1.03]"
                  onClick={handleRunAIAnalysis}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    "Init NE Synthesis"
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card rounded-[2.5rem] p-6 border-none">
             <CardHeader className="pb-6">
               <CardTitle className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Grid Integrity</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               {[
                 { label: "Mesh Services", status: "Nominal", color: "text-accent" },
                 { label: "Transit Latency", status: "28ms", color: "text-primary" },
                 { label: "Sector Health", status: "99.4%", color: "text-accent" }
               ].map((item, i) => (
                 <div key={i} className="flex justify-between items-center p-4 bg-secondary rounded-xl border border-primary/5">
                   <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{item.label}</span>
                   <span className={cn("text-[9px] font-black uppercase tracking-widest", item.color)}>{item.status}</span>
                 </div>
               ))}
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}