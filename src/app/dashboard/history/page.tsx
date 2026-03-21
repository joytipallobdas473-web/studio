
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function HistoryPage() {
  const orders = [
    { id: "ORD-7721", date: "2024-05-12", item: "Logitech MX Master 3", qty: 5, total: "$420.00", status: "In Transit" },
    { id: "ORD-7719", date: "2024-05-10", item: "Dell 27 Monitor", qty: 10, total: "$1,150.00", status: "Delivered" },
    { id: "ORD-7715", date: "2024-05-08", item: "USB-C Hubs", qty: 25, total: "$89.50", status: "Delivered" },
    { id: "ORD-7712", date: "2024-05-05", item: "Office Chairs", qty: 2, total: "$550.00", status: "Cancelled" },
    { id: "ORD-7708", date: "2024-05-01", item: "Paper Reams (A4)", qty: 100, total: "$400.00", status: "Delivered" },
    { id: "ORD-7699", date: "2024-04-28", item: "Laptop Stands", qty: 15, total: "$320.00", status: "Delivered" },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered": return "bg-green-100 text-green-700 hover:bg-green-100";
      case "in transit": return "bg-blue-100 text-blue-700 hover:bg-blue-100";
      case "processing": return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100";
      case "cancelled": return "bg-red-100 text-red-700 hover:bg-red-100";
      default: return "bg-gray-100 text-gray-700";
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
                    <Badge className={getStatusColor(order.status)}>
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
