
"use client";

import { useState } from "react";
import { useAuth, useUser } from "@/firebase";
import { updatePassword } from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ShieldCheck, Loader2, AlertTriangle, KeyRound, Fingerprint, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminSettings() {
  const auth = useAuth();
  const { user } = useUser();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uidCopied, setUidCopied] = useState(false);

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
      toast({
        title: "Security Protocol Updated",
        description: "Admin passkey has been successfully rotated.",
      });
    } catch (err: any) {
      if (err.code === "auth/requires-recent-login") {
        setError("Security Timeout: Please logout and sign back in to authorize passkey rotation.");
      } else {
        setError("Transmission Failure: Could not update security credentials.");
      }
      toast({
        title: "Update Failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setUidCopied(true);
      toast({ title: "Admin UID Copied", description: "Identity signature saved to clipboard." });
      setTimeout(() => setUidCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-[10px] font-black tracking-[0.4em] text-primary uppercase">Security Core</span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">Admin Settings</h1>
        <p className="text-slate-500 font-medium text-sm tracking-wide">Configure regional controller credentials and security protocols.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-10 pb-6 bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-2xl">
                <Fingerprint className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-black uppercase italic tracking-tighter text-slate-900">Controller Identity</CardTitle>
                <CardDescription className="text-xs font-medium">Your unique regional identifier (UID).</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-4">
             <div className="relative group">
                <div className="text-[11px] text-slate-400 font-mono break-all bg-slate-900 text-slate-300 p-6 rounded-[1.5rem] border border-white/5 pr-16 shadow-xl">
                  {user?.uid || "INITIALIZING..."}
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 text-slate-500 hover:text-white hover:bg-white/10"
                  onClick={copyUid}
                >
                  {uidCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2 italic">
                Use this signature for technical support or security rule configuration.
              </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-10 pb-6 bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-2xl">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-black uppercase italic tracking-tighter text-slate-900">Credential Rotation</CardTitle>
                <CardDescription className="text-xs font-medium">Update the primary passkey for this controller node.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            {error && (
              <Alert variant="destructive" className="rounded-2xl border-rose-100 bg-rose-50 text-rose-600">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-[10px] font-black uppercase tracking-widest">Protocol Alert</AlertTitle>
                <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 pl-1">New Regional Passkey</Label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-14 h-14 bg-slate-50 border-none rounded-2xl focus:ring-primary font-bold text-slate-900"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 pl-1">Confirm Identity</Label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-14 h-14 bg-slate-50 border-none rounded-2xl focus:ring-primary font-bold text-slate-900"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-16 rounded-2xl bg-primary text-white font-black shadow-lg hover:scale-105 transition-all uppercase tracking-widest text-xs"
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="mr-3 h-5 w-5" /> Commit Rotation
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="p-10 pt-0 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
              Note: Passkey rotation is restricted to the current active session. <br />
              Ensure you are logged into a verified controller account.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
