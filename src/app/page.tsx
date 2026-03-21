"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  ShieldCheck, 
  Loader2, 
  MapPin, 
  ArrowRight, 
  Network, 
  Globe2,
  Boxes
} from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { signInAnonymously } from "firebase/auth";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const auth = useAuth();
  const { isUserLoading } = useUser();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleLogin = async (role: "retailer" | "admin") => {
    setIsLoading(role);
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      toast({
        title: "Access Granted",
        description: `Redirecting to the ${role === 'admin' ? 'Regional Hub' : 'Retailer Portal'}.`,
      });
      router.push(role === "admin" ? "/admin" : "/dashboard");
    } catch (error: any) {
      toast({ 
        title: "Network Error", 
        description: "Failed to establish a secure link with the regional mesh.", 
        variant: "destructive" 
      });
      setIsLoading(null);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ECF0F5]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40">Synchronizing Mesh</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#ECF0F5] font-body relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]" />
      </div>

      <div className="mb-16 flex flex-col items-center text-center relative z-10">
        <div className="relative mb-8">
           <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse" />
           <div className="bg-primary p-5 rounded-[2rem] shadow-2xl relative">
              <Boxes className="h-12 w-12 text-white" />
           </div>
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
          NE Retail <span className="text-primary">Connect</span>
        </h1>
        <div className="flex items-center gap-3 mt-4 px-6 py-2 bg-white/50 backdrop-blur-md rounded-full border border-white/20 shadow-sm">
          <MapPin className="h-4 w-4 text-accent" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">North East Logistics Infrastructure</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl relative z-10">
        {/* Retailer Entry */}
        <Card 
          onClick={() => handleLogin("retailer")} 
          className="group cursor-pointer hover:translate-y-[-8px] transition-all duration-500 border-none shadow-[0_20px_40px_rgba(0,0,0,0.05)] rounded-[3rem] bg-white overflow-hidden"
        >
          <CardContent className="p-12 flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full scale-125 group-hover:scale-150 transition-transform duration-500" />
              <div className="bg-slate-50 p-6 rounded-3xl text-accent group-hover:bg-accent group-hover:text-white transition-all duration-500 relative">
                <Package className="h-10 w-10" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800 uppercase italic">Partner Portal</h2>
              <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[200px]">
                Direct channel for stock procurement and regional delivery tracking.
              </p>
            </div>
            <Button 
              className={cn(
                "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all",
                isLoading === "retailer" ? "bg-slate-100 text-slate-400" : "bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20"
              )}
              disabled={!!isLoading}
            >
              {isLoading === "retailer" ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>Enter Portal <ArrowRight className="ml-3 h-4 w-4" /></>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Admin Entry */}
        <Card 
          onClick={() => handleLogin("admin")} 
          className="group cursor-pointer hover:translate-y-[-8px] transition-all duration-500 border-none shadow-[0_20px_40px_rgba(0,0,0,0.05)] rounded-[3rem] bg-white overflow-hidden"
        >
          <CardContent className="p-12 flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-125 group-hover:scale-150 transition-transform duration-500" />
              <div className="bg-slate-50 p-6 rounded-3xl text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 relative">
                <ShieldCheck className="h-10 w-10" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800 uppercase italic">Regional Hub</h2>
              <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[200px]">
                Authorized access for network orchestration and supply-chain oversight.
              </p>
            </div>
            <Button 
              className={cn(
                "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all",
                isLoading === "admin" ? "bg-slate-100 text-slate-400" : "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
              )}
              disabled={!!isLoading}
            >
              {isLoading === "admin" ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>Control Center <ArrowRight className="ml-3 h-4 w-4" /></>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <footer className="mt-20 flex flex-col items-center gap-6 relative z-10">
        <div className="flex items-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all cursor-default">
           <Network className="h-6 w-6" />
           <div className="h-4 w-px bg-slate-300" />
           <Globe2 className="h-6 w-6" />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">
          North East Logistics Mesh • v2.0
        </p>
      </footer>
    </div>
  );
}
