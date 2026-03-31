"use client";

import { useState, useMemo, useEffect } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, query } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, FileText, Filter, Loader2, Phone, MapPin, Mail, Globe, CheckCircle2, Banknote, CreditCard, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { updateDocumentNonBlocking } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MASTER_ADMIN_UID = "j96izCkggNcL002AHiJjzGb18Bf2";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "return_pending", label: "Return Pending" },
  { value: "returned", label: "Returned" },
];

export default function AdminOrdersPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [storeFilter, setStoreFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isAdmin = useMemo(() => {
    return user?.email?.toLowerCase().includes("admin") || user?.uid === MASTER_ADMIN_UID;
  }, [user]);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user || !isAdmin) return null;
    return query(collection(db, "orders"));
  }, [db, user, isAdmin]);

  const { data: rawOrders, isLoading: loading } = useCollection(ordersQuery);

  const orders = useMemo(() => {
    if (!rawOrders) return [];
    return [...rawOrders].sort((a, b) => {
      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;
      return dateB - dateA;
    });
  }, [rawOrders]);

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    if (!db) return;
    const orderRef = doc(db, "orders", orderId);
    
    updateDocumentNonBlocking(orderRef, { status: newStatus });
    toast({ title: "Protocol Synchronized", description: `Packet ${orderId.substring(0, 6)} status updated.` });
  };

  const handlePaymentUpdate = (orderId: string, newPaymentMethod: string) => {
    if (!db) return;
    const orderRef = doc(db, "orders", orderId);
    
    updateDocumentNonBlocking(orderRef, { paymentMethod: newPaymentMethod });
    toast({ title: "Payment Protocol Synchronized", description: `Packet ${orderId.substring(0, 6)} updated.` });
  };

  const filteredOrders = orders.filter(order => {
    const matchesStore = storeFilter === "all" || order.storeName === storeFilter;
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (order.storeName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.phoneNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.deliveryAddress || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStore && matchesStatus && matchesSearch;
  });

  const downloadPO = (orderId?: string) => {
    const ordersToExport = orderId ? orders.filter(o => o.id === orderId) : filteredOrders;
    if (!ordersToExport || ordersToExport.length === 0) return;

    const headers = ["Packet ID", "Node", "Gmail", "Phone", "Delivery Address", "Payment", "Timestamp", "Items", "Quantity", "Total ($)", "Status"];
    const csvContent = [
      headers,
      ...ordersToExport.map(o => [
        o.id,
        o.storeName || 'SYSTEM',
        o.email || 'N/A',
        o.phoneNumber || 'N/A',
        `"${o.deliveryAddress?.replace(/,/g, ' ') || 'N/A'}"`,
        o.paymentMethod === 'cash' ? 'Cash' : 'Credit',
        o.createdAt?.seconds ? format(o.createdAt.seconds * 1000, 'yyyy-MM-dd HH:mm') : 'PENDING',
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

  if (loading || !isClient) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-emerald-500';
      case 'processing': return 'text-primary';
      case 'shipped': return 'text-accent';
      case 'cancelled': return 'text-rose-500';
      case 'return_pending': return 'text-orange-500';
      case 'returned': return 'text-slate-400';
      default: return 'text-amber-500';
    }
  }

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-primary" />
             <span className="text-[10px] font-black tracking-[0.4em] text-primary uppercase">Traffic Controller</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase italic leading-none">Global Orders</h1>
          <p className="text-muted-foreground font-medium text-sm tracking-wide">Real-time restock orchestration across the regional grid.</p>
        </div>
        <Button onClick={() => downloadPO()} className="w-full md:w-auto h-14 md:h-16 px-8 glass-card border-white/10 text-white hover:text-primary transition-all font-black uppercase tracking-widest text-[10px] md:text-xs">
          <Download className="mr-3 h-5 w-5" /> Export All Logs
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search Node, Email, Phone..." 
            className="pl-16 h-14 md:h-16 glass-card border-white/10 text-white placeholder:text-muted-foreground rounded-2xl md:rounded-[1.5rem] focus:ring-primary text-sm md:text-base font-medium" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={storeFilter} onValueChange={setStoreFilter}>
          <SelectTrigger className="h-14 md:h-16 glass-card border-white/10 text-white rounded-2xl md:rounded-[1.5rem] px-6">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <SelectValue placeholder="Node Selection" />
            </div>
          </SelectTrigger>
          <SelectContent className="glass-card border-white/10 text-white rounded-2xl">
            <SelectItem value="all" className="font-bold uppercase tracking-widest text-[10px]">All Active Nodes</SelectItem>
            {Array.from(new Set(orders.map(o => o.storeName).filter(Boolean) || [])).map(store => (
              <SelectItem key={store} value={store} className="font-bold uppercase tracking-widest text-[10px]">{store}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-14 md:h-16 glass-card border-white/10 text-white rounded-2xl md:rounded-[1.5rem] px-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              <SelectValue placeholder="Status Filter" />
            </div>
          </SelectTrigger>
          <SelectContent className="glass-card border-white/10 text-white rounded-2xl">
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="font-bold uppercase tracking-widest text-[10px]">{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="hidden md:block border-none glass-card rounded-[2.5rem] overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5 h-20 hover:bg-transparent">
                <TableHead className="text-muted-foreground uppercase text-[10px] font-black tracking-[0.3em] pl-10">Packet Signature</TableHead>
                <TableHead className="text-muted-foreground uppercase text-[10px] font-black tracking-[0.3em]">Origin & Destination</TableHead>
                <TableHead className="text-muted-foreground uppercase text-[10px] font-black tracking-[0.3em]">Payload Data</TableHead>
                <TableHead className="text-muted-foreground uppercase text-[10px] font-black tracking-[0.3em]">Flow Control</TableHead>
                <TableHead className="text-muted-foreground uppercase text-[10px] font-black tracking-[0.3em] text-right pr-10">Protocol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="border-white/5 hover:bg-white/5 transition-all group h-32">
                    <TableCell className="pl-10">
                      <div className="flex items-center gap-4">
                        <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                        <span className="font-mono text-xs font-black text-muted-foreground uppercase tracking-widest">{order.id.substring(0, 8)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5 py-4">
                        <span className="font-black text-white text-sm uppercase italic">{order.storeName || 'ROOT_SYSTEM'}</span>
                        <div className="flex items-center gap-2 text-[10px] text-primary font-bold">
                          <Mail className="h-2.5 w-2.5 opacity-50" />
                          {order.email || 'NO_EMAIL'}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold">
                          <Phone className="h-2.5 w-2.5 opacity-50" />
                          {order.phoneNumber || 'NO_CONTACT'}
                        </div>
                        <div className="flex items-start gap-2 text-[9px] text-muted-foreground font-medium max-w-[200px]">
                          <MapPin className="h-2.5 w-2.5 shrink-0 mt-0.5 text-accent" />
                          <span className="truncate">{order.deliveryAddress || 'NO_ADDRESS'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate max-w-[140px] uppercase tracking-tight">{order.items || 'Logistics Cluster'}</span>
                          <Select 
                            value={order.paymentMethod || 'cash'} 
                            onValueChange={(val) => handlePaymentUpdate(order.id, val)}
                          >
                            <SelectTrigger className="h-7 w-[90px] text-[7px] font-black uppercase tracking-widest rounded-lg border-none bg-white/5 text-white shrink-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass-card border-white/10 text-white rounded-xl">
                              <SelectItem value="cash" className="text-[10px] font-black tracking-widest uppercase">CASH</SelectItem>
                              <SelectItem value="after_delivery" className="text-[10px] font-black tracking-widest uppercase">CREDIT</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-primary tracking-widest">${(order.total || 0).toFixed(2)}</span>
                           <span className="text-[9px] text-muted-foreground font-mono">Qty: {order.quantity || 1}</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground font-mono">
                          {order.createdAt?.seconds ? format(order.createdAt.seconds * 1000, 'MMM dd • HH:mm') : 'SYNCING'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={order.status} 
                        onValueChange={(val) => handleStatusUpdate(order.id, val)}
                      >
                        <SelectTrigger className={cn(
                          "h-10 w-[140px] text-[10px] font-black uppercase tracking-[0.15em] rounded-xl border-white/10 bg-white/5",
                          getStatusBadgeColor(order.status)
                        )}>
                          <div className="flex items-center gap-2">
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="glass-card border-white/10 text-white rounded-2xl">
                          <SelectItem value="pending" className="text-[10px] font-black tracking-widest uppercase">PENDING</SelectItem>
                          <SelectItem value="processing" className="text-[10px] font-black tracking-widest uppercase">PROCESSING</SelectItem>
                          <SelectItem value="shipped" className="text-[10px] font-black tracking-widest uppercase">SHIPPED</SelectItem>
                          <SelectItem value="delivered" className="text-[10px] font-black tracking-widest uppercase text-emerald-500">DELIVERED</SelectItem>
                          <SelectItem value="cancelled" className="text-[10px] font-black tracking-widest uppercase text-rose-500">CANCELLED</SelectItem>
                          <SelectItem value="return_pending" className="text-[10px] font-black tracking-widest uppercase text-orange-500">RETURN REQ</SelectItem>
                          <SelectItem value="returned" className="text-[10px] font-black tracking-widest uppercase text-slate-400">RETURNED</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-muted-foreground hover:text-primary h-11 rounded-2xl px-6 hover:bg-white/5 font-bold uppercase tracking-widest text-[10px]"
                        onClick={() => downloadPO(order.id)}
                      >
                        <FileText className="h-4 w-4 mr-3" /> Packet PO
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-40 text-muted-foreground">
                    <Globe className="h-20 w-20 mx-auto mb-6 opacity-10 animate-spin-slow" />
                    <p className="font-black uppercase tracking-[0.3em] text-xs italic">Awaiting telemetry synchronization...</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="md:hidden space-y-4">
        {filteredOrders.length ? filteredOrders.map((order) => (
          <Card key={order.id} className="border-none glass-card rounded-3xl p-6 space-y-6">
            <div className="flex justify-between items-start">
               <div className="min-w-0 flex-1 pr-2">
                 <p className="text-[10px] font-black text-primary uppercase italic tracking-tighter mb-1">{order.id.substring(0, 8)}</p>
                 <div className="flex items-center gap-2">
                    <h3 className="font-black text-white text-sm uppercase italic truncate">{order.storeName || 'Branch Node'}</h3>
                 </div>
               </div>
               <Select 
                  value={order.status} 
                  onValueChange={(val) => handleStatusUpdate(order.id, val)}
                >
                  <SelectTrigger className={cn(
                    "h-8 w-[110px] text-[8px] font-black uppercase tracking-widest rounded-xl border-none bg-white/5 shrink-0",
                    getStatusBadgeColor(order.status)
                  )}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/10 text-white rounded-2xl">
                    <SelectItem value="pending" className="text-[10px] font-black tracking-widest uppercase">PENDING</SelectItem>
                    <SelectItem value="processing" className="text-[10px] font-black tracking-widest uppercase">PROCESSING</SelectItem>
                    <SelectItem value="shipped" className="text-[10px] font-black tracking-widest uppercase">SHIPPED</SelectItem>
                    <SelectItem value="delivered" className="text-[10px] font-black tracking-widest uppercase text-emerald-500">DELIVERED</SelectItem>
                    <SelectItem value="cancelled" className="text-[10px] font-black tracking-widest uppercase text-rose-500">CANCELLED</SelectItem>
                    <SelectItem value="return_pending" className="text-[10px] font-black tracking-widest uppercase text-orange-500">RETURN REQ</SelectItem>
                    <SelectItem value="returned" className="text-[10px] font-black tracking-widest uppercase text-slate-400">RETURNED</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            
            <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                    <Phone className="h-3 w-3 text-primary opacity-50" />
                    {order.phoneNumber || 'N/A'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[8px] font-black text-muted-foreground uppercase">
                    {order.paymentMethod === 'cash' ? <Banknote className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                    {order.paymentMethod === 'after_delivery' ? 'CREDIT' : 'CASH'}
                  </div>
               </div>
               <div className="flex items-start gap-3 text-[10px] text-muted-foreground font-medium">
                  <MapPin className="h-3 w-3 text-accent shrink-0 mt-0.5" />
                  <span>{order.deliveryAddress || 'NO_ADDRESS'}</span>
               </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-4">
               <div className="space-y-0.5">
                  <p className="text-xs font-black text-primary font-mono">${(order.total || 0).toFixed(2)}</p>
                  <p className="text-[9px] text-muted-foreground font-mono truncate max-w-[150px]">{order.items || 'Payload'}</p>
               </div>
               <Button size="sm" variant="outline" className="h-10 rounded-xl glass-card border-white/10 text-white font-black text-[9px] uppercase tracking-widest" onClick={() => downloadPO(order.id)}>
                 <Download className="h-3 w-3 mr-2" /> PO
               </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}