
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  Loader2, 
  MapPin, 
  Boxes,
  UserPlus,
  ArrowRight,
  ChevronRight,
  ShieldAlert,
  LayoutDashboard
} from "lucide-react";
import { useUser } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Home() {
  const { isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ECF0F5]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#ECF0F5]">
      <div className="max-w-4xl w-full space-y-12">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="bg-primary p-4 rounded-[2rem] shadow-xl animate-in zoom-in duration-1000">
            <Boxes className="h-12 w-12 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic">NE Retail Hub</h1>
            <p className="text-slate-500 font-bold flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.4em]">
              <MapPin className="h-4 w-4 text-accent" /> North East Regional Logistics
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Branch/Retailer Access */}
          <Card className="border-none shadow-sm hover:shadow-2xl transition-all duration-500 bg-white rounded-[3rem] overflow-hidden group">
            <CardHeader className="pt-12 text-center">
              <div className="mx-auto bg-primary/5 p-6 rounded-3xl text-primary group-hover:scale-110 transition-transform">
                <UserPlus className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl font-black pt-6 uppercase italic tracking-tight">Branch Portal</CardTitle>
              <CardDescription className="px-8 font-medium">Compulsory registration and inventory requests for retailer nodes.</CardDescription>
            </CardHeader>
            <CardContent className="pb-12 px-12 space-y-4">
              <Link href="/register">
                <Button className="w-full h-16 rounded-2xl bg-accent text-primary hover:bg-primary hover:text-white font-black text-xs transition-all uppercase tracking-widest shadow-lg">
                  Register Branch <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login" className="block text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">
                Already registered? Sign in
              </Link>
            </CardContent>
          </Card>

          {/* Admin Command Access */}
          <Card className="border-none shadow-sm hover:shadow-2xl transition-all duration-500 bg-slate-900 rounded-[3rem] overflow-hidden group">
            <CardHeader className="pt-12 text-center">
              <div className="mx-auto bg-white/5 p-6 rounded-3xl text-accent group-hover:rotate-12 transition-transform">
                <ShieldAlert className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl font-black pt-6 uppercase italic tracking-tight text-white">Command Console</CardTitle>
              <CardDescription className="px-8 font-medium text-slate-500">Regional controller access for grid monitoring and SKU authorization.</CardDescription>
            </CardHeader>
            <CardContent className="pb-12 px-12">
              <Link href="/admin/login">
                <Button className="w-full h-16 rounded-2xl bg-white text-primary hover:bg-accent hover:text-primary font-black text-xs shadow-lg transition-all uppercase tracking-widest">
                  Secure Identity Login <ChevronRight className="ml-3 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col items-center space-y-6 pt-12">
          <div className="flex items-center gap-12 text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">
             <span className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Secure Grid</span>
             <span className="flex items-center gap-3"><MapPin className="h-4 w-4 text-accent" /> NE Cluster</span>
          </div>
          <p className="text-center text-[9px] text-slate-400 font-black uppercase tracking-widest opacity-40">
            Proprietary Logistics Architecture • v2.8 PRD
          </p>
        </div>
      </div>
    </div>
  );
}
