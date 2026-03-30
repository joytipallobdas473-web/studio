
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Loader2, ShieldAlert, Store, ArrowRight, Boxes, Globe, Zap, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const MASTER_ADMIN_UID = "j96izCkggNcL002AHiJjzGb18Bf2";

export default function Home() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const storeRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "stores", user.uid);
  }, [db, user]);

  const { data: store, isLoading: storeLoading } = useDoc(storeRef);

  // Handle Automatic Redirects for Authenticated Users
  useEffect(() => {
    if (!isUserLoading && user && isClient) {
      const isAdmin = user.email?.toLowerCase().includes("admin") || user.uid === MASTER_ADMIN_UID;
      if (isAdmin) {
        router.push("/admin");
      } else if (!storeLoading && store) {
        router.push("/dashboard");
      } else if (!storeLoading && !store) {
        router.push("/register");
      }
    }
  }, [user, isUserLoading, store, storeLoading, router, isClient]);

  if (isUserLoading || (user && storeLoading) || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="flex flex-col items-center gap-6 text-center animate-pulse">
          <div className="bg-primary p-5 rounded-[2rem] shadow-[0_0_50px_rgba(34,96,181,0.3)]">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Protocol Synchronization</p>
            <p className="text-sm font-black uppercase italic tracking-tighter text-slate-500">Scanning Network Identity...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#020617] relative overflow-hidden">
      {/* Background Grid Decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #2260B5 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>
      
      <div className="w-full max-w-4xl space-y-12 relative z-10 animate-in fade-in duration-1000">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md mb-4">
             <div className="h-2 w-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_rgba(38,205,242,0.8)]" />
             <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Grid Status: Online</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none">
            Regional <span className="text-primary">Logistics</span> Hub
          </h1>
          <p className="text-slate-500 font-bold flex items-center justify-center gap-3 text-xs md:text-sm uppercase tracking-[0.4em]">
             <MapPin className="h-4 w-4 text-primary" /> North East Cluster Control v2.8
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Admin Access Node */}
          <Link href="/admin/login" className="group">
            <Card className="border-white/5 bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden hover:scale-[1.02] transition-all duration-500 hover:shadow-[0_0_80px_rgba(34,96,181,0.15)] group-hover:border-primary/20 h-full">
              <CardContent className="p-10 flex flex-col items-center text-center space-y-6">
                <div className="bg-primary/20 p-6 rounded-[2rem] group-hover:bg-primary group-hover:scale-110 transition-all duration-500">
                  <ShieldAlert className="h-10 w-10 text-primary group-hover:text-white" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Command Console</h2>
                  <p className="text-slate-500 font-medium text-xs leading-relaxed uppercase tracking-widest px-4">
                    Restricted access for North East regional administrators.
                  </p>
                </div>
                <div className="pt-4 w-full">
                  <Button className="w-full h-14 bg-white/5 hover:bg-primary text-white font-black rounded-2xl border border-white/5 uppercase tracking-widest text-[10px] transition-all duration-500">
                    Initialize Admin Session <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Branch Access Node */}
          <Link href="/login" className="group">
            <Card className="border-white/5 bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden hover:scale-[1.02] transition-all duration-500 hover:shadow-[0_0_80px_rgba(38,205,242,0.1)] group-hover:border-accent/20 h-full">
              <CardContent className="p-10 flex flex-col items-center text-center space-y-6">
                <div className="bg-accent/20 p-6 rounded-[2rem] group-hover:bg-accent group-hover:scale-110 transition-all duration-500">
                  <Store className="h-10 w-10 text-accent group-hover:text-slate-900" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Branch Portal</h2>
                  <p className="text-slate-500 font-medium text-xs leading-relaxed uppercase tracking-widest px-4">
                    Order telemetry and stock registry for branch managers.
                  </p>
                </div>
                <div className="pt-4 w-full">
                  <Button className="w-full h-14 bg-white/5 hover:bg-accent text-white group-hover:text-slate-900 font-black rounded-2xl border border-white/5 uppercase tracking-widest text-[10px] transition-all duration-500">
                    Access Store Dashboard <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="pt-12 text-center flex flex-col items-center gap-6">
          <div className="flex items-center gap-8 opacity-20">
             <Boxes className="h-8 w-8 text-white" />
             <Globe className="h-8 w-8 text-white" />
             <Zap className="h-8 w-8 text-white" />
          </div>
          <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.5em] leading-relaxed">
            Centralized Regional Inventory Control <br /> 
            Powered by North East Logistics Grid
          </p>
        </div>
      </div>
    </div>
  );
}
