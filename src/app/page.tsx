
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCardWrapper } from "@/components/auth-card-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Lock, User, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { signInAnonymously } from "firebase/auth";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Home() {
  const router = useRouter();
  const auth = useAuth();
  const { user, loading: userLoading } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent, role: "retailer" | "admin") => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    try {
      // Authenticate with Firebase. Prototype uses Anonymous Auth.
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      
      toast({
        title: "Authenticated",
        description: `Welcome to the ${role === 'admin' ? 'Admin' : 'Retailer'} Portal.`,
      });

      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      let message = "Authentication failed. Ensure Anonymous Auth is enabled in Firebase Console.";
      
      if (error.code === 'auth/api-key-not-valid') {
        message = "Invalid Firebase API Key. Please check src/firebase/config.ts.";
      }
      
      setAuthError(message);
      toast({ title: "Login Failed", description: message, variant: "destructive" });
      setIsLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="mb-8 flex flex-col items-center animate-in fade-in slide-in-from-top-4">
        <div className="bg-primary p-4 rounded-2xl shadow-xl mb-4"><Package className="h-10 w-10 text-white" /></div>
        <h1 className="text-4xl font-bold text-primary tracking-tight">Retails Stocks</h1>
        <p className="text-muted-foreground font-medium">Enterprise Inventory Network</p>
      </div>

      {authError && (
        <div className="w-full max-w-[400px] mb-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs font-medium">{authError}</AlertDescription>
          </Alert>
        </div>
      )}

      <Tabs defaultValue="retailer" className="w-full max-w-[400px]">
        <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
          <TabsTrigger value="retailer" className="font-bold text-xs uppercase"><User className="h-4 w-4 mr-2" /> Retailer</TabsTrigger>
          <TabsTrigger value="admin" className="font-bold text-xs uppercase"><ShieldCheck className="h-4 w-4 mr-2" /> Admin</TabsTrigger>
        </TabsList>

        <TabsContent value="retailer">
          <AuthCardWrapper headerTitle="Retailer Portal" headerLabel="Store Manager Login">
            <form onSubmit={(e) => handleLogin(e, "retailer")} className="space-y-4">
              <Input placeholder="Manager ID" className="h-11 bg-muted/20" required />
              <Input type="password" placeholder="Security Pin" className="h-11 bg-muted/20" required />
              <Button type="submit" className="w-full h-11 font-bold" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Access Dashboard"}
              </Button>
            </form>
          </AuthCardWrapper>
        </TabsContent>

        <TabsContent value="admin">
          <AuthCardWrapper headerTitle="Central Admin" headerLabel="Warehouse Management">
            <form onSubmit={(e) => handleLogin(e, "admin")} className="space-y-4">
              <Input type="email" placeholder="Admin Email" className="h-11 bg-muted/20" required />
              <Input type="password" placeholder="Master Password" className="h-11 bg-muted/20" required />
              <Button type="submit" className="w-full h-11 bg-slate-900 text-white font-bold" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Open Control Center"}
              </Button>
            </form>
          </AuthCardWrapper>
        </TabsContent>
      </Tabs>
    </div>
  );
}
