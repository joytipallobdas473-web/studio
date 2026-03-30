
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/firebase";
import { 
  Loader2, 
  Store, 
  ShieldCheck, 
  ChevronRight, 
  MapPin, 
  Globe, 
  Activity,
  Boxes,
  Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-6">
          <div className="bg-primary/5 p-6 rounded-[2.5rem] animate-pulse border border-primary/10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Identity Synchronization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Structural Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="w-full max-w-4xl space-y-12 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm mb-4">
             <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">North East Logistics v2.9</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase italic leading-[0.9]">
            Regional <br /> <span className="text-primary">Command</span> Hub
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-slate-200" />
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center gap-3">
              <Globe className="h-3 w-3" /> Secure Node Access
            </p>
            <div className="h-px w-12 bg-slate-200" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* PRIMARY: Branch Portal */}
          <Link href="/login" className="group">
            <Card className="h-full border-none bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden group-hover:scale-[1.02] group-hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] transition-all duration-500">
              <CardContent className="p-12 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="bg-primary p-6 rounded-[2rem] shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform duration-500">
                    <Store className="h-8 w-8 text-white" />
                  </div>
                  <Badge className="bg-slate-50 text-slate-400 border-none font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-xl">Protocol 01</Badge>
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Branch Portal</h2>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">Identity synchronization and stock reordering for authorized regional retail nodes.</p>
                </div>
                <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] pt-4 group-hover:gap-4 transition-all">
                  Initialize Sync <ChevronRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* SECONDARY: Admin Console */}
          <Link href="/admin/login" className="group">
            <Card className="h-full border-none bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden group-hover:scale-[1.02] transition-all duration-500 border-t border-white/5">
              <CardContent className="p-12 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="bg-white/10 p-6 rounded-[2rem] border border-white/10 group-hover:-rotate-12 transition-transform duration-500">
                    <Cpu className="h-8 w-8 text-accent" />
                  </div>
                  <Badge className="bg-accent/10 text-accent border-none font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-xl">Protocol 02</Badge>
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Command Terminal</h2>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed">Global telemetry monitoring, SKU provisioning, and regional grid orchestration.</p>
                </div>
                <div className="flex items-center gap-2 text-accent font-black uppercase tracking-widest text-[10px] pt-4 group-hover:gap-4 transition-all">
                  Access Grid <ChevronRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="text-center pt-8">
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4">
             <Activity className="h-3 w-3 text-emerald-500" /> All Systems Operational
           </p>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", className)}>
      {children}
    </div>
  );
}
