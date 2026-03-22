
"use client";

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, FileText, Filter, Loader2, Globe, Phone, MapPin, Mail } from "lucide-react";
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
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (order.storeName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.phoneNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.deliveryAddress || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStore && matchesSearch;
  });

  const downloadPO = (orderId?: string) => {
    const ordersToExport = orderId ? orders?.filter(o => o.id === orderId) : filteredOrders;
    if (!ordersToExport || ordersToExport.length === 0) return;

    const headers = ["Packet ID", "Node", "Gmail", "Phone", "Delivery Address", "Timestamp", "Items", "Quantity", "Total ($)", "Status"];
    const csvContent = [
      headers,
      ...ordersToExport.map(o => [
        o.id,
        o.storeName || 'SYSTEM',
        o.email || 'N/A',
        o.phoneNumber || 'N/A',
        o.deliveryAddress?.replace(/,/g, ' ') || 'N/A',
        o.createdAt?.toDate ? format(o.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : 'PENDING',
        `"${o.items || 'Restock'}"`,
        o.quantity || 1,
        (o.total || 0).toFixed(2),
        o.status
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `PROTOCOL_LOG_${orderId ? orderId.substring(0, 8) : 'BATCH'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ 
      title: "Data Log Exported", 
      description: orderId ? `Packet PO for ${orderId.substring(0, 6)} saved.` : "Batch logs exported."
    });
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
             <div className="h-2 w-2 rounded-full bg-primary" />
             <span className="text-[10px] font-black tracking-[0.4em] text-primary uppercase">Traffic Controller</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic">Global Orders</h1>
          <p className="text-slate-500 font-medium text-sm tracking-wide">Real-time restock orchestration across the regional logistics grid.</p>
        </div>
        <Button onClick={() => downloadPO()} className="h-16 px-8 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-primary transition-all font-black uppercase tracking-widest text-xs shadow-sm">
          <Download className="mr-3 h-5 w-5" /> Export All Logs
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Search by Node, Email, Phone, or Address..." 
            className="pl-16 h-16 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-[1.5rem] focus:ring-primary text-base font-medium" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={storeFilter} onValueChange={setStoreFilter}>
          <SelectTrigger className="h-16 bg-white border-slate-200 text-slate-900 rounded-[1.5rem] px-6">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-slate-400" />
              <SelectValue placeholder="Node Selection" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 text-slate-900 rounded-2xl">
            <SelectItem value="all" className="font-bold uppercase tracking-widest text-[10px]">All Active Nodes</SelectItem>
            {Array.from(new Set(orders?.map(o => o.storeName).filter(Boolean) || [])).map(store => (
              <SelectItem key={store} value={store} className="font-bold uppercase tracking-widest text-[10px]">{store}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-none bg-white rounded-[2.5rem] overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100 h-20">
                <TableHead className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em] pl-10">Packet Signature</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em]">Origin & Destination</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em]">Payload Data</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em]">Flow Control</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em] text-right pr-10">Protocol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders?.length ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="border-slate-50 hover:bg-slate-50/50 transition-all group h-32">
                    <TableCell className="pl-10">
                      <div className="flex items-center gap-4">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="font-mono text-xs font-black text-slate-400 uppercase tracking-widest">{order.id.substring(0, 8)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5 py-4">
                        <span className="font-black text-slate-900 text-sm uppercase italic">{order.storeName || 'ROOT_SYSTEM'}</span>
                        <div className="flex items-center gap-2 text-[10px] text-primary font-bold">
                          <Mail className="h-2.5 w-2.5 opacity-50" />
                          {order.email || 'NO_EMAIL'}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-600 font-bold">
                          <Phone className="h-2.5 w-2.5 opacity-50" />
                          {order.phoneNumber || 'NO_CONTACT'}
                        </div>
                        <div className="flex items-start gap-2 text-[9px] text-slate-500 font-medium max-w-[200px]">
                          <MapPin className="h-2.5 w-2.5 shrink-0 mt-0.5 text-accent" />
                          <span className="truncate">{order.deliveryAddress || 'NO_ADDRESS'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-700 truncate max-w-[180px] uppercase tracking-tight">{order.items || 'Logistics Cluster'}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-primary tracking-widest">${(order.total || 0).toFixed(2)}</span>
                           <span className="text-[9px] text-slate-400 font-mono">
                            Qty: {order.quantity || 1}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'MMM dd • HH:mm') : 'SYNCING'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select 
                        defaultValue={order.status} 
                        onValueChange={(val) => handleStatusUpdate(order.id, val)}
                      >
                        <SelectTrigger className={cn(
                          "h-10 w-[140px] text-[10px] font-black uppercase tracking-[0.15em] rounded-xl border-slate-100 bg-slate-50",
                          order.status === 'delivered' ? 'text-emerald-600' :
                          order.status === 'processing' ? 'text-blue-600' :
                          order.status === 'shipped' ? 'text-purple-600' :
                          order.status === 'cancelled' ? 'text-rose-600' :
                          'text-amber-600'
                        )}>
                          <div className="flex items-center gap-2">
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-slate-900 rounded-2xl">
                          <SelectItem value="pending" className="text-[10px] font-black tracking-widest uppercase">PENDING</SelectItem>
                          <SelectItem value="processing" className="text-[10px] font-black tracking-widest uppercase">PROCESSING</SelectItem>
                          <SelectItem value="shipped" className="text-[10px] font-black tracking-widest uppercase">SHIPPED</SelectItem>
                          <SelectItem value="delivered" className="text-[10px] font-black tracking-widest uppercase text-emerald-600">DELIVERED</SelectItem>
                          <SelectItem value="cancelled" className="text-[10px] font-black tracking-widest uppercase text-rose-600">CANCELLED</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-slate-400 hover:text-primary h-11 rounded-2xl px-6 hover:bg-slate-50 font-bold uppercase tracking-widest text-[10px]"
                        onClick={() => downloadPO(order.id)}
                      >
                        <FileText className="h-4 w-4 mr-3" /> Packet PO
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-40 text-slate-400">
                    <Globe className="h-20 w-20 mx-auto mb-6 opacity-10 animate-spin-slow" />
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
