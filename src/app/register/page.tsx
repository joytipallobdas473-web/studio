
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
  PhoneCall
} from "lucide-react";
import { useFirestore, useAuth, useUser, useDoc, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MASTER_ADMIN_UID = "j96izCkggNcL002AHiJjzGb18Bf2";

export default function RegisterPage() {
  const router = useRouter();
  const db = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const [formData, setFormData] = useState({
    managerName: "",
    email: "",
    password: "",
    storeName: "",
    location: "",
    phoneNumber: ""
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const storeRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "stores", user.uid);
  }, [db, user]);

  const { data: store, isLoading: storeLoading } = useDoc(storeRef);

  // High-priority redirect for Master Admin or verified branch managers
  useEffect(() => {
    if (!isUserLoading && user && isClient) {
      const isAdmin = user.email?.toLowerCase().includes("admin") || user.uid === MASTER_ADMIN_UID;
      if (isAdmin) {
        router.push("/admin");
      } else if (!storeLoading && store) {
        router.push("/dashboard");
      }
    }
  }, [user, isUserLoading, store, storeLoading, router, isClient]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !auth) return;
    
    if (formData.password.length < 6) {
      toast({ title: "Security Alert", description: "Passkey must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(auth, formData.email.trim().toLowerCase(), formData.password);
      const currentUser = cred.user;

      const storeData = {
        id: currentUser.uid,
        name: formData.storeName.trim(),
        managerName: formData.managerName.trim(),
        email: formData.email.trim().toLowerCase(),
        location: formData.location.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        status: "pending",
        createdAt: serverTimestamp()
      };

      const storeDocRef = doc(db, "stores", currentUser.uid);
      setDocumentNonBlocking(storeDocRef, storeData, { merge: true });
      
      setIsSuccess(true);
      toast({
        title: "Protocol Initialized",
        description: "Branch registry pending regional verification.",
      });
      
      setTimeout(() => {
        const isAdmin = currentUser.email?.toLowerCase().includes("admin") || currentUser.uid === MASTER_ADMIN_UID;
        router.push(isAdmin ? "/admin" : "/dashboard");
      }, 2500);
      
    } catch (error: any) {
      setIsLoading(false);
      toast({ 
        title: "Onboarding Error", 
        description: error.message || "Identity sync failed. Protocol rejected.", 
        variant: "destructive" 
      });
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#ECF0F5]">
        <div className="text-center space-y-8 animate-in zoom-in duration-500">
           <div className="bg-primary p-8 rounded-full shadow-2xl inline-block">
              <CheckCircle2 className="h-20 w-20 text-white" />
           </div>
           <div className="space-y-3">
             <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
               Application Logged
             </h2>
             <p className="text-slate-500 font-medium tracking-wide">
               Regional administrators will verify your branch node shortly.
             </p>
           </div>
           <div className="flex flex-col items-center gap-3">
             <Loader2 className="h-6 w-6 animate-spin text-primary opacity-30" />
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing Identity Registry...</p>
           </div>
        </div>
      </div>
    );
  }

  // Prevent flash of content if user is already an admin
  const isMasterAdmin = user?.uid === MASTER_ADMIN_UID;
  if (isUserLoading || (user && (storeLoading || isMasterAdmin)) || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ECF0F5]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Network Interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#ECF0F5]">
      <div className="w-full max-w-2xl space-y-8 pb-12 animate-in fade-in duration-700">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-black text-[10px] uppercase tracking-widest group">
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
            Hub Selection
          </Link>
          <Link href="/login" className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">
            Already registered? Sign in
          </Link>
        </div>

        <div className="text-center space-y-3">
          <div className="bg-primary p-5 rounded-[2rem] shadow-xl inline-block mb-4">
            <Boxes className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Regional Onboarding</h1>
          <p className="text-slate-500 font-bold flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.4em]">
             <MapPin className="h-3.5 w-3.5 text-accent" /> North East Network Registry
          </p>
        </div>

        <Alert className="bg-white border-primary/20 rounded-[2.5rem] shadow-sm p-8">
          <div className="flex items-center gap-4">
            <div className="bg-primary/5 p-4 rounded-2xl">
              <PhoneCall className="h-6 w-6 text-primary" />
            </div>
            <div>
              <AlertTitle className="text-xs font-black uppercase tracking-widest text-primary mb-1">Support Protocol Active</AlertTitle>
              <AlertDescription className="text-sm font-medium text-slate-600">
                Contact regional support for onboarding at <span className="font-black text-primary text-lg ml-2">9085067897</span>.
              </AlertDescription>
            </div>
          </div>
        </Alert>

        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-10 pb-0 bg-slate-50/50">
            <CardTitle className="text-2xl font-black text-primary uppercase italic tracking-tighter">
              New Branch Registry
            </CardTitle>
            <CardDescription className="font-medium">Provide official regional retail credentials for node authorization.</CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={handleRegister} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Manager Identity</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-30" />
                    <Input 
                      placeholder="Official Name" 
                      className="pl-14 h-14 bg-slate-50 border-none rounded-2xl focus:ring-primary font-bold text-slate-900" 
                      required 
                      value={formData.managerName}
                      onChange={(e) => setFormData({...formData, managerName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Contact Phone</Label>
                  <div className="relative">
                    <PhoneCall className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-30" />
                    <Input 
                      type="tel"
                      placeholder="90XXXXXXXX" 
                      className="pl-14 h-14 bg-slate-50 border-none rounded-2xl focus:ring-primary font-bold text-slate-900" 
                      required 
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Work Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-30" />
                    <Input 
                      type="email" 
                      placeholder="manager@node.com" 
                      className="pl-14 h-14 bg-slate-50 border-none rounded-2xl focus:ring-primary font-bold text-slate-900" 
                      required 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Secure Passkey</Label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-30" />
                    <Input 
                      type="password" 
                      placeholder="Min. 6 characters" 
                      className="pl-14 h-14 bg-slate-50 border-none rounded-2xl focus:ring-primary font-bold text-slate-900" 
                      required 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Branch Designation</Label>
                  <div className="relative">
                    <Building className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-30" />
                    <Input 
                      placeholder="e.g., Guwahati Hub" 
                      className="pl-14 h-14 bg-slate-50 border-none rounded-2xl focus:ring-primary font-bold text-slate-900" 
                      required 
                      value={formData.storeName}
                      onChange={(e) => setFormData({...formData, storeName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Node Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-30" />
                    <Input 
                      placeholder="City, State" 
                      className="pl-14 h-14 bg-slate-50 border-none rounded-2xl focus:ring-primary font-bold text-slate-900" 
                      required 
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full h-16 bg-primary text-white hover:bg-primary/90 font-black rounded-2xl shadow-xl group uppercase tracking-widest text-[10px]" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <div className="flex items-center gap-3">
                    Apply for Network Access <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
          <div className="p-10 pt-0 border-t border-slate-50 bg-slate-50/30 text-center space-y-4">
            <p className="text-xs text-slate-500 font-medium">
              Existing branch partner? <Link href="/login" className="text-primary font-black hover:underline uppercase tracking-widest text-[10px] ml-2">Identity Sync</Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
