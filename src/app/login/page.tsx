
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Boxes, Mail, Lock, Loader2, ArrowLeft, ChevronRight, MapPin } from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { toast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setIsLoading(false);
        const isAdmin = email.toLowerCase().includes("admin") || firebaseUser.email?.toLowerCase().includes("admin");
        router.push(isAdmin ? "/admin" : "/dashboard");
      }
    });
    return () => unsubscribe();
  }, [auth, email, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Access Authorized",
        description: "Welcome to the regional logistics network.",
      });
    } catch (error: any) {
      setIsLoading(false);
      console.error("Auth error:", error);
      toast({
        title: "Verification Failed",
        description: "The credentials provided are invalid. Please check your registry data.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#ECF0F5]">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-sm group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <div className="text-center space-y-2">
          <div className="bg-primary p-3 rounded-2xl shadow-lg inline-block mb-4">
            <Boxes className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Identity Verification</h1>
          <p className="text-slate-500 font-medium flex items-center justify-center gap-2">
            <MapPin className="h-3 w-3 text-accent" /> NE Regional Access
          </p>
        </div>

        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <CardHeader className="p-8 pb-0 bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-primary">Login Protocol</CardTitle>
            <CardDescription>Enter your credentials for network authorization.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Work Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    type="email" 
                    placeholder="name@region.com" 
                    className="pl-12 h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-primary font-medium" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Secure Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-12 h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-primary font-medium" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-14 bg-primary text-white hover:bg-primary/90 font-bold rounded-2xl shadow-md group" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>Authorize Access <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="p-8 pt-0 flex flex-col space-y-4">
             <div className="relative w-full">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400 bg-white px-4">New to the network?</div>
             </div>
             <Link href="/register" className="w-full">
               <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50">
                 Apply for Branch Registration
               </Button>
             </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
