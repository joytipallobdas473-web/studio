
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Package, ShoppingCart, AlertCircle, Loader2, Cpu, Activity, Zap, Globe, TrendingUp, BarChart3, CheckCircle2, Bell, ShieldAlert, Volume2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { analyzeInventory, type InventoryAnalysisOutput } from "@/ai/flows/inventory-analyst";
import { synthesizeAnalysis } from "@/ai/flows/audio-summary";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip, Cell, YAxis } from "recharts";
import { format, subDays, isSameDay } from "date-fns";
import Image from "next/image";

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
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3"><div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /><span className="text-[10px] font-black tracking-[0.4em] text-primary uppercase">Regional Command v6.0</span></div>
          <h1 className="text-4xl font-black text-white uppercase italic">Command Center</h1>
        </div>
        <div className="flex gap-4"><Button variant="outline" className="h-12 px-6 rounded-xl font-black border-white/10 bg-white/5 text-[10px] uppercase text-white" onClick={() => window.location.reload()}><Zap className="mr-2 h-4 w-4" /> Refresh Grid</Button></div>
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
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'}} labelStyle={{color: '#f8fafc', fontWeight: 800, textTransform: 'uppercase', fontSize: '10px'}} />
                  <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => <Cell key={index} fill={entry.profit > 0 ? '#10b981' : '#334155'} fillOpacity={0.8} />)}
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
              {aiAnalysis && <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-background/20 text-background" onClick={handlePlayAnalysis} disabled={isSynthesizing}>{isSynthesizing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Volume2 className="h-5 w-5" />}</Button>}
            </div>
            {aiAnalysis ? (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                <div className="p-5 bg-background/20 rounded-2xl border border-background/10"><p className="text-[11px] leading-relaxed font-bold italic">"{aiAnalysis.summary}"</p></div>
                <div className="space-y-3">{aiAnalysis.recommendations.slice(0, 3).map((rec, idx) => (<div key={idx} className="flex gap-3 items-start text-[9px] font-black uppercase tracking-wide leading-snug"><CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" /><span>{rec}</span></div>))}</div>
              </div>
            ) : (
              <p className="text-[11px] font-bold opacity-90 leading-relaxed">Synthesize regional patterns and profitability trends for strategic oversight.</p>
            )}
          </div>
          <Button className="w-full h-14 bg-background/20 backdrop-blur-sm text-background hover:bg-background hover:text-primary font-black rounded-xl transition-all uppercase tracking-widest text-[9px] mt-8" onClick={handleRunAIAnalysis} disabled={isAnalyzing}>{isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run Neural Audit"}</Button>
        </Card>
      </div>
    </div>
  );
}
