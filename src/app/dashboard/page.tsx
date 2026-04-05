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
  Plus
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
      color: "text-primary", 
      bg: "bg-primary/10" 
    },
    { 
      label: "In Transit", 
      value: orders?.filter(o => o.status === 'shipped')?.length?.toString() || "0", 
      icon: Truck, 
      color: "text-blue-500", 
      bg: "bg-blue-500/10" 
    },
    { 
      label: "Node Sync", 
      value: orders?.filter(o => o.status === 'delivered')?.length?.toString() || "0", 
      icon: PackageCheck, 
      color: "text-emerald-500", 
      bg: "bg-emerald-500/10" 
    },
  ], [orders]);

  const getStatusColor = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "delivered": return "text-emerald-600 bg-emerald-500/10 border-emerald-500/20";
      case "processing": return "text-primary bg-primary/10 border-primary/20";
      case "pending": return "text-amber-600 bg-amber-500/10 border-amber-500/20";
      case "shipped": return "text-blue-600 bg-blue-500/10 border-blue-500/20";
      case "cancelled": return "text-rose-600 bg-rose-500/10 border-rose-500/20";
      case "return_pending": return "text-orange-600 bg-orange-500/10 border-orange-500/20";
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
        toast({ title: "Damage Log Recorded", description: `${qty} units flagged for credit.` });
      })
      .catch(() => {
        setIsSubmittingReturn(false);
        toast({ title: "Sync Failed", variant: "destructive" });
      });
  };

  if (!isClient || authLoading || storeLoading || ordersLoading || productsLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-30" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 pb-20">
      {/* Header Protocol */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-500 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-10 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-primary/10 rounded-2xl">
                 <Cpu className="h-6 w-6 text-primary" />
               </div>
               <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Branch Node</h1>
               {store && (
                <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest text-primary border-primary/20 px-3 py-1 bg-primary/5">
                  ID: {store.id.substring(0, 6)}
                </Badge>
              )}
            </div>
            <p className="text-slate-500 font-medium text-lg leading-none">
              Designation: <span className="text-slate-900 font-black italic">{store?.name || "Aether Hub"}</span>
            </p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto relative z-10">
            <Link href="/dashboard/order" className="flex-1 md:flex-none">
              <Button className="w-full h-16 bg-primary text-white font-black rounded-2xl px-10 uppercase tracking-widest text-[10px] cyber-button border-none shadow-xl shadow-primary/20">
                <PlusCircle className="mr-3 h-5 w-5" />
                Initialize Provision
              </Button>
            </Link>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setIsReturnDialogOpen(true)}
                    className="h-16 w-16 rounded-2xl border-slate-200 bg-white text-slate-400 hover:text-primary transition-all shrink-0 shadow-sm"
                  >
                    <Undo2 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest p-3 rounded-xl">
                  Damage Report Protocol
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Stats Cluster */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card className="border-none shadow-lg bg-white rounded-3xl overflow-hidden hover:translate-y-[-4px] transition-all duration-500 group" key={i}>
            <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">{stat.label}</span>
              <div className={cn(stat.bg, stat.color, "p-3 rounded-2xl transition-transform group-hover:scale-110")}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="text-4xl font-black text-slate-900 tracking-tighter italic">{stat.value}</div>
              <div className="flex items-center gap-2 mt-4">
                 <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/20 w-3/4 rounded-full" />
                 </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Provision Cluster */}
        <Card className="bg-[#030712] text-white shadow-2xl border-none rounded-[2.5rem] overflow-hidden flex flex-col group/catalog">
          <CardHeader className="bg-white/5 p-8 pb-6 border-b border-white/5">
            <CardTitle className="text-xl font-black flex items-center gap-4 uppercase italic tracking-tighter">
              <Package className="h-6 w-6 text-primary" />
              Provision Registry
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 flex-1">
            <div className="grid grid-cols-2 gap-4">
              {productsList.length > 0 ? productsList.map((product) => {
                const img = (product.imageUrls || []).filter(u => !!u)[0] || product.imageUrl || `https://picsum.photos/seed/${product.id}/100/100`;
                let Icon = Package;
                if (product.category === 'Electronics') Icon = Smartphone;
                else if (product.category === 'Apparel') Icon = Shirt;
                else if (product.category === 'Grocery') Icon = Apple;
                else if (product.category === 'Office Supplies') Icon = Briefcase;

                return (
                  <Link key={product.id} href="/dashboard/order" className="group">
                    <div className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all cursor-pointer h-full">
                      <div className="relative h-16 w-16 rounded-xl overflow-hidden shrink-0 bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <img src={img} alt={product.name} className="h-full w-full object-cover" />
                        <div className="absolute -bottom-1 -right-1 bg-primary p-1 rounded-lg border border-black/50">
                          <Icon className="h-2.5 w-2.5 text-white" />
                        </div>
                      </div>
                      <p className="font-black text-[9px] uppercase tracking-tighter italic truncate w-full text-center opacity-60 group-hover:text-primary group-hover:opacity-100 transition-all">{product.name}</p>
                    </div>
                  </Link>
                );
              }) : (
                <p className="text-[9px] text-center font-black opacity-30 uppercase tracking-widest col-span-2 py-12">Registry Offline</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="p-8 pt-0">
            <Link href="/dashboard/order" className="w-full">
              <Button className="w-full h-14 bg-primary text-white rounded-xl shadow-xl font-black uppercase tracking-widest text-[9px] hover:scale-[1.02] transition-all">
                Access Catalog <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Analytics & Traffic */}
        <div className="lg:col-span-2 space-y-10">
           <Card className="border-none bg-white rounded-[2.5rem] overflow-hidden shadow-xl group">
             <CardHeader className="p-8 pb-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-slate-900">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Flow Telemetry</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-slate-100 text-slate-500 border-none">7 Cycle Audit</Badge>
               </div>
             </CardHeader>
             <CardContent className="p-8 pt-0">
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dy={10} />
                      <RechartsTooltip 
                        cursor={{fill: 'rgba(0,0,0,0.02)'}}
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}
                        labelStyle={{fontWeight: 900, fontSize: '10px', textTransform: 'uppercase'}}
                      />
                      <Bar dataKey="spent" radius={[4, 4, 4, 4]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--muted))'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </CardContent>
           </Card>

           <Card className="shadow-2xl border-none bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="border-b border-slate-100 p-8 flex flex-row items-center justify-between">
              <div className="flex items-center gap-4 text-slate-900">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Telemetry Logs</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                 <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600">Active Node</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {orders.length > 0 ? orders.slice(0, 6).map((order) => (
                  <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-8 hover:bg-slate-50 transition-all gap-6 group">
                    <div className="space-y-1">
                      <p className="font-black text-primary flex items-center gap-2 uppercase italic text-[10px] tracking-widest">
                        PKT_{order.id.substring(0, 8)}
                        <span className="text-[9px] font-bold text-slate-300">• {order.createdAt?.seconds ? format(order.createdAt.seconds * 1000, 'HH:mm') : 'SYNC'}</span>
                      </p>
                      <p className="text-sm font-black text-slate-700 uppercase tracking-tighter group-hover:text-primary transition-colors truncate max-w-[240px]">{order.items || 'Standard Packet'}</p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-10">
                      <p className="text-lg font-black text-slate-900 font-mono tracking-tighter">₹{(order.total || 0).toFixed(0)}</p>
                      <Badge className={cn("capitalize h-8 px-4 font-black rounded-xl text-[9px] tracking-widest uppercase border shadow-sm", getStatusColor(order.status))}>
                        {order.status === 'return_pending' ? 'DAMAGE' : order.status}
                      </Badge>
                    </div>
                  </div>
                )) : (
                  <div className="py-24 text-center text-slate-300 font-black uppercase text-[10px] tracking-[0.5em] italic">Telemetry Stream Offline</div>
                )}
              </div>
              <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                <Link href="/dashboard/history" className="block text-center">
                  <Button variant="ghost" className="text-slate-400 font-black uppercase tracking-widest text-[9px] hover:text-primary hover:bg-white h-12 rounded-xl w-full transition-all">
                    Full Log Registry <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Return Dialog Protocol */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="rounded-[2.5rem] border-none p-10 bg-white max-w-2xl shadow-2xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-black text-primary uppercase italic tracking-tighter flex items-center gap-3">
              <Undo2 className="h-6 w-6" /> Damage Log Registry
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-500 text-sm">
              Archive damaged SKU data for regional credit verification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-8">
            {returnableProducts.length > 0 ? (
              <div className="grid gap-4 max-h-[45vh] overflow-y-auto pr-4 custom-scrollbar">
                {returnableProducts.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary/20 transition-all gap-4">
                    <div className="space-y-1">
                      <h4 className="font-black text-slate-900 uppercase italic text-sm leading-tight">{item.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Density: {item.totalQuantity} Units</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-white rounded-xl border border-slate-200 overflow-hidden h-10 shadow-sm">
                        <button onClick={() => updateDamageQty(item.name, -1, item.totalQuantity)} className="px-3 hover:bg-slate-50 text-slate-400 hover:text-primary"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-10 text-center font-black text-xs text-primary">{damageReportQuantities[item.name] || 0}</span>
                        <button onClick={() => updateDamageQty(item.name, 1, item.totalQuantity)} className="px-3 hover:bg-slate-50 text-slate-400 hover:text-primary"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleInitiateReturn(item)}
                        disabled={isSubmittingReturn || (damageReportQuantities[item.name] || 0) === 0}
                        className="h-10 px-6 rounded-xl bg-slate-900 text-white font-black uppercase text-[9px] tracking-widest hover:bg-primary transition-all"
                      >
                        {isSubmittingReturn ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Log Entry"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                 <AlertCircle className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No Delivered Payloads Found</p>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-slate-100 pt-8">
            <Button variant="ghost" onClick={() => setIsReturnDialogOpen(false)} className="h-12 rounded-xl font-black uppercase tracking-widest text-[9px] text-slate-400 hover:text-rose-500">Terminate Protocol</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}