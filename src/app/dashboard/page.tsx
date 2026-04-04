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
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Undo2,
  AlertTriangle,
  Minus,
  Plus,
  History,
  Smartphone,
  Shirt,
  Apple,
  Briefcase,
  LayoutGrid,
  TrendingDown,
  Layers,
  BarChart3,
  Star
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
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from "recharts";

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
      label: "Pending Transmissions", 
      value: orders?.filter(o => o.status === 'pending')?.length?.toString() || "0", 
      icon: ShoppingCart, 
      color: "text-primary", 
      bg: "bg-primary/5" 
    },
    { 
      label: "Active Inbound", 
      value: orders?.filter(o => o.status === 'shipped')?.length?.toString() || "0", 
      icon: Truck, 
      color: "text-accent", 
      bg: "bg-accent/5" 
    },
    { 
      label: "Stock Handover", 
      value: orders?.filter(o => o.status === 'delivered')?.length?.toString() || "0", 
      icon: PackageCheck, 
      color: "text-emerald-600", 
      bg: "bg-emerald-50" 
    },
  ], [orders]);

  const getStatusColor = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "delivered": return "text-emerald-700 bg-emerald-50 border-emerald-100";
      case "processing": return "text-primary bg-primary/5 border-primary/10";
      case "pending": return "text-amber-700 bg-amber-50 border-amber-100";
      case "shipped": return "text-indigo-700 bg-indigo-50 border-indigo-100";
      case "cancelled": return "text-rose-700 bg-rose-50 border-rose-100";
      case "return_pending": return "text-orange-700 bg-orange-50 border-orange-100";
      case "returned": return "text-slate-700 bg-slate-100 border-slate-200";
      default: return "text-slate-700 bg-slate-50 border-slate-100";
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
        toast({ title: "Damage Protocol Active", description: `${qty} unit(s) flagged for regional credit.` });
      })
      .catch(() => {
        setIsSubmittingReturn(false);
        toast({ title: "Transmission Failed", description: "Node sync error.", variant: "destructive" });
      });
  };

  if (!isClient || authLoading || storeLoading || ordersLoading || productsLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white p-10 rounded-[3rem] border border-primary/10 shadow-[0_20px_50px_-12px_rgba(15,50,45,0.08)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-20 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-3">
             <Star className="h-5 w-5 text-primary animate-pulse fill-primary" />
             <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Boutique Node</h1>
             {store && (
              <Badge variant="outline" className="font-black text-[9px] uppercase tracking-[0.4em] text-primary border-primary/20 px-3 py-1 bg-primary/5">
                {store.status}
              </Badge>
            )}
          </div>
          <p className="text-slate-500 font-medium text-base tracking-wide">
            Designation: <span className="text-slate-900 font-black italic">{store?.name || "Aether Branch"}</span>
          </p>
        </div>
        <div className="flex items-center gap-5 w-full md:w-auto relative z-10">
          <Link href="/dashboard/order" className="flex-1 md:flex-none">
            <Button className="w-full bg-primary text-white font-black hover:scale-[1.05] transition-all shadow-[0_15px_35px_-5px_rgba(15,50,45,0.3)] h-16 rounded-[2rem] px-10 uppercase tracking-widest text-[11px] border-none">
              <PlusCircle className="mr-3 h-5 w-5" />
              Boutique Reorder
            </Button>
          </Link>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setIsReturnDialogOpen(true)}
                  className="h-10 w-10 rounded-2xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all shrink-0"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-white border-primary/10 text-primary font-black text-[9px] uppercase tracking-widest p-3 rounded-xl shadow-xl">
                Damage Reporting
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <Card className="border-none shadow-[0_10px_30px_-5px_rgba(15,50,45,0.04)] overflow-hidden bg-white rounded-[2.5rem] hover:translate-y-[-4px] transition-all duration-500 group" key={i}>
            <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">{stat.label}</CardTitle>
              <div className={cn(stat.bg, stat.color, "p-3 rounded-2xl group-hover:scale-110 transition-transform")}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="text-4xl font-black text-slate-900 tracking-tighter italic">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Card className="bg-accent text-white shadow-2xl border-none rounded-[3.5rem] overflow-hidden flex flex-col order-first group/catalog">
          <CardHeader className="bg-white/5 p-10 pb-6 border-b border-white/5">
            <CardTitle className="text-2xl font-black flex items-center gap-4 uppercase italic tracking-tighter">
              <Package className="h-7 w-7 text-primary" />
              Silk Catalog
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 flex-1">
            <div className="grid grid-cols-2 gap-5">
              {productsList && productsList.length > 0 ? productsList.map((product) => {
                const validImages = (product.imageUrls || []).filter((u: string) => !!u);
                const primaryImage = validImages[0] || product.imageUrl || `https://picsum.photos/seed/${product.id}/100/100`;

                let CategoryIcon = Package;
                if (product.category === 'Electronics') CategoryIcon = Smartphone;
                else if (product.category === 'Apparel') CategoryIcon = Shirt;
                else if (product.category === 'Grocery') CategoryIcon = Apple;
                else if (product.category === 'Office Supplies') CategoryIcon = Briefcase;

                const mrp = product.mrp || product.price || 0;
                const price = product.price || 0;
                const savings = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

                return (
                  <Link key={product.id} href="/dashboard/order" className="group">
                    <div className="flex flex-col items-center gap-4 p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[2.5rem] transition-all cursor-pointer relative overflow-hidden h-full shadow-lg group-hover:shadow-primary/20">
                      <div className="h-20 w-20 rounded-[1.5rem] overflow-hidden shrink-0 bg-white/10 flex items-center justify-center relative group-hover:scale-110 transition-transform duration-500">
                        <img 
                          src={primaryImage}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-primary p-1.5 rounded-lg border border-white/20 shadow-md">
                          <CategoryIcon className="h-3 w-3 text-white" />
                        </div>
                        {savings > 0 && (
                          <div className="absolute top-0 left-0 bg-emerald-500 text-white text-[7px] font-black px-2 py-1 rounded-br-xl shadow-lg">
                            -{savings}%
                          </div>
                        )}
                      </div>
                      <div className="text-center w-full space-y-1">
                        <p className="font-black text-[10px] uppercase tracking-tighter italic truncate w-full group-hover:text-primary transition-colors">{product.name}</p>
                        <div className="flex flex-col items-center">
                           <span className="text-[8px] font-bold opacity-30 line-through">₹{mrp.toFixed(0)}</span>
                           <span className="text-[10px] font-mono font-black group-hover:text-primary transition-colors">₹{price.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              }) : (
                <p className="text-xs text-center font-bold opacity-50 uppercase tracking-widest col-span-2">Registry Empty</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="p-10 pt-0">
            <Link href="/dashboard/order" className="w-full">
              <Button className="w-full h-16 bg-white text-accent rounded-[1.5rem] shadow-xl font-black uppercase tracking-[0.3em] text-[11px] hover:bg-primary hover:text-white transition-all">
                Reveal Catalog
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <div className="lg:col-span-2 space-y-10">
           <Card className="border-none bg-white rounded-[3.5rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(15,50,45,0.06)] group">
             <CardHeader className="p-10 pb-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-slate-900">
                    <BarChart3 className="h-6 w-6 text-primary" />
                    <CardTitle className="text-2xl font-black uppercase italic tracking-tighter">Procurement Flow</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-[0.4em] px-4 py-1.5 bg-primary/5 text-primary border-none">Analysis Grid</Badge>
               </div>
             </CardHeader>
             <CardContent className="p-10 pt-0">
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 800}} dy={12} />
                      <RechartsTooltip 
                        cursor={{fill: 'rgba(15, 50, 45, 0.03)'}}
                        contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px -10px rgba(15,50,45,0.15)', padding: '16px'}}
                        labelStyle={{fontWeight: 900, fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px'}}
                      />
                      <Bar dataKey="spent" radius={[6, 6, 6, 6]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--muted))'} className="transition-all hover:opacity-80" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </CardContent>
           </Card>

           <Card className="shadow-[0_25px_70px_-20px_rgba(15,50,45,0.08)] border-none bg-white rounded-[3.5rem] overflow-hidden">
            <CardHeader className="border-b border-secondary bg-secondary/30 p-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-slate-900">
                  <Activity className="h-6 w-6 text-primary" />
                  <CardTitle className="text-2xl font-black uppercase italic tracking-tighter">Grid Telemetry</CardTitle>
                </div>
                <div className="flex items-center gap-3">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Secure Link</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-secondary">
                {orders && orders.length > 0 ? orders.slice(0, 10).map((order) => (
                  <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-10 hover:bg-secondary/20 transition-all gap-8 group">
                    <div>
                      <p className="font-black text-primary flex items-center gap-3 uppercase italic text-[11px] tracking-widest">
                        PKG_{order.id.substring(0, 8)}
                        <span className="text-[10px] font-bold text-slate-300">• {order.createdAt?.seconds ? format(order.createdAt.seconds * 1000, 'MMM dd • HH:mm') : 'SYNCING'}</span>
                      </p>
                      <p className="text-base font-black text-slate-700 mt-2 uppercase tracking-tighter group-hover:text-primary transition-colors">{order.items || 'Restock Packet'}</p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-12">
                      <p className="text-xl font-black text-slate-900 font-mono tracking-tighter">₹{(order.total || 0).toFixed(0)}</p>
                      <Badge className={cn("capitalize h-10 px-6 font-black rounded-2xl text-[10px] tracking-[0.2em] uppercase border-none shadow-sm", getStatusColor(order.status))}>
                        {order.status === 'return_pending' ? 'DAMAGE LOG' : order.status}
                      </Badge>
                    </div>
                  </div>
                )) : (
                  <div className="py-32 text-center text-slate-400 font-black uppercase text-[11px] tracking-[0.5em] italic">Awaiting node synchronization...</div>
                )}
              </div>
              <div className="p-10 border-t border-secondary bg-secondary/10">
                <Link href="/dashboard/history" className="block text-center">
                  <Button variant="ghost" className="text-primary font-black uppercase tracking-[0.4em] text-[11px] hover:bg-primary/10 h-14 rounded-2xl w-full">
                    Access Historical Logs <ArrowRight className="ml-4 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="rounded-[3.5rem] border-none p-12 bg-white max-w-3xl shadow-2xl">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-3xl font-black text-primary uppercase italic tracking-tighter flex items-center gap-4">
              <Undo2 className="h-8 w-8 text-primary" /> Damage Reporting
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-500 text-base leading-relaxed">
              Flag damaged inventory for regional credit. High-density documentation may be requested by the regional hub.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-10">
            {returnableProducts.length > 0 ? (
              <div className="grid gap-5 max-h-[55vh] overflow-y-auto pr-6 custom-scrollbar">
                {returnableProducts.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-8 bg-secondary/30 rounded-[2.5rem] border border-secondary group hover:border-primary/40 transition-all gap-6">
                    <div className="space-y-2">
                      <h4 className="font-black text-slate-900 uppercase italic text-base leading-none">{item.name}</h4>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Logged Density: {item.totalQuantity} Units</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center bg-white rounded-2xl border border-secondary overflow-hidden h-12 shadow-sm">
                        <button 
                          onClick={() => updateDamageQty(item.name, -1, item.totalQuantity)} 
                          className="px-4 hover:bg-secondary transition-colors text-slate-400 hover:text-primary"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-12 text-center font-black text-sm text-primary">
                          {damageReportQuantities[item.name] || 0}
                        </span>
                        <button 
                          onClick={() => updateDamageQty(item.name, 1, item.totalQuantity)} 
                          className="px-4 hover:bg-secondary transition-colors text-slate-400 hover:text-primary"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleInitiateReturn(item)}
                        disabled={isSubmittingReturn || (damageReportQuantities[item.name] || 0) === 0}
                        className="h-12 px-8 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                      >
                        {isSubmittingReturn ? <Loader2 className="h-4 w-4 animate-spin" /> : "Transmit Claim"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-secondary/10 rounded-[3rem] border border-dashed border-secondary">
                 <AlertCircle className="h-16 w-16 text-slate-300 mx-auto mb-6 opacity-30" />
                 <p className="text-sm font-black text-slate-400 uppercase tracking-[0.4em] italic">No Restock Payloads Detected</p>
                 <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-2">Only confirmed deliveries can be reported.</p>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-secondary pt-10">
            <Button variant="ghost" onClick={() => setIsReturnDialogOpen(false)} className="h-14 rounded-2xl font-black uppercase tracking-[0.4em] text-[11px] text-slate-400 hover:text-primary transition-colors">Abort Protocol</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}