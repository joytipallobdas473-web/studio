
"use client";

import { useState } from "react";
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
  CheckCircle2
} from "lucide-react";
import { useFirestore, useAuth, setDocumentNonBlocking } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const db = useFirestore();
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    managerName: "",
    email: "",
    storeName: "",
    location: ""
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !auth) return;
    
    setIsLoading(true);

    try {
      let currentUser = auth.currentUser;
      if (!currentUser) {
        const cred = await signInAnonymously(auth);
        currentUser = cred.user;
      }

      if (!currentUser) throw new Error("Authentication failed");

      const storeData = {
        id: currentUser.uid,
        name: formData.storeName.trim(),
        managerName: formData.managerName.trim(),
        email: formData.email.trim(),
        location: formData.location.trim(),
        status: "pending",
        createdAt: serverTimestamp()
      };

      // Link store to the user's UID
      const storeRef = doc(db, "stores", currentUser.uid);
      setDocumentNonBlocking(storeRef, storeData, { merge: true });
      
      setIsSuccess(true);
      toast({
        title: "Registration Logged",
        description: "Your regional node application is pending verification.",
      });
      setTimeout(() => router.push("/dashboard"), 3000);
      
    } catch (error) {
      setIsLoading(false);
      toast({ title: "Registration Error", description: "Protocol rejected. Please try again.", variant: "destructive" });
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#ECF0F5]">
        <div className="text-center space-y-6 animate-in zoom-in duration-500">
           <div className="bg-primary p-6 rounded-full shadow-2xl inline-block">
              <CheckCircle2 className="h-16 w-16 text-white" />
           </div>
           <div className="space-y-2">
             <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Application Logged</h2>
             <p className="text-slate-500 font-medium">Regional administrators will verify your branch details shortly.</p>
           </div>
           <Link href="/dashboard">
             <Button className="mt-4 bg-primary text-white font-bold rounded-xl px-8 h-12">
               Enter Portal
             </Button>
           </Link>
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
          <div className="bg-primary p-3 rounded-2xl shadow-lg inline-block mb-4">
            <Boxes className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Branch Registration</h1>
          <p className="text-slate-500 font-medium font-body">Submit your details to join the NE Retail Connect network.</p>
        </div>

        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <CardHeader className="p-8 pb-0 bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-primary">Regional Onboarding</CardTitle>
            <CardDescription>Fill in your professional information for verification.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Manager Name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Full Name" 
                      className="pl-12 h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-primary font-medium" 
                      required 
                      value={formData.managerName}
                      onChange={(e) => setFormData({...formData, managerName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Work Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      type="email" 
                      placeholder="email@work.com" 
                      className="pl-12 h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-primary font-medium" 
                      required 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Store / Branch Name</Label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="e.g., Guwahati North Station" 
                    className="pl-12 h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-primary font-medium" 
                    required 
                    value={formData.storeName}
                    onChange={(e) => setFormData({...formData, storeName: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Regional Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="City, State (NE Region)" 
                    className="pl-12 h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-primary font-medium" 
                    required 
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-14 bg-primary text-white hover:bg-primary/90 font-bold rounded-2xl shadow-md group" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>Apply for Access <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
