
"use client";

import { useState, useEffect, useRef } from "react";
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
  PhoneCall,
  Camera,
  Upload,
  X,
  ImageIcon
} from "lucide-react";
import { useFirestore, useAuth, useUser, useDoc, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const MASTER_ADMIN_UID = "j96izCkggNcL002AHiJjzGb18Bf2";

export default function RegisterPage() {
  const router = useRouter();
  const db = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const [formData, setFormData] = useState({
    managerName: "",
    email: "",
    password: "",
    storeName: "",
    location: "",
    phoneNumber: "",
    imageUrl: ""
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const storeRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "stores", user.uid);
  }, [db, user?.uid]);

  const { data: store, isLoading: storeLoading } = useDoc(storeRef);

  useEffect(() => {
    if (!isClient || isUserLoading) return;

    if (user) {
      const isAdmin = user.email?.toLowerCase().includes("admin") || user.uid === MASTER_ADMIN_UID;
      if (isAdmin) {
        router.push("/admin");
        return;
      }
      
      if (!storeLoading && store && !isSuccess) {
        router.push("/dashboard");
      }
    }
  }, [user, isUserLoading, store, storeLoading, router, isClient, isSuccess]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions to capture your profile photo.',
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        setFormData({ ...formData, imageUrl: dataUri });
        stopCamera();
        toast({ title: "Identity Photo Captured" });
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
        toast({ title: "Photo Identity Loaded" });
      };
      reader.readAsDataURL(file);
    }
  };

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
        imageUrl: formData.imageUrl || `https://picsum.photos/seed/${currentUser.uid}/200`,
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
        router.push("/dashboard");
      }, 1500);
      
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

  if (!isClient || isUserLoading || (user && storeLoading)) {
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
          <Link href="/admin/login" className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-black text-[10px] uppercase tracking-widest group">
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
            Switch to Admin Console
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

        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-10 pb-0 bg-slate-50/50">
            <CardTitle className="text-2xl font-black text-primary uppercase italic tracking-tighter">
              New Branch Registry
            </CardTitle>
            <CardDescription className="font-medium">Provide official regional retail credentials for node authorization.</CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={handleRegister} className="space-y-10">
              
              <div className="flex flex-col items-center gap-6 py-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identity Visual Signature</Label>
                <div className="relative h-32 w-32 rounded-full overflow-hidden bg-white border-2 border-primary/20 shadow-inner group">
                  {isCameraActive ? (
                    <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
                  ) : formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Profile Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-200">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                  )}
                  {formData.imageUrl && !isCameraActive && (
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, imageUrl: ""})}
                      className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="flex gap-4">
                  {!isCameraActive ? (
                    <>
                      <Button type="button" variant="outline" size="sm" className="h-10 rounded-xl px-6 border-slate-200 font-black uppercase text-[9px] tracking-widest" onClick={startCamera}>
                        <Camera className="h-3.5 w-3.5 mr-2" /> Start Lens
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="h-10 rounded-xl px-6 border-slate-200 font-black uppercase text-[9px] tracking-widest" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-3.5 w-3.5 mr-2" /> Upload File
                      </Button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileUpload}
                      />
                    </>
                  ) : (
                    <Button type="button" size="sm" className="h-10 rounded-xl px-8 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[9px] tracking-widest" onClick={capturePhoto}>
                      Capture Frame
                    </Button>
                  )}
                </div>
              </div>

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
