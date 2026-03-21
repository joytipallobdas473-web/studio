"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Package, User, ShieldCheck, Loader2, Globe, Cpu, Zap } from "lucide-react";
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
        title: "Protocol Synchronized",
        description: `Accessing ${role === 'admin' ? 'Root Administrator' : 'Branch Node'} profile.`,
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
      <div className="min-h-screen flex items-center justify-center bg-[#02040a]">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#02040a] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#1e293b,transparent)] opacity-40 pointer-events-none" />
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="mb-16 flex flex-col items-center animate-in fade-in slide-in-from-top-8 duration-1000">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
          <div className="relative bg-slate-900 border border-white/10 p-5 rounded-[2rem] shadow-2xl">
            <Cpu className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic text-glow">Retail OS</h1>
        <div className="flex items-center gap-3 mt-4">
          <Globe className="h-3 w-3 text-primary animate-pulse" />
          <span className="text-[10px] font-black tracking-[0.4em] text-slate-500 uppercase">Global Infrastructure Hub</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl animate-in zoom-in duration-700">
        <Card onClick={() => handleLogin("retailer")} className="group cursor-pointer border-white/5 bg-white/[0.02] backdrop-blur-3xl rounded-[2.5rem] hover:bg-white/[0.05] hover:scale-[1.02] transition-all duration-500 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-10 flex flex-col items-center text-center space-y-6">
            <div className="bg-primary/10 p-5 rounded-3xl text-primary group-hover:scale-110 transition-transform duration-500">
              <Package className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Branch Portal</h2>
              <p className="text-slate-500 text-sm mt-2 font-medium">Regional inventory management and stock telemetry.</p>
            </div>
            <Badge variant="outline" className="bg-black/40 border-white/5 text-[9px] font-black tracking-widest uppercase py-1 px-4 text-slate-400">Merchant Access</Badge>
          </CardContent>
        </Card>

        <Card onClick={() => handleLogin("admin")} className="group cursor-pointer border-white/5 bg-slate-950/50 backdrop-blur-3xl rounded-[2.5rem] hover:bg-slate-900/50 hover:scale-[1.02] transition-all duration-500 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-10 flex flex-col items-center text-center space-y-6">
            <div className="bg-blue-500/10 p-5 rounded-3xl text-blue-400 group-hover:scale-110 transition-transform duration-500">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Control Center</h2>
              <p className="text-slate-500 text-sm mt-2 font-medium">Root-level system orchestration and AI synthesis.</p>
            </div>
            <Badge className="bg-blue-500/20 text-blue-400 border-none text-[9px] font-black tracking-widest uppercase py-1 px-4">Admin privileges</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="mt-16 text-[10px] font-bold text-slate-700 uppercase tracking-[0.5em] animate-pulse">
        System Operational | Syncing Global Nodes
      </div>
    </div>
  );
}