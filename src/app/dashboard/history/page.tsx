
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, ArrowUpDown, Clock, Truck, PackageCheck, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function HistoryPage() {
  const orders = [
    { id: "ORD-9901", date: "2024-05-15", item: "Logitech MX Master 3", qty: 5, total: "$495.00", status: "pending" },
    { id: "ORD-9902", date: "2024-05-14", item: "Dell 27 Monitor", qty: 2, total: "$579.00", status: "processing" },
    { id: "ORD-9903", date: "2024-05-14", item: "USB-C Hubs", qty: 10, total: "$350.00", status: "shipped" },
    { id: "ORD-9904", date: "2024-05-13", item: "Office Chairs", qty: 4, total: "$1,200.00", status: "delivered" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered": return <PackageCheck className="h-3 w-3 mr-1" />;
      case "processing": return <Clock className="h-3 w-3 mr-1" />;
      case "pending": return <Clock className="h-3 w-3 mr-1" />;
      case "shipped": return <Truck className="h-3 w-3 mr-1" />;
      case "cancelled": return <XCircle className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered": return "text-green-700 bg-green-50 border-green-200";
      case "processing": return "text-blue-700 bg-blue-50 border-blue-200";
      case "pending": return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "shipped": return "text-purple-700 bg-purple-50 border-purple-200";
      case "cancelled": return "text-red-700 bg-red-50 border-red-200";
      default: return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Order History</h1>
          <p className="text-muted-foreground font-body">Review all your previous stock requests.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by Order ID or Item..." className="pl-9" />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Badge variant="outline" className="h-10 px-4 cursor-pointer hover:bg-muted flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Badge>
          <Badge variant="outline" className="h-10 px-4 cursor-pointer hover:bg-muted flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" /> Sort
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-bold text-primary">{order.id}</TableCell>
                  <TableCell className="text-muted-foreground">{order.date}</TableCell>
                  <TableCell className="font-medium">{order.item}</TableCell>
                  <TableCell>{order.qty}</TableCell>
                  <TableCell className="font-bold">{order.total}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize flex items-center w-fit ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
