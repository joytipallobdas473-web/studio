
"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/use-memo-firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Store, Package, ShoppingCart, AlertCircle, ArrowUpRight, Activity, Loader2, Sparkles, BrainCircuit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { analyzeInventory, type InventoryAnalysisOutput } from "@/ai/flows/inventory-analyst";

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

  const inventoryQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, "inventory");
  }, [db]);

  const { data: stores, loading: storesLoading } = useCollection(storesQuery);
  const { data: orders, loading: ordersLoading } = useCollection(ordersQuery);
  const { data: products, loading: inventoryLoading } = useCollection(inventoryQuery);

  const stats = useMemo(() => {
    const pendingStoresCount = stores?.filter(s => s.status === 'pending').length || 0;
    const activeOrdersCount = orders?.filter(o => !['delivered', 'cancelled'].includes(o.status)).length || 0;
    const lowStockCount = products?.filter(p => p.currentStock < 10).length || 0;

    return [
      { label: "Pending Registrations", value: pendingStoresCount.toString(), icon: Store, color: "text-orange-600", bg: "bg-orange-50", trend: "Approval needed" },
      { label: "Total Products", value: products?.length.toString() || "0", icon: Package, color: "text-blue-600", bg: "bg-blue-50", trend: "Global catalog" },
      { label: "Active Orders", value: activeOrdersCount.toString(), icon: ShoppingCart, color: "text-green-600", bg: "bg-green-50", trend: "Ongoing requests" },
      { label: "Low Stock Alerts", value: lowStockCount.toString(), icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", trend: lowStockCount > 0 ? "Action required" : "Healthy" },
    ];
  }, [stores, orders, products]);

  const recentActivities = useMemo(() => {
    const combined = [
      ...(stores?.map(s => ({
        title: "New store registration",
        target: s.name,
        time: s.createdAt?.toDate ? format(s.createdAt.toDate(), 'MMM dd, h:mm a') : 'Recently',
        status: s.status,
        timestamp: s.createdAt?.toMillis ? s.createdAt.toMillis() : 0,
        type: 'store'
      })) || []),
      ...(orders?.map(o => ({
        title: "New order placed",
        target: `${o.storeName || 'Store'} (${o.items || 'Items'})`,
        time: o.createdAt?.toDate ? format(o.createdAt.toDate(), 'MMM dd, h:mm a') : 'Recently',
        status: o.status,
        timestamp: o.createdAt?.toMillis ? o.createdAt.toMillis() : 0,
        type: 'order'
      })) || [])
    ];
    return combined.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  }, [stores, orders]);

  const handleRunAIAnalysis = async () => {
    if (!products || !orders) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeInventory({
        products: products.map(p => ({
          name: p.name,
          currentStock: p.currentStock,
          category: p.category,
          mrp: p.mrp
        })),
        recentOrders: orders.map(o => ({
          items: o.items,
          status: o.status,
          total: o.total
        }))
      });
      setAiAnalysis(result);
    } catch (error) {
      console.error("AI Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (storesLoading || ordersLoading || inventoryLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-primary md:text-3xl">Control Center Overview</h1>
        <p className="text-muted-foreground text-sm md:text-base">Real-time status of your retail network and inventory.</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="relative overflow-hidden border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</CardTitle>
              <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-none">
          <CardHeader className="flex flex-row items-center gap-2 border-b">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-bold">Recent System Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentActivities.length > 0 ? recentActivities.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex gap-3 items-start">
                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${item.type === 'store' ? 'bg-orange-400' : 'bg-blue-400'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{item.title}: <span className="text-primary">{item.target}</span></p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                  <Badge variant={item.status === 'pending' ? 'outline' : 'secondary'} className="text-[10px] capitalize shrink-0 ml-2">
                    {item.status}
                  </Badge>
                </div>
              )) : (
                <div className="p-8 text-center text-muted-foreground">No recent system activity.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-primary text-primary-foreground shadow-lg border-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5" />
                  AI Smart Analyst
                </CardTitle>
                <Sparkles className="h-4 w-4 text-accent animate-pulse" />
              </div>
              <CardDescription className="text-primary-foreground/80">
                Analyze live warehouse and order data for insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiAnalysis ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase">Risk Level</span>
                      <Badge className={
                        aiAnalysis.riskLevel === 'high' ? 'bg-red-500' : 
                        aiAnalysis.riskLevel === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                      }>
                        {aiAnalysis.riskLevel}
                      </Badge>
                    </div>
                    <p className="text-sm leading-relaxed text-primary-foreground/90 italic">
                      "{aiAnalysis.summary}"
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase opacity-70">Top Recommendations</p>
                    {aiAnalysis.recommendations.map((rec, i) => (
                      <div key={i} className="flex gap-2 items-start text-xs text-primary-foreground/90">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="secondary" 
                    className="w-full text-xs font-bold bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={handleRunAIAnalysis}
                    disabled={isAnalyzing}
                  >
                    Refresh Analysis
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-primary-foreground/90 text-sm leading-relaxed">
                    Tap below to generate real-time reorder suggestions based on your current global stock and pending orders.
                  </p>
                  <Button 
                    className="w-full bg-white text-primary hover:bg-white/90 font-bold"
                    onClick={handleRunAIAnalysis}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Generate Insights"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-dashed border-2 bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Regional Alert</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Stock levels below 10 units trigger global alerts. {stats.find(s => s.label === "Low Stock Alerts")?.value || 0} items currently at risk.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
