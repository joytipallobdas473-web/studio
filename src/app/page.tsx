
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCardWrapper } from "@/components/auth-card-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BiometricPrompt } from "@/components/biometric-prompt";
import { Package, Lock, User } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate authentication and redirect to order page as requested
    setTimeout(() => {
      router.push("/dashboard/order");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="mb-8 flex flex-col items-center">
        <Package className="h-12 w-12 text-primary mb-2" />
        <h1 className="text-3xl font-headline font-bold text-primary">Retails Stocks</h1>
      </div>

      <AuthCardWrapper 
        headerTitle="Welcome Back" 
        headerLabel="Login to manage your retail inventory"
      >
        <Tabs defaultValue="credentials" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="biometric">Biometric</TabsTrigger>
          </TabsList>
          
          <TabsContent value="credentials">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="username" placeholder="john.doe" className="pl-9" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" className="pl-9" required />
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="biometric">
            <BiometricPrompt onComplete={() => router.push("/dashboard/order")} />
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link href="/register" className="text-accent font-semibold hover:underline">
            Register now
          </Link>
        </div>
      </AuthCardWrapper>
    </div>
  );
}
