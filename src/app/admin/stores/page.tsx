"use client";

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, MapPin, Loader2, Store, Globe, UserCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function StoreManagement() {
  const db = useFirestore();
  
  const storesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "stores"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: stores, isLoading: loading } = useCollection(storesQuery);

  const handleAction = (id: string, newStatus: string) => {
    if (!db) return;
    const storeRef = doc(db, "stores", id);
    
    updateDoc(storeRef, { status: newStatus })
      .then(() => {
        toast({ title: "Status Updated", description: `Retail node marked as ${newStatus}.` });
      })
      .catch((err) => {
        console.error(err);
        toast({ title: "Update Failed", variant: "destructive" });
      });
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Retail Partners</h1>
        <p className="text-slate-500 text-sm font-medium">Manage and authorize regional branch nodes.</p>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex items-center gap-3">
            <Store className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-bold">Registration Queue</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="font-bold uppercase text-[10px] tracking-widest pl-8">Branch Name</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Manager</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Location</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores?.length ? (
                stores.map((store) => (
                  <TableRow key={store.id} className="hover:bg-slate-50/50">
                    <TableCell className="pl-8 font-semibold text-slate-900">{store.name}</TableCell>
                    <TableCell className="text-slate-600 text-sm">{store.managerName || 'Pending'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <MapPin className="h-3 w-3" />
                        {store.location || 'North East'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "rounded-full px-3 py-0.5 text-[10px] font-bold uppercase",
                        store.status === "active" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : 
                        store.status === "rejected" ? "bg-rose-100 text-rose-700 border-rose-200" : 
                        "bg-amber-100 text-amber-700 border-amber-200"
                      )}>
                        {store.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      {store.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="h-8 rounded-full text-emerald-600 border-emerald-200 hover:bg-emerald-50" 
                                  onClick={() => handleAction(store.id, "active")}>
                            <Check className="h-3 w-3 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 rounded-full text-rose-600 border-rose-200 hover:bg-rose-50"
                                  onClick={() => handleAction(store.id, "rejected")}>
                            <X className="h-3 w-3 mr-1" /> Deny
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-slate-400 italic">
                    <Globe className="h-10 w-10 mx-auto mb-2 opacity-10" />
                    No retail partners found.
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