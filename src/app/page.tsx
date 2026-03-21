"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Package, ShieldCheck, Loader2, MapPin } from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { signInAnonymously } from "firebase/auth";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const auth = useAuth();
  const { userLoading } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (role: "retailer" | "admin") => {
    setIsLoading(true);
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      toast({
        title: "Access Granted",
        description: `Redirecting to ${role === 'admin' ? 'Admin Hub' : 'Retailer Portal'}.`,
      });
      router.push(role === "admin" ? "/admin" : "/dashboard");
    } catch (error: any) {
      toast({ 
        title: "Login Failed", 
        description: "Could not establish a secure session.", 
        variant: "destructive" 
      });
      setIsLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ECF0F5]">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#ECF0F5] relative font-body">
      <div className="mb-12 flex flex-col items-center text-center">
        <div className="bg-primary p-4 rounded-2xl shadow-lg mb-6">
          <Package className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-primary tracking-tight">NE Retail Connect</h1>
        <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4 text-accent" />
          North East Regional Inventory Network
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
        <Card 
          onClick={() => handleLogin("retailer")} 
          className="cursor-pointer group hover:border-primary/50 transition-all border-2 border-white bg-white shadow-sm rounded-3xl"
        >
          <CardContent className="p-10 flex flex-col items-center text-center space-y-6">
            <div className="bg-slate-100 p-5 rounded-2xl text-primary group-hover:bg-primary/5 transition-colors">
              <Package className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Retailer Portal</h2>
              <p className="text-slate-500 text-sm mt-2">Order stock and track deliveries for your local branch.</p>
            </div>
            <Button variant="secondary" className="w-full font-bold">Access Node</Button>
          </CardContent>
        </Card>

        <Card 
          onClick={() => handleLogin("admin")} 
          className="cursor-pointer group hover:border-accent/50 transition-all border-2 border-white bg-white shadow-sm rounded-3xl"
        >
          <CardContent className="p-10 flex flex-col items-center text-center space-y-6">
            <div className="bg-slate-100 p-5 rounded-2xl text-accent group-hover:bg-accent/5 transition-colors">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Admin Hub</h2>
              <p className="text-slate-500 text-sm mt-2">Manage products, verify stores, and oversee regional orders.</p>
            </div>
            <Button variant="default" className="w-full font-bold bg-primary">Access Command</Button>
          </CardContent>
        </Card>
      </div>

      <footer className="mt-16 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        Sector 7 Operations | Regional Mesh v1.0
      </footer>
    </div>
  );
}