
"use client";

import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, updateDoc, query, orderBy, deleteDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, MapPin, Loader2, Store, Globe, Trash2, RotateCcw, ShieldAlert } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { deleteDocumentNonBlocking } from "@/firebase";
import { useMemo } from "react";

const MASTER_ADMIN_UID = "j96izCkggNcL002AHiJjzGb18Bf2";

export default function StoreManagement() {
  const db = useFirestore();
  const { user } = useUser();

  const isAdmin = useMemo(() => {
    return user?.email?.toLowerCase().includes("admin") || user?.uid === MASTER_ADMIN_UID;
  }, [user]);
  
  const storesQuery = useMemoFirebase(() => {
    if (!db || !user || !isAdmin) return null;
    return query(collection(db, "stores"), orderBy("createdAt", "desc"));
  }, [db, user, isAdmin]);

  const { data: stores, isLoading: loading } = useCollection(storesQuery);

  const handleAction = (id: string, newStatus: string) => {
    if (!db) return;
    const storeRef = doc(db, "stores", id);
    
    updateDoc(storeRef, { status: newStatus })
      .then(() => {
        toast({ 
          title: "Node Status Updated", 
          description: `Retail node ${id.substring(0, 5)} is now ${newStatus}.` 
        });
      })
      .catch((err) => {
        console.error(err);
        toast({ title: "Update Failed", variant: "destructive" });
      });
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    const storeRef = doc(db, "stores", id);
    deleteDocumentNonBlocking(storeRef);
    toast({ 
      title: "Node Purged", 
      description: "Branch registry has been permanently removed.",
      variant: "destructive" 
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-primary" />
             <span className="text-[10px] font-black tracking-[0.4em] text-primary uppercase">Network Registry</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Retail Partners</h1>
          <p className="text-muted-foreground text-sm font-medium">Manage and authorize regional branch nodes for the NE network.</p>
        </div>
      </div>

      <Card className="border-none glass-card rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/5 py-6 px-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-black uppercase italic tracking-tighter text-white">Branch Inventory</CardTitle>
            </div>
            <Badge variant="outline" className="font-bold text-[9px] uppercase tracking-widest text-muted-foreground border-white/10">
              {stores?.length || 0} Registered Nodes
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/5 h-16 border-white/5 hover:bg-transparent">
                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] pl-10 text-muted-foreground">Branch Identity</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Regional Location</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Contact Node</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Sync Status</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-right pr-10 text-muted-foreground">Command Protocol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores?.length ? (
                stores.map((store) => (
                  <TableRow key={store.id} className="hover:bg-white/5 group h-24 border-white/5">
                    <TableCell className="pl-10">
                      <div className="flex items-center gap-6">
                        <div className="relative h-14 w-14 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                          <img 
                            src={store.imageUrl || `https://picsum.photos/seed/${store.id}/100/100`} 
                            alt={store.name} 
                            className="h-full w-full object-cover" 
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-white text-sm uppercase italic">{store.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">ID: {store.id.substring(0, 8)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                        <MapPin className="h-3.5 w-3.5 text-accent" />
                        {store.location || 'North East Region'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                         <span className="text-xs font-bold text-white">{store.managerName || 'UNASSIGNED'}</span>
                         <span className="text-[10px] text-muted-foreground">{store.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "rounded-xl px-4 py-1 text-[9px] font-black uppercase tracking-widest border-none",
                        store.status === "active" ? "bg-emerald-500/10 text-emerald-500" : 
                        store.status === "rejected" ? "bg-rose-500/10 text-rose-500" : 
                        "bg-amber-500/10 text-amber-500"
                      )}>
                        {store.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        {store.status === "pending" ? (
                          <>
                            <Button size="sm" variant="outline" className="h-10 rounded-xl text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 font-bold text-[10px] uppercase tracking-widest px-4" 
                                    onClick={() => handleAction(store.id, "active")}>
                              <Check className="h-3 w-3 mr-2" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-10 rounded-xl text-rose-500 border-rose-500/20 hover:bg-rose-500/10 font-bold text-[10px] uppercase tracking-widest px-4"
                                    onClick={() => handleAction(store.id, "rejected")}>
                              <X className="h-3 w-3 mr-2" /> Deny
                            </Button>
                          </>
                        ) : store.status === "active" ? (
                          <Button size="sm" variant="outline" className="h-10 rounded-xl text-rose-500 border-rose-500/20 hover:bg-rose-500/10 font-bold text-[10px] uppercase tracking-widest px-4"
                                  onClick={() => handleAction(store.id, "rejected")}>
                            <ShieldAlert className="h-3 w-3 mr-2" /> Decommission
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="h-10 rounded-xl text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 font-bold text-[10px] uppercase tracking-widest px-4"
                                  onClick={() => handleAction(store.id, "active")}>
                            <RotateCcw className="h-3 w-3 mr-2" /> Restore Node
                          </Button>
                        )}
                        
                        <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-50/10"
                                onClick={() => handleDelete(store.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-40 text-muted-foreground italic border-none hover:bg-transparent">
                    <Globe className="h-20 w-20 mx-auto mb-6 opacity-5 animate-spin-slow" />
                    <p className="font-black uppercase tracking-[0.3em] text-[10px]">No regional partners registered.</p>
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
