"use client";

import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, MapPin, User, Loader2, ShieldAlert, Store, Globe } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function StoreManagement() {
  const db = useFirestore();
  const { user } = useUser();
  
  const storesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "stores"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: stores, isLoading: loading, error } = useCollection(storesQuery);

  const handleAction = (id: string, newStatus: string) => {
    if (!db) return;
    const storeRef = doc(db, "stores", id);
    const updateData = { status: newStatus };
    
    updateDoc(storeRef, updateData)
      .then(() => {
        toast({ title: "Node Protocol Updated", description: `Registration marked as ${newStatus}.` });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: storeRef.path,
          operation: 'update',
          requestResourceData: updateData
        }));
      });
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12 bg-slate-900/40 rounded-[2rem] border border-slate-800 border-dashed animate-in zoom-in duration-500">
        <ShieldAlert className="h-16 w-16 text-rose-500 mb-6" />
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">ACCESS REFUSED</h2>
        <p className="text-slate-500 mb-8 max-w-sm text-sm font-medium">
          Root permissions are required to manage store nodes. Link your UID to the <code className="text-rose-400 font-mono">roles_admin</code> collection.
        </p>
        {user && (
          <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 w-full max-w-xs font-mono text-xs break-all mb-8 shadow-2xl">
            <span className="text-slate-600 block mb-2 font-sans font-bold uppercase tracking-widest text-[9px]">YOUR UNIQUE ROOT ID:</span>
            <span className="text-slate-300">AEGmDwRin2c5sDZdx1Jhk87yF9L2</span>
            <div className="mt-2 h-px bg-slate-800 w-full" />
            <span className="text-primary mt-2 block">{user.uid}</span>
          </div>
        )}
        <Button onClick={() => window.location.reload()} className="h-12 px-10 rounded-xl bg-primary font-bold">Re-verify Security</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase">RETAIL PARTNERS</h1>
        <p className="text-slate-500 font-medium text-sm">Managing branch node approvals and network expansion.</p>
      </div>

      <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-xl rounded-3xl overflow-hidden border shadow-2xl">
        <CardHeader className="border-b border-slate-800/50 p-8">
          <div className="flex items-center gap-4">
            <div className="bg-amber-500/10 p-2.5 rounded-xl">
              <Store className="h-6 w-6 text-amber-500" />
            </div>
            <CardTitle className="text-xl font-bold text-white tracking-tight">Deployment Queue</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-slate-800">
                <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest h-14 pl-8">Store Node</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest h-14">Lead Admin</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest h-14">Global Latency</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest h-14">Status</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest text-right pr-8 h-14">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores?.length ? (
                stores.map((store) => (
                  <TableRow key={store.id} className="border-slate-800/50 hover:bg-white/[0.02] transition-colors group">
                    <TableCell className="pl-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">{store.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">ID: {store.id.substring(0, 8)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                          {store.managerName ? store.managerName.substring(0, 1) : '?'}
                        </div>
                        <span className="text-xs font-medium text-slate-300">{store.managerName || 'ANON_USER'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="h-3 w-3 text-primary" />
                        {store.location || 'REMOTE'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest",
                        store.status === "active" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                        store.status === "rejected" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : 
                        "bg-slate-800 text-slate-400 border-slate-700"
                      )}>
                        {store.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      {store.status === "pending" && (
                        <div className="flex justify-end gap-3">
                          <Button size="sm" variant="outline" className="h-9 rounded-xl border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all font-bold px-4" 
                                  onClick={() => handleAction(store.id, "active")}>
                            <Check className="h-4 w-4 mr-2" /> Activate
                          </Button>
                          <Button size="sm" variant="outline" className="h-9 rounded-xl border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-bold px-4"
                                  onClick={() => handleAction(store.id, "rejected")}>
                            <X className="h-4 w-4 mr-2" /> Deny
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-32 text-slate-600">
                    <Globe className="h-12 w-12 mx-auto mb-4 opacity-10 animate-spin-slow" />
                    <p className="font-medium italic">Scanning for new retail nodes...</p>
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
