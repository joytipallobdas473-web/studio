"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Store, Package, ShoppingCart, AlertCircle, Activity, Loader2, Sparkles, BrainCircuit, ShieldAlert, Key, TrendingUp, BarChart3, Globe, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { analyzeInventory, type InventoryAnalysisOutput } from "@/ai/flows/inventory-analyst";
import { cn } from "@/lib/utils";

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

  if (storesError || ordersError || productsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12 bg-slate-900/50 rounded-[2rem] border border-slate-800 space-y-8 animate-in fade-in duration-700">
        <div className="relative">
          <div className="absolute inset-0 bg-rose-500/20 blur-[50px] rounded-full" />
          <div className="relative bg-rose-500/10 p-8 rounded-full border border-rose-500/20">
            <ShieldAlert className="h-16 w-16 text-rose-500" />
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-white tracking-tight">Access Restricted</h2>
          <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
            Your identity is verified, but root privileges are not yet activated. Register your UID in the <code className="text-rose-400 font-mono">roles_admin</code> registry to proceed.
          </p>
        </div>
        {user && (
          <div className="p-6 bg-black/40 rounded-2xl border border-slate-800 w-full max-w-sm">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase mb-4 tracking-widest text-slate-500">
              <span className="flex items-center gap-2"><Key className="h-3 w-3" /> Target UID</span>
              <Badge variant="outline" className="bg-slate-900 border-slate-700 text-slate-300">ACTIVE</Badge>
            </div>
            <code className="text-xs font-mono break-all block p-3 bg-slate-950 rounded-lg border border-slate-800 text-primary select-all">{user.uid}</code>
            <p className="mt-4 text-[10px] text-slate-500 text-left">
              1. Open Firebase Console<br/>
              2. Create collection: <strong>roles_admin</strong><br/>
              3. Create document ID: <strong>{user.uid}</strong>
            </p>
          </div>
        )}
        <Button onClick={() => window.location.reload()} variant="outline" className="h-12 px-8 rounded-full border-slate-700 hover:bg-slate-800">Re-verify Session</Button>
      </div>
    );
  }

  if (storesLoading || ordersLoading || productsLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-t-2 border-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Globe className="h-6 w-6 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">Admin Terminal</Badge>
          <h1 className="text-4xl font-black tracking-tighter text-white">SYSTEM STATUS</h1>
          <p className="text-slate-500 text-sm font-medium">Monitoring {stores?.length || 0} nodes across the retail network.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-slate-900/50 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800">
            <BarChart3 className="mr-2 h-4 w-4" /> Reports
          </Button>
          <Button className="bg-primary text-primary-foreground font-bold shadow-[0_0_20px_rgba(var(--primary),0.2)] hover:shadow-[0_0_30px_rgba(var(--primary),0.4)]">
            <Zap className="mr-2 h-4 w-4" /> Live Actions
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className={`relative overflow-hidden border ${stat.border} bg-slate-900/40 backdrop-blur-sm group hover:bg-slate-900/60 transition-all duration-300 shadow-xl`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{stat.label}</CardTitle>
              <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-white tracking-tighter">{stat.value}</div>
              <div className="flex items-center gap-2 mt-4">
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${stat.color.replace('text', 'bg')} w-[70%] opacity-50`} />
                </div>
                <span className="text-[10px] font-mono text-slate-500">70%</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-2xl border-slate-800 bg-slate-900/30 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/50 pb-6 px-8">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <Activity className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-white tracking-tight">System Feed</CardTitle>
                <CardDescription className="text-slate-500 text-xs">Real-time event stream from connected branches.</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">View Archive</Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-800/50">
              {orders && orders.length > 0 ? orders.slice(0, 6).map((order, i) => (
                <div key={i} className="flex items-center justify-between px-8 py-5 hover:bg-white/[0.02] transition-colors group">
                  <div className="flex gap-4 items-center">
                    <div className="relative">
                      <div className={`h-3 w-3 rounded-full ${order.status === 'delivered' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                      <div className={`absolute inset-0 h-3 w-3 rounded-full animate-ping opacity-20 ${order.status === 'delivered' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        {order.storeName || 'Branch Node'}
                        <Badge variant="outline" className="text-[8px] h-4 font-mono border-slate-800 text-slate-500">#{order.id.substring(0, 6)}</Badge>
                      </p>
                      <p className="text-xs text-slate-500 font-medium">Requested: <span className="text-slate-300">{order.items || 'Restock'}</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">${(order.total || 0).toFixed(2)}</p>
                    <p className="text-[10px] text-slate-600 font-mono">{(order.createdAt as any)?.toDate ? format((order.createdAt as any).toDate(), 'HH:mm:ss') : '--:--:--'}</p>
                  </div>
                </div>
              )) : (
                <div className="py-24 text-center">
                  <Globe className="h-12 w-12 text-slate-800 mx-auto mb-4 animate-spin-slow" />
                  <p className="text-slate-600 font-medium italic">Scanning for network activity...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-[0_20px_50px_rgba(var(--primary),0.2)] border-none overflow-hidden relative">
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-[60px]" />
            <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-32 h-32 bg-black/20 rounded-full blur-[40px]" />
            
            <CardHeader className="relative z-10 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-2 rounded-xl">
                  <BrainCircuit className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-full border border-white/10">
                  <Sparkles className="h-3 w-3 text-amber-300 animate-pulse" />
                  <span className="text-[9px] font-bold tracking-widest">LIVE AI</span>
                </div>
              </div>
              <CardTitle className="text-2xl font-black tracking-tighter">PREDICTIVE ENGINE</CardTitle>
              <CardDescription className="text-primary-foreground/70 text-sm font-medium">
                Neural analysis of stock patterns.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              {aiAnalysis ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-black/20 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">System Health</span>
                      <Badge className={cn(
                        "rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-tighter shadow-sm",
                        aiAnalysis.riskLevel === 'high' ? 'bg-rose-500' : 
                        aiAnalysis.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-emerald-500 text-black'
                      )}>
                        {aiAnalysis.riskLevel} Risk
                      </Badge>
                    </div>
                    <p className="text-sm leading-relaxed font-medium italic">
                      "{aiAnalysis.summary}"
                    </p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Engine Directives</p>
                    <div className="space-y-2">
                      {aiAnalysis.recommendations.map((rec, i) => (
                        <div key={i} className="flex gap-3 items-start text-xs font-medium bg-white/5 p-2.5 rounded-xl border border-white/5 group hover:bg-white/10 transition-colors">
                          <TrendingUp className="h-4 w-4 text-amber-300 mt-0.5 shrink-0" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button 
                    variant="secondary" 
                    className="w-full h-11 text-xs font-bold bg-white text-primary hover:bg-slate-100 rounded-xl"
                    onClick={handleRunAIAnalysis}
                    disabled={isAnalyzing}
                  >
                    Refresh Analysis
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-xs font-medium opacity-80">
                      <div className="p-2 bg-white/10 rounded-lg"><ShoppingCart className="h-4 w-4" /></div>
                      <p>Processing pending demand...</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium opacity-80">
                      <div className="p-2 bg-white/10 rounded-lg"><Package className="h-4 w-4" /></div>
                      <p>Scanning inventory delta...</p>
                    </div>
                  </div>
                  <Button 
                    className="w-full h-12 bg-white text-primary hover:bg-slate-100 font-bold rounded-2xl shadow-xl transition-all hover:scale-[1.02]"
                    onClick={handleRunAIAnalysis}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Synthesize Insights"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="border-slate-800 bg-slate-900/40 p-6 border-dashed border-2">
             <div className="flex flex-col gap-4 text-center">
                <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto">
                  <Globe className="h-5 w-5 text-slate-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Node Status</h4>
                  <p className="text-xs text-slate-500">Latency is within healthy limits across 12 regions.</p>
                </div>
                <Button variant="outline" size="sm" className="w-full border-slate-700 text-slate-400 hover:text-white">Region Details</Button>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}