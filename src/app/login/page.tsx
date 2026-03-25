
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Boxes, Mail, Lock, Loader2, ArrowLeft, ChevronRight, MapPin, Store, Fingerprint, Keyboard } from "lucide-react";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { BiometricPrompt } from "@/components/biometric-prompt";

export default function RetailerLoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"standard" | "biometric">("standard");

  const storeRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "stores", user.uid);
  }, [db, user]);

  const { data: store, isLoading: storeLoading } = useDoc(storeRef);

  useEffect(() => {
    if (!isUserLoading && !storeLoading && user) {
      if (store) {
        router.push("/dashboard");
      } else {
        router.push("/register");
      }
    }
  }, [user, isUserLoading, store, storeLoading, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Node Identity Verified",
        description: "Synchronizing branch telemetry...",
      });
    } catch (error: any) {
      setIsLoading(false);
      toast({
        title: "Authentication Failed",
        description: "Invalid credentials for this node.",
        variant: "destructive",
      });
    }
  };

  const handleBiometricComplete = () => {
    toast({
      title: "Biometric Protocol Accepted",
      description: "Identity verified via localized hardware scan.",
    });
    // In a real app, this would involve WebAuthn. Here we simulate entry if already logged in or redirect to standard.
    if (user) {
       router.push("/dashboard");
    } else {
       setLoginMethod("standard");
       toast({ title: "Primary Sync Required", description: "Please perform standard sync for first-time session." });
    }
  };

  if (isUserLoading || (user && storeLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ECF0F5]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#ECF0F5]">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-xs uppercase tracking-widest group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Hub Selection
        </Link>

        <div className="text-center space-y-2">
          <div className="bg-primary p-4 rounded-[1.5rem] shadow-lg inline-block mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Branch Portal</h1>
          <p className="text-slate-500 font-bold flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.3em]">
            <MapPin className="h-3 w-3 text-accent" /> North East Retailer Access
          </p>
        </div>

        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-10 pb-0 bg-slate-50/50">
            <div className="flex justify-between items-start">
               <div>
                 <CardTitle className="text-lg font-black text-primary italic uppercase tracking-tighter">
                   {loginMethod === "standard" ? "Identity Sync" : "Biometric Protocol"}
                 </CardTitle>
                 <CardDescription className="font-medium">
                   {loginMethod === "standard" ? "Enter your registered branch credentials." : "Scan registered fingerprint node."}
                 </CardDescription>
               </div>
               <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-xl h-10 w-10 text-slate-400 hover:text-primary"
                onClick={() => setLoginMethod(loginMethod === "standard" ? "biometric" : "standard")}
               >
                 {loginMethod === "standard" ? <Fingerprint className="h-5 w-5" /> : <Keyboard className="h-5 w-5" />}
               </Button>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            {loginMethod === "standard" ? (
              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Branch Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      type="email" 
                      placeholder="branch@node.com" 
                      className="pl-14 h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-primary font-bold text-slate-900" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Secure Passkey</Label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      className="pl-14 h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-primary font-bold text-slate-900" 
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
                    <>Access Dashboard <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </Button>
              </form>
            ) : (
              <div className="py-4">
                <BiometricPrompt onComplete={handleBiometricComplete} />
              </div>
            )}
          </CardContent>
          <CardFooter className="p-10 pt-0 flex flex-col space-y-6">
             <div className="relative w-full">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                <div className="relative flex justify-center text-[9px] uppercase font-black text-slate-400 bg-white px-4">New Branch Partner?</div>
             </div>
             <Link href="/register" className="w-full">
               <Button variant="outline" className="w-full h-14 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 uppercase tracking-widest text-[10px]">
                 Initialize Onboarding
               </Button>
             </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
