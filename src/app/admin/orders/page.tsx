
"use client";

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, FileText, Filter, Loader2, Globe, Phone } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AdminOrdersPage() {
  const db = useFirestore();
  const [storeFilter, setStoreFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const ordersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "orders"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: orders, isLoading: loading } = useCollection(ordersQuery);

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    if (!db) return;
    const orderRef = doc(db, "orders", orderId);
    
    updateDoc(orderRef, { status: newStatus })
      .then(() => {
        toast({ title: "Protocol Synchronized", description: `Packet ${orderId.substring(0, 6)} updated.` });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: orderRef.path,
          operation: 'update',
          requestResourceData: { status: newStatus }
        }));
      });
  };

  const filteredOrders = orders?.filter(order => {
    const matchesStore = storeFilter === "all" || order.storeName === storeFilter;
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (order.storeName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (order.phoneNumber || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStore && matchesSearch;
  });

  const downloadPO = (orderId?: string) => {
    const ordersToExport = orderId ? orders?.filter(o => o.id === orderId) : filteredOrders;
    if (!ordersToExport || ordersToExport.length === 0) return;
    const headers = ["Packet ID", "Node", "Contact", "Timestamp", "Payload", "Value ($)", "Status"];
    const csvContent = [headers, ...ordersToExport.map(o => [
      o.id, o.storeName || 'SYSTEM', o.phoneNumber || 'N/A',
      o.createdAt?.toDate ? format(o.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : 'PENDING',
      `"${o.items || 'Restock'}"`, (o.total || 0).toFixed(2), o.status
    ])].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `PROTOCOL_LOG_${Date.now()}.csv`);
    link.click();
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_#3b82f6]" />
             <span className="text-[10px] font-black tracking-[0.4em] text-primary uppercase">Traffic Controller</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">Global Orders</h1>
          <p className="text-slate-500 font-medium text-sm tracking-wide">Real-time restock orchestration across the retail infrastructure.</p>
        </div>
        <Button onClick={() => downloadPO()} className="h-16 px-8 rounded-2xl bg-white/5 border-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-all font-black uppercase tracking-widest text-xs">
          <Download className="mr-3 h-5 w-5" /> Export Data Logs
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <Input 
            placeholder="Search by Node ID, Merchant, or Phone..." 
            className="pl-16 h-16 bg-slate-950/50 border-white/5 text-white placeholder:text-slate-600 rounded-[1.5rem] focus:ring-primary text-base" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={storeFilter} onValueChange={setStoreFilter}>
          <SelectTrigger className="h-16 bg-slate-950/50 border-white/5 text-white rounded-[1.5rem] px-6">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-slate-500" />
              <SelectValue placeholder="Node Selection" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-slate-950 border-white/10 text-white rounded-2xl">
            <SelectItem value="all" className="font-bold uppercase tracking-widest text-[10px]">All Active Nodes</SelectItem>
            {Array.from(new Set(orders?.map(o => o.storeName).filter(Boolean) || [])).map(store => (
              <SelectItem key={store} value={store} className="font-bold uppercase tracking-widest text-[10px]">{store}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-white/5 bg-slate-950/30 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5 h-20">
                <TableHead className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em] pl-10">Packet Signature</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em]">Origin Node</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em]">Payload Data</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em]">Flow Control</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em] text-right pr-10">Protocol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders?.length ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="border-white/5 hover:bg-white/[0.03] transition-all group h-24">
                    <TableCell className="pl-10">
                      <div className="flex items-center gap-4">
                        <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_#3b82f6]" />
                        <span className="font-mono text-xs font-black text-slate-400 uppercase tracking-widest">{order.id.substring(0, 10)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-black text-white text-sm uppercase italic">{order.storeName || 'ROOT_SYSTEM'}</span>
                        <div className="flex items-center gap-2 text-[10px] text-primary font-bold">
                          <Phone className="h-2.5 w-2.5" />
                          {order.phoneNumber || 'NO_CONTACT'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-300 truncate max-w-[180px] uppercase tracking-tight">{order.items || 'Logistics Cluster'}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-primary tracking-widest">${(order.total || 0).toFixed(2)}</span>
                           <span className="text-[9px] text-slate-600 font-mono">
                            {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'MMM dd • HH:mm') : 'SYNCING'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select 
                        defaultValue={order.status} 
                        onValueChange={(val) => handleStatusUpdate(order.id, val)}
                      >
                        <SelectTrigger className={cn(
                          "h-10 w-[140px] text-[10px] font-black uppercase tracking-[0.15em] rounded-xl border-white/5 bg-black/40",
                          order.status === 'delivered' ? 'text-emerald-500' :
                          order.status === 'processing' ? 'text-blue-400' :
                          order.status === 'shipped' ? 'text-purple-400' :
                          order.status === 'cancelled' ? 'text-rose-500' :
                          'text-amber-400'
                        )}>
                          <div className="flex items-center gap-2">
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="bg-slate-950 border-white/10 text-white rounded-2xl">
                          <SelectItem value="pending" className="text-[10px] font-black tracking-widest uppercase">PENDING</SelectItem>
                          <SelectItem value="processing" className="text-[10px] font-black tracking-widest uppercase">PROCESSING</SelectItem>
                          <SelectItem value="shipped" className="text-[10px] font-black tracking-widest uppercase">SHIPPED</SelectItem>
                          <SelectItem value="delivered" className="text-[10px] font-black tracking-widest uppercase text-emerald-500">DELIVERED</SelectItem>
                          <SelectItem value="cancelled" className="text-[10px] font-black tracking-widest uppercase text-rose-500">CANCELLED</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-slate-500 hover:text-white h-11 rounded-2xl px-6 hover:bg-white/5 font-bold uppercase tracking-widest text-[10px]"
                        onClick={() => downloadPO(order.id)}
                      >
                        <FileText className="h-4 w-4 mr-3" /> Packet PO
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-40 text-slate-600">
                    <Globe className="h-20 w-20 mx-auto mb-6 opacity-5 animate-spin-slow" />
                    <p className="font-black uppercase tracking-[0.3em] text-xs italic">Awaiting telemetry synchronization...</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
