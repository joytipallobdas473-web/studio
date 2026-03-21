"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCardWrapper } from "@/components/auth-card-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Lock, User, ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/firebase";
import { signInAnonymously } from "firebase/auth";
import { toast } from "@/hooks/use-toast";

export default function Home() {
  const router = useRouter();
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent, role: "retailer" | "admin") => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Authenticate with Firebase to satisfy Firestore Security Rules
      await signInAnonymously(auth);
      
      toast({
        title: "Authenticated",
        description: `Welcome to the ${role === 'admin' ? 'Admin' : 'Retailer'} Portal.`,
      });

      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard/order");
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Could not authenticate. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="mb-8 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="bg-primary p-4 rounded-2xl shadow-xl mb-4">
          <Package className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Retails Stocks</h1>
        <p className="text-muted-foreground mt-2 font-medium">Enterprise Inventory Network</p>
      </div>

      <Tabs defaultValue="retailer" className="w-full max-w-[400px] animate-in fade-in zoom-in duration-500">
        <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
          <TabsTrigger value="retailer" className="flex items-center gap-2 font-bold">
            <User className="h-4 w-4" /> Retailer
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2 font-bold">
            <ShieldCheck className="h-4 w-4" /> Admin
          </TabsTrigger>
        </TabsList>

        <TabsContent value="retailer">
          <AuthCardWrapper 
            headerTitle="Retailer Login" 
            headerLabel="Manage your store and place orders"
          >
            <form onSubmit={(e) => handleLogin(e, "retailer")} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="retailer-username">Store Manager ID</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="retailer-username" placeholder="manager.01" className="pl-9 h-11" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="retailer-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="retailer-password" type="password" placeholder="••••••••" className="pl-9 h-11" required />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 font-bold shadow-lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Enter Retailer Portal"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">New store manager? </span>
              <Link href="/register" className="text-accent font-bold hover:underline">
                Register Store
              </Link>
            </div>
          </AuthCardWrapper>
        </TabsContent>

        <TabsContent value="admin">
          <AuthCardWrapper 
            headerTitle="Administrator" 
            headerLabel="Official inventory and store control"
          >
            <form onSubmit={(e) => handleLogin(e, "admin")} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-username">Admin Email</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="admin-username" type="email" placeholder="admin@retails-stocks.com" className="pl-9 h-11" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Secure Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="admin-password" type="password" placeholder="••••••••" className="pl-9 h-11" required />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 bg-slate-900 text-white hover:bg-slate-800 font-bold shadow-lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Login to Admin Panel"}
              </Button>
            </form>
          </AuthCardWrapper>
        </TabsContent>
      </Tabs>
    </div>
  );
}
