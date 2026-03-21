
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, User, ShieldCheck, Loader2, Info } from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { signInAnonymously } from "firebase/auth";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const auth = useAuth();
  const { user, loading: userLoading } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (role: "retailer" | "admin") => {
    setIsLoading(true);

    try {
      // Authenticate with Firebase. Prototype uses Anonymous Auth.
      // Any credentials entered in the form are ignored in this prototype.
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
      toast({ 
        title: "Login Failed", 
        description: "Authentication failed. Ensure Anonymous Auth is enabled in the Firebase Console.", 
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
      <div className="mb-8 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="bg-primary p-4 rounded-2xl shadow-xl mb-4">
          <Package className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-primary tracking-tight text-center">Retail Network</h1>
        <p className="text-muted-foreground font-medium">Inventory & Stock Management</p>
      </div>

      <Card className="w-full max-w-[400px] shadow-lg border-t-4 border-t-primary animate-in zoom-in duration-300">
        <CardHeader>
          <CardTitle>Test Portal Access</CardTitle>
          <CardDescription>
            This prototype uses **Anonymous Authentication**. You do not need real credentials to test.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <Button 
              onClick={() => handleLogin("retailer")} 
              className="h-14 font-bold flex justify-between px-6 hover:bg-muted/50"
              variant="outline"
              disabled={isLoading}
            >
              <div className="flex items-center gap-3">
                <div className="bg-accent/20 p-2 rounded-lg text-accent">
                  <User className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm">Retailer Portal</p>
                  <p className="text-[10px] font-normal text-muted-foreground uppercase">Store Manager Access</p>
                </div>
              </div>
              <Loader2 className={isLoading ? "animate-spin h-4 w-4" : "hidden"} />
            </Button>

            <Button 
              onClick={() => handleLogin("admin")} 
              className="h-14 font-bold flex justify-between px-6 bg-slate-900 text-white hover:bg-slate-800"
              disabled={isLoading}
            >
              <div className="flex items-center gap-3">
                <div className="bg-accent p-2 rounded-lg text-slate-900">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm">Central Admin</p>
                  <p className="text-[10px] font-normal text-slate-400 uppercase">Warehouse Management</p>
                </div>
              </div>
              <Loader2 className={isLoading ? "animate-spin h-4 w-4" : "hidden"} />
            </Button>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg flex gap-3 items-start border border-blue-100">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-blue-800 space-y-2">
              <p className="font-bold">Important for Admin Testing:</p>
              <p>Security rules restrict Admin write access. To test adding products, you must manually add your UID to the <code>roles_admin</code> collection in the Firebase Console.</p>
              {user && (
                <div className="bg-white p-2 rounded border border-blue-200 select-all font-mono">
                  Your UID: <span className="font-bold">{user.uid}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
