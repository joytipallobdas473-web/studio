"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/firebase";
import { 
  Loader2, 
  Store, 
  ChevronRight, 
  Globe, 
  Activity,
  Cpu,
  Layers,
  ShieldCheck,
  Star,
  Terminal
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MASTER_ADMIN_UID = "j96izCkggNcL002AHiJjzGb18Bf2";

export default function EntryGateway() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      setIsRedirecting(true);
      const isAdmin = user.email?.toLowerCase().includes("admin") || user.uid === MASTER_ADMIN_UID;
      router.push(isAdmin ? "/admin" : "/dashboard");
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="flex flex-col items-center gap-8">
          <div className="bg-primary/5 p-12 rounded-full animate-pulse border border-primary/20">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[1.2em] text-primary/40">Synchronizing Neural Link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Cinematic Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_90%_90%_at_50%_0%,#000_60%,transparent_100%)] opacity-30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/10 blur-[150px] rounded-full opacity-40" />
      
      <div className="w-full max-w-7xl space-y-24 relative z-10 animate-in fade-in slide-in-from-bottom-20 duration-1000">
        <div className="text-center space-y-12">
          <div className="inline-flex items-center gap-5 px-8 py-3 glass-card rounded-full border-primary/30 mb-6 bg-primary/5 shadow-2xl">
             <Star className="h-3 w-3 text-primary animate-pulse fill-primary" />
             <span className="text-[11px] font-black uppercase tracking-[0.8em] text-primary">Aether Logistics Grid v3.0 Alpha</span>
          </div>
          <h1 className="text-8xl md:text-[12rem] font-black text-white tracking-tighter uppercase italic leading-[0.75]">
            Regional <br /> <span className="text-primary drop-shadow-[0_0_50px_rgba(15,50,45,0.6)]">Grid</span>
          </h1>
          <div className="flex items-center justify-center gap-12">
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <p className="text-[12px] font-black text-slate-500 uppercase tracking-[1em] flex items-center gap-6">
              <Globe className="h-5 w-5 text-primary" /> Multi-Node Gateway
            </p>
            <div className="h-px w-32 bg-gradient-to-l from-transparent via-primary/30 to-transparent" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 px-4">
          {/* PRIMARY: Boutique Portal */}
          <Link href="/login" className="group">
            <Card className="h-full glass-card border-none rounded-[4rem] overflow-hidden group-hover:scale-[1.03] group-hover:shadow-[0_40px_100px_rgba(15,50,45,0.25)] transition-all duration-700 bg-white/5 backdrop-blur-3xl relative">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-transparent to-transparent opacity-50" />
              <CardContent className="p-20 space-y-16">
                <div className="flex justify-between items-start">
                  <div className="bg-primary/10 p-10 rounded-[3rem] border border-primary/20 group-hover:rotate-6 transition-transform duration-700 shadow-2xl">
                    <Store className="h-14 w-14 text-primary" />
                  </div>
                  <Badge className="bg-white/5 text-primary border-primary/30 font-black text-[10px] uppercase tracking-[0.5em] px-8 py-3 rounded-full">Protocol: Boutique</Badge>
                </div>
                <div className="space-y-8">
                  <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none">Boutique Portal</h2>
                  <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-sm">Elite node synchronization and premium reorder telemetry for high-end retail clusters.</p>
                </div>
                <div className="flex items-center gap-6 text-primary font-black uppercase tracking-[0.5em] text-[12px] pt-12 group-hover:translate-x-8 transition-all">
                  Initialize Silk Link <ChevronRight className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* SECONDARY: Admin Console */}
          <Link href="/admin/login" className="group">
            <Card className="h-full bg-primary text-primary-foreground rounded-[4rem] shadow-[0_40px_120px_rgba(15,50,45,0.4)] overflow-hidden group-hover:scale-[1.03] transition-all duration-700 relative border-none">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)] pointer-events-none" />
              <div className="absolute top-0 left-0 w-full h-1.5 bg-white/20" />
              <CardContent className="p-20 space-y-16 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="bg-white/20 p-10 rounded-[3rem] border border-white/40 group-hover:-rotate-6 transition-transform duration-700 shadow-2xl">
                    <Terminal className="h-14 w-14 text-white" />
                  </div>
                  <Badge className="bg-white/20 text-white border-white/40 font-black text-[10px] uppercase tracking-[0.5em] px-8 py-3 rounded-full">Protocol: Master</Badge>
                </div>
                <div className="space-y-8">
                  <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none">Command Deck</h2>
                  <p className="text-white/80 text-lg font-medium leading-relaxed max-w-sm">Regional grid orchestration, global telemetry override, and Master Admin protocols.</p>
                </div>
                <div className="flex items-center gap-6 text-white font-black uppercase tracking-[0.5em] text-[12px] pt-12 group-hover:translate-x-8 transition-all">
                  Access Neural Hub <ChevronRight className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="text-center pt-24 pb-12">
           <div className="inline-flex items-center gap-16 px-16 py-6 glass-card rounded-full border-white/5 bg-white/5 backdrop-blur-3xl shadow-2xl">
             <div className="flex items-center gap-4">
               <Activity className="h-5 w-5 text-emerald-500" />
               <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500">Nodes Synchronized</span>
             </div>
             <div className="h-6 w-px bg-white/10" />
             <div className="flex items-center gap-4">
               <ShieldCheck className="h-5 w-5 text-primary" />
               <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500">Signature Verified</span>
             </div>
             <div className="h-6 w-px bg-white/10" />
             <div className="flex items-center gap-4">
               <Layers className="h-5 w-5 text-primary/60" />
               <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500">Grid Optimal</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}