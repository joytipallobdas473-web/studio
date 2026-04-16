
"use client";

import { useFirestore, useDoc, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Printer, 
  Clock, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  AlertCircle, 
  Box, 
  MapPin, 
  Zap, 
  FileText,
  Loader2,
  Calendar,
  ShieldCheck
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const STATUS_MAP = {
  pending: { label: "Request Logged", color: "text-amber-500", icon: Clock, desc: "Awaiting regional coordination." },
  processing: { label: "Orchestrating", color: "text-blue-500", icon: Layers, desc: "Packet is being consolidated at the hub." },
  shipped: { label: "In Transit", color: "text-primary", icon: Truck, desc: "Payload is moving across the regional grid." },
  delivered: { label: "Synchronized", color: "text-emerald-500", icon: CheckCircle2, desc: "Packet delivered and acknowledged." },
  cancelled: { label: "Terminated", color: "text-rose-500", icon: XCircle, desc: "Process aborted by administrator." },
  return_pending: { label: "Audit Required", color: "text-orange-500", icon: AlertCircle, desc: "Damage report registered for audit." },
  returned: { label: "Purged", color: "text-slate-400", icon: Box, desc: "Unit inventory adjusted." },
};

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();

  const orderRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, "orders", id as string);
  }, [db, id]);

  const { data: order, isLoading: loading } = useDoc(orderRef);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600 opacity-20" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-black uppercase text-slate-900">Node Not Found</h2>
        <Button onClick={() => router.push("/dashboard/history")} className="mt-4">Back to History</Button>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[order.status as keyof typeof STATUS_MAP] || STATUS_MAP.pending;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/dashboard/history")}
          className="text-slate-400 hover:text-emerald-600 font-black uppercase tracking-widest text-[10px]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Return to History
        </Button>
        <div className="flex items-center gap-3">
           <Badge variant="outline" className="h-9 px-4 rounded-xl border-slate-200 text-slate-400 font-mono text-[10px] uppercase">
             PKT-{order.id.substring(0, 12).toUpperCase()}
           </Badge>
           <Button variant="outline" className="h-9 rounded-xl border-slate-200 text-slate-500 hover:text-emerald-600 px-4 font-black uppercase text-[9px] tracking-widest">
             <Printer className="mr-2 h-3.5 w-3.5" /> Manifest
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
               <CardHeader className="p-10 pb-0 flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="h-2 w-2 rounded-full bg-emerald-500" />
                       <span className="text-[10px] font-black tracking-[0.4em] text-emerald-600 uppercase">Logistics Manifest</span>
                    </div>
                    <CardTitle className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Packet Payload</CardTitle>
                  </div>
                  <div className="text-right">
                     <p className="text-2xl font-black text-slate-900 font-mono tracking-tighter italic">₹{(order.total || 0).toFixed(2)}</p>
                     <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Commit Valuation</p>
                  </div>
               </CardHeader>
               <CardContent className="p-10 space-y-10">
                  <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                       <Box className="h-3.5 w-3.5" /> SKU Clusters
                     </h3>
                     <p className="text-lg font-bold text-slate-900 leading-relaxed uppercase tracking-tight">
                       {order.items}
                     </p>
                     <div className="mt-6 flex items-center gap-6">
                        <div className="space-y-1">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Units</p>
                           <p className="text-sm font-black text-emerald-600">{order.quantity || 1} SKUs</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Payment Protocol</p>
                           <p className="text-sm font-black text-slate-900 uppercase">{order.paymentMethod === 'after_delivery' ? 'CREDIT' : 'CASH'}</p>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5" /> Destination Node
                        </h4>
                        <div className="space-y-1.5">
                           <p className="font-black text-slate-900 uppercase italic">{order.storeName}</p>
                           <p className="text-xs font-medium text-slate-500 leading-relaxed">{order.deliveryAddress}</p>
                           <p className="text-xs font-bold text-emerald-600 mt-2">Node Signal: {order.phoneNumber}</p>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" /> Timeline Signature
                        </h4>
                        <div className="space-y-1.5">
                           <p className="text-xs font-bold text-slate-600">Logged: <span className="text-slate-900">{order.createdAt?.seconds ? format(order.createdAt.seconds * 1000, 'dd MMM yyyy • HH:mm') : 'Syncing...'}</span></p>
                           <p className="text-xs font-bold text-slate-600">Regional ID: <span className="text-slate-900 font-mono">{(order.id as string).substring(0, 8)}</span></p>
                        </div>
                     </div>
                  </div>
               </CardContent>
            </Card>
         </div>

         <div className="space-y-8">
            <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2.5rem] overflow-hidden">
               <CardHeader className="p-10 pb-6 border-b border-white/5">
                  <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3 text-emerald-400">
                    <StatusIcon className="h-5 w-5" /> Logistics Status
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-10 space-y-8">
                  <div className="space-y-2">
                     <p className={cn("text-3xl font-black uppercase italic tracking-tighter", statusInfo.color)}>
                        {statusInfo.label}
                     </p>
                     <p className="text-xs font-medium text-slate-400 leading-relaxed italic">
                        "{statusInfo.desc}"
                     </p>
                  </div>

                  <div className="relative pt-4">
                     <div className="absolute left-1 top-0 bottom-0 w-0.5 bg-white/10" />
                     <div className="space-y-8 relative z-10">
                        {['pending', 'processing', 'shipped', 'delivered'].map((step, idx) => {
                           const isCompleted = ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status) >= idx;
                           const isCurrent = order.status === step;
                           
                           return (
                              <div key={step} className="flex items-center gap-6 group">
                                 <div className={cn(
                                    "h-2.5 w-2.5 rounded-full transition-all duration-500",
                                    isCompleted ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-white/10"
                                 )} />
                                 <div className={cn(
                                    "flex flex-col transition-opacity",
                                    isCompleted ? "opacity-100" : "opacity-30"
                                 )}>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{step}</span>
                                    {isCurrent && <span className="text-[8px] font-bold text-emerald-400 animate-pulse uppercase">Active Protocol</span>}
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               </CardContent>
               <div className="px-10 pb-10">
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-3">
                     <div className="flex items-center gap-2 text-emerald-400">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Network Verified</span>
                     </div>
                     <p className="text-[10px] text-slate-400 leading-relaxed font-medium">This packet identity is certified by the regional Aether grid node.</p>
                  </div>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}
