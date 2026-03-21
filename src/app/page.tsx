
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  ShieldCheck, 
  Loader2, 
  MapPin, 
  Boxes,
  UserPlus,
  ArrowRight,
  ChevronRight
} from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { signInAnonymously } from "firebase/auth";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const auth = useAuth();
  const { isUserLoading } = useUser();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleAnonymousEntry = async (role: "retailer" | "admin") => {
    setIsLoading(role);
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      toast({
        title: "Access Granted",
        description: `Welcome to the ${role === 'admin' ? 'Regional Hub' : 'Partner Portal'}.`,
      });
      router.push(role === "admin" ? "/admin" : "/dashboard");
    } catch (error: any) {
      toast({ 
        title: "Network Error", 
        description: "Could not establish connection to the regional network.", 
        variant: "destructive" 
      });
      setIsLoading(null);
    }
  };

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
          <div className="bg-primary p-4 rounded-2xl shadow-lg animate-in zoom-in duration-700">
            <Boxes className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">NE Retail Connect</h1>
            <p className="text-slate-500 font-medium flex items-center justify-center gap-2">
              <MapPin className="h-4 w-4 text-accent" /> North East Regional Logistics Infrastructure
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Retailer Card */}
          <Card 
            className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer bg-white group rounded-[2rem] overflow-hidden"
          >
            <CardHeader className="pt-10 text-center">
              <div className="mx-auto bg-slate-50 p-5 rounded-2xl text-accent group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                <Package className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl font-bold pt-4">Partner Portal</CardTitle>
              <CardDescription className="px-6">Request stock and track regional deliveries for your branch node.</CardDescription>
            </CardHeader>
            <CardContent className="pb-10 px-10 space-y-4">
              <Button 
                onClick={() => handleAnonymousEntry("retailer")}
                className="w-full h-14 rounded-2xl bg-accent text-primary hover:bg-primary hover:text-white font-bold text-sm shadow-sm transition-all"
                disabled={!!isLoading}
              >
                {isLoading === "retailer" ? <Loader2 className="h-5 w-5 animate-spin" /> : "Quick Entry (Demo)"}
              </Button>
              <Link href="/login" className="block text-center">
                <Button variant="ghost" className="text-slate-500 font-bold hover:text-primary transition-colors text-xs uppercase tracking-widest">
                  Secure Identity Login <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Admin Card */}
          <Card 
            className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer bg-white group rounded-[2rem] overflow-hidden"
          >
            <CardHeader className="pt-10 text-center">
              <div className="mx-auto bg-slate-50 p-5 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl font-bold pt-4">Regional Hub</CardTitle>
              <CardDescription className="px-6">Manage global SKUs, authorize new nodes, and monitor logistics feeds.</CardDescription>
            </CardHeader>
            <CardContent className="pb-10 px-10 space-y-4">
              <Button 
                onClick={() => handleAnonymousEntry("admin")}
                className="w-full h-14 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg hover:shadow-primary/20 transition-all"
                disabled={!!isLoading}
              >
                {isLoading === "admin" ? <Loader2 className="h-5 w-5 animate-spin" /> : "Command Center (Demo)"}
              </Button>
              <Link href="/login" className="block text-center">
                <Button variant="ghost" className="text-slate-500 font-bold hover:text-primary transition-colors text-xs uppercase tracking-widest">
                  Administrator Login <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col items-center space-y-4 pt-8">
          <p className="text-slate-500 text-sm font-medium">New branch registration</p>
          <Link href="/register">
            <Button variant="outline" className="text-primary font-bold flex items-center gap-2 h-14 px-8 rounded-2xl border-primary/20 hover:bg-primary/5 shadow-sm">
              <UserPlus className="h-5 w-5" />
              Join the North East Network
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em]">
          North East Logistics Infrastructure • v2.5 PRD
        </p>
      </div>
    </div>
  );
}
