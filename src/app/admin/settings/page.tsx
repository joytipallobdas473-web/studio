"use client";

import { useState } from "react";
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { updatePassword } from "firebase/auth";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ShieldCheck, Loader2, AlertTriangle, KeyRound, Fingerprint, Copy, Check, UserPlus, Trash2, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const MASTER_ADMIN_UID = "j96izCkggNcL002AHiJjzGb18Bf2";

export default function AdminSettings() {
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uidCopied, setUidCopied] = useState(false);

  // Identity Whitelisting State
  const [newAdminUid, setNewAdminUid] = useState("");
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  const isMasterAdmin = user?.uid === MASTER_ADMIN_UID;

  const rolesQuery = useMemoFirebase(() => {
    if (!db || !isMasterAdmin) return null;
    return collection(db, "roles_admin");
  }, [db, isMasterAdmin]);

  const { data: adminRoles, isLoading: rolesLoading } = useCollection(rolesQuery);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passkeys do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Security protocol requires at least 6 characters.");
      return;
    }

    setIsLoading(true);
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setError("Authentication node not found.");
      setIsLoading(false);
      return;
    }

    try {
      await updatePassword(currentUser, newPassword);
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Security Protocol Updated", description: "Admin passkey successfully rotated." });
    } catch (err: any) {
      if (err.code === "auth/requires-recent-login") {
        setError("Security Timeout: Please logout and sign back in to authorize passkey rotation.");
      } else {
        setError("Transmission Failure: Could not update security credentials.");
      }
      toast({ title: "Update Failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhitelistAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !newAdminUid.trim()) return;

    setIsAddingAdmin(true);
    try {
      const roleRef = doc(db, "roles_admin", newAdminUid.trim());
      await setDoc(roleRef, { 
        uid: newAdminUid.trim(), 
        role: "regional",
        addedAt: new Date().toISOString()
      });
      setNewAdminUid("");
      toast({ title: "Authority Provisioned", description: "New regional controller whitelisted." });
    } catch (err) {
      toast({ title: "Authorization Refused", variant: "destructive" });
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRevokeAdmin = async (uid: string) => {
    if (!db || uid === MASTER_ADMIN_UID) return;
    try {
      await deleteDoc(doc(db, "roles_admin", uid));
      toast({ title: "Authority Revoked", description: "Identity signature purged from grid." });
    } catch (err) {
      toast({ title: "Action Blocked", variant: "destructive" });
    }
  };

  const copyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setUidCopied(true);
      toast({ title: "Admin UID Copied" });
      setTimeout(() => setUidCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-[10px] font-black tracking-[0.4em] text-primary uppercase">Security Core</span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">Grid Settings</h1>
        <p className="text-muted-foreground font-medium text-sm tracking-wide">Orchestrate regional controller identities and secure protocols.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {isMasterAdmin && (
            <Card className="border-none shadow-sm rounded-[2.5rem] glass-card overflow-hidden">
              <CardHeader className="p-10 pb-6 bg-white/5">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-2xl">
                    <UserPlus className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black uppercase italic tracking-tighter text-white">Identity Whitelist</CardTitle>
                    <CardDescription className="text-xs font-medium text-muted-foreground">Authorize secondary regional controllers via UID.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                <form onSubmit={handleWhitelistAdmin} className="flex gap-4">
                  <Input 
                    placeholder="Enter Admin UID..." 
                    className="h-14 bg-white/5 border-white/10 rounded-2xl text-white font-mono"
                    value={newAdminUid}
                    onChange={(e) => setNewAdminUid(e.target.value)}
                    required
                  />
                  <Button type="submit" className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest" disabled={isAddingAdmin}>
                    {isAddingAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : "Whitelist"}
                  </Button>
                </form>

                <div className="rounded-2xl border border-white/5 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5 h-12 hover:bg-transparent">
                        <TableHead className="text-[9px] font-black uppercase tracking-widest pl-6">Signature</TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-widest">Authority</TableHead>
                        <TableHead className="text-right pr-6"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminRoles?.map((role) => (
                        <TableRow key={role.id} className="border-white/5 h-14 hover:bg-white/5 transition-colors group">
                          <TableCell className="pl-6 font-mono text-[10px] text-muted-foreground">{role.uid}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[8px] uppercase font-black px-2 py-0.5 border-white/10 text-primary">
                              {role.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRevokeAdmin(role.uid)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-sm rounded-[2.5rem] glass-card overflow-hidden">
            <CardHeader className="p-10 pb-6 bg-white/5">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-2xl">
                  <KeyRound className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-black uppercase italic tracking-tighter text-white">Credential Rotation</CardTitle>
                  <CardDescription className="text-xs font-medium text-muted-foreground">Update the primary passkey for this controller node.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              {error && (
                <Alert variant="destructive" className="rounded-2xl border-rose-500/20 bg-rose-500/10 text-rose-500">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="text-[10px] font-black uppercase tracking-widest">Protocol Alert</AlertTitle>
                  <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground pl-1">New Regional Passkey</Label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-14 h-14 bg-white/5 border-none rounded-2xl focus:ring-primary font-bold text-white"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground pl-1">Confirm Identity</Label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-14 h-14 bg-white/5 border-none rounded-2xl focus:ring-primary font-bold text-white"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-16 rounded-2xl bg-primary text-background font-black shadow-lg hover:scale-105 transition-all uppercase tracking-widest text-xs"
                >
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Commit Rotation"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm rounded-[2.5rem] glass-card overflow-hidden">
            <CardHeader className="p-8 pb-4 bg-white/5">
              <div className="flex items-center gap-3">
                <Fingerprint className="h-5 w-5 text-primary" />
                <CardTitle className="text-[11px] font-black uppercase tracking-widest text-white">Identity Signature</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
               <div className="relative group">
                  <div className="text-[10px] text-muted-foreground font-mono break-all bg-black/40 p-5 rounded-[1.5rem] border border-white/5 pr-14 shadow-xl">
                    {user?.uid || "INITIALIZING..."}
                  </div>
                  <Button size="icon" variant="ghost" className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 text-muted-foreground hover:text-white" onClick={copyUid}>
                    {uidCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest px-2 italic leading-relaxed">
                  Unique controller ID. Required for whitelisting secondary regional nodes.
                </p>
            </CardContent>
          </Card>

          <Card className="border-none rounded-[2rem] bg-amber-500/5 border border-amber-500/10 p-8 space-y-4">
             <div className="flex items-center gap-3 text-amber-500">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Master Protocol</span>
             </div>
             <p className="text-[11px] font-medium text-amber-500/80 leading-relaxed">
               As the Master Admin, you have global override authority. Whitelisting new regional controllers grants them visibility into all grid telemetry.
             </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
