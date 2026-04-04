
"use client";

import { useFirestore, useCollection, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, doc, where, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
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
  Layers
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
      label: "Pending Packets", 
      value: orders?.filter(o => o.status === 'pending')?.length?.toString() || "0", 
      icon: ShoppingCart, 
      color: "text-blue-600", 
      bg: "bg-blue-50" 
    },
    { 
      label: "Regional Transit", 
      value: orders?.filter(o => o.status === 'shipped')?.length?.toString() || "0", 
      icon: Truck, 
      color: "text-indigo-600", 
      bg: "bg-indigo-50" 
    },
    { 
      label: "Stock Logged", 
      value: orders?.filter(o => o.status === 'delivered')?.length?.toString() || "0", 
      icon: PackageCheck, 
      color: "text-emerald-600", 
      bg: "bg-emerald-50" 
    },
  ], [orders]);

  const getStatusColor = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "delivered": return "text-emerald-700 bg-emerald-50 border-emerald-100";
      case "processing": return "text-blue-700 bg-blue-50 border-blue-100";
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
        toast({ title: "Damage Report Filed", description: `${qty} unit(s) reported to regional logistics hub.` });
      })
      .catch(() => {
        setIsSubmittingReturn(false);
        toast({ title: "Network Failure", description: "Could not transmit damage report.", variant: "destructive" });
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
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter text-primary">Branch Overview</h1>
            {store && (
              <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest text-primary border-primary/20">
                {store.status}
              </Badge>
            )}
          </div>
          <p className="text-slate-500 font-medium text-sm">
            Node: <span className="text-slate-900 font-black">{store?.name || "Initializing..."}</span>
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Link href="/dashboard/order">
            <Button className="bg-primary text-white font-black hover:scale-105 transition-all shadow-lg h-14 rounded-2xl px-8 uppercase tracking-widest text-[11px]">
              <PlusCircle className="mr-3 h-5 w-5" />
              New Reorder
            </Button>
          </Link>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setIsReturnDialogOpen(true)}
                  className="h-8 w-8 rounded-lg border-orange-200 bg-orange-50/50 text-orange-700 hover:bg-orange-100 transition-all shrink-0"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-white border-orange-100 text-orange-700 font-black text-[10px] uppercase tracking-widest">
                Damage Reporting
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[1.5rem] hover:translate-y-[-2px] transition-all" key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{stat.label}</CardTitle>
              <div className={cn(stat.bg, stat.color, "p-2.5 rounded-xl")}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900 tracking-tighter italic">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="bg-primary text-white shadow-xl border-none rounded-[2.5rem] overflow-hidden flex flex-col order-first">
          <CardHeader className="bg-white/10 p-8">
            <CardTitle className="text-xl font-black flex items-center gap-3 uppercase italic tracking-tighter">
              <Package className="h-6 w-6" />
              Regional Catalog
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
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
                    <div className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-[1.5rem] transition-all cursor-pointer relative overflow-hidden h-full">
                      <div className="h-14 w-14 rounded-xl overflow-hidden shrink-0 bg-white/10 flex items-center justify-center relative shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <img 
                          src={primaryImage}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-primary p-1 rounded-md border border-white/20">
                          <CategoryIcon className="h-2.5 w-2.5 text-white" />
                        </div>
                        {savings > 0 && (
                          <div className="absolute top-0 left-0 bg-emerald-500 text-white text-[6px] font-black px-1 py-0.5 rounded-br-md">
                            -{savings}%
                          </div>
                        )}
                        {validImages.length > 1 && (
                          <div className="absolute top-0 right-0 p-1">
                            <Layers className="h-2 w-2 text-white/50" />
                          </div>
                        )}
                      </div>
                      <div className="text-center w-full">
                        <p className="font-black text-[9px] uppercase tracking-tighter italic truncate w-full leading-tight group-hover:text-accent transition-colors">{product.name}</p>
                        <div className="flex flex-col items-center">
                           <span className="text-[7px] font-bold opacity-40 line-through">₹{mrp.toFixed(0)}</span>
                           <span className="text-[9px] font-mono font-bold group-hover:text-accent transition-colors">₹{price.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              }) : (
                <p className="text-xs text-center font-bold opacity-50 uppercase tracking-widest col-span-2">No SKUs Provisioned</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="p-8 pt-0">
            <Link href="/dashboard/order" className="w-full">
              <Button className="w-full h-14 bg-white text-primary hover:bg-slate-100 font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg">
                Browse Full Catalog
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="lg:col-span-2 shadow-sm border-none bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="border-b border-slate-50 bg-slate-50/50 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-primary">
                <Activity className="h-5 w-5" />
                <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Telemetery Log</CardTitle>
              </div>
              <Badge className="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border-none px-4 py-1.5 rounded-lg">LIVE</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {orders && orders.length > 0 ? orders.slice(0, 10).map((order) => (
                <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-8 hover:bg-slate-50/50 transition-colors gap-6">
                  <div>
                    <p className="font-black text-primary flex items-center gap-2 uppercase italic text-[10px] tracking-wide">
                      PKT_{order.id.substring(0, 8)}
                      <span className="text-[9px] font-bold text-slate-400">• {order.createdAt?.seconds ? format(order.createdAt.seconds * 1000, 'MMM dd, HH:mm') : 'SYNCING'}</span>
                    </p>
                    <p className="text-sm font-bold text-slate-700 mt-1 uppercase tracking-tight">{order.items || 'Standard Payload'}</p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-10">
                    <p className="text-base font-black text-slate-900 font-mono">₹{(order.total || 0).toFixed(2)}</p>
                    <Badge className={cn("capitalize h-9 px-5 font-black rounded-xl text-[9px] tracking-widest uppercase border", getStatusColor(order.status))}>
                      {order.status === 'return_pending' ? 'Damage Reported' : order.status}
                    </Badge>
                  </div>
                </div>
              )) : (
                <div className="py-24 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest italic">Awaiting telemetry sync...</div>
              )}
            </div>
            <div className="p-8 border-t border-slate-50 bg-slate-50/30">
              <Link href="/dashboard/history" className="block text-center">
                <Button variant="ghost" className="text-primary font-black uppercase tracking-widest text-[10px] hover:bg-primary/5">
                  Access Full Grid Logs <ArrowRight className="ml-3 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="rounded-[2.5rem] border-none p-10 bg-white max-w-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-primary uppercase italic tracking-tighter flex items-center gap-3">
              <Undo2 className="h-6 w-6 text-orange-500" /> Damage Reporting
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-500 pt-2">
              Report damaged items from your confirmed deliveries. The regional hub will review the claim for credit processing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {returnableProducts.length > 0 ? (
              <div className="grid gap-4 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                {returnableProducts.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary/30 transition-all gap-4">
                    <div className="space-y-1">
                      <h4 className="font-black text-slate-900 uppercase italic text-sm">{item.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Received Density: {item.totalQuantity} Units</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-white rounded-xl border border-slate-200 overflow-hidden h-10 shadow-sm">
                        <button 
                          onClick={() => updateDamageQty(item.name, -1, item.totalQuantity)} 
                          className="px-3 hover:bg-slate-50 transition-colors text-slate-400 hover:text-primary"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center font-black text-xs text-primary">
                          {damageReportQuantities[item.name] || 0}
                        </span>
                        <button 
                          onClick={() => updateDamageQty(item.name, 1, item.totalQuantity)} 
                          className="px-3 hover:bg-slate-50 transition-colors text-slate-400 hover:text-primary"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleInitiateReturn(item)}
                        disabled={isSubmittingReturn || (damageReportQuantities[item.name] || 0) === 0}
                        className="h-10 px-6 rounded-xl bg-primary text-white font-black uppercase text-[9px] tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                      >
                        {isSubmittingReturn ? <Loader2 className="h-4 w-4 animate-spin" /> : "Report Damage"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                 <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No delivered stock found.</p>
                 <p className="text-[9px] text-slate-400 uppercase mt-1">Only successfully delivered packets can be reported for damage.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsReturnDialogOpen(false)} className="h-12 rounded-xl font-black uppercase tracking-widest text-[10px] text-slate-400">Abort</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
