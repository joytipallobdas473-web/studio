
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCardWrapper } from "@/components/auth-card-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Lock, User, ShieldCheck } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent, role: "retailer" | "admin") => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate authentication and redirect based on role
    setTimeout(() => {
      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard/order");
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="mb-8 flex flex-col items-center">
        <Package className="h-12 w-12 text-primary mb-2" />
        <h1 className="text-3xl font-headline font-bold text-primary">Retails Stocks</h1>
      </div>

      <Tabs defaultValue="retailer" className="w-full max-w-[400px]">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="retailer" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Retailer
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
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
                  <Input id="retailer-username" placeholder="manager.01" className="pl-9" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="retailer-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="retailer-password" type="password" placeholder="••••••••" className="pl-9" required />
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Enter Retailer Portal"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">New store manager? </span>
              <Link href="/register" className="text-accent font-semibold hover:underline">
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
                  <Input id="admin-username" type="email" placeholder="admin@retails-stocks.com" className="pl-9" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Secure Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="admin-password" type="password" placeholder="••••••••" className="pl-9" required />
                </div>
              </div>
              <Button type="submit" className="w-full bg-slate-900 text-white hover:bg-slate-800" disabled={isLoading}>
                {isLoading ? "Authenticating..." : "Login to Admin Panel"}
              </Button>
            </form>
          </AuthCardWrapper>
        </TabsContent>
      </Tabs>
    </div>
  );
}
