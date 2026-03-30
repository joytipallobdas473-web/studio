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
          <div className="bg-primary/10 p-8 rounded-full animate-pulse border border-primary/20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.8em] text-primary/60">Initializing Neural Link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* NextGen Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="w-full max-w-5xl space-y-16 relative z-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-4 px-6 py-2 glass-card rounded-full border-primary/20 mb-4">
             <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
             <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Global Logistics v3.0 Alpha</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase italic leading-[0.85]">
            Aether <br /> <span className="text-primary drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]">Network</span>
          </h1>
          <div className="flex items-center justify-center gap-6">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary/30" />
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.8em] flex items-center gap-3">
              <Globe className="h-4 w-4 text-primary" /> Multi-Node Gateway
            </p>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary/30" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* PRIMARY: Branch Portal */}
          <Link href="/login" className="group">
            <Card className="h-full glass-card border-none rounded-[2.5rem] overflow-hidden group-hover:scale-[1.03] group-hover:border-primary/30 group-hover:shadow-[0_0_50px_rgba(6,182,212,0.15)] transition-all duration-500">
              <CardContent className="p-12 space-y-10">
                <div className="flex justify-between items-start">
                  <div className="bg-primary/10 p-6 rounded-[2rem] border border-primary/20 group-hover:rotate-12 transition-transform duration-500">
                    <Store className="h-10 w-10 text-primary" />
                  </div>
                  <Badge className="bg-white/5 text-primary border-primary/20 font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-full">Protocol: Branch</Badge>
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Retail Portal</h2>
                  <p className="text-muted-foreground text-sm font-medium leading-relaxed">Secure node synchronization and reorder telemetry for localized retail clusters.</p>
                </div>
                <div className="flex items-center gap-4 text-primary font-black uppercase tracking-[0.3em] text-[10px] pt-6 group-hover:translate-x-4 transition-all">
                  Initialize Sync <ChevronRight className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* SECONDARY: Admin Console */}
          <Link href="/admin/login" className="group">
            <Card className="h-full bg-primary text-primary-foreground rounded-[2.5rem] shadow-[0_0_60px_rgba(6,182,212,0.2)] overflow-hidden group-hover:scale-[1.03] transition-all duration-500 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              <CardContent className="p-12 space-y-10 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="bg-white/20 p-6 rounded-[2rem] border border-white/30 group-hover:-rotate-12 transition-transform duration-500">
                    <Cpu className="h-10 w-10 text-white" />
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30 font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-full">Protocol: Master</Badge>
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Command Deck</h2>
                  <p className="text-white/80 text-sm font-medium leading-relaxed">Regional grid orchestration, SKU density monitoring, and global telemetry override.</p>
                </div>
                <div className="flex items-center gap-4 text-white font-black uppercase tracking-[0.3em] text-[10px] pt-6 group-hover:translate-x-4 transition-all">
                  Access Grid <ChevronRight className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="text-center pt-12">
           <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.5em] flex items-center justify-center gap-6">
             <Activity className="h-4 w-4 text-emerald-500" /> All Neural Nodes Active
             <Layers className="h-4 w-4 text-primary" /> Grid Density Optimal
           </p>
        </div>
      </div>
    </div>
  );
}