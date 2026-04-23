"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Package, ShoppingCart, AlertCircle, Loader2, Cpu, Activity, Zap, Globe, TrendingUp, BarChart3, CheckCircle2, Volume2, Box } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { analyzeInventory, type InventoryAnalysisOutput } from "@/ai/flows/inventory-analyst";
import { synthesizeAnalysis } from "@/ai/flows/audio-summary";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip, Cell, YAxis } from "recharts";
import { format, subDays, isSameDay } from "date-fns";

const MASTER_ADMIN_UID = "j96izCkggNcL002AHiJjzGb18Bf2";

export default function AdminOverview() {
  const db = useFirestore();
  const { user } = useUser();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<InventoryAnalysisOutput | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  const adminRoleRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "roles_admin", user.uid);
  }, [db, user?.uid]);

  const { data: adminRole } = useDoc(adminRoleRef);
  const isAdmin = useMemo(() => user?.email?.toLowerCase().includes("admin") || user?.uid === MASTER_ADMIN_UID || !!adminRole, [user, adminRole]);

  const storesQuery = useMemoFirebase(() => (!db || !isAdmin) ? null : query(collection(db, "stores")), [db, isAdmin]);
  const allOrdersQuery = useMemoFirebase(() => (!db || !isAdmin) ? null : query(collection(db, "orders")), [db, isAdmin]);
  const productsQuery = useMemoFirebase(() => (!db || !isAdmin) ? null : collection(db, "products"), [db, isAdmin]);

  const { data: stores } = useCollection(storesQuery);
  const { data: orders } = useCollection(allOrdersQuery);
  const { data: products } = useCollection(productsQuery);

  const chartData = useMemo(() => {
    if (!orders) return [];
    const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();
    return days.map(day => {
      const dayLabel = format(day, 'eee');
      const dayOrders = orders.filter(o => o.createdAt?.seconds && isSameDay(new Date(o.createdAt.seconds * 1000), day));
      const dayProfit = dayOrders.reduce((sum, o) => sum + (o.profit || 0), 0);
      return { name: dayLabel, volume: dayOrders.length, profit: dayProfit };
    });
  }, [orders]);

  const stats = useMemo(() => [
    { label: "Active Nodes", val: stores?.length || 0, icon: Store, color: "text-primary" },
    { label: "SKU Registry", val: products?.length || 0, icon: Package, color: "text-primary" },
    { label: "Packet Traffic", val: orders?.length || 0, icon: ShoppingCart, color: "text-primary" },
  ], [stores, products, orders]);

  const handleRunAIAnalysis = async () => {
    if (!products || !orders) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeInventory({
        products: products.map(p => ({ name: p.name, currentStock: p.stockQuantity, category: p.category, mrp: p.mrp || p.price, offerPrice: p.price })),
        recentOrders: orders.slice(0, 20).map(o => ({ items: o.items, status: o.status, total: o.total }))
      });
      setAiAnalysis(result);
      toast({ title: "Grid Analysis Synthesized" });
    } catch (e) { toast({ title: "Neural Link Timeout", variant: "destructive" }); }
    finally { setIsAnalyzing(false); }
  };

  const handlePlayAnalysis = async () => {
    if (!aiAnalysis) return;
    setIsSynthesizing(true);
    try {
      const result = await synthesizeAnalysis(`${aiAnalysis.summary}. recommendations: ${aiAnalysis.recommendations.join('. ')}`);
      setAudioUrl(result.media);
    } catch (e) { toast({ title: "Audio Sync Failed", variant: "destructive" }); }
    finally { setIsSynthesizing(false); }
  };

  if (!isClient || !isAdmin) return null;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" onEnded={() => setAudioUrl(null)} autoPlay />}
      
      {/* Event Ticker */}
      <div className="w-full h-12 bg-white/5 border-y border-white/5 overflow-hidden flex items-center relative rounded-xl">
         <div className="absolute left-0 top-0 bottom-0 bg-primary px-4 flex items-center z-10">
            <span className="text-[10px] font-black uppercase text-black">Live_Feed</span>
         </div>
         <div className="flex gap-12 animate-marquee whitespace-nowrap px-4 ml-24">
            {orders?.slice(0, 5).map((o, i) => (
              <div key={i} className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase">
                <div className="h-1 w-1 rounded-full bg-primary" />
                Packet Provision: PKT-{o.id.substring(0,6)} // {o.storeName} // ₹{o.total.toFixed(0)}
              </div>
            ))}
            {stores?.slice(0, 3).map((s, i) => (
              <div key={`s-${i}`} className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase">
                <div className="h-1 w-1 rounded-full bg-primary" />
                Node Registry: {s.name} Registered // Status: {s.status}
              </div>
            ))}
         </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3"><div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-gold" /><span className="text-[10px] font-black tracking-[0.4em] text-primary uppercase">Regional Command v7.0</span></div>
          <h1 className="text-4xl font-black text-white uppercase italic">Command Center</h1>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="h-12 px-6 rounded-xl font-black border-white/10 bg-white/5 text-[10px] uppercase text-white hover:text-primary" onClick={() => window.location.reload()}>
            <Zap className="mr-2 h-4 w-4" /> Refresh Grid
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="glass-card border-none rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
            <CardContent className="p-8">
               <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{stat.label}</span>
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
               </div>
               <div className="text-4xl font-black text-white italic tracking-tighter">{stat.val}</div>
               <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-primary uppercase tracking-widest">
                  <Activity className="h-3 w-3" /> Node Synchronized
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 glass-card border-none rounded-[2rem] overflow-hidden">
          <CardHeader className="border-b border-white/5 py-8 px-10 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3"><BarChart3 className="h-5 w-5 text-primary" /><CardTitle className="text-xl font-black uppercase italic text-white">Profit Intensity Log</CardTitle></div>
            <Badge className="text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary px-4 py-1.5 rounded-lg">7 Cycle Intensity</Badge>
          </CardHeader>
          <CardContent className="p-10">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 800}} dy={10} />
                  <YAxis hide />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#020617', border: '1px solid rgba(245,158,11,0.1)', borderRadius: '12px'}} labelStyle={{color: '#f8fafc', fontWeight: 800, textTransform: 'uppercase', fontSize: '10px'}} />
                  <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => <Cell key={index} fill={entry.profit > 0 ? 'hsl(var(--primary))' : '#334155'} fillOpacity={0.8} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="command-gradient text-background border-none shadow-xl rounded-[2.5rem] p-10 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4"><Cpu className="h-7 w-7" /><CardTitle className="text-2xl font-black uppercase italic">AI Synthesis</CardTitle></div>
              {aiAnalysis && <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-background/20 text-background hover:bg-background hover:text-primary" onClick={handlePlayAnalysis} disabled={isSynthesizing}>{isSynthesizing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Volume2 className="h-5 w-5" />}</Button>}
            </div>
            {aiAnalysis ? (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                <div className="p-5 bg-background/20 rounded-2xl border border-background/10"><p className="text-[11px] leading-relaxed font-bold italic">"{aiAnalysis.summary}"</p></div>
                <div className="space-y-3">
                  {aiAnalysis.recommendations.slice(0, 3).map((rec, idx) => (
                    <div key={idx} className="flex gap-3 items-start text-[9px] font-black uppercase tracking-wide leading-snug">
                      <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
                {aiAnalysis.clusterScores && (
                  <div className="grid grid-cols-2 gap-4 mt-6">
                     {aiAnalysis.clusterScores.slice(0, 2).map((score, i) => (
                       <div key={i} className="bg-background/10 p-3 rounded-xl border border-white/5">
                          <span className="text-[8px] font-black uppercase opacity-60">{score.category} Efficiency</span>
                          <p className="text-lg font-black">{score.score}%</p>
                       </div>
                     ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] font-bold opacity-90 leading-relaxed">Synthesize regional patterns and profitability trends for strategic oversight.</p>
            )}
          </div>
          <Button className="w-full h-14 bg-background/20 backdrop-blur-sm text-background hover:bg-background hover:text-primary font-black rounded-xl transition-all uppercase tracking-widest text-[9px] mt-8" onClick={handleRunAIAnalysis} disabled={isAnalyzing}>{isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run Neural Audit"}</Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
         <Card className="glass-card border-none rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between border-b border-white/5">
               <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-black uppercase italic text-white">Logistics Grid Heatmap</CardTitle>
               </div>
               <Badge className="text-[8px] font-bold uppercase tracking-widest bg-primary/10 text-primary border-none">NE-01 Region</Badge>
            </CardHeader>
            <CardContent className="p-10">
               <div className="aspect-[16/9] w-full bg-black/40 rounded-3xl relative overflow-hidden border border-white/5 flex items-center justify-center">
                  <div className="absolute inset-0 opacity-10 flex items-center justify-center">
                     <div className="w-[150%] h-[150%] border-[20px] border-white/5 rounded-full animate-spin-slow" />
                  </div>
                  <div className="relative z-10 text-center space-y-4">
                     <div className="flex justify-center gap-8">
                        {["Assam", "Meghalaya", "Guwahati", "Nagaland"].map((loc, i) => (
                           <div key={loc} className="flex flex-col items-center gap-2">
                              <div className={cn("h-3 w-3 rounded-full animate-pulse", i === 0 ? "bg-primary" : "bg-white/20")} />
                              <span className="text-[8px] font-black uppercase text-muted-foreground">{loc}</span>
                           </div>
                        ))}
                     </div>
                     <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Active Node Distribution // Grid Latency: 12ms</p>
                  </div>
               </div>
            </CardContent>
         </Card>

         <Card className="glass-card border-none rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8 pb-4 border-b border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-rose-500" />
                  <CardTitle className="text-lg font-black uppercase italic text-white">Critical Stock Nodes</CardTitle>
               </div>
               <Badge className="text-[8px] font-bold uppercase tracking-widest bg-rose-500/10 text-rose-500 border-none">Safety Threshold &lt; 10</Badge>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-white/5">
                  {products?.filter(p => p.stockQuantity < 10).slice(0, 5).map((p, i) => (
                    <div key={i} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-white uppercase italic">{p.name}</span>
                          <span className="text-[8px] font-mono text-muted-foreground uppercase">{p.sku}</span>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="flex flex-col items-end">
                             <span className="text-[8px] font-black text-rose-500 uppercase">Critical</span>
                             <span className="text-xs font-black text-white">{p.stockQuantity} Units</span>
                          </div>
                          <Zap className="h-4 w-4 text-rose-500 animate-pulse" />
                       </div>
                    </div>
                  ))}
                  {products?.filter(p => p.stockQuantity < 10).length === 0 && (
                    <div className="py-20 text-center opacity-30">
                       <p className="text-[10px] font-black uppercase tracking-widest italic">All nodes within safety parameters.</p>
                    </div>
                  )}
               </div>
            </CardContent>
         </Card>
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-spin-slow {
          animation: spin 15s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
