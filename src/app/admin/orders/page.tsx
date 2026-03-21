"use client";

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, FileText, Filter, Loader2 } from "lucide-react";
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
        toast({ title: "Status Synchronized", description: `Order ${orderId.substring(0, 6)} is now ${newStatus}.` });
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
                         (order.storeName || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStore && matchesSearch;
  });

  const downloadPO = (orderId?: string) => {
    const ordersToExport = orderId ? orders?.filter(o => o.id === orderId) : filteredOrders;
    if (!ordersToExport || ordersToExport.length === 0) return;
    const headers = ["Order ID", "Store", "Date", "Items", "Total Amount ($)", "Status"];
    const csvContent = [headers, ...ordersToExport.map(o => [
      o.id, o.storeName || 'Unknown',
      o.createdAt?.toDate ? format(o.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A',
      `"${o.items || 'No items'}"`, (o.total || 0).toFixed(2), o.status
    ])].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `PO_EX_LOG_${Date.now()}.csv`);
    link.click();
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Order Logistics</h1>
          <p className="text-slate-500 font-medium text-sm">Real-time restock orchestration across retail nodes.</p>
        </div>
        <Button onClick={() => downloadPO()} className="bg-slate-900 border border-slate-800 text-slate-300 hover:text-white h-12 px-6 rounded-xl font-bold shadow-xl">
          <Download className="mr-2 h-5 w-5" /> Export Data Logs
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <Input 
            placeholder="Search by Node ID or Merchant Name..." 
            className="pl-12 h-14 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600 rounded-2xl" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={storeFilter} onValueChange={setStoreFilter}>
          <SelectTrigger className="h-14 bg-slate-900/50 border-slate-800 text-white rounded-2xl">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <SelectValue placeholder="Node Selection" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-white">
            <SelectItem value="all">All Active Nodes</SelectItem>
            {Array.from(new Set(orders?.map(o => o.storeName).filter(Boolean) || [])).map(store => (
              <SelectItem key={store} value={store}>{store}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-xl rounded-3xl overflow-hidden border">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-slate-800">
                <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest h-16 pl-8">Packet ID</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest h-16">Merchant Node</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest h-16">Payload</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest h-16">Flow Control</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest h-16 text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders?.length ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="border-slate-800/50 hover:bg-white/[0.02] transition-colors group">
                    <TableCell className="pl-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="font-mono text-xs font-bold text-slate-400">{order.id.substring(0, 10).toUpperCase()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">{order.storeName || 'SYSTEM'}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'MMM dd • HH:mm') : 'PENDING'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-300 truncate max-w-[150px]">{order.items || 'Standard SKU'}</span>
                        <span className="text-[10px] font-black text-primary">${(order.total || 0).toFixed(2)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select 
                        defaultValue={order.status} 
                        onValueChange={(val) => handleStatusUpdate(order.id, val)}
                      >
                        <SelectTrigger className={cn(
                          "h-9 w-[130px] text-[10px] font-black uppercase tracking-wider rounded-xl border-slate-800",
                          order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400' :
                          order.status === 'processing' ? 'bg-blue-500/10 text-blue-400' :
                          order.status === 'shipped' ? 'bg-purple-500/10 text-purple-400' :
                          order.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400' :
                          'bg-amber-500/10 text-amber-400'
                        )}>
                          <div className="flex items-center gap-2">
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                          <SelectItem value="pending" className="text-[10px] font-bold">PENDING</SelectItem>
                          <SelectItem value="processing" className="text-[10px] font-bold">PROCESSING</SelectItem>
                          <SelectItem value="shipped" className="text-[10px] font-bold">SHIPPED</SelectItem>
                          <SelectItem value="delivered" className="text-[10px] font-bold">DELIVERED</SelectItem>
                          <SelectItem value="cancelled" className="text-[10px] font-bold text-rose-500">CANCELLED</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-slate-400 hover:text-white h-9 rounded-xl px-4 hover:bg-slate-800"
                        onClick={() => downloadPO(order.id)}
                      >
                        <FileText className="h-4 w-4 mr-2" /> PO
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-24 text-slate-600 italic">
                    <Loader2 className="h-10 w-10 mx-auto mb-4 opacity-10 animate-spin" />
                    No synchronization events matching filters.
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
