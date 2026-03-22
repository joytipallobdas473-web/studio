
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Lock, Loader2, ArrowLeft, ShieldAlert, Zap, Globe, AlertTriangle } from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
      const isAdmin = user.email?.toLowerCase().includes("admin");
      if (isAdmin) {
        router.push("/admin");
      }
    }
  }, [user, isUserLoading, router]);

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!auth) return;
    
    // Strict Admin Keyword Protocol check for login
    if (!email.toLowerCase().includes("admin")) {
      toast({
        title: "Access Denied",
        description: "Branch accounts cannot access the Command Portal. Use a regional admin signature.",
        variant: "destructive",
      });
      setError("Unauthorized signature. Administrator credentials required.");
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Command Access Authorized",
        description: "Synchronizing regional telemetry...",
      });
    } catch (error: any) {
      setIsLoading(false);
      const isAuthError = error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email';
      
      setError(isAuthError ? "Identity not recognized. Please ensure your administrator account is registered." : "Security Authentication Failure.");
      
      toast({
        title: "Authentication Failed",
        description: "Invalid credentials or unregistered node.",
        variant: "destructive",
      });
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#020617]">
      <div className="w-full max-w-md space-y-8 animate-in fade-in duration-1000">
        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-black text-[10px] uppercase tracking-widest group">
          <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
          Abort to Selection
        </Link>

        <div className="text-center space-y-3">
          <div className="bg-primary p-4 rounded-[2rem] shadow-xl inline-block mb-2">
            <ShieldAlert className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Command Portal</h1>
          <p className="text-slate-500 font-bold flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.4em]">
             <Globe className="h-3 w-3 text-accent animate-spin-slow" /> Regional Controller Console
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-rose-500/10 border-rose-500/20 text-rose-500 rounded-3xl p-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-black uppercase text-[10px] tracking-widest mb-1">Authorization Error</AlertTitle>
            <AlertDescription className="text-xs font-medium opacity-90">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-white/5 bg-slate-900/50 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-2xl">
          <CardHeader className="p-10 pb-0">
            <CardTitle className="text-xl font-black text-primary uppercase italic tracking-tighter">Controller Identity</CardTitle>
            <CardDescription className="text-slate-500 font-medium">Restricted access for North East regional administrators.</CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={handleAdminSignIn} className="space-y-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1 text-primary">Admin Signature (Email)</Label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                  <Input 
                    type="email" 
                    placeholder="admin@retail.com" 
                    className="pl-14 h-16 bg-black/40 border-white/5 rounded-2xl focus:ring-primary font-bold text-white placeholder:text-slate-700" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(email.toLowerCase())}
                    onInput={(e: any) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Secure Passkey</Label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-14 h-16 bg-black/40 border-white/5 rounded-2xl focus:ring-primary font-bold text-white" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-16 bg-primary text-white hover:bg-white hover:text-primary font-black rounded-2xl shadow-2xl group uppercase tracking-[0.2em] text-xs transition-all duration-500" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5" /> Initialize Access
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
          <div className="p-10 pt-0 text-center space-y-4">
            <p className="text-[11px] text-slate-600 font-medium italic">
              Unrecognized identity? Administrator nodes must be pre-registered by the network owner.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
