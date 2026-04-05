
"use client";

import { useFirestore, useCollection, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, doc, where, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  ShoppingCart, 
  ArrowRight, 
  Truck, 
  PackageCheck, 
  PlusCircle, 
  Activity, 
  Loader2, 
  ChevronRight, 
  Undo2,
  AlertCircle,
  Smartphone,
  Shirt,
  Apple,
  Briefcase,
  BarChart3,
  Star,
  Cpu,
  Zap,
  Layers,
  Sparkles,
  Minus,
  Plus,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { addDocumentNonBlocking } from "@/firebase";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip as RechartsTooltip, Cell } from "recharts";

const MASTER_ADMIN_UID = "j96izCkggNcL002AHiJjzGb18Bf2";

export default function DashboardPage() {
  const db = useFirestore();
  const { user, isUserLoading: authLoading } = useUser();
  const [isClient, setIsClient] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [damageReportQuantities, setDamageReportQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    setIsClient(true);
  }, []);

  const storeRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "stores", user.uid);
  }, [db, user?.uid]);

  const { data: store, isLoading: storeLoading } = useDoc(storeRef);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "orders"), 
      where("userId", "==", user.uid)
    );
  }, [db, user?.uid]);

  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "products"));
  }, [db]);

  const { data: rawOrders, isLoading: ordersLoading } = useCollection(ordersQuery);
  const { data: rawProducts, isLoading: productsLoading } = useCollection(productsQuery);

  const orders = useMemo(() => {
    if (!rawOrders) return [];
    return [...rawOrders].sort((a, b) => {
      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;
      return dateB - dateA;
    });
  }, [rawOrders]);

  const chartData = useMemo(() => {
    if (!orders) return [];
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('en-IN', { weekday: 'short' });
    }).reverse();

    return days.map(day => {
      const dayTotal = orders
        .filter(o => o.createdAt?.seconds && format(o.createdAt.seconds * 1000, 'EEE') === day)
        .reduce((sum, o) => sum + (o.total || 0), 0);
      return { name: day, spent: dayTotal };
    });
  }, [orders]);

  const returnableProducts = useMemo(() => {
    if (!orders) return [];
    const delivered = orders.filter(o => o.status === 'delivered');
    const uniqueItemsMap = new Map();
    
    delivered.forEach(o => {
      const key = o.items;
      if (!uniqueItemsMap.has(key)) {
        uniqueItemsMap.set(key, {
          name: o.items,
          totalQuantity: o.quantity || 0,
          orders: [o.id],
          productId: o.productId || "",
          pricePerUnit: (o.total || 0) / (o.quantity || 1)
        });
      } else {
        const existing = uniqueItemsMap.get(key);
        existing.totalQuantity += (o.quantity || 0);
        existing.orders.push(o.id);
      }
    });
    
    return Array.from(uniqueItemsMap.values());
  }, [orders]);

  useEffect(() => {
    if (isReturnDialogOpen && returnableProducts.length > 0) {
      const initial: Record<string, number> = {};
      returnableProducts.forEach(p => {
        initial[p.name] = 0;
      });
      setDamageReportQuantities(initial);
    }
  }, [isReturnDialogOpen, returnableProducts]);

  const updateDamageQty = (name: string, delta: number, max: number) => {
    setDamageReportQuantities(prev => ({
      ...prev,
      [name]: Math.min(max, Math.max(0, (prev[name] || 0) + delta))
    }));
  };

  const productsList = useMemo(() => {
    if (!rawProducts) return [];
    return [...rawProducts].sort((a, b) => (a.name || "").localeCompare(b.name || "")).slice(0, 8);
  }, [rawProducts]);

  const stats = useMemo(() => [
    { 
      label: "Open Request", 
      value: orders?.filter(o => o.status === 'pending')?.length?.toString() || "0", 
      icon: ShoppingCart, 
      color: "text-emerald-600", 
      bg: "bg-emerald-50" 
    },
    { 
      label: "In Transit", 
      value: orders?.filter(o => o.status === 'shipped')?.length?.toString() || "0", 
      icon: Truck, 
      color: "text-sky-600", 
      bg: "bg-sky-50" 
    },
    { 
      label: "Completed Sync", 
      value: orders?.filter(o => o.status === 'delivered')?.length?.toString() || "0", 
      icon: PackageCheck, 
      color: "text-emerald-700", 
      bg: "bg-emerald-100/50" 
    },
  ], [orders]);

  const getStatusColor = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "delivered": return "text-emerald-700 bg-emerald-100 border-emerald-200";
      case "processing": return "text-sky-700 bg-sky-50 border-sky-100";
      case "pending": return "text-amber-700 bg-amber-50 border-amber-100";
      case "shipped": return "text-blue-700 bg-blue-50 border-blue-100";
      case "cancelled": return "text-rose-700 bg-rose-50 border-rose-100";
      case "return_pending": return "text-orange-700 bg-orange-50 border-orange-100";
      default: return "text-slate-500 bg-slate-100 border-slate-200";
    }
  };

  const handleInitiateReturn = (item: any) => {
    if (!db || !user) return;
    const qty = damageReportQuantities[item.name] || 0;
    if (qty === 0) return;
    
    setIsSubmittingReturn(true);

    const returnData = {
      items: `DAMAGE REPORT: ${item.name}`,
      productId: item.productId || "",
      userId: user.uid,
      quantity: qty, 
      total: item.pricePerUnit * qty,
      phoneNumber: store?.phoneNumber || "",
      deliveryAddress: store?.location || "",
      paymentMethod: "cash", 
      email: store?.email || user.email || "",
      status: "return_pending",
      storeName: store?.name || "Retailer Node",
      createdAt: serverTimestamp()
    };

    addDocumentNonBlocking(collection(db, "orders"), returnData)
      .then(() => {
        setIsSubmittingReturn(false);
        setIsReturnDialogOpen(false);
        toast({ title: "Damage Log Recorded", description: `${qty} units flagged for audit.` });
      })
      .catch(() => {
        setIsSubmittingReturn(false);
        toast({ title: "Sync Failed", variant: "destructive" });
      });
  };

  if (!isClient || authLoading || storeLoading || ordersLoading || productsLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600 opacity-30" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Dynamic Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:opacity-100 transition-opacity" />
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black tracking-[0.4em] text-emerald-600 uppercase">Live Branch Node</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            {store?.name || "Aether Branch"}
          </h1>
          <div className="text-slate-500 font-medium text-sm flex items-center gap-2">
            Regional Designation: <Badge variant="outline" className="rounded-lg text-[9px] font-bold uppercase tracking-widest text-emerald-600 border-emerald-100 px-2 py-0.5">{store?.id.substring(0, 8)}</Badge>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
          <Link href="/dashboard/order" className="flex-1 md:flex-none">
            <Button className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl px-8 uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-100 border-none transition-all hover:scale-[1.02]">
              <PlusCircle className="mr-2 h-4 w-4" />
              New order
            </Button>
          </Link>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setIsReturnDialogOpen(true)}
                  className="h-14 w-14 rounded-xl border-slate-200 bg-white text-slate-400 hover:text-emerald-600 transition-all shrink-0"
                >
                  <Undo2 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest p-2 rounded-lg">
                Report Damage
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Grid Status Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow-md transition-all group" key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{stat.label}</span>
                <div className={cn(stat.bg, stat.color, "p-2.5 rounded-xl group-hover:scale-110 transition-transform")}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 tracking-tighter italic">{stat.value}</div>
              <div className="flex items-center gap-1.5 mt-4 text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                <Activity className="h-3 w-3" /> Sync Active
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Operations Hub */}
        <div className="lg:col-span-2 space-y-8">
           <Card className="border-none bg-white rounded-[2rem] overflow-hidden shadow-sm">
             <CardHeader className="p-8 pb-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-emerald-600" />
                    <CardTitle className="text-lg font-black uppercase italic tracking-tighter text-slate-900">Procurement Audit</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-[8px] font-bold uppercase tracking-widest bg-slate-50 text-slate-400 border-none">7 Cycle Log</Badge>
               </div>
             </CardHeader>
             <CardContent className="p-8 pt-0">
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dy={10} />
                      <RechartsTooltip 
                        cursor={{fill: 'rgba(0,0,0,0.02)'}}
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)'}}
                        labelStyle={{fontWeight: 900, fontSize: '10px', textTransform: 'uppercase'}}
                      />
                      <Bar dataKey="spent" radius={[4, 4, 4, 4]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#059669' : '#e2e8f0'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </CardContent>
           </Card>

           <Card className="shadow-sm border-none bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="border-b border-slate-50 p-8 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3 text-slate-900">
                <Activity className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-lg font-black uppercase italic tracking-tighter">Live Telemetry</CardTitle>
              </div>
              <Link href="/dashboard/history">
                <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50">
                  Full Log <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {orders.length > 0 ? orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-all group">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-black text-emerald-600 uppercase tracking-widest">PKT-{order.id.substring(0, 6)}</span>
                        <span className="text-[8px] font-bold text-slate-300 uppercase">{order.createdAt?.seconds ? format(order.createdAt.seconds * 1000, 'MMM dd') : 'SYNC'}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700 uppercase tracking-tight truncate max-w-[200px]">{order.items || 'Standard Packet'}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className="text-sm font-black text-slate-900 font-mono tracking-tighter">₹{(order.total || 0).toFixed(0)}</p>
                      <Badge className={cn("h-7 px-3 font-black rounded-lg text-[8px] tracking-widest uppercase border shadow-none", getStatusColor(order.status))}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                )) : (
                  <div className="py-20 text-center text-slate-200 font-black uppercase text-[10px] tracking-[0.5em] italic">Telemetry Stream Offline</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rapid Access Catalog */}
        <Card className="bg-slate-900 text-white shadow-xl border-none rounded-[2.5rem] overflow-hidden flex flex-col h-full">
          <CardHeader className="bg-white/5 p-8 border-b border-white/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-black flex items-center gap-3 uppercase italic tracking-tighter text-emerald-400">
                <Package className="h-5 w-5" />
                SKU Provision
              </CardTitle>
              <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black uppercase px-2 py-0.5 rounded-lg">{productsList.length} Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex-1">
            <div className="grid grid-cols-2 gap-3">
              {productsList.length > 0 ? productsList.map((product) => {
                const img = (product.imageUrls || []).filter(u => !!u)[0] || product.imageUrl || `https://picsum.photos/seed/${product.id}/100/100`;
                return (
                  <Link key={product.id} href="/dashboard/order" className="group">
                    <div className="flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all h-full">
                      <div className="relative h-14 w-14 rounded-lg overflow-hidden shrink-0 bg-white/10 group-hover:scale-105 transition-transform">
                        <img src={img} alt={product.name} className="h-full w-full object-cover" />
                      </div>
                      <p className="font-black text-[8px] uppercase tracking-tighter italic truncate w-full text-center opacity-60 group-hover:text-emerald-400 group-hover:opacity-100 transition-all">{product.name}</p>
                    </div>
                  </Link>
                );
              }) : (
                <div className="col-span-2 py-12 text-center text-white/20 font-black uppercase text-[10px] tracking-widest">Registry Offline</div>
              )}
            </div>
          </CardContent>
          <CardFooter className="p-6 pt-0">
            <Link href="/dashboard/order" className="w-full">
              <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg font-black uppercase tracking-widest text-[9px] border-none transition-all group">
                Access Full Catalog <ArrowUpRight className="ml-2 h-3.5 w-3.5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Audit Modal Protocol */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="rounded-[2.5rem] border-none p-8 bg-white max-w-xl shadow-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-black text-emerald-600 uppercase italic tracking-tighter flex items-center gap-3">
              <Undo2 className="h-5 w-5" /> Damage Audit Registry
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-500 text-xs">
              Archive damaged SKU data for regional credit verification.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            {returnableProducts.length > 0 ? (
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {returnableProducts.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 transition-all">
                    <div className="space-y-0.5">
                      <h4 className="font-black text-slate-900 uppercase italic text-xs leading-none">{item.name}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Density: {item.totalQuantity} Units</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-white rounded-lg border border-slate-200 overflow-hidden h-8 shadow-sm">
                        <button onClick={() => updateDamageQty(item.name, -1, item.totalQuantity)} className="px-2 hover:bg-slate-50 text-slate-400"><Minus className="h-3 w-3" /></button>
                        <span className="w-8 text-center font-black text-xs text-emerald-600">{damageReportQuantities[item.name] || 0}</span>
                        <button onClick={() => updateDamageQty(item.name, 1, item.totalQuantity)} className="px-2 hover:bg-slate-50 text-slate-400"><Plus className="h-3 w-3" /></button>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleInitiateReturn(item)}
                        disabled={isSubmittingReturn || (damageReportQuantities[item.name] || 0) === 0}
                        className="h-8 px-4 rounded-lg bg-slate-900 text-white font-black uppercase text-[8px] tracking-widest hover:bg-emerald-600 transition-all"
                      >
                        {isSubmittingReturn ? <Loader2 className="h-3 w-3 animate-spin" /> : "Log Entry"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                 <AlertCircle className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">No Delivered Payloads Found</p>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-slate-100 pt-6">
            <Button variant="ghost" onClick={() => setIsReturnDialogOpen(false)} className="h-10 rounded-lg font-black uppercase tracking-widest text-[9px] text-slate-400 hover:text-rose-500">Close Protocol</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
