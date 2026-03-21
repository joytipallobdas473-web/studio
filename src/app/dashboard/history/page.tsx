
"use client";

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, ArrowUpDown, Clock, Truck, PackageCheck, XCircle, Loader2, Phone } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { format } from "date-fns";

export default function HistoryPage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");

  const historyQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "orders"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: orders, isLoading: loading } = useCollection(historyQuery);

  const filteredOrders = orders?.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.items || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.phoneNumber || "").toLowerCase().includes(searchTerm.toLowerCase())
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-primary">Order History</h1>
        <p className="text-muted-foreground">Review all your previous stock requests.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by ID, Item, or Phone..." 
            className="pl-9 h-11" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Badge variant="outline" className="h-11 px-4 cursor-pointer hover:bg-muted flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Badge>
          <Badge variant="outline" className="h-11 px-4 cursor-pointer hover:bg-muted flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" /> Sort
          </Badge>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold">Packet ID</TableHead>
                <TableHead className="font-bold">Contact Node</TableHead>
                <TableHead className="font-bold">Payload</TableHead>
                <TableHead className="font-bold">Value</TableHead>
                <TableHead className="font-bold">Flow Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders && filteredOrders.length > 0 ? filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-mono font-bold text-primary text-[10px] uppercase">
                    {order.id.substring(0, 8)}
                    <p className="text-[9px] text-slate-400 font-normal">
                      {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <Phone className="h-3 w-3 text-primary" />
                      {order.phoneNumber || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-slate-800">
                    {order.items || 'Stock Item'}
                    <p className="text-[10px] text-slate-400 font-normal">Qty: {order.quantity || 1}</p>
                  </TableCell>
                  <TableCell className="font-black text-primary">${(order.total || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize flex items-center w-fit h-7 px-3 text-[10px] font-bold tracking-wide rounded-lg ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                    No orders found in registry history.
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
