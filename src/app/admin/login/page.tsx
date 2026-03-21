
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Boxes, Mail, Lock, Loader2, ArrowLeft, ShieldAlert, Zap, Globe } from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { toast } from "@/hooks/use-toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    if (!auth) return;
    
    if (!email.toLowerCase().includes("admin")) {
      toast({
        title: "Access Denied",
        description: "Standard accounts cannot access the Command Portal.",
        variant: "destructive",
      });
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
      toast({
        title: "Security Authentication Failure",
        description: "Invalid admin credentials detected.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#020617]">
      <div className="w-full max-w-md space-y-8 animate-in fade-in duration-1000">
        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-black text-[10px] uppercase tracking-widest group">
          <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
          Abort to Selection
        </Link>

        <div className="text-center space-y-3">
          <div className="bg-primary p-4 rounded-[2rem] shadow-[0_0_50px_rgba(var(--primary),0.3)] inline-block mb-2">
            <ShieldAlert className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Command Portal</h1>
          <p className="text-slate-500 font-bold flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.4em]">
             <Globe className="h-3 w-3 text-accent animate-spin-slow" /> Regional Controller Console
          </p>
        </div>

        <Card className="border-white/5 bg-slate-900/50 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-2xl">
          <CardHeader className="p-10 pb-0">
            <CardTitle className="text-xl font-black text-primary uppercase italic tracking-tighter">Identity Protocol</CardTitle>
            <CardDescription className="text-slate-500 font-medium">Restricted access for North East regional administrators only.</CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={handleAdminSignIn} className="space-y-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Admin Signature</Label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                  <Input 
                    type="email" 
                    placeholder="admin@retail.com" 
                    className="pl-14 h-16 bg-black/40 border-white/5 rounded-2xl focus:ring-primary font-bold text-white placeholder:text-slate-700" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    <Zap className="h-5 w-5" /> Initialize Console Access
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="p-10 pt-0">
             <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 w-full">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                   SYSTEM ADVISORY
                </p>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  Unauthorized attempts to access the regional command grid are logged and reported to the NE Network Authority.
                </p>
             </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
