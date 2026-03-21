
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, MapPin, User } from "lucide-react";

export default function StoreManagement() {
  const [stores, setStores] = useState([
    { id: "1", name: "Downtown Brooklyn", manager: "Sarah Connor", location: "Brooklyn, NY", status: "pending" },
    { id: "2", name: "Jersey City Hub", manager: "Mike Ross", location: "Jersey City, NJ", status: "pending" },
    { id: "3", name: "Main St Boutique", manager: "Harvey Specter", location: "New York, NY", status: "active" },
  ]);

  const handleAction = (id: string, newStatus: string) => {
    setStores(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Store Registrations</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store Name</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-bold">{store.name}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    {store.manager}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {store.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={store.status === "pending" ? "outline" : "default"} 
                           className={store.status === "active" ? "bg-green-100 text-green-700" : ""}>
                      {store.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {store.status === "pending" && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" 
                                onClick={() => handleAction(store.id, "active")}>
                          <Check className="h-4 w-4 mr-1" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleAction(store.id, "rejected")}>
                          <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
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
