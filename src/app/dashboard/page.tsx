"use client";

import { useFirestore, useCollection, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, doc, where, serverTimestamp } from "firebase/firestore";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  ShoppingCart, 
  Truck, 
  PackageCheck, 
  PlusCircle, 
  Activity, 
  Loader2, 
  ChevronRight, 
  Undo2,
  AlertCircle,
  BarChart3,
  Zap,
  Minus,
  Plus,
  ArrowUpRight,
  Camera,
  ImageIcon,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format, subDays, isSameDay } from "date-fns";
import { useMemo, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { addDocumentNonBlocking } from "@/firebase";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip as RechartsTooltip, Cell } from "recharts";

export default function DashboardPage() {
  const db = useFirestore();
  const { user, isUserLoading: authLoading } = useUser();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isClient, setIsClient] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [damageReportQuantities, setDamageReportQuantities] = useState<Record<string, number>>({});
  
  // Camera State for Damage Proof
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [damageProofUrl, setDamageProofUrl] = useState<Record<string, string>>({});
  const [reportingItem, setReportingItem] = useState<any>(null);

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
    const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();
    return days.map(day => {
      const dayLabel = format(day, 'eee');
      const dayTotal = orders
        .filter(o => {
          if (!o.createdAt?.seconds) return false;
          const oDate = new Date(o.createdAt.seconds * 1000);
          return isSameDay(oDate, day);
        })
        .reduce((sum, o) => sum + (o.total || 0), 0);
      return { name: dayLabel, spent: dayTotal };
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
      returnableProducts.forEach(p => { initial[p.name] = 0; });
      setDamageReportQuantities(initial);
    }
  }, [isReturnDialogOpen, returnableProducts]);

  const updateDamageQty = (name: string, delta: number, max: number) => {
    setDamageReportQuantities(prev => ({
      ...prev,
      [name]: Math.min(max, Math.max(0, (prev[name] || 0) + delta))
    }));
  };

  const startCamera = async (item: any) => {
    setReportingItem(item);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      toast({ title: "Lens Failure", description: "Camera access required for damage proof.", variant: "destructive" });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureDamageProof = () => {
    if (videoRef.current && reportingItem) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg', 0.7);
        setDamageProofUrl(prev => ({ ...prev, [reportingItem.name]: dataUri }));
        stopCamera();
        toast({ title: "Proof Synchronized", description: "Damage visual signature captured." });
      }
    }
  };

  const productsList = useMemo(() => {
    if (!rawProducts) return [];
    return [...rawProducts].sort((a, b) => (a.name || "").localeCompare(b.name || "")).slice(0, 8);
  }, [rawProducts]);

  const stats = useMemo(() => [
    { label: "Open Request", value: orders?.filter(o => o.status === 'pending')?.length?.toString() || "0", icon: ShoppingCart, color: "text-primary", bg: "bg-primary/5" },
    { label: "In Transit", value: orders?.filter(o => o.status === 'shipped')?.length?.toString() || "0", icon: Truck, color: "text-sky-600", bg: "bg-sky-50" },
    { label: "Completed Sync", value: orders?.filter(o => o.status === 'delivered')?.length?.toString() || "0", icon: PackageCheck, color: "text-indigo-700", bg: "bg-indigo-50" },
  ], [orders]);

  const getStatusColor = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "delivered": return "text-emerald-700 bg-emerald-50 border-emerald-100";
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
    const proof = damageProofUrl[item.name];

    if (qty === 0) return;
    if (!proof) {
      toast({ title: "Proof Required", description: "Visual evidence is mandatory for damage logs.", variant: "destructive" });
      return;
    }

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
      damageImageUrl: proof,
      storeName: store?.name || "Retailer Node",
      createdAt: serverTimestamp()
    };
    
    addDocumentNonBlocking(collection(db, "orders"), returnData)
      .then(() => {
        setIsSubmittingReturn(false);
        toast({ title: "Damage Log Recorded", description: `${qty} units flagged for audit.` });
        setDamageProofUrl(prev => {
          const next = {...prev};
          delete next[item.name];
          return next;
        });
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
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:opacity-100 transition-opacity" />
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
             <span className="text-[10px] font-black tracking-[0.4em] text-primary uppercase">Live Branch Node</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">{store?.name || "Aether Branch"}</h1>
          <div className="text-slate-500 font-medium text-sm flex items-center gap-2">
            Regional Designation: <Badge variant="outline" className="rounded-lg text-[9px] font-bold uppercase tracking-widest text-primary border-primary/10 px-2 py-0.5">{store?.id.substring(0, 8)}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
          <Link href="/dashboard/order" className="flex-1 md:flex-none">
            <Button className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-xl px-8 uppercase tracking-widest text-[10px] shadow-lg shadow-primary/10 border-none transition-all hover:scale-[1.02]">
              <PlusCircle className="mr-2 h-4 w-4" /> New order
            </Button>
          </Link>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setIsReturnDialogOpen(true)} className="h-14 w-14 rounded-xl border-slate-200 bg-white text-slate-400 hover:text-primary transition-all shrink-0">
                  <Undo2 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest p-2 rounded-lg">Report Damage</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow-md transition-all group" key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{stat.label}</span>
                <div className={cn(stat.bg, stat.color, "p-2.5 rounded-xl group-hover:scale-110 transition-transform")}><stat.icon className="h-4 w-4" /></div>
              </div>
              <div className="text-3xl font-black text-slate-900 tracking-tighter italic">{stat.value}</div>
              <div className="flex items-center gap-1.5 mt-4 text-[9px] font-bold text-primary uppercase tracking-widest"><Activity className="h-3 w-3" /> Sync Active</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <Card className="border-none bg-white rounded-[2rem] overflow-hidden shadow-sm">
             <CardHeader className="p-8 pb-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-primary" />
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
                      <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)'}} labelStyle={{fontWeight: 900, fontSize: '10px', textTransform: 'uppercase'}} />
                      <Bar dataKey="spent" radius={[4, 4, 4, 4]}>
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? 'hsl(var(--primary))' : '#e2e8f0'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </CardContent>
           </Card>

           <Card className="shadow-sm border-none bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="border-b border-slate-50 p-8 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3 text-slate-900">
                <div className="relative">
                  <Activity className="h-5 w-5 text-primary" />
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-primary/40 rounded-full animate-ping" />
                </div>
                <CardTitle className="text-lg font-black uppercase italic tracking-tighter">Live Telemetry</CardTitle>
              </div>
              <Link href="/dashboard/history">
                <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-slate-50">Full Log <ChevronRight className="ml-1 h-3 w-3" /></Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {orders.length > 0 ? orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-all group">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-black text-primary uppercase tracking-widest">PKT-{order.id.substring(0, 6)}</span>
                        <span className="text-[8px] font-bold text-slate-300 uppercase">{order.createdAt?.seconds ? format(order.createdAt.seconds * 1000, 'MMM dd') : 'SYNC'}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700 uppercase tracking-tight truncate max-w-[200px]">{order.items || 'Standard Packet'}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className="text-sm font-black text-slate-900 font-mono tracking-tighter">₹{(order.total || 0).toFixed(0)}</p>
                      <Badge className={cn("h-7 px-3 font-black rounded-lg text-[8px] tracking-widest uppercase border shadow-none", getStatusColor(order.status))}>{order.status}</Badge>
                    </div>
                  </div>
                )) : <div className="py-20 text-center text-slate-200 font-black uppercase text-[10px] tracking-[0.5em] italic">Telemetry Stream Offline</div>}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-900 text-white shadow-xl border-none rounded-[2.5rem] overflow-hidden flex flex-col h-full">
          <CardHeader className="bg-white/5 p-8 border-b border-white/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-black flex items-center gap-3 uppercase italic tracking-tighter text-primary"><Package className="h-5 w-5" /> SKU Provision</CardTitle>
              <Badge className="bg-primary text-white border-none text-[8px] font-black uppercase px-2 py-0.5 rounded-lg">{productsList.length} Active</Badge>
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
                        <Image src={img} alt={product.name} fill className="object-cover" data-ai-hint="product photo" />
                      </div>
                      <p className="font-black text-[8px] uppercase tracking-tighter italic truncate w-full text-center opacity-60 group-hover:text-primary group-hover:opacity-100 transition-all">{product.name}</p>
                    </div>
                  </Link>
                );
              }) : <div className="col-span-2 py-12 text-center text-white/20 font-black uppercase text-[10px] tracking-widest">Registry Offline</div>}
            </div>
          </CardContent>
          <CardFooter className="p-6 pt-0">
            <Link href="/dashboard/order" className="w-full">
              <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg font-black uppercase tracking-widest text-[9px] border-none transition-all group">
                Access Full Catalog <ArrowUpRight className="ml-2 h-3.5 w-3.5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={isReturnDialogOpen} onOpenChange={(open) => {
        if (!open) stopCamera();
        setIsReturnDialogOpen(open);
      }}>
        <DialogContent className="rounded-[2.5rem] border-none p-8 bg-white max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-black text-primary uppercase italic tracking-tighter flex items-center gap-3"><Undo2 className="h-5 w-5" /> Damage Audit Registry</DialogTitle>
            <DialogDescription className="font-medium text-slate-500 text-xs">Capture visual proof and log damaged SKU data for regional audit.</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-6">
            {returnableProducts.length > 0 ? (
              <div className="space-y-4">
                {returnableProducts.map((item, idx) => (
                  <Card key={idx} className="overflow-hidden border border-slate-100 bg-slate-50 rounded-2xl">
                    <div className="p-4 flex items-center justify-between border-b border-white">
                      <div className="space-y-0.5">
                        <h4 className="font-black text-slate-900 uppercase italic text-xs leading-none">{item.name}</h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Available Density: {item.totalQuantity} Units</p>
                      </div>
                      <div className="flex items-center bg-white rounded-lg border border-slate-200 overflow-hidden h-8 shadow-sm">
                        <button onClick={() => updateDamageQty(item.name, -1, item.totalQuantity)} className="px-2 hover:bg-slate-50 text-slate-400"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-8 text-center font-black text-xs text-primary">{damageReportQuantities[item.name] || 0}</span>
                        <button onClick={() => updateDamageQty(item.name, 1, item.totalQuantity)} className="px-2 hover:bg-slate-50 text-slate-400"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    
                    <div className="p-4 flex flex-col sm:flex-row gap-6 items-center">
                       <div className="w-full sm:w-48 aspect-video bg-black rounded-xl overflow-hidden relative border border-slate-200 flex items-center justify-center">
                          {isCameraActive && reportingItem?.name === item.name ? (
                            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                          ) : damageProofUrl[item.name] ? (
                            <Image src={damageProofUrl[item.name]} alt="Proof" fill className="object-cover" />
                          ) : (
                            <div className="flex flex-col items-center gap-2 opacity-20">
                               <ImageIcon className="h-6 w-6 text-white" />
                               <span className="text-[8px] font-black uppercase text-white">No Visual Proof</span>
                            </div>
                          )}
                       </div>
                       
                       <div className="flex-1 flex flex-col gap-3 w-full">
                          {!isCameraActive || reportingItem?.name !== item.name ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => startCamera(item)}
                              className="h-10 rounded-xl border-slate-200 font-black uppercase text-[8px] tracking-widest text-slate-500 hover:text-primary"
                            >
                              <Camera className="h-3.5 w-3.5 mr-2" /> {damageProofUrl[item.name] ? "Retake Proof" : "Start Audit Lens"}
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              onClick={captureDamageProof}
                              className="h-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-[8px] tracking-widest shadow-md"
                            >
                              <Sparkles className="h-3.5 w-3.5 mr-2" /> Capture Frame
                            </Button>
                          )}
                          
                          <Button 
                            size="sm" 
                            onClick={() => handleInitiateReturn(item)} 
                            disabled={isSubmittingReturn || (damageReportQuantities[item.name] || 0) === 0 || !damageProofUrl[item.name]} 
                            className="h-10 rounded-xl bg-slate-900 text-white font-black uppercase text-[9px] tracking-widest hover:bg-primary transition-all"
                          >
                            {isSubmittingReturn ? <Loader2 className="h-3 w-3 animate-spin" /> : "Commit Damage Log"}
                          </Button>
                       </div>
                    </div>
                  </Card>
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