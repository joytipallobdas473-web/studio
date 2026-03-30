
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Lock, Loader2, ArrowLeft, ShieldAlert, Zap, Globe, AlertTriangle, Fingerprint } from "lucide-react";
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
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[150px] rounded-full" />
      
      <div className="w-full max-w-lg space-y-12 relative z-10 animate-in fade-in zoom-in duration-1000">
        <div className="text-center space-y-6">
          <div className="command-gradient p-6 rounded-[2.5rem] shadow-[0_0_50px_rgba(38,205,242,0.4)] inline-block mb-4">
            <ShieldAlert className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">Command Terminal</h1>
          <div className="text-accent font-black flex items-center justify-center gap-4 text-[11px] uppercase tracking-[0.6em]">
             <div className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
             Restricted Regional Access
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-rose-500/10 border-rose-500/30 text-rose-400 rounded-3xl p-8 shadow-2xl animate-in shake duration-500">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="font-black uppercase text-xs tracking-widest mb-2">Authorization Error</AlertTitle>
            <AlertDescription className="text-sm font-medium opacity-90">{error}</AlertDescription>
          </Alert>
        )}

        <Card className="glass-panel rounded-[3.5rem] p-4 overflow-hidden shadow-2xl">
          <CardHeader className="p-12 pb-0">
            <CardTitle className="text-2xl font-black text-white uppercase italic tracking-tighter">Identity Sync</CardTitle>
            <CardDescription className="text-muted-foreground/60 font-bold text-sm mt-2 uppercase tracking-wide">Enter Encrypted Controller Passkey</CardDescription>
          </CardHeader>
          <CardContent className="p-12">
            <form onSubmit={handleAdminSignIn} className="space-y-10">
              <div className="space-y-4">
                <Label className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/50 ml-1">Admin Signature</Label>
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-accent transition-colors" />
                  <Input 
                    type="email" 
                    placeholder="admin@hub.protocol" 
                    className="pl-16 h-20 bg-white/5 border-white/5 rounded-3xl focus:ring-accent font-black text-white placeholder:text-white/10 uppercase tracking-widest text-xs" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <Label className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/50 ml-1">Secure Passkey</Label>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-accent transition-colors" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-16 h-20 bg-white/5 border-white/5 rounded-3xl focus:ring-accent font-black text-white placeholder:text-white/10" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-20 command-gradient text-white hover:scale-105 transition-all duration-500 font-black rounded-3xl shadow-[0_0_40px_rgba(38,205,242,0.3)] uppercase tracking-[0.3em] text-[11px]" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <div className="flex items-center gap-4">
                    <Fingerprint className="h-6 w-6" /> Authorize Session
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
          <div className="px-12 pb-12 text-center border-t border-white/5 pt-8 bg-black/40">
             <Link href="/login" className="text-[11px] text-muted-foreground hover:text-accent transition-colors font-black uppercase tracking-widest flex items-center justify-center gap-3 group">
               <ArrowLeft className="h-4 w-4 group-hover:-translate-x-2 transition-transform" /> Switch to Branch Portal
             </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
