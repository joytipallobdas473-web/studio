
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, FileText, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminOrdersPage() {
  const [storeFilter, setStoreFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [orders] = useState([
    { id: "ORD-9901", store: "Downtown Brooklyn", date: "2024-05-15", items: "Logitech MX Master 3 (x5)", total: 495.00, status: "pending" },
    { id: "ORD-9902", store: "Jersey City Hub", date: "2024-05-14", items: "Dell 27 Monitor (x2)", total: 579.00, status: "processing" },
    { id: "ORD-9903", store: "Downtown Brooklyn", date: "2024-05-14", items: "USB-C Hubs (x10)", total: 350.00, status: "shipped" },
    { id: "ORD-9904", store: "Main St Boutique", date: "2024-05-13", items: "Office Chairs (x4)", total: 1200.00, status: "delivered" },
  ]);

  const filteredOrders = orders.filter(order => {
    const matchesStore = storeFilter === "all" || order.store === storeFilter;
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         order.store.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStore && matchesSearch;
  });

  const downloadPO = (orderId?: string) => {
    const ordersToExport = orderId ? orders.filter(o => o.id === orderId) : filteredOrders;
    
    if (ordersToExport.length === 0) return;

    const headers = ["Order ID", "Store", "Date", "Items", "Total Amount ($)", "Status"];
    const csvData = ordersToExport.map(o => [
      o.id,
      o.store,
      o.date,
      `"${o.items}"`,
      o.total.toFixed(2),
      o.status
    ]);

    const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    const fileName = orderId ? `PO_${orderId}.csv` : `PO_Storewise_${storeFilter === 'all' ? 'All_Stores' : storeFilter.replace(/\s+/g, '_')}.csv`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered": return "bg-green-100 text-green-700";
      case "processing": return "bg-blue-100 text-blue-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "shipped": return "bg-purple-100 text-purple-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Consolidated Orders</h1>
          <p className="text-muted-foreground text-sm">Track and manage stock requests across all stores.</p>
        </div>
        <Button onClick={() => downloadPO()} className="bg-accent text-accent-foreground font-bold hover:bg-accent/90">
          <Download className="mr-2 h-4 w-4" /> Download Store-wise PO
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by Order ID or Store..." 
            className="pl-9" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Select value={storeFilter} onValueChange={setStoreFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Filter by Store" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                <SelectItem value="Downtown Brooklyn">Downtown Brooklyn</SelectItem>
                <SelectItem value="Jersey City Hub">Jersey City Hub</SelectItem>
                <SelectItem value="Main St Boutique">Main St Boutique</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items Requested</TableHead>
                <TableHead>Total ($)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-code font-bold text-primary">{order.id}</TableCell>
                    <TableCell className="font-medium">{order.store}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{order.date}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{order.items}</TableCell>
                    <TableCell className="font-bold">${order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)} variant="outline">
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-accent hover:text-accent/90"
                        onClick={() => downloadPO(order.id)}
                      >
                        <FileText className="h-4 w-4 mr-1" /> PO
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No orders found for the selected criteria.
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
