
"use client";

import { useState, useMemo, useEffect } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, doc, query } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, FileText, Filter, Loader2, Phone, MapPin, Mail, Globe, CheckCircle2, Truck, Printer, X, Edit2, ShieldAlert, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { updateDocumentNonBlocking } from "@/firebase";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MASTER_ADMIN_UID = "j96izCkggNcL002AHiJjzGb18Bf2";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "return_pending", label: "Damage Reported" },
  { value: "returned", label: "Damage Resolved" },
];

export default function AdminOrdersPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [storeFilter, setStoreFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  
  // Edit State
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    items: "",
    total: "0",
    quantity: "0"
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const adminRoleRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "roles_admin", user.uid);
  }, [db, user?.uid]);

  const { data: adminRole } = useDoc(adminRoleRef);

  const isAdmin = useMemo(() => {
    return user?.email?.toLowerCase().includes("admin") || user?.uid === MASTER_ADMIN_UID || !!adminRole;
  }, [user, adminRole]);

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

  const handleOpenEdit = (order: any) => {
    setEditingOrder(order);
    setEditForm({
      items: order.items || "",
      total: (order.total || 0).toString(),
      quantity: (order.quantity || 0).toString()
    });
  };

  const handleCommitOverride = () => {
    if (!db || !editingOrder) return;
    const orderRef = doc(db, "orders", editingOrder.id);
    
    updateDocumentNonBlocking(orderRef, {
      items: editForm.items,
      total: parseFloat(editForm.total) || 0,
      quantity: parseInt(editForm.quantity) || 0
    });

    toast({ title: "Manifest Overridden", description: "Packet payload updated by authority." });
    setEditingOrder(null);
  };

  const filteredOrders = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return orders.filter(order => {
      const matchesStore = storeFilter === "all" || order.storeName === storeFilter;
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesSearch = 
        order.id.toLowerCase().includes(query) || 
        (order.storeName || "").toLowerCase().includes(query) ||
        (order.phoneNumber || "").toLowerCase().includes(query) ||
        (order.email || "").toLowerCase().includes(query) ||
        (order.deliveryAddress || "").toLowerCase().includes(query);
      return matchesStore && matchesStatus && matchesSearch;
    });
  }, [orders, storeFilter, statusFilter, searchQuery]);

  const downloadPO = (orderId?: string) => {
    const ordersToExport = orderId ? orders.filter(o => o.id === orderId) : filteredOrders;
    if (!ordersToExport || ordersToExport.length === 0) return;

    const headers = ["Packet ID", "Node", "Gmail", "Phone", "Delivery Address", "Payment", "Timestamp", "Items", "Quantity", "Total (₹)", "Status"];
    const csvContent = [
      headers,
      ...ordersToExport.map(o => [
        o.id,
        o.storeName || 'SYSTEM',
        o.email || 'N/A',
        o.phoneNumber || 'N/A',
        `"${o.deliveryAddress?.replace(/,/g, ' ') || 'N/A'}"`,
        o.paymentMethod === 'cash' ? 'Cash' : o.paymentMethod === 'paid' ? 'Paid' : 'Credit',
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
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
      {/* Manifest Edit Overlay (Red Alert Theme) */}
      <Dialog open={!!editingOrder} onOpenChange={() => setEditingOrder(null)}>
        <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-10 glass-card border-none shadow-2xl bg-black text-white">
           <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                 <ShieldAlert className="h-5 w-5 text-rose-500" />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500">Override Protocol</span>
              </div>
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-rose-500">Modify Manifest</DialogTitle>
              <DialogDescription className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">
                 Adjust item payload, valuation, and unit density for packet {editingOrder?.id.substring(0, 8)}
              </DialogDescription>
           </DialogHeader>

           <div className="space-y-6 py-6">
              <div className="space-y-3">
                 <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Payload Manifest (Items)</Label>
                 <Textarea 
                    value={editForm.items}
                    onChange={(e) => setEditForm({...editForm, items: e.target.value})}
                    placeholder="SKU-1 (x5), SKU-2 (x2)..."
                    className="min-h-[120px] bg-white/5 border-white/10 rounded-2xl text-white font-bold text-xs leading-relaxed focus:ring-rose-500"
                 />
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Commit Valuation (₹)</Label>
                    <Input 
                       type="number"
                       value={editForm.total}
                       onChange={(e) => setEditForm({...editForm, total: e.target.value})}
                       className="h-14 bg-white/5 border-white/10 rounded-2xl text-white font-mono font-black"
                    />
                 </div>
                 <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Unit Density (Qty)</Label>
                    <Input 
                       type="number"
                       value={editForm.quantity}
                       onChange={(e) => setEditForm({...editForm, quantity: e.target.value})}
                       className="h-14 bg-white/5 border-white/10 rounded-2xl text-white font-mono font-black"
                    />
                 </div>
              </div>
           </div>

           <DialogFooter className="gap-4">
              <Button variant="ghost" onClick={() => setEditingOrder(null)} className="h-14 px-8 rounded-2xl uppercase tracking-widest font-black text-muted-foreground hover:text-white">Abort</Button>
              <Button onClick={handleCommitOverride} className="bg-rose-500 text-white h-14 px-10 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-rose-600 transition-all">
                 <Save className="mr-3 h-5 w-5" /> Commit Override
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Printable Invoice Overlay */}
      {selectedInvoice && (
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="sm:max-w-[800px] p-0 border-none bg-white overflow-hidden">
             <div className="sr-only">
               <DialogTitle>Order Invoice Preview</DialogTitle>
               <DialogDescription>Detailed hardcopy manifest for order {selectedInvoice.id}</DialogDescription>
             </div>
             <div id="printable-invoice" className="bg-white text-slate-900 p-12 space-y-8 font-sans">
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8">
                   <div className="space-y-1">
                      <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Aether Network</h2>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Regional Logistics Hub // North East Grid</p>
                   </div>
                   <div className="text-right space-y-1">
                      <h3 className="text-xl font-black uppercase italic">Invoice</h3>
                      <p className="text-[10px] font-mono font-bold text-slate-400">ID: {selectedInvoice.id.toUpperCase()}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-12">
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1">Destination Node</h4>
                      <div className="space-y-1">
                         <p className="font-black uppercase italic text-lg">{selectedInvoice.storeName}</p>
                         <p className="text-xs font-medium text-slate-600 leading-relaxed max-w-[250px]">{selectedInvoice.deliveryAddress}</p>
                         <p className="text-xs font-bold text-slate-900 mt-2">Node Comms: {selectedInvoice.phoneNumber}</p>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1">Protocol Details</h4>
                      <div className="space-y-1">
                         <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-bold uppercase">Date:</span>
                            <span className="font-bold">{selectedInvoice.createdAt?.seconds ? format(selectedInvoice.createdAt.seconds * 1000, 'dd MMM yyyy') : 'PENDING'}</span>
                         </div>
                         <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-bold uppercase">Method:</span>
                            <span className="font-bold uppercase">{selectedInvoice.paymentMethod || 'CASH'}</span>
                         </div>
                         <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-bold uppercase">Status:</span>
                            <span className="font-bold uppercase text-emerald-600">{selectedInvoice.status}</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-4 pt-4">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="border-b-2 border-slate-900 h-10">
                            <th className="text-[10px] font-black uppercase tracking-widest">SKU Identity / Description</th>
                            <th className="text-[10px] font-black uppercase tracking-widest text-right">Quantity</th>
                            <th className="text-[10px] font-black uppercase tracking-widest text-right">Total (₹)</th>
                         </tr>
                      </thead>
                      <tbody>
                         <tr className="border-b border-slate-100 h-16">
                            <td className="py-4">
                               <p className="font-bold text-sm leading-snug">{selectedInvoice.items}</p>
                               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Consolidated Logistics Packet</p>
                            </td>
                            <td className="text-right font-mono font-bold text-sm">{selectedInvoice.quantity || 1}</td>
                            <td className="text-right font-mono font-black text-sm">{(selectedInvoice.total || 0).toFixed(2)}</td>
                         </tr>
                      </tbody>
                   </table>
                </div>

                <div className="flex justify-end pt-4">
                   <div className="w-64 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                         <span className="text-slate-400 font-bold uppercase">Subtotal:</span>
                         <span className="font-bold">₹{(selectedInvoice.total || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                         <span className="text-slate-400 font-bold uppercase">Logistics Fee:</span>
                         <span className="font-bold">₹0.00</span>
                      </div>
                      <div className="border-t-2 border-slate-900 pt-3 flex justify-between items-center">
                         <span className="text-sm font-black uppercase italic">Grand Total:</span>
                         <span className="text-xl font-black font-mono tracking-tighter">₹{(selectedInvoice.total || 0).toFixed(2)}</span>
                      </div>
                   </div>
                </div>

                <div className="pt-20 grid grid-cols-2 gap-24">
                   <div className="border-t border-slate-300 pt-3 space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Regional Controller Signature</p>
                      <p className="text-[10px] font-bold text-slate-900 uppercase">Aether Authority Node</p>
                   </div>
                   <div className="border-t border-slate-300 pt-3 space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Node Manager Signature</p>
                      <p className="text-[10px] font-bold text-slate-900 uppercase">{selectedInvoice.storeName}</p>
                   </div>
                </div>

                <div className="pt-12 text-center">
                   <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-300">This document is a certified regional manifest of the Aether Network // End of Line</p>
                </div>
             </div>
             <div className="p-6 bg-slate-50 border-t flex justify-end gap-3 print:hidden">
                <Button variant="outline" onClick={() => setSelectedInvoice(null)} className="h-12 px-6 rounded-xl font-bold uppercase text-[10px]">Close Node</Button>
                <Button onClick={handlePrint} className="h-12 px-8 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px]">
                   <Printer className="mr-2 h-4 w-4" /> Print Hardcopy
                </Button>
             </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8 print:hidden">
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 print:hidden">
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

      <Card className="hidden md:block border-none glass-card rounded-[2.5rem] overflow-hidden print:hidden">
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
                            <SelectTrigger className={cn(
                              "h-7 w-[90px] text-[7px] font-black uppercase tracking-widest rounded-lg border-none bg-white/5 shrink-0",
                              order.paymentMethod === 'paid' ? "text-emerald-500" : "text-white"
                            )}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass-card border-white/10 text-white rounded-xl">
                              <SelectItem value="cash" className="text-[10px] font-black tracking-widest uppercase">CASH</SelectItem>
                              <SelectItem value="after_delivery" className="text-[10px] font-black tracking-widest uppercase">CREDIT</SelectItem>
                              <SelectItem value="paid" className="text-[10px] font-black tracking-widest uppercase text-emerald-500">PAID</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-primary tracking-widest">₹{(order.total || 0).toFixed(2)}</span>
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
                          <SelectItem value="return_pending" className="text-[10px] font-black tracking-widest uppercase text-orange-500">DAMAGE REPT</SelectItem>
                          <SelectItem value="returned" className="text-[10px] font-black tracking-widest uppercase text-slate-400">DMG RESOLVED</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <div className="flex flex-col items-end gap-2">
                         <div className="flex gap-2">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-11 w-11 rounded-2xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                              onClick={() => handleOpenEdit(order)}
                            >
                               <Edit2 className="h-5 w-5" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-muted-foreground hover:text-primary h-11 rounded-2xl px-6 hover:bg-white/5 font-bold uppercase tracking-widest text-[10px]"
                              onClick={() => setSelectedInvoice(order)}
                            >
                              <Printer className="h-4 w-4 mr-3" /> Invoice
                            </Button>
                         </div>
                         <Button 
                           size="sm" 
                           variant="ghost" 
                           className="text-muted-foreground hover:text-white h-8 rounded-xl px-4 hover:bg-white/5 font-bold uppercase tracking-widest text-[8px]"
                           onClick={() => downloadPO(order.id)}
                         >
                           <Download className="h-3 w-3 mr-2" /> Data PO
                         </Button>
                      </div>
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

      <div className="md:hidden space-y-4 print:hidden">
        {filteredOrders.length ? filteredOrders.map((order) => (
          <Card key={order.id} className="border-none glass-card rounded-3xl p-6 space-y-6">
            <div className="flex justify-between items-start">
               <div className="min-w-0 flex-1 pr-2">
                 <p className="text-[10px] font-black text-primary uppercase italic tracking-tighter mb-1">{order.id.substring(0, 8)}</p>
                 <div className="flex items-center gap-2">
                    <h3 className="font-black text-white text-sm uppercase italic truncate">{order.storeName || 'Branch Node'}</h3>
                 </div>
               </div>
               <div className="flex flex-col items-end gap-2">
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
                      <SelectItem value="return_pending" className="text-[10px] font-black tracking-widest uppercase text-orange-500">DAMAGE REPT</SelectItem>
                      <SelectItem value="returned" className="text-[10px] font-black tracking-widest uppercase text-slate-400">DMG RESOLVED</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 rounded-xl border-white/10 bg-white/5 text-rose-500 font-black text-[8px] uppercase tracking-widest"
                    onClick={() => handleOpenEdit(order)}
                  >
                     <Edit2 className="h-3 w-3 mr-2" /> Override
                  </Button>
               </div>
            </div>
            
            <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                    <Phone className="h-3 w-3 text-primary opacity-50" />
                    {order.phoneNumber || 'N/A'}
                  </div>
                  <Select 
                    value={order.paymentMethod || 'cash'} 
                    onValueChange={(val) => handlePaymentUpdate(order.id, val)}
                  >
                    <SelectTrigger className={cn(
                      "h-8 w-[95px] text-[8px] font-black uppercase tracking-widest rounded-xl border-none bg-white/10 shrink-0",
                      order.paymentMethod === 'paid' ? "text-emerald-500" : "text-white"
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-white/10 text-white rounded-2xl">
                      <SelectItem value="cash" className="text-[10px] font-black tracking-widest uppercase">CASH</SelectItem>
                      <SelectItem value="after_delivery" className="text-[10px] font-black tracking-widest uppercase">CREDIT</SelectItem>
                      <SelectItem value="paid" className="text-[10px] font-black tracking-widest uppercase text-emerald-500">PAID</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
               <div className="flex items-start gap-3 text-[10px] text-muted-foreground font-medium">
                  <MapPin className="h-3 w-3 text-accent shrink-0 mt-0.5" />
                  <span>{order.deliveryAddress || 'NO_ADDRESS'}</span>
               </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-4">
               <div className="space-y-0.5">
                  <p className="text-xs font-black text-primary font-mono">₹{(order.total || 0).toFixed(2)}</p>
                  <p className="text-[9px] text-muted-foreground font-mono truncate max-w-[150px]">{order.items || 'Payload'}</p>
               </div>
               <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-10 rounded-xl glass-card border-white/10 text-white font-black text-[9px] uppercase tracking-widest" onClick={() => setSelectedInvoice(order)}>
                    <Printer className="h-3 w-3 mr-2" /> Invoice
                  </Button>
                  <Button size="sm" variant="outline" className="h-10 rounded-xl glass-card border-white/10 text-white font-black text-[9px] uppercase tracking-widest" onClick={() => downloadPO(order.id)}>
                    <Download className="h-3 w-3 mr-2" /> PO
                  </Button>
               </div>
            </div>
          </Card>
        )) : null}
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 20px;
          }
          .dark-admin {
             background-color: white !important;
             color: black !important;
          }
        }
      `}</style>
    </div>
  );
}
