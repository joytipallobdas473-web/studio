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
  ShieldCheck
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="bg-primary/10 p-10 rounded-full animate-pulse border border-primary/20">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[1em] text-primary/60">Initializing Neural Link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Cinematic Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full opacity-50" />
      
      <div className="w-full max-w-6xl space-y-20 relative z-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
        <div className="text-center space-y-10">
          <div className="inline-flex items-center gap-4 px-6 py-2 glass-card rounded-full border-primary/30 mb-4 bg-primary/5">
             <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
             <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Aether Logistics Grid v3.0 Alpha</span>
          </div>
          <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter uppercase italic leading-[0.8]">
            Regional <br /> <span className="text-primary drop-shadow-[0_0_30px_rgba(6,182,212,0.4)]">Grid</span>
          </h1>
          <div className="flex items-center justify-center gap-8">
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.8em] flex items-center gap-4">
              <Globe className="h-4 w-4 text-primary" /> Multi-Node Gateway
            </p>
            <div className="h-px w-24 bg-gradient-to-l from-transparent via-primary/40 to-transparent" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* PRIMARY: Branch Portal */}
          <Link href="/login" className="group">
            <Card className="h-full glass-card border-none rounded-[3rem] overflow-hidden group-hover:scale-[1.02] group-hover:border-primary/40 group-hover:shadow-[0_0_80px_rgba(6,182,212,0.2)] transition-all duration-700 bg-[#0c1122]/60">
              <CardContent className="p-16 space-y-12">
                <div className="flex justify-between items-start">
                  <div className="bg-primary/10 p-8 rounded-[2.5rem] border border-primary/30 group-hover:rotate-6 transition-transform duration-700">
                    <Store className="h-12 w-12 text-primary" />
                  </div>
                  <Badge className="bg-white/5 text-primary border-primary/30 font-black text-[9px] uppercase tracking-[0.3em] px-5 py-2 rounded-full">Protocol: Branch</Badge>
                </div>
                <div className="space-y-6">
                  <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">Branch Portal</h2>
                  <p className="text-slate-400 text-base font-medium leading-relaxed max-w-sm">Secure node synchronization and reorder telemetry for localized retail clusters.</p>
                </div>
                <div className="flex items-center gap-4 text-primary font-black uppercase tracking-[0.4em] text-[11px] pt-8 group-hover:translate-x-6 transition-all">
                  Initialize Sync <ChevronRight className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* SECONDARY: Admin Console */}
          <Link href="/admin/login" className="group">
            <Card className="h-full bg-primary text-primary-foreground rounded-[3rem] shadow-[0_30px_100px_rgba(6,182,212,0.3)] overflow-hidden group-hover:scale-[1.02] transition-all duration-700 relative border-none">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)] pointer-events-none" />
              <CardContent className="p-16 space-y-12 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="bg-white/20 p-8 rounded-[2.5rem] border border-white/40 group-hover:-rotate-6 transition-transform duration-700">
                    <Cpu className="h-12 w-12 text-white" />
                  </div>
                  <Badge className="bg-white/20 text-white border-white/40 font-black text-[9px] uppercase tracking-[0.3em] px-5 py-2 rounded-full">Protocol: Master</Badge>
                </div>
                <div className="space-y-6">
                  <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">Command Deck</h2>
                  <p className="text-white/80 text-base font-medium leading-relaxed max-w-sm">Regional grid orchestration, SKU density monitoring, and global telemetry override.</p>
                </div>
                <div className="flex items-center gap-4 text-white font-black uppercase tracking-[0.4em] text-[11px] pt-8 group-hover:translate-x-6 transition-all">
                  Access Grid <ChevronRight className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="text-center pt-20">
           <div className="inline-flex items-center gap-10 px-10 py-4 glass-card rounded-full border-white/5 bg-white/5">
             <div className="flex items-center gap-3">
               <Activity className="h-4 w-4 text-emerald-500" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Nodes Active</span>
             </div>
             <div className="h-4 w-px bg-white/10" />
             <div className="flex items-center gap-3">
               <ShieldCheck className="h-4 w-4 text-primary" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Encryption Verified</span>
             </div>
             <div className="h-4 w-px bg-white/10" />
             <div className="flex items-center gap-3">
               <Layers className="h-4 w-4 text-accent" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Grid Stable</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}