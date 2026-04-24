"use client";

import { useState, useMemo, useEffect } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, doc, query } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, Filter, Loader2, Phone, MapPin, Mail, Globe, CheckCircle2, Truck, Printer, X, Edit2, ShieldAlert, Save, TrendingUp, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { updateDocumentNonBlocking } from "@/firebase";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

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
  
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    items: "",
    total: "0",
    profit: "0",
    quantity: "0",
    protocolNote: ""
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
    return [...rawOrders].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [rawOrders]);

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, "orders", orderId), { status: newStatus });
    toast({ title: "Protocol Synchronized" });
  };

  const handleOpenEdit = (order: any) => {
    setEditingOrder(order);
    setEditForm({
      items: order.items || "",
      total: (order.total || 0).toString(),
      profit: (order.profit || 0).toString(),
      quantity: (order.quantity || 0).toString(),
      protocolNote: order.protocolNote || ""
    });
  };

  const handleCommitOverride = () => {
    if (!db || !editingOrder) return;
    updateDocumentNonBlocking(doc(db, "orders", editingOrder.id), {
      items: editForm.items,
      total: parseFloat(editForm.total) || 0,
      profit: parseFloat(editForm.profit) || 0,
      quantity: parseInt(editForm.quantity) || 0,
      protocolNote: editForm.protocolNote
    });
    toast({ title: "Manifest Overridden", description: "Packet payload updated by authority." });
    setEditingOrder(null);
  };

  const getStatusColor = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "delivered": return "text-emerald-400 border-emerald-400/20 bg-emerald-400/5";
      case "processing": return "text-cyan-400 border-cyan-400/20 bg-cyan-400/5";
      case "pending": return "text-amber-400 border-amber-400/20 bg-amber-400/5";
      case "shipped": return "text-blue-400 border-blue-400/20 bg-blue-400/5";
      case "cancelled": return "text-rose-500 border-rose-500/20 bg-rose-500/5";
      case "return_pending": return "text-orange-400 border-orange-400/20 bg-orange-400/5";
      default: return "text-slate-400 border-white/10 bg-white/5";
    }
  };

  const filteredOrders = useMemo(() => {
    const queryStr = searchQuery.toLowerCase();
    return orders.filter(order => {
      const matchesStore = storeFilter === "all" || order.storeName === storeFilter;
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesSearch = order.id.toLowerCase().includes(queryStr) || (order.storeName || "").toLowerCase().includes(queryStr);
      return matchesStore && matchesStatus && matchesSearch;
    });
  }, [orders, storeFilter, statusFilter, searchQuery]);

  const downloadPO = (orderId?: string) => {
    const ordersToExport = orderId ? orders.filter(o => o.id === orderId) : filteredOrders;
    if (!ordersToExport || ordersToExport.length === 0) return;
    const headers = ["Packet ID", "Node", "Email", "Phone", "Delivery", "Payment", "Items", "Qty", "Total (₹)", "Profit (₹)", "Status"];
    const csvContent = [headers, ...ordersToExport.map(o => [
      o.id, o.storeName, o.email, o.phoneNumber, `"${o.deliveryAddress}"`, o.paymentMethod, `"${o.items}"`, o.quantity, o.total, o.profit, o.status
    ])].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }));
    link.setAttribute("download", `AETHER_PROTOCOL_LOG_${Date.now()}.csv`);
    link.click();
  };

  if (loading) return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" /></div>;

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700">
      <Dialog open={!!editingOrder} onOpenChange={() => setEditingOrder(null)}>
        <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-10 glass-card border-none shadow-2xl bg-black text-white">
           <DialogHeader>
              <div className="flex items-center gap-3 mb-2"><ShieldAlert className="h-5 w-5 text-rose-500" /><span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500">Override Protocol</span></div>
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-rose-500">Modify Manifest</DialogTitle>
           </DialogHeader>
           <div className="space-y-6 py-6">
              <div className="space-y-3">
                 <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Payload Manifest (Items)</Label>
                 <Textarea value={editForm.items} onChange={(e) => setEditForm({...editForm, items: e.target.value})} className="min-h-[120px] bg-white/5 border-white/10 rounded-2xl text-white font-bold text-xs" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-3"><Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Commit Valuation (₹)</Label><Input type="number" value={editForm.total} onChange={(e) => setEditForm({...editForm, total: e.target.value})} className="h-14 bg-white/5 border-white/10 rounded-2xl text-white font-mono" /></div>
                 <div className="space-y-3"><Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Net Profit (₹)</Label><Input type="number" value={editForm.profit} onChange={(e) => setEditForm({...editForm, profit: e.target.value})} className="h-14 bg-white/5 border-white/10 rounded-2xl text-emerald-500 font-mono" /></div>
                 <div className="space-y-3"><Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Unit Density</Label><Input type="number" value={editForm.quantity} onChange={(e) => setEditForm({...editForm, quantity: e.target.value})} className="h-14 bg-white/5 border-white/10 rounded-2xl text-white font-mono" /></div>
              </div>
              <div className="space-y-3">
                 <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Authority Note (Optional)</Label>
                 <Input value={editForm.protocolNote} onChange={(e) => setEditForm({...editForm, protocolNote: e.target.value})} placeholder="Reason for override..." className="h-12 bg-white/5 border-white/10 rounded-xl text-white text-xs" />
              </div>
           </div>
           <DialogFooter className="gap-4">
              <Button variant="ghost" onClick={() => setEditingOrder(null)} className="h-14 px-8 rounded-2xl uppercase tracking-widest font-black text-muted-foreground">Abort</Button>
              <Button onClick={handleCommitOverride} className="bg-rose-500 text-white h-14 px-10 rounded-2xl font-black uppercase tracking-widest shadow-lg"><Save className="mr-3 h-5 w-5" /> Commit Override</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedInvoice && (
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="sm:max-w-[800px] p-0 border-none bg-white overflow-hidden">
             <div className="sr-only"><DialogTitle>Order Invoice Preview</DialogTitle></div>
             <div id="printable-invoice" className="bg-white text-slate-900 p-12 space-y-8 font-sans border-8 border-slate-50 m-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-slate-50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-50" />
                <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 relative z-10">
                   <div className="space-y-1"><h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Aether Network</h2><p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Regional Logistics Hub // North East Grid</p></div>
                   <div className="text-right space-y-1"><h3 className="text-2xl font-black uppercase italic tracking-tighter">Manifest</h3><p className="text-[10px] font-mono font-bold text-slate-400">Packet: {selectedInvoice.id.toUpperCase()}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-16 relative z-10">
                   <div className="space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b-2 border-slate-100 pb-2">Destination Node</h4>
                      <div className="space-y-1"><p className="font-black uppercase italic text-xl">{selectedInvoice.storeName}</p><p className="text-xs font-bold text-slate-600 leading-relaxed">{selectedInvoice.deliveryAddress}</p><p className="text-xs font-black text-slate-900 mt-4">Node Contact: {selectedInvoice.phoneNumber}</p></div>
                   </div>
                   <div className="space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b-2 border-slate-100 pb-2">Protocol Details</h4>
                      <div className="space-y-2">
                         <div className="flex justify-between text-xs"><span className="text-slate-400 font-black uppercase">Sync Date:</span><span className="font-black">{selectedInvoice.createdAt?.seconds ? format(selectedInvoice.createdAt.seconds * 1000, 'dd MMM yyyy') : 'PENDING'}</span></div>
                         <div className="flex justify-between text-xs"><span className="text-slate-400 font-black uppercase">Payment:</span><span className="font-black uppercase">{selectedInvoice.paymentMethod || 'CASH'}</span></div>
                         <div className="flex justify-between text-xs"><span className="text-slate-400 font-black uppercase">Density:</span><span className="font-black">{selectedInvoice.quantity || 1} Units</span></div>
                         <div className="flex justify-between text-[8px] pt-2 mt-2 border-t border-slate-100 font-mono"><span className="text-slate-400">AUTH_TOKEN:</span><span className="font-bold">{(selectedInvoice.id as string).substring(0, 16).toUpperCase()}</span></div>
                      </div>
                   </div>
                </div>
                <div className="pt-8 relative z-10">
                   <table className="w-full">
                      <thead>
                         <tr className="border-b-2 border-slate-900 h-12">
                            <th className="text-[10px] font-black uppercase tracking-widest text-left">SKU Identity & Payload Description</th>
                            <th className="text-[10px] font-black uppercase tracking-widest text-right">Valuation (₹)</th>
                         </tr>
                      </thead>
                      <tbody>
                         <tr className="border-b border-slate-100 h-24">
                            <td>
                               <p className="font-black text-sm uppercase">{selectedInvoice.items}</p>
                               <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Certified Regional Logistics Cluster</p>
                            </td>
                            <td className="text-right font-mono font-black text-lg">{(selectedInvoice.total || 0).toFixed(2)}</td>
                         </tr>
                      </tbody>
                   </table>
                </div>
                <div className="flex justify-end pt-8 relative z-10">
                   <div className="w-80 space-y-4 pt-6 border-t-4 border-slate-900">
                      <div className="flex justify-between items-center text-sm font-black uppercase">
                         <span>Grand Total Commit:</span>
                         <span className="text-2xl italic tracking-tighter">₹{(selectedInvoice.total || 0).toFixed(2)}</span>
                      </div>
                   </div>
                </div>
                {selectedInvoice.protocolNote && (
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 relative z-10">
                     <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Authority Protocol Note</p>
                     <p className="text-[10px] font-bold italic leading-relaxed">"{selectedInvoice.protocolNote}"</p>
                  </div>
                )}
                <div className="pt-24 grid grid-cols-2 gap-32 relative z-10">
                   <div className="border-t-2 border-slate-300 pt-4"><p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Regional Authority Signature</p></div>
                   <div className="border-t-2 border-slate-300 pt-4"><p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Node Manager Signature</p></div>
                </div>
                
                {/* Official Watermark */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[30deg] opacity-[0.03] select-none pointer-events-none">
                   <h2 className="text-[10rem] font-black uppercase italic tracking-tighter">AETHER</h2>
                </div>

                <div className="pt-12 text-center relative z-10">
                   <div className="flex items-center justify-center gap-2 text-emerald-600 mb-3 opacity-30">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="text-[8px] font-black uppercase tracking-[0.3em]">Official Regional Verification Protocol v8.0</span>
                   </div>
                   <p className="text-[7px] font-black uppercase tracking-[0.5em] text-slate-300">Certified Regional Hub Registry // Aether Logistics Network // North East Grid</p>
                </div>
             </div>
             <div className="p-6 bg-slate-50 border-t flex justify-end gap-3 print:hidden">
                <Button variant="ghost" onClick={() => setSelectedInvoice(null)} className="h-12 px-6 rounded-xl font-bold uppercase text-[10px]">Close Node</Button>
                <Button onClick={() => window.print()} className="h-12 px-8 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px]"><Printer className="mr-2 h-4 w-4" /> Print Manifest</Button>
             </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 print:hidden">
        <div className="space-y-3">
          <div className="flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-primary" /><span className="text-[10px] font-black tracking-[0.4em] text-primary uppercase">Traffic Controller</span></div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase italic leading-none">Global Orders</h1>
        </div>
        <Button onClick={() => downloadPO()} className="w-full md:w-auto h-14 md:h-16 px-8 glass-card border-white/10 text-white font-black uppercase tracking-widest text-[10px]"><Download className="mr-3 h-5 w-5" /> Export Logs</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 print:hidden">
        <div className="md:col-span-2 relative"><Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input placeholder="Search Node or Packet..." className="pl-16 h-14 md:h-16 glass-card border-white/10 text-white rounded-2xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
        <Select value={storeFilter} onValueChange={setStoreFilter}><SelectTrigger className="h-14 md:h-16 glass-card border-white/10 text-white rounded-2xl px-6"><div className="flex items-center gap-3"><Filter className="h-5 w-5 text-muted-foreground" /><SelectValue placeholder="Node Selection" /></div></SelectTrigger><SelectContent className="glass-card border-white/10 text-white"><SelectItem value="all" className="font-bold uppercase tracking-widest text-[10px]">All Active Nodes</SelectItem>{Array.from(new Set(orders.map(o => o.storeName).filter(Boolean))).map(s => (<SelectItem key={s} value={s} className="font-bold uppercase tracking-widest text-[10px]">{s}</SelectItem>))}</SelectContent></Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-14 md:h-16 glass-card border-white/10 text-white rounded-2xl px-6"><div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-muted-foreground" /><SelectValue placeholder="Status Filter" /></div></SelectTrigger><SelectContent className="glass-card border-white/10 text-white">{STATUS_OPTIONS.map(opt => (<SelectItem key={opt.value} value={opt.value} className="font-bold uppercase tracking-widest text-[10px]">{opt.label}</SelectItem>))}</SelectContent></Select>
      </div>

      <Card className="hidden md:block border-none glass-card rounded-[2.5rem] overflow-hidden print:hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/5"><TableRow className="border-white/5 h-20"><TableHead className="text-muted-foreground uppercase text-[10px] font-black tracking-[0.3em] pl-10">Packet Signature</TableHead><TableHead className="text-muted-foreground uppercase text-[10px] font-black tracking-[0.3em]">Origin & Destination</TableHead><TableHead className="text-muted-foreground uppercase text-[10px] font-black tracking-[0.3em]">Payload Data</TableHead><TableHead className="text-muted-foreground uppercase text-[10px] font-black tracking-[0.3em]">Flow Control</TableHead><TableHead className="text-muted-foreground uppercase text-[10px] font-black tracking-[0.3em] text-right pr-10">Protocol</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredOrders.length ? filteredOrders.map((order) => (
                <TableRow key={order.id} className="border-white/5 hover:bg-white/5 transition-all group h-32">
                  <TableCell className="pl-10"><div className="flex items-center gap-4"><div className="h-2 w-2 rounded-full bg-primary" /><span className="font-mono text-xs font-black text-muted-foreground uppercase">{order.id.substring(0, 8)}</span></div></TableCell>
                  <TableCell><div className="flex flex-col gap-1.5 py-4"><span className="font-black text-white text-sm uppercase italic">{order.storeName}</span><div className="flex items-center gap-2 text-[10px] text-primary font-bold"><Mail className="h-2.5 w-2.5 opacity-50" />{order.email}</div><div className="flex items-start gap-2 text-[9px] text-muted-foreground font-medium max-w-[200px]"><MapPin className="h-2.5 w-2.5 shrink-0 mt-0.5" /><span className="truncate">{order.deliveryAddress}</span></div></div></TableCell>
                  <TableCell><div className="flex flex-col gap-1"><div className="flex items-center gap-2"><span className="text-xs font-bold text-white truncate max-w-[140px] uppercase">{order.items}</span><Badge variant="outline" className="text-[7px] border-white/10 text-emerald-500 uppercase">{order.paymentMethod}</Badge></div><div className="flex flex-col"><span className="text-[10px] font-black text-primary">₹{(order.total || 0).toFixed(2)}</span><span className="text-[8px] font-black text-emerald-500 uppercase">Profit: ₹{(order.profit || 0).toFixed(2)}</span></div></div></TableCell>
                  <TableCell><Select value={order.status} onValueChange={(val) => handleStatusUpdate(order.id, val)}><SelectTrigger className="h-10 w-[140px] text-[10px] font-black uppercase rounded-xl border-white/10 bg-white/5"><SelectValue /></SelectTrigger><SelectContent className="glass-card border-white/10 text-white rounded-2xl">{STATUS_OPTIONS.slice(1).map(opt => (<SelectItem key={opt.value} value={opt.value} className="text-[10px] font-black uppercase">{opt.label}</SelectItem>))}</SelectContent></Select></TableCell>
                  <TableCell className="text-right pr-10"><div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all"><Button size="icon" variant="ghost" className="h-11 w-11 rounded-2xl text-rose-500" onClick={() => handleOpenEdit(order)}><Edit2 className="h-5 w-5" /></Button><Button size="sm" variant="ghost" className="text-muted-foreground hover:text-primary h-11 px-6 font-bold uppercase tracking-widest text-[10px]" onClick={() => setSelectedInvoice(order)}><Printer className="h-4 w-4 mr-3" /> Manifest</Button></div></TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={5} className="text-center py-40 italic text-white/20 uppercase tracking-[0.5em] text-[10px]">Awaiting telemetry stream...</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="md:hidden grid grid-cols-1 gap-4 print:hidden">
        {filteredOrders.length > 0 ? filteredOrders.map((order) => (
          <Card key={order.id} className="border-none glass-card rounded-3xl overflow-hidden p-6 relative group">
            <div className="space-y-5">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                   <span className="text-[9px] font-mono font-black text-primary uppercase tracking-widest">PKT-{order.id.substring(0, 8)}</span>
                   <span className="font-black text-white text-base uppercase italic mt-1 leading-none">{order.storeName}</span>
                </div>
                <Badge variant="outline" className={cn("h-7 px-3 font-black rounded-lg text-[8px] tracking-widest uppercase border shadow-none", getStatusColor(order.status))}>
                  {order.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-white/5">
                 <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Revenue</span>
                    <p className="text-sm font-black text-primary font-mono">₹{(order.total || 0).toFixed(2)}</p>
                 </div>
                 <div className="space-y-1 text-right">
                    <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Net Profit</span>
                    <p className="text-sm font-black text-emerald-400 font-mono">₹{(order.profit || 0).toFixed(2)}</p>
                 </div>
              </div>

              <div className="space-y-2">
                 <p className="text-[10px] font-bold text-white uppercase italic truncate">{order.items}</p>
                 <div className="flex flex-col gap-1.5 opacity-60">
                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-bold">
                       <Mail className="h-3 w-3" /> {order.email}
                    </div>
                    <div className="flex items-start gap-2 text-[8px] text-muted-foreground leading-tight">
                       <MapPin className="h-3 w-3 shrink-0" /> {order.deliveryAddress}
                    </div>
                 </div>
              </div>

              <div className="flex gap-2 pt-1">
                 <Select value={order.status} onValueChange={(val) => handleStatusUpdate(order.id, val)}>
                    <SelectTrigger className="flex-1 h-12 text-[10px] font-black uppercase rounded-xl border-white/10 bg-white/5">
                       <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-white/10 text-white rounded-2xl">
                       {STATUS_OPTIONS.slice(1).map(opt => (
                          <SelectItem key={opt.value} value={opt.value} className="text-[10px] font-black uppercase">{opt.label}</SelectItem>
                       ))}
                    </SelectContent>
                 </Select>
                 <Button size="icon" variant="outline" className="h-12 w-12 rounded-xl bg-white/5 border-white/10 text-rose-500" onClick={() => handleOpenEdit(order)}>
                    <Edit2 className="h-5 w-5" />
                 </Button>
                 <Button size="icon" variant="outline" className="h-12 w-12 rounded-xl bg-white/5 border-white/10 text-primary" onClick={() => setSelectedInvoice(order)}>
                    <Printer className="h-5 w-5" />
                 </Button>
              </div>
            </div>
          </Card>
        )) : (
          <div className="text-center py-20 glass-card rounded-[2.5rem] border border-dashed border-white/10">
             <Globe className="h-12 w-12 mx-auto mb-4 text-primary opacity-20 animate-spin-slow" />
             <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">No Packet Telemetry Detected</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; height: auto; margin: 0; padding: 20px; }
          .dark-admin { background-color: white !important; color: black !important; }
        }
      `}</style>
    </div>
  );
}