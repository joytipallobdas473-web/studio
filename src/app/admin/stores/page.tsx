
"use client";

import { useFirestore, useCollection } from "@/firebase";
import { collection, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, MapPin, User, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function StoreManagement() {
  const db = useFirestore();
  const storesQuery = db ? query(collection(db, "stores"), orderBy("createdAt", "desc")) : null;
  const { data: stores, loading } = useCollection(storesQuery);

  const handleAction = async (id: string, newStatus: string) => {
    if (!db) return;
    try {
      const storeRef = doc(db, "stores", id);
      await updateDoc(storeRef, { status: newStatus });
      toast({
        title: "Status Updated",
        description: `Store is now ${newStatus}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update store status.",
      });
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
              {stores?.length ? (
                stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-bold">{store.name}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      {store.managerName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {store.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={store.status === "pending" ? "outline" : "default"} 
                             className={store.status === "active" ? "bg-green-100 text-green-700" : store.status === "rejected" ? "bg-red-100 text-red-700" : ""}>
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No store registrations found.
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
