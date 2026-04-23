
"use client";

import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Clock, 
  Truck, 
  Loader2, 
  MapPin, 
  ChevronRight, 
  Calendar,
  Layers,
  Zap,
  Box,
  CheckCircle2,
  AlertCircle,
  XCircle,
  CopyPlus
} from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const STATUS_MAP = {
  pending: { label: "Logged", color: "text-amber-500", icon: Clock, step: 1 },
  processing: { label: "Orchestrating", color: "text-blue-500", icon: Layers, step: 2 },
  shipped: { label: "In Transit", color: "text-primary", icon: Truck, step: 3 },
  delivered: { label: "Synchronized", color: "text-emerald-500", icon: CheckCircle2, step: 4 },
  cancelled: { label: "Terminated", color: "text-rose-500", icon: XCircle, step: 0 },
  return_pending: { label: "Audit Required", color: "text-orange-500", icon: AlertCircle, step: 1 },
  returned: { label: "Purged", color: "text-slate-400", icon: Box, step: 0 },
};

export default function HistoryPage() {
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const historyQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "orders"), 
      where("userId", "==", user.uid)
    );
  }, [db, user]);

  const { data: rawOrders, isLoading: loading } = useCollection(historyQuery);

  const orders = useMemo(() => {
    if (!rawOrders) return [];
    return [...rawOrders].sort((a, b) => {
      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;
      return dateB - dateA;
    });
  }, [rawOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (o.items || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.deliveryAddress || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  const handleCloneManifest = (order: any) => {
    // Pack the manifest into local storage for the order page to pick up
    try {
      localStorage.setItem("aether_clone_payload", JSON.stringify({
        items: order.items,
        timestamp: Date.now()
      }));
      toast({ title: "Manifest Cloned", description: "Packet repopulated for high-speed reorder." });
      router.push("/dashboard/order");
    } catch (e) {
      toast({ title: "Protocol Failure", description: "Could not cache manifest signature.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 opacity-30" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Syncing Packet Log...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
             <span className="text-[10px] font-black tracking-[0.4em] text-emerald-600 uppercase">Telemetry Manifest</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Packet History</h1>
          <p className="text-slate-500 font-medium text-sm">Full chronological registry of reorder payloads.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search Packet Signature..." 
              className="pl-12 h-14 bg-slate-50 border-none rounded-xl focus:ring-emerald-600 font-bold text-slate-900" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Badge variant="outline" className="h-14 px-6 rounded-xl border-slate-200 bg-white text-slate-400 font-black uppercase tracking-widest text-[9px] hidden sm:flex">
             {orders.length} Packets Logged
          </Badge>
        </div>
      </div>

      {filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredOrders.map((order) => {
            const statusInfo = STATUS_MAP[order.status as keyof typeof STATUS_MAP] || STATUS_MAP.pending;
            const StatusIcon = statusInfo.icon;
            const currentStep = statusInfo.step;

            return (
              <Card key={order.id} className="group border-none shadow-sm bg-white rounded-[2rem] overflow-hidden hover:shadow-md transition-all duration-500">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row items-stretch">
                    <div className="flex-1 p-8 space-y-6">
                       <div className="flex justify-between items-start">
                         <div className="space-y-1">
                           <div className="flex items-center gap-3">
                             <span className="text-[10px] font-mono font-black text-emerald-600 tracking-widest uppercase">PKT-{order.id.substring(0, 8)}</span>
                             <div className="flex items-center gap-2 text-slate-300 font-bold text-[10px] uppercase">
                               <Calendar className="h-3 w-3" />
                               {order.createdAt?.seconds ? format(order.createdAt.seconds * 1000, 'MMM dd, yyyy') : 'SYNCING'}
                             </div>
                           </div>
                           <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-tight group-hover:text-emerald-600 transition-colors">
                             {order.items || 'Standard Reorder Payload'}
                           </h3>
                         </div>
                         <div className="text-right">
                           <p className="text-2xl font-black text-slate-900 font-mono tracking-tighter italic">₹{(order.total || 0).toFixed(0)}</p>
                           <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Valuation Commit</p>
                         </div>
                       </div>

                       <div className="flex flex-wrap items-center gap-6">
                          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                             <MapPin className="h-3.5 w-3.5 text-emerald-600/40" />
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide truncate max-w-[150px]">
                               {order.deliveryAddress || 'Branch Destination'}
                             </span>
                          </div>
                          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                             <Zap className="h-3.5 w-3.5 text-amber-500/40" />
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                               {order.paymentMethod === 'after_delivery' ? 'CREDIT PROTOCOL' : 'CASH ON SYNC'}
                             </span>
                          </div>
                          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                             <Box className="h-3.5 w-3.5 text-blue-500/40" />
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                               Density: {order.quantity || 1} Units
                             </span>
                          </div>
                       </div>
                    </div>

                    <div className="lg:w-80 bg-slate-50/50 border-t lg:border-t-0 lg:border-l border-slate-100 p-8 flex flex-col justify-center gap-6">
                       <div className="flex items-center justify-between mb-2">
                         <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Logistics Flow</span>
                         <div className={cn("flex items-center gap-2 font-black uppercase text-[10px] tracking-widest italic", statusInfo.color)}>
                           <StatusIcon className="h-3.5 w-3.5" />
                           {statusInfo.label}
                         </div>
                       </div>
                       
                       <div className="relative h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={cn("absolute top-0 left-0 h-full transition-all duration-1000 ease-out", 
                              order.status === 'cancelled' ? 'bg-rose-500' : 'bg-emerald-500'
                            )}
                            style={{ width: `${(currentStep / 4) * 100}%` }}
                          />
                       </div>
                       <div className="flex justify-between">
                         {[1, 2, 3, 4].map((step) => (
                           <div 
                            key={step} 
                            className={cn("h-2 w-2 rounded-full transition-all duration-500", 
                              currentStep >= step ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-slate-200"
                            )} 
                           />
                         ))}
                       </div>

                       <div className="pt-2 grid grid-cols-2 gap-3">
                         <Button 
                            variant="outline" 
                            className="h-11 rounded-xl border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-white font-black uppercase tracking-widest text-[9px] transition-all"
                            onClick={() => handleCloneManifest(order)}
                          >
                           <CopyPlus className="mr-2 h-3.5 w-3.5" /> Clone
                         </Button>
                         <Link href={`/dashboard/history/${order.id}`} className="block">
                           <Button variant="outline" className="w-full h-11 rounded-xl border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-white font-black uppercase tracking-widest text-[9px] transition-all">
                             Expand <ChevronRight className="ml-1 h-3.5 w-3.5" />
                           </Button>
                         </Link>
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-32 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
          <Layers className="h-16 w-16 text-slate-100 mx-auto mb-6" />
          <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-lg">Registry Empty</h3>
          <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-widest">No packet telemetry matches your signature query.</p>
          <Link href="/dashboard/order" className="mt-8 inline-block">
            <Button className="h-12 px-8 rounded-xl bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest">
              Provision First Packet
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
