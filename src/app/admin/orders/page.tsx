"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, FileText, Filter, CheckCircle2, Clock, Truck, PackageCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

export default function AdminOrdersPage() {
  const [storeFilter, setStoreFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [orders, setOrders] = useState([
    { id: "ORD-9901", store: "Downtown Brooklyn", date: "2024-05-15", items: "Logitech MX Master 3 (x5)", total: 495.00, status: "pending" },
    { id: "ORD-9902", store: "Jersey City Hub", date: "2024-05-14", items: "Dell 27 Monitor (x2)", total: 579.00, status: "processing" },
    { id: "ORD-9903", store: "Downtown Brooklyn", date: "2024-05-14", items: "USB-C Hubs (x10)", total: 350.00, status: "shipped" },
    { id: "ORD-9904", store: "Main St Boutique", date: "2024-05-13", items: "Office Chairs (x4)", total: 1200.00, status: "delivered" },
  ]);

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    
    toast({
      title: "Status Updated",
      description: `Order ${orderId} is now ${newStatus}.`,
    });
  };

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Consolidated Orders</h1>
          <p className="text-muted-foreground text-sm">Track and update delivery status for all store requests.</p>
        </div>
        <Button onClick={() => downloadPO()} className="bg-accent text-accent-foreground font-bold hover:bg-accent/90">
          <Download className="mr-2 h-4 w-4" /> Download PO
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
        <div>
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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Items Requested</TableHead>
                <TableHead>Total ($)</TableHead>
                <TableHead>Status Control</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-code font-bold text-primary">{order.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{order.store}</span>
                        <span className="text-[10px] text-muted-foreground">{order.date}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{order.items}</TableCell>
                    <TableCell className="font-bold">${order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Select 
                        defaultValue={order.status} 
                        onValueChange={(val) => handleStatusUpdate(order.id, val)}
                      >
                        <SelectTrigger className={`h-8 w-[140px] text-xs font-semibold ${getStatusColor(order.status)}`}>
                          <div className="flex items-center">
                            {getStatusIcon(order.status)}
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
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
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
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
