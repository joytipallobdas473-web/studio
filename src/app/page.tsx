"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Package, ShieldCheck, Loader2, Map, Mountain, Zap } from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { signInAnonymously } from "firebase/auth";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const router = useRouter();
  const auth = useAuth();
  const { user, loading: userLoading } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (role: "retailer" | "admin") => {
    setIsLoading(true);
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      toast({
        title: "Grid Authorization",
        description: `Establishing link to ${role === 'admin' ? 'Regional Command' : 'Branch Node'}.`,
      });
      router.push(role === "admin" ? "/admin" : "/dashboard");
    } catch (error: any) {
      toast({ 
        title: "Auth Failure", 
        description: "Secure session could not be established.", 
        variant: "destructive" 
      });
      setIsLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background ne-gradient-bg relative overflow-hidden font-body">
      <div className="mb-20 flex flex-col items-center animate-in fade-in slide-in-from-top-8 duration-1000">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
          <div className="relative bg-white border border-primary/10 p-6 rounded-[2.5rem] shadow-2xl">
            <Mountain className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-6xl font-black tracking-tighter text-primary uppercase italic text-glow">NE Retail Connect</h1>
        <div className="flex items-center gap-4 mt-6">
          <div className="h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" />
          <span className="text-[10px] font-black tracking-[0.5em] text-muted-foreground uppercase">North East Regional Logistics Grid</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-4xl animate-in zoom-in duration-700">
        <Card onClick={() => handleLogin("retailer")} className="group cursor-pointer border-white glass-card rounded-[3rem] hover:scale-[1.03] transition-all duration-500 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-12 flex flex-col items-center text-center space-y-8">
            <div className="bg-secondary p-6 rounded-[2rem] text-primary group-hover:scale-110 transition-transform duration-500 shadow-sm border border-primary/5">
              <Package className="h-12 w-12" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-primary uppercase italic tracking-tight">Branch Node</h2>
              <p className="text-muted-foreground text-sm mt-3 font-medium">Local inventory telemetry for regional outlets.</p>
            </div>
            <Badge variant="outline" className="bg-white/50 border-primary/10 text-[9px] font-black tracking-[0.4em] uppercase py-1.5 px-6 text-primary">Partner Access</Badge>
          </CardContent>
        </Card>

        <Card onClick={() => handleLogin("admin")} className="group cursor-pointer border-primary/10 bg-primary text-white rounded-[3rem] hover:scale-[1.03] transition-all duration-500 overflow-hidden relative shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-12 flex flex-col items-center text-center space-y-8">
            <div className="bg-white/10 p-6 rounded-[2rem] text-accent group-hover:scale-110 transition-transform duration-500 shadow-lg backdrop-blur-md">
              <ShieldCheck className="h-12 w-12" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Regional Root</h2>
              <p className="text-white/70 text-sm mt-3 font-medium">Network oversight and predictive grid control.</p>
            </div>
            <Badge className="bg-accent text-primary border-none text-[9px] font-black tracking-[0.4em] uppercase py-1.5 px-6">Command Privileges</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="mt-20 flex items-center gap-6 text-[10px] font-black text-primary/30 uppercase tracking-[0.5em] animate-pulse">
        <Zap className="h-4 w-4" /> Regional Mesh Nominal | Sector 7 Active
      </div>
    </div>
  );
}