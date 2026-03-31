"use client";

import { useState, useMemo, useEffect } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Package, ShoppingCart, AlertCircle, Loader2, Cpu, Activity, Zap, Globe, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
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
      { label: "New Node Request", value: pendingStoresCount.toString(), icon: Store, color: "text-blue-500", bg: "bg-blue-500/10" },
      { label: "Active SKUs", value: (products?.length || 0).toString(), icon: Package, color: "text-primary", bg: "bg-primary/10" },
      { label: "Order Traffic", value: activeOrdersCount.toString(), icon: ShoppingCart, color: "text-emerald-500", bg: "bg-emerald-500/10" },
      { label: "Inventory Risk", value: lowStockCount.toString(), icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
    ];
  }, [stores, orders, products]);

  if (!isClient || !isAdmin) return null;

  const anyLoading = storesLoading || ordersLoading || productsLoading;
  const allNull = !stores && !orders && !products;

  if (anyLoading && allNull) {
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
             <span className="text-[10px] font-black tracking-[0.4em] text-primary uppercase">Regional Grid Console</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">System Dashboard</h1>
          <p className="text-muted-foreground text-sm font-medium">Monitoring {stores?.length || 0} active retail nodes.</p>
        </div>
        <div className="flex gap-4 w-full lg:w-auto">
          <Button variant="outline" className="flex-1 lg:flex-none h-12 px-6 rounded-xl font-black border-white/10 bg-white/5 hover:bg-white/10 text-[10px] uppercase tracking-widest text-white" onClick={() => toast({ title: "Grid Refreshed" })}>
            <Zap className="mr-2 h-4 w-4 text-primary" /> Sync Data
          </Button>
          <Button className="flex-1 lg:flex-none h-12 px-8 rounded-xl font-black bg-primary text-background text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
            <Globe className="mr-2 h-4 w-4" /> Global Status
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="glass-card border-none rounded-2xl overflow-hidden group hover:translate-y-[-4px] transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                <div className={cn(stat.bg, stat.color, "p-2 rounded-xl")}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-white tracking-tighter italic">{stat.value}</div>
              <div className="flex items-center gap-1.5 mt-4 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                <TrendingUp className="h-3 w-3" /> Nominal
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
                  <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-white">Network Traffic</CardTitle>
                </div>
                <Badge className="text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border-none px-4 py-1.5 rounded-lg">Real-Time</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {sortedOrders.length > 0 ? sortedOrders.map((order, i) => (
                  <div key={i} className="flex items-center justify-between px-10 py-6 hover:bg-white/5 transition-all group">
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        order.status === 'delivered' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                        order.status === 'cancelled' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-primary'
                      )} />
                      <div>
                        <p className="text-sm font-black text-white uppercase italic tracking-tight">{order.storeName || 'Unknown Node'}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                          {order.items || 'Standard Payload'}
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
                  <div className="py-24 text-center text-muted-foreground font-black uppercase text-[10px] tracking-[0.4em] italic">No active telemetry...</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="command-gradient text-background border-none shadow-xl rounded-[2.5rem] p-10 relative overflow-hidden">
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-4">
                <Cpu className="h-7 w-7" />
                <CardTitle className="text-2xl font-black uppercase italic tracking-tighter">AI Analysis</CardTitle>
              </div>
              {aiAnalysis ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                  <div className="p-5 bg-background/20 rounded-2xl border border-background/10">
                    <p className="text-[11px] leading-relaxed font-bold italic">"{aiAnalysis.summary}"</p>
                  </div>
                  <div className="space-y-3">
                     {aiAnalysis.recommendations.map((rec, idx) => (
                       <div key={idx} className="flex gap-3 items-start text-[9px] font-black uppercase tracking-wide leading-snug">
                          <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                       </div>
                     ))}
                  </div>
                  <Button variant="secondary" className="w-full h-12 rounded-xl font-black text-[9px] uppercase tracking-widest bg-background text-primary hover:bg-background/90" onClick={handleRunAIAnalysis} disabled={isAnalyzing}>
                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Re-Run Analysis"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-[11px] font-bold opacity-90 leading-relaxed">Synthesize grid patterns and stock density for strategic intelligence.</p>
                  <Button 
                    className="w-full h-12 bg-background/20 backdrop-blur-sm text-background hover:bg-background hover:text-primary font-black rounded-xl shadow-lg transition-all uppercase tracking-widest text-[9px] border border-background/20"
                    onClick={handleRunAIAnalysis}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Begin AI Synthesis"}
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card className="glass-card border-none rounded-[2rem] p-8 space-y-6">
            <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Grid Health</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase">
                <span className="text-muted-foreground">Encryption</span>
                <span className="text-emerald-500">Active</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase">
                <span className="text-muted-foreground">Stability</span>
                <span className="text-primary">99.98%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

async function handleRunAIAnalysis() {
  // Placeholder for internal handler
}