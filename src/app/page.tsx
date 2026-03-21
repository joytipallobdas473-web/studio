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
  Boxes
} from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { signInAnonymously } from "firebase/auth";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#ECF0F5]">
      <div className="max-w-4xl w-full space-y-12">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="bg-primary p-4 rounded-2xl shadow-lg">
            <Boxes className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">NE Retail Connect</h1>
            <p className="text-slate-500 font-medium flex items-center justify-center gap-2">
              <MapPin className="h-4 w-4 text-accent" /> North East Regional Logistics Network
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Retailer Card */}
          <Card 
            className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer bg-white group"
            onClick={() => handleLogin("retailer")}
          >
            <CardHeader className="pt-10 text-center">
              <div className="mx-auto bg-slate-50 p-5 rounded-2xl text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                <Package className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl font-bold pt-4">Partner Portal</CardTitle>
              <CardDescription>Order stock and track regional deliveries for your branch.</CardDescription>
            </CardHeader>
            <CardContent className="pb-10">
              <Button 
                variant="outline"
                className="w-full h-12 rounded-xl border-accent text-accent hover:bg-accent hover:text-white font-bold"
                disabled={!!isLoading}
              >
                {isLoading === "retailer" ? <Loader2 className="h-5 w-5 animate-spin" /> : "Access Portal"}
              </Button>
            </CardContent>
          </Card>

          {/* Admin Card */}
          <Card 
            className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer bg-white group"
            onClick={() => handleLogin("admin")}
          >
            <CardHeader className="pt-10 text-center">
              <div className="mx-auto bg-slate-50 p-5 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl font-bold pt-4">Regional Hub</CardTitle>
              <CardDescription>Manage inventory, approve stores, and monitor network health.</CardDescription>
            </CardHeader>
            <CardContent className="pb-10">
              <Button 
                className="w-full h-12 rounded-xl bg-primary text-white font-bold"
                disabled={!!isLoading}
              >
                {isLoading === "admin" ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enter Control Center"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">
          North East Logistics Infrastructure • v2.0
        </p>
      </div>
    </div>
  );
}