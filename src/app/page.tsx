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
  Terminal,
  Zap,
  Box,
  Fingerprint
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MASTER_ADMIN_UID = "j96izCkggNcL002AHiJjzGb18Bf2";

export default function EntryGateway() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<"retail" | "admin" | null>(null);

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
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-primary selection:text-white">
      {/* Cinematic Grid & Glow Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_90%_90%_at_50%_50%,#000_60%,transparent_100%)] opacity-40" />
      
      {/* Dynamic Background Glows */}
      <div className={cn(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[180px] transition-all duration-1000 opacity-20",
        hoveredNode === "retail" ? "bg-primary/40" : hoveredNode === "admin" ? "bg-amber-500/40" : "bg-blue-500/20"
      )} />

      <div className="w-full max-w-7xl space-y-24 relative z-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        {/* Header Telemetry */}
        <div className="flex flex-col items-center text-center space-y-10">
          <div className="inline-flex items-center gap-4 px-6 py-2 glass-card rounded-full border-primary/20 bg-primary/5 shadow-2xl backdrop-blur-md">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-[0.6em] text-primary">Aether Network v3.0 // Regional Grid</span>
          </div>
          
          <h1 className="text-7xl md:text-[10rem] font-black text-white tracking-tighter uppercase italic leading-[0.8] transition-all duration-700">
            REGIONAL <br /> 
            <span className={cn(
              "transition-all duration-700 block",
              hoveredNode === "retail" ? "text-primary drop-shadow-[0_0_60px_rgba(15,50,45,0.8)]" : 
              hoveredNode === "admin" ? "text-amber-500 drop-shadow-[0_0_60px_rgba(245,158,11,0.8)]" : 
              "text-white/20"
            )}>
              LOGISTICS
            </span>
          </h1>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 pt-8">
             <div className="flex flex-col items-center gap-2 group cursor-default">
                <Box className="h-5 w-5 text-primary/40 group-hover:text-primary transition-colors" />
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Active Payloads</span>
                <span className="text-sm font-mono font-bold text-white/80">4.2k</span>
             </div>
             <div className="flex flex-col items-center gap-2 group cursor-default">
                <Zap className="h-5 w-5 text-primary/40 group-hover:text-primary transition-colors" />
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Node Sync</span>
                <span className="text-sm font-mono font-bold text-white/80">99.9%</span>
             </div>
             <div className="flex flex-col items-center gap-2 group cursor-default">
                <Globe className="h-5 w-5 text-primary/40 group-hover:text-primary transition-colors" />
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Sectors</span>
                <span className="text-sm font-mono font-bold text-white/80">North East</span>
             </div>
             <div className="flex flex-col items-center gap-2 group cursor-default">
                <ShieldCheck className="h-5 w-5 text-primary/40 group-hover:text-primary transition-colors" />
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Security</span>
                <span className="text-sm font-mono font-bold text-white/80">Verified</span>
             </div>
          </div>
        </div>

        {/* Dual Entry Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* RETAIL NODE */}
          <Link 
            href="/login" 
            className="group"
            onMouseEnter={() => setHoveredNode("retail")}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <Card className="h-full glass-card border-white/5 rounded-[3rem] overflow-hidden group-hover:scale-[1.02] group-hover:border-primary/30 transition-all duration-500 bg-white/5 backdrop-blur-2xl relative">
              <div className="absolute top-0 right-0 p-12 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-16 space-y-12 relative z-10">
                <div className="flex justify-between items-center">
                  <div className="bg-primary/10 p-8 rounded-[2rem] border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                    <Store className="h-10 w-10" />
                  </div>
                  <Badge variant="outline" className="px-6 py-2 rounded-full border-primary/20 text-primary font-black text-[9px] uppercase tracking-[0.4em]">Boutique Hub</Badge>
                </div>
                <div className="space-y-6">
                  <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none group-hover:translate-x-2 transition-transform">Branch Portal</h2>
                  <p className="text-slate-400 text-base font-medium leading-relaxed max-w-xs">
                    Access premium node synchronization and silk catalog reorder telemetry.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-primary font-black uppercase tracking-[0.4em] text-[11px] pt-8 opacity-60 group-hover:opacity-100 transition-all">
                  Initialize Link <ChevronRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* ADMIN NODE */}
          <Link 
            href="/admin/login" 
            className="group"
            onMouseEnter={() => setHoveredNode("admin")}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <Card className="h-full glass-card border-white/5 rounded-[3rem] overflow-hidden group-hover:scale-[1.02] group-hover:border-amber-500/30 transition-all duration-500 bg-white/5 backdrop-blur-2xl relative">
              <div className="absolute top-0 right-0 p-12 bg-amber-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-16 space-y-12 relative z-10">
                <div className="flex justify-between items-center">
                  <div className="bg-amber-500/10 p-8 rounded-[2rem] border border-amber-500/20 text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-all duration-500">
                    <Terminal className="h-10 w-10" />
                  </div>
                  <Badge variant="outline" className="px-6 py-2 rounded-full border-amber-500/20 text-amber-500 font-black text-[9px] uppercase tracking-[0.4em]">Master Protocol</Badge>
                </div>
                <div className="space-y-6">
                  <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none group-hover:translate-x-2 transition-transform">Command Deck</h2>
                  <p className="text-slate-400 text-base font-medium leading-relaxed max-w-xs">
                    Orchestrate regional grid clusters and manage global network telemetry.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-amber-500 font-black uppercase tracking-[0.4em] text-[11px] pt-8 opacity-60 group-hover:opacity-100 transition-all">
                  Access Neural Hub <ChevronRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Global Footer Footer */}
        <div className="flex flex-col items-center gap-12 pt-16 border-t border-white/5">
           <div className="flex items-center gap-16 px-12 py-6 glass-card rounded-full border-white/5 bg-white/5 backdrop-blur-3xl shadow-2xl">
             <div className="flex items-center gap-4">
               <Fingerprint className="h-4 w-4 text-primary" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Signature Encrypted</span>
             </div>
             <div className="h-4 w-px bg-white/10" />
             <div className="flex items-center gap-4">
               <Activity className="h-4 w-4 text-emerald-500" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Network Optimal</span>
             </div>
           </div>
           <p className="text-[9px] font-black uppercase tracking-[0.8em] text-slate-600">Secure Regional Logistics Infrastructure // 2024</p>
        </div>
      </div>
    </div>
  );
}
