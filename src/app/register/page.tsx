"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Boxes, 
  Lock, 
  User, 
  Mail, 
  MapPin, 
  Building, 
  Loader2, 
  ArrowLeft,
  ChevronRight,
  CheckCircle2
} from "lucide-react";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const db = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    managerName: "",
    email: "",
    storeName: "",
    location: "",
    password: ""
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    
    setIsLoading(true);
    const storeData = {
      name: formData.storeName,
      managerName: formData.managerName,
      email: formData.email,
      location: formData.location,
      status: "pending",
      createdAt: serverTimestamp()
    };

    addDoc(collection(db, "stores"), storeData)
      .then(() => {
        setIsSuccess(true);
        toast({
          title: "Registration Queued",
          description: "Your regional node application is pending verification.",
        });
        setTimeout(() => router.push("/"), 3000);
      })
      .catch(() => {
        setIsLoading(false);
        toast({ title: "Registration Failed", description: "Node rejected by mesh.", variant: "destructive" });
      });
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#ECF0F5]">
        <div className="text-center space-y-6 animate-in zoom-in duration-500">
           <div className="bg-emerald-500 p-6 rounded-[2.5rem] shadow-2xl inline-block">
              <CheckCircle2 className="h-16 w-16 text-white" />
           </div>
           <div className="space-y-2">
             <h2 className="text-3xl font-black text-slate-900 uppercase italic">Request Logged</h2>
             <p className="text-slate-500 font-medium">Regional admin will verify your node shortly.</p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#ECF0F5] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]" />
      </div>

      <Link href="/" className="absolute top-10 left-10 flex items-center gap-3 text-slate-500 hover:text-primary transition-colors font-black uppercase tracking-widest text-[10px] group">
        <div className="p-2 rounded-xl bg-white border border-slate-100 group-hover:bg-primary group-hover:text-white transition-all">
          <ArrowLeft className="h-4 w-4" />
        </div>
        Portal Selection
      </Link>

      <div className="w-full max-w-xl relative z-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="bg-primary p-4 rounded-[1.5rem] shadow-xl mb-6">
            <Boxes className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
            Node <span className="text-primary">Registration</span>
          </h1>
        </div>

        <Card className="border-none shadow-[0_30px_60px_rgba(0,0,0,0.1)] rounded-[3rem] bg-white overflow-hidden">
          <CardHeader className="p-10 pb-0 space-y-2">
            <CardTitle className="text-xs font-black uppercase tracking-[0.4em] text-primary/60">Retailer Onboarding</CardTitle>
            <CardDescription className="text-slate-400 font-medium">Submit your branch details to join the North East network.</CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Manager Identity</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Full Name" 
                      className="pl-12 h-14 bg-slate-50 border-none rounded-2xl focus:ring-primary font-medium" 
                      required 
                      value={formData.managerName}
                      onChange={(e) => setFormData({...formData, managerName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Work Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      type="email" 
                      placeholder="email@node.com" 
                      className="pl-12 h-14 bg-slate-50 border-none rounded-2xl focus:ring-primary font-medium" 
                      required 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Branch Designation</Label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="e.g., Guwahati Main Hub" 
                    className="pl-12 h-14 bg-slate-50 border-none rounded-2xl focus:ring-primary font-medium" 
                    required 
                    value={formData.storeName}
                    onChange={(e) => setFormData({...formData, storeName: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Geographic Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="City, State (North East)" 
                    className="pl-12 h-14 bg-slate-50 border-none rounded-2xl focus:ring-primary font-medium" 
                    required 
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-3 pb-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Access Credentials</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-12 h-14 bg-slate-50 border-none rounded-2xl focus:ring-primary font-medium" 
                    required 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-16 bg-primary text-white hover:bg-primary/90 font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-primary/20 group" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>Apply for Network Access <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <p className="mt-10 text-center text-xs font-black uppercase tracking-[0.2em] text-slate-400">
          Already a partner? <Link href="/" className="text-primary hover:underline">Return to Login</Link>
        </p>
      </div>
    </div>
  );
}
