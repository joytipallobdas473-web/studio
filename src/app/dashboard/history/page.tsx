"use client";

import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, where } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, ArrowUpDown, Clock, Truck, PackageCheck, XCircle, Loader2, Phone, MapPin, Banknote, CreditCard, AlertTriangle, ExternalLink } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function HistoryPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");

  const historyQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "orders"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [db, user]);

  const { data: orders, isLoading: loading, error } = useCollection(historyQuery);

  const filteredOrders = orders?.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.items || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.phoneNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.deliveryAddress || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      case "delivered": return "text-green-700 bg-green-50 border-green-200";
      case "processing": return "text-blue-700 bg-blue-50 border-blue-200";
      case "pending": return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "shipped": return "text-purple-700 bg-purple-50 border-purple-200";
      case "cancelled": return "text-red-700 bg-red-50 border-red-200";
      default: return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  // Handle Index Errors specifically
  if (error && error.message.includes("index")) {
    const indexUrl = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0];
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
        <div className="bg-amber-100 p-6 rounded-full mb-6">
          <AlertTriangle className="h-12 w-12 text-amber-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Index Required</h2>
        <p className="text-slate-500 max-w-md mt-4 font-medium">
          The regional grid requires a composite index to sort and filter your history logs.
        </p>
        {indexUrl && (
          <Button asChild className="mt-8 bg-primary text-white font-black rounded-2xl h-14 px-10 uppercase tracking-widest text-[10px]">
            <a href={indexUrl} target="_blank" rel="noopener noreferrer">
              Deploy Index <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-primary tracking-tight italic uppercase">Order Registry</h1>
        <p className="text-muted-foreground font-medium">Comprehensive history of reorder packets for this node.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Filter by ID, Item, Phone, or Address..." 
            className="pl-11 h-12 bg-slate-50 border-none rounded-xl font-medium" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Badge variant="outline" className="h-12 px-5 cursor-pointer hover:bg-slate-50 flex items-center gap-2 rounded-xl border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <Filter className="h-4 w-4 opacity-50" /> Filter
          </Badge>
          <Badge variant="outline" className="h-12 px-5 cursor-pointer hover:bg-slate-50 flex items-center gap-2 rounded-xl border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <ArrowUpDown className="h-4 w-4 opacity-50" /> Sort
          </Badge>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden rounded-[2.5rem] bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 h-16">
              <TableRow className="border-slate-100">
                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] pl-8">Packet Signature</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em]">Contact & Payment</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em]">Payload</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em]">Net Value</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] pr-8">Flow Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders && filteredOrders.length > 0 ? filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-slate-50/50 transition-colors h-24 border-slate-100">
                  <TableCell className="font-mono font-bold text-primary text-[11px] uppercase pl-8">
                    {order.id.substring(0, 8)}
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                      {order.createdAt?.seconds ? format(order.createdAt.seconds * 1000, 'yyyy-MM-dd') : 'SYNCING'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                          <Phone className="h-3 w-3 text-primary opacity-50" />
                          {order.phoneNumber || "N/A"}
                        </div>
                        <Badge variant="secondary" className="h-5 px-2 text-[8px] font-black uppercase bg-slate-100 text-slate-500 border-none">
                          {order.paymentMethod === 'cash' ? <Banknote className="h-2 w-2 mr-1" /> : <CreditCard className="h-2 w-2 mr-1" />}
                          {order.paymentMethod === 'after_delivery' ? 'AFTER DEL' : 'CASH'}
                        </Badge>
                      </div>
                      <div className="flex items-start gap-2 text-[10px] text-slate-400 font-medium max-w-[200px]">
                        <MapPin className="h-3 w-3 shrink-0 text-accent opacity-50" />
                        <span className="truncate">{order.deliveryAddress || "Not Provided"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-slate-800 text-sm uppercase italic">
                    {order.items || 'Restock Packet'}
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Qty: {order.quantity || 1}</p>
                  </TableCell>
                  <TableCell className="font-black text-primary text-base tracking-tight">${(order.total || 0).toFixed(2)}</TableCell>
                  <TableCell className="pr-8">
                    <Badge variant="outline" className={`capitalize flex items-center w-fit h-8 px-4 text-[9px] font-black tracking-[0.1em] rounded-xl ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-32 text-slate-400 italic font-medium">
                    No order telemetry detected in history logs.
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
