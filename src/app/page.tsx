
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
  Zap,
  Box,
  Fingerprint,
  Terminal,
  ShieldCheck,
  Cpu,
  Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
          <div className="p-1 w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-cyan-400 animate-spin">
            <div className="w-full h-full bg-[#020617] rounded-full flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[1em] text-primary/60 animate-pulse">Initializing Neural Link</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Neo-Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/80 to-[#020617]" />
      
      {/* Dynamic Aura */}
      <div className={cn(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full blur-[150px] transition-all duration-1000 opacity-10",
        hoveredNode === "retail" ? "bg-purple-500" : hoveredNode === "admin" ? "bg-cyan-500" : "bg-blue-500"
      )} />

      <div className="w-full max-w-7xl space-y-24 relative z-10">
        {/* Header Protocol */}
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="inline-flex items-center gap-3 px-5 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
             <span className="text-[9px] font-black uppercase tracking-[0.5em] text-white/60">Aether Grid v4.0 // Global Sync</span>
          </div>
          
          <h1 className="text-5xl md:text-[7rem] lg:text-[9rem] font-black text-white tracking-tighter uppercase italic leading-[0.85] text-stroke transition-all duration-700">
            NORTH EAST <br /> 
            <span className={cn(
              "transition-all duration-1000",
              hoveredNode === "retail" ? "text-purple-500 drop-shadow-[0_0_50px_rgba(168,85,247,0.5)]" : 
              hoveredNode === "admin" ? "text-cyan-400 drop-shadow-[0_0_50px_rgba(34,211,238,0.5)]" : 
              "text-white/10"
            )}>
              LOGISTICS
            </span>
          </h1>

          <div className="flex flex-wrap justify-center gap-12 pt-4">
             {[
               { icon: Box, label: "Payloads", val: "4.8k" },
               { icon: Zap, label: "Latency", val: "12ms" },
               { icon: Globe, label: "Regions", val: "NE-01" },
               { icon: ShieldCheck, label: "Secured", val: "AES-256" }
             ].map((stat, i) => (
               <div key={i} className="flex flex-col items-center gap-1 group opacity-40 hover:opacity-100 transition-opacity">
                  <stat.icon className="h-4 w-4 text-primary" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{stat.label}</span>
                  <span className="text-xs font-mono font-bold text-white">{stat.val}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Entry Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* RETAIL NODE */}
          <Link 
            href="/login" 
            className="group"
            onMouseEnter={() => setHoveredNode("retail")}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <div className="relative h-full p-px rounded-[2rem] bg-white/5 hover:bg-gradient-to-br hover:from-purple-500/50 hover:to-transparent transition-all duration-500">
              <div className="h-full bg-[#030712] rounded-[2rem] p-12 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all" />
                
                <div className="flex justify-between items-center">
                  <div className="p-6 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white transition-all duration-500">
                    <Store className="h-8 w-8" />
                  </div>
                  <Badge variant="outline" className="px-4 py-1 rounded-full border-purple-500/30 text-purple-400 font-black text-[8px] uppercase tracking-widest bg-purple-500/5">Retail Portal</Badge>
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-tight">Branch Node</h2>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[240px]">
                    Initialize stock reorder and boutique grid synchronization.
                  </p>
                </div>
                
                <div className="flex items-center gap-3 text-purple-400 font-black uppercase tracking-[0.3em] text-[10px] pt-4 group-hover:translate-x-2 transition-transform">
                  Access Portal <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </Link>

          {/* ADMIN NODE */}
          <Link 
            href="/admin/login" 
            className="group"
            onMouseEnter={() => setHoveredNode("admin")}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <div className="relative h-full p-px rounded-[2rem] bg-white/5 hover:bg-gradient-to-br hover:from-cyan-500/50 hover:to-transparent transition-all duration-500">
              <div className="h-full bg-[#030712] rounded-[2rem] p-12 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all" />
                
                <div className="flex justify-between items-center">
                  <div className="p-6 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-400 group-hover:text-black transition-all duration-500">
                    <Terminal className="h-8 w-8" />
                  </div>
                  <Badge variant="outline" className="px-4 py-1 rounded-full border-cyan-500/30 text-cyan-400 font-black text-[8px] uppercase tracking-widest bg-cyan-500/5">Command Level</Badge>
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-tight">Command Deck</h2>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[240px]">
                    Orchestrate regional clusters and global traffic telemetry.
                  </p>
                </div>
                
                <div className="flex items-center gap-3 text-cyan-400 font-black uppercase tracking-[0.3em] text-[10px] pt-4 group-hover:translate-x-2 transition-transform">
                  Enter Hub <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Infrastructure Tag */}
        <div className="flex flex-col items-center gap-8 pt-12 border-t border-white/5 opacity-40">
           <div className="flex items-center gap-12 text-slate-500">
             <div className="flex items-center gap-3">
               <Cpu className="h-3.5 w-3.5" />
               <span className="text-[9px] font-black uppercase tracking-widest">Neural Link v4.0</span>
             </div>
             <div className="flex items-center gap-3">
               <Fingerprint className="h-3.5 w-3.5" />
               <span className="text-[9px] font-black uppercase tracking-widest">Encrypted</span>
             </div>
             <div className="flex items-center gap-3">
               <Activity className="h-3.5 w-3.5" />
               <span className="text-[9px] font-black uppercase tracking-widest">Healthy</span>
             </div>
           </div>
           <p className="text-[8px] font-black uppercase tracking-[1em] text-slate-700">AETHER LOGISTICS INFRASTRUCTURE // NORTH EAST HUB</p>
        </div>
      </div>
    </div>
  );
}
