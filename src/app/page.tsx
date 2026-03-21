
"use client";

import { useState, useEffect } from "react";
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
      // Authenticate with Firebase to satisfy Firestore Security Rules
      // We use Anonymous Auth as a prototype-friendly way to authorize requests
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      
      toast({
        title: "Authenticated",
        description: `Welcome to the ${role === 'admin' ? 'Admin' : 'Retailer'} Portal.`,
      });

      // Simple role-based routing for the prototype
      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      let message = "Could not authenticate. Please try again.";
      
      if (error.code === 'auth/api-key-not-valid') {
        message = "Firebase API Key is invalid. Please check your src/firebase/config.ts file and ensure your project is properly configured in the Firebase Console.";
      } else if (error.code === 'auth/operation-not-allowed') {
        message = "Anonymous Authentication is not enabled. Please enable it in the Firebase Console under Build > Authentication > Sign-in method.";
      }
      
      setAuthError(message);
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive"
      });
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
      <div className="mb-8 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="bg-primary p-4 rounded-2xl shadow-xl mb-4">
          <Package className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Retails Stocks</h1>
        <p className="text-muted-foreground mt-2 font-medium">Enterprise Inventory Network</p>
      </div>

      {authError && (
        <div className="w-full max-w-[400px] mb-6">
          <Alert variant="destructive" className="animate-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs font-medium leading-relaxed">
              {authError}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <Tabs defaultValue="retailer" className="w-full max-w-[400px] animate-in fade-in zoom-in duration-500">
        <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
          <TabsTrigger value="retailer" className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
            <User className="h-4 w-4" /> Retailer
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" /> Admin
          </TabsTrigger>
        </TabsList>

        <TabsContent value="retailer">
          <AuthCardWrapper 
            headerTitle="Retailer Portal" 
            headerLabel="Secure access for store managers"
          >
            <form onSubmit={(e) => handleLogin(e, "retailer")} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="retailer-username" className="text-[10px] font-bold uppercase text-muted-foreground">Store Manager ID</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="retailer-username" placeholder="manager.01" className="pl-9 h-11 bg-muted/20 border-none" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="retailer-password" id="retailer-password-label" className="text-[10px] font-bold uppercase text-muted-foreground">Security Pin</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="retailer-password" type="password" placeholder="••••••••" className="pl-9 h-11 bg-muted/20 border-none" required />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 font-bold shadow-lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Access Dashboard"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Unauthorized store? </span>
              <Link href="/register" className="text-accent font-bold hover:underline">
                Register Now
              </Link>
            </div>
          </AuthCardWrapper>
        </TabsContent>

        <TabsContent value="admin">
          <AuthCardWrapper 
            headerTitle="Central Admin" 
            headerLabel="Warehouse and network control"
          >
            <form onSubmit={(e) => handleLogin(e, "admin")} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-username" className="text-[10px] font-bold uppercase text-muted-foreground">Administrator Email</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="admin-username" type="email" placeholder="admin@retails-stocks.com" className="pl-9 h-11 bg-muted/20 border-none" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password" id="admin-password-label" className="text-[10px] font-bold uppercase text-muted-foreground">Master Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="admin-password" type="password" placeholder="••••••••" className="pl-9 h-11 bg-muted/20 border-none" required />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 bg-slate-900 text-white hover:bg-slate-800 font-bold shadow-lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Open Control Center"}
              </Button>
            </form>
          </AuthCardWrapper>
        </TabsContent>
      </Tabs>
    </div>
  );
}
