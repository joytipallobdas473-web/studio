
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Boxes, Mail, Lock, Loader2, ArrowLeft, ChevronRight, MapPin, ShieldCheck, User } from "lucide-react";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const storeRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "stores", user.uid);
  }, [db, user]);

  const { data: store, isLoading: storeLoading } = useDoc(storeRef);

  useEffect(() => {
    if (user && !storeLoading) {
      const isAdmin = user.email?.toLowerCase().includes("admin");
      
      if (isAdmin) {
        router.push("/admin");
      } else if (store) {
        router.push("/dashboard");
      } else {
        router.push("/register");
      }
    }
  }, [user, store, storeLoading, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    setIsLoading(true);
    try {
      // Try to sign in; if user doesn't exist, create them for demo purposes
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          await createUserWithEmailAndPassword(auth, email, password);
        } else {
          throw err;
        }
      }
      
      toast({
        title: "Access Authorized",
        description: "Synchronizing with regional telemetry...",
      });
    } catch (error: any) {
      setIsLoading(false);
      toast({
        title: "Auth Error",
        description: error.message || "Credential verification failed.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#ECF0F5]">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-sm group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Selection
        </Link>

        <div className="text-center space-y-2">
          <div className="bg-primary p-3 rounded-2xl shadow-lg inline-block mb-4">
            <Boxes className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Identity Portal</h1>
          <p className="text-slate-500 font-medium flex items-center justify-center gap-2 text-sm">
            <MapPin className="h-3 w-3 text-accent" /> North East Cluster Access
          </p>
        </div>

        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <CardHeader className="p-8 pb-0 bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-primary italic uppercase tracking-tighter">Login Protocol</CardTitle>
            <CardDescription>Enter credentials for regional authorization.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Work Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    type="email" 
                    placeholder="admin@retail.com or user@retail.com" 
                    className="pl-12 h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-primary font-bold text-slate-900" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Secure Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-12 h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-primary font-bold text-slate-900" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-14 bg-primary text-white hover:bg-primary/90 font-black rounded-2xl shadow-md group uppercase tracking-widest text-xs" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>Authorize Access <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="p-8 pt-0 flex flex-col space-y-6">
             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 w-full space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3 text-accent" /> Demo Access Key
                </p>
                <p className="text-[11px] text-slate-600 font-medium">
                  Use email containing <strong>'admin'</strong> for Admin Hub access.
                </p>
             </div>
             <div className="relative w-full">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                <div className="relative flex justify-center text-[9px] uppercase font-black text-slate-400 bg-white px-4">Retailer Node Registration</div>
             </div>
             <Link href="/register" className="w-full">
               <Button variant="outline" className="w-full h-14 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 uppercase tracking-widest text-[10px]">
                 Join the North East Network
               </Button>
             </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
