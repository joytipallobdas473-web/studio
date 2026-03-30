"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Lock, Loader2, ArrowLeft, ShieldAlert, Zap, Globe, AlertTriangle, Fingerprint, ShieldCheck } from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MASTER_ADMIN_UID = "j96izCkggNcL002AHiJjzGb18Bf2";

export default function AdminLoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isUserLoading && user) {
      const isAdmin = user.email?.toLowerCase().includes("admin") || user.uid === MASTER_ADMIN_UID;
      if (isAdmin) {
        router.push("/admin");
      } else {
        setError("Unauthorized Identity Signature.");
      }
    }
  }, [user, isUserLoading, router]);

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!auth) return;
    
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      const signedInUser = userCredential.user;
      
      const isAdmin = signedInUser.email?.toLowerCase().includes("admin") || signedInUser.uid === MASTER_ADMIN_UID;
      
      if (!isAdmin) {
        await signOut(auth);
        setIsLoading(false);
        setError("Access Denied: Unrecognized administrator signature.");
        return;
      }

      toast({ title: "Command Access Authorized" });
      router.push("/admin");
    } catch (error: any) {
      setIsLoading(false);
      setError("Security Authentication Failure.");
      toast({ title: "Authentication Failed", variant: "destructive" });
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Structural Decorative Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 blur-[120px] rounded-full" />
      
      <div className="w-full max-w-lg space-y-10 relative z-10 animate-in fade-in duration-700">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm mb-6">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Secure Node Protocol</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Command Terminal</h1>
          <div className="flex items-center justify-center gap-4">
             <div className="h-px w-8 bg-slate-200" />
             <div className="text-primary font-black text-[10px] uppercase tracking-[0.5em] flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Regional Access
             </div>
             <div className="h-px w-8 bg-slate-200" />
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-rose-50 border-rose-100 text-rose-600 rounded-2xl p-6 shadow-sm animate-in shake duration-500">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-black uppercase text-[10px] tracking-widest mb-1">Authorization Error</AlertTitle>
            <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-10 pb-0">
            <CardTitle className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Identity Sync</CardTitle>
            <CardDescription className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-wide">Enter Encrypted Controller Passkey</CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={handleAdminSignIn} className="space-y-8">
              <div className="space-y-3">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Admin Signature</Label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input 
                    type="email" 
                    placeholder="admin@protocol.io" 
                    className="pl-14 h-14 bg-slate-50 border-none rounded-2xl focus:ring-primary font-bold text-slate-900 placeholder:text-slate-300 text-sm" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Secure Passkey</Label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-14 h-14 bg-slate-50 border-none rounded-2xl focus:ring-primary font-bold text-slate-900 placeholder:text-slate-300" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-16 bg-primary text-white hover:bg-primary/90 hover:scale-[1.02] transition-all duration-300 font-black rounded-2xl shadow-lg shadow-primary/20 uppercase tracking-[0.2em] text-[10px]" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <div className="flex items-center gap-3">
                    <Fingerprint className="h-5 w-5" /> Authorize Node
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
          <div className="px-10 pb-10 text-center pt-8 bg-slate-50/50">
             <Link href="/login" className="text-[9px] text-slate-400 hover:text-primary transition-colors font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 group">
               <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" /> Switch to Branch Portal
             </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}