
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Boxes, 
  User as UserIcon, 
  Mail, 
  MapPin, 
  Building, 
  Loader2, 
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Lock,
  Info
} from "lucide-react";
import { useFirestore, useAuth, useUser, useDoc, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const db = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    managerName: "",
    email: "",
    password: "",
    storeName: "",
    location: ""
  });

  const storeRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "stores", user.uid);
  }, [db, user]);

  const { data: store, isLoading: storeLoading } = useDoc(storeRef);

  useEffect(() => {
    if (!isUserLoading && !storeLoading && user && store) {
      router.push(user.email?.toLowerCase().includes("admin") ? "/admin" : "/dashboard");
    }
  }, [user, isUserLoading, store, storeLoading, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !auth) return;
    
    if (formData.password.length < 6) {
      toast({ title: "Validation Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const currentUser = cred.user;

      const storeData = {
        id: currentUser.uid,
        name: formData.storeName.trim(),
        managerName: formData.managerName.trim(),
        email: formData.email.trim(),
        location: formData.location.trim(),
        status: "pending",
        createdAt: serverTimestamp()
      };

      const storeRef = doc(db, "stores", currentUser.uid);
      setDocumentNonBlocking(storeRef, storeData, { merge: true });
      
      setIsSuccess(true);
      toast({
        title: "Registration Logged",
        description: "Your branch application is pending regional verification.",
      });
      
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
      
    } catch (error: any) {
      setIsLoading(false);
      toast({ 
        title: "Registration Error", 
        description: error.message || "Protocol rejected. Identity may already exist.", 
        variant: "destructive" 
      });
    }
  };

  if (isUserLoading || (user && storeLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ECF0F5]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#ECF0F5]">
        <div className="text-center space-y-6 animate-in zoom-in duration-500">
           <div className="bg-primary p-6 rounded-full shadow-2xl inline-block">
              <CheckCircle2 className="h-16 w-16 text-white" />
           </div>
           <div className="space-y-2">
             <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
               Application Logged
             </h2>
             <p className="text-slate-500 font-medium">
               Regional administrators will verify your branch details shortly.
             </p>
           </div>
           <div className="flex flex-col items-center gap-2">
             <Loader2 className="h-6 w-6 animate-spin text-primary" />
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Finalizing Identity Registry...</p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#ECF0F5]">
      <div className="w-full max-w-xl space-y-8">
        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-sm group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Selection
        </Link>

        <div className="text-center space-y-2">
          <div className="bg-primary p-4 rounded-3xl shadow-lg inline-block mb-4">
            <Boxes className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Regional Onboarding</h1>
          <p className="text-slate-500 font-bold flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.3em]">
             <MapPin className="h-3 w-3 text-accent" /> North East Network Registry
          </p>
        </div>

        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-10 pb-0 bg-slate-50/50">
            <CardTitle className="text-xl font-black text-primary uppercase italic tracking-tighter">
              New Branch Registry
            </CardTitle>
            <CardDescription className="font-medium">Please provide your official retail credentials.</CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Manager Identity</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Full Name" 
                      className="pl-12 h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-primary font-bold text-slate-900" 
                      required 
                      value={formData.managerName}
                      onChange={(e) => setFormData({...formData, managerName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Work Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      type="email" 
                      placeholder="manager@node.com" 
                      className="pl-12 h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-primary font-bold text-slate-900" 
                      required 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Secure Passkey</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    type="password" 
                    placeholder="Min. 6 characters" 
                    className="pl-12 h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-primary font-bold text-slate-900" 
                    required 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Branch/Sector Name</Label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="e.g., Guwahati Station / Shillong Hub" 
                    className="pl-12 h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-primary font-bold text-slate-900" 
                    required 
                    value={formData.storeName}
                    onChange={(e) => setFormData({...formData, storeName: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Node Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="City, State (North East Region)" 
                    className="pl-12 h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-primary font-bold text-slate-900" 
                    required 
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-16 bg-primary text-white hover:bg-primary/90 font-black rounded-2xl shadow-xl group uppercase tracking-widest text-xs" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>Apply for Access <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
            </form>
          </CardContent>
          <div className="p-10 pt-0 border-t border-slate-50 bg-slate-50/30 text-center space-y-4">
            <p className="text-xs text-slate-500 font-medium">
              Already have a registered node? <Link href="/login" className="text-primary font-black hover:underline">Identity Login</Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
