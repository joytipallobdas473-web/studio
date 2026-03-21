"use client";

import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, MapPin, Loader2, ShieldAlert, Store, Globe, Key, UserCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { cn } from "@/lib/utils";

const ADMIN_OVERRIDES = ["AEGmDwRin2c5sDZdx1Jhk87yF9L2", "cKRTD1vPTOfID6XADH31VVpGYAU2"];

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
        toast({ title: "Protocol Applied", description: `Merchant node marked as ${newStatus}.` });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: storeRef.path,
          operation: 'update',
          requestResourceData: updateData
        }));
      });
  };

  const isExplicitAdmin = user && ADMIN_OVERRIDES.includes(user.uid);

  if (error && !isExplicitAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-16 bg-slate-950/50 rounded-[2.5rem] border border-white/5 space-y-12 animate-in zoom-in duration-700">
        <div className="relative">
          <div className="absolute inset-0 bg-rose-500/20 blur-[80px] rounded-full" />
          <ShieldAlert className="h-24 w-24 text-rose-500 relative" />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Permission Failure</h2>
          <p className="text-slate-500 max-w-lg mx-auto text-sm font-medium leading-relaxed">
            Administrative authority required to manage retail nodes. Deploy your identity to the secure administrative registry.
          </p>
        </div>
        {user && (
          <div className="p-10 bg-black/40 rounded-[2rem] border border-white/5 w-full max-w-md shadow-2xl font-mono">
            <span className="text-slate-600 block mb-4 font-sans font-black uppercase tracking-[0.3em] text-[10px]">Your System Root ID:</span>
            <span className="text-primary font-black text-sm block mb-6">{user.uid}</span>
            <div className="h-px bg-white/5 w-full mb-8" />
            <div className="flex flex-col items-start gap-4 text-[10px] text-slate-500 font-sans font-bold uppercase tracking-widest">
              <span className="flex items-center gap-3"><Key className="h-4 w-4 text-primary" /> 1. Provision 'roles_admin' collection</span>
              <span className="flex items-center gap-3"><Key className="h-4 w-4 text-primary" /> 2. Map current Root ID as Doc ID</span>
            </div>
          </div>
        )}
        <Button onClick={() => window.location.reload()} className="h-16 px-12 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-all">Re-validate Node</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
           <div className="h-2 w-2 rounded-full bg-primary" />
           <span className="text-[10px] font-black tracking-[0.4em] text-primary uppercase">Network Controller</span>
        </div>
        <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">Retail Partners</h1>
        <p className="text-slate-500 font-medium text-sm tracking-wide">Managing global branch node authorizations and expansion protocols.</p>
      </div>

      <Card className="border-white/5 bg-slate-950/30 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-2xl">
        <CardHeader className="border-b border-white/5 p-10 pt-12">
          <div className="flex items-center gap-5">
            <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
              <Store className="h-7 w-7 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black text-white tracking-tight uppercase italic">Authorization Queue</CardTitle>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Pending node verification requests</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5 h-20">
                <TableHead className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em] pl-10">Store Node Entity</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em]">Lead Administrator</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em]">Geo-Location</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em]">Protocol Status</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em] text-right pr-10">Decision</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores?.length ? (
                stores.map((store) => (
                  <TableRow key={store.id} className="border-white/5 hover:bg-white/[0.03] transition-all group h-24">
                    <TableCell className="pl-10">
                      <div className="flex flex-col gap-1">
                        <span className="font-black text-white text-sm uppercase tracking-tight italic">{store.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">NODE_ID: {store.id.substring(0, 10).toUpperCase()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-xs font-black text-primary">
                          {store.managerName ? store.managerName.substring(0, 1).toUpperCase() : '?'}
                        </div>
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-tight">{store.managerName || 'ANON_NODE'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <MapPin className="h-4 w-4 text-primary" />
                        {store.location || 'GLOBAL_EDGE'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "rounded-xl px-4 py-1 text-[9px] font-black uppercase tracking-[0.2em] shadow-xl",
                        store.status === "active" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/5" : 
                        store.status === "rejected" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : 
                        "bg-slate-900 text-slate-500 border-white/5"
                      )}>
                        {store.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      {store.status === "pending" && (
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <Button size="sm" variant="outline" className="h-11 rounded-xl border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all font-black uppercase tracking-widest text-[9px] px-6" 
                                  onClick={() => handleAction(store.id, "active")}>
                            <UserCheck className="h-4 w-4 mr-3" /> Authorize
                          </Button>
                          <Button size="sm" variant="outline" className="h-11 rounded-xl border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-black uppercase tracking-widest text-[9px] px-6"
                                  onClick={() => handleAction(store.id, "rejected")}>
                            <X className="h-4 w-4 mr-3" /> Deny
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-40 text-slate-600">
                    <Globe className="h-20 w-20 mx-auto mb-6 opacity-5 animate-spin-slow" />
                    <p className="font-black uppercase tracking-[0.3em] text-xs italic">Scanning for new retail infrastructure nodes...</p>
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
