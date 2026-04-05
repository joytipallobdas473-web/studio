"use client";

import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, ArrowUpDown, Clock, Truck, PackageCheck, XCircle, Loader2, Phone, MapPin, Banknote, CreditCard, BoxSelect } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useMemo } from "react";
import { format } from "date-fns";

export default function HistoryPage() {
  const db = useFirestore();
  const { user } = useUser();
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
      (o.phoneNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.deliveryAddress || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  const getStatusIcon = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "delivered": return <PackageCheck className="h-3 w-3 mr-1" />;
      case "processing": return <Clock className="h-3 w-3 mr-1" />;
      case "pending": return <Clock className="h-3 w-3 mr-1" />;
      case "shipped": return <Truck className="h-3 w-3 mr-1" />;
      case "cancelled": return <XCircle className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "delivered": return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case "processing": return "text-sky-700 bg-sky-50 border-sky-200";
      case "pending": return "text-amber-700 bg-amber-50 border-amber-200";
      case "shipped": return "text-blue-700 bg-blue-50 border-blue-200";
      case "cancelled": return "text-rose-700 bg-rose-50 border-rose-200";
      default: return "text-slate-700 bg-slate-50 border-slate-200";
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600 opacity-30" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
             <span className="text-[10px] font-black tracking-[0.4em] text-emerald-600 uppercase">Telemetry Registry</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Packet History</h1>
          <p className="text-slate-500 font-medium text-sm">Comprehensive log of reorder packets for this branch node.</p>
        </div>
        <div className="flex gap-3">
           <Badge variant="outline" className="h-10 px-4 rounded-xl border-slate-200 text-slate-500 font-bold uppercase tracking-widest text-[9px] bg-white">
             {orders.length} Packets Logged
           </Badge>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by ID, Product, or Location..." 
            className="pl-11 h-12 bg-slate-50 border-none rounded-xl font-bold text-slate-900 placeholder:text-slate-400" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-200 text-slate-500 font-black uppercase tracking-widest text-[9px] bg-white hover:bg-slate-50">
            <Filter className="h-4 w-4 mr-2 opacity-50" /> Filter
          </Button>
          <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-200 text-slate-500 font-black uppercase tracking-widest text-[9px] bg-white hover:bg-slate-50">
            <ArrowUpDown className="h-4 w-4 mr-2 opacity-50" /> Sort
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden rounded-[2rem] bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 h-14">
              <TableRow className="border-slate-100">
                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] pl-8">Signature</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em]">Deployment Details</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em]">Payload Data</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em]">Valuation</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] pr-8 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders && filteredOrders.length > 0 ? filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-slate-50/50 transition-colors h-24 border-slate-100 group">
                  <TableCell className="pl-8">
                    <div className="flex flex-col">
                      <span className="font-mono font-black text-emerald-600 text-xs tracking-widest uppercase">#{order.id.substring(0, 8)}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        {order.createdAt?.seconds ? format(order.createdAt.seconds * 1000, 'yyyy-MM-dd') : 'PENDING'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                          <Phone className="h-3 w-3 text-emerald-600 opacity-50" />
                          {order.phoneNumber || "N/A"}
                        </div>
                        <Badge variant="secondary" className="h-5 px-2 text-[8px] font-black uppercase bg-slate-100 text-slate-500 border-none">
                          {order.paymentMethod === 'cash' ? <Banknote className="h-2 w-2 mr-1" /> : <CreditCard className="h-2 w-2 mr-1" />}
                          {order.paymentMethod === 'after_delivery' ? 'CREDIT' : 'CASH'}
                        </Badge>
                      </div>
                      <div className="flex items-start gap-2 text-[10px] text-slate-400 font-medium max-w-[200px]">
                        <MapPin className="h-3 w-3 shrink-0 text-emerald-600/40" />
                        <span className="truncate">{order.deliveryAddress || "Branch Node Coordinate"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <span className="font-black text-slate-800 text-xs uppercase italic group-hover:text-emerald-600 transition-colors">{order.items || 'Restock Packet'}</span>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Qty: {order.quantity || 1}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-black text-slate-900 text-base tracking-tighter italic font-mono">
                    ₹{(order.total || 0).toFixed(0)}
                  </TableCell>
                  <TableCell className="pr-8 text-right">
                    <Badge variant="outline" className={`capitalize inline-flex items-center h-8 px-4 text-[9px] font-black tracking-widest rounded-lg border shadow-none ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-32 text-slate-300">
                    <BoxSelect className="h-16 w-16 mx-auto mb-4 opacity-10" />
                    <p className="font-black uppercase tracking-[0.4em] text-[10px] italic">Telemetry Log Empty</p>
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