
"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Mail, MapPin, Building, Fingerprint, Loader2, BadgeCheck, Clock, Copy, Check, Camera, Upload, X, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [copied, setCopied] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storeRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "stores", user.uid);
  }, [db, user?.uid]);

  const { data: storeData, isLoading: storeLoading } = useDoc(storeRef);

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
        description: 'Please enable camera permissions to update your identity photo.',
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
        setPreviewUrl(canvas.toDataURL('image/jpeg', 0.8));
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const savePhoto = () => {
    if (!db || !user || !previewUrl) return;
    const docRef = doc(db, "stores", user.uid);
    updateDocumentNonBlocking(docRef, { imageUrl: previewUrl });
    setIsPhotoDialogOpen(false);
    setPreviewUrl("");
    toast({ title: "Identity Synchronized", description: "Node visual ID updated successfully." });
  };

  const copyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopied(true);
      toast({ title: "Signature Copied", description: "Node UID saved to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isUserLoading || storeLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600 opacity-30" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
             <span className="text-[10px] font-black tracking-[0.4em] text-emerald-600 uppercase">Node Management</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 italic uppercase tracking-tight leading-none">Identity Core</h1>
          <p className="text-slate-500 font-medium text-sm mt-2">Manage your regional branch credentials and visual signature.</p>
        </div>
        {storeData?.status && (
          <Badge className={cn(
            "h-10 px-6 font-black uppercase tracking-widest text-[10px] rounded-xl border shadow-none",
            storeData.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
          )}>
            {storeData.status === 'active' ? <BadgeCheck className="w-4 h-4 mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
            PROTOCOL: {storeData.status}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem] group">
            <CardContent className="pt-10 text-center space-y-6">
              <div className="relative inline-block">
                <Avatar className="h-28 w-28 mx-auto border-4 border-slate-50 shadow-inner">
                  <AvatarImage src={storeData?.imageUrl || `https://picsum.photos/seed/${user?.uid}/200`} />
                  <AvatarFallback className="bg-emerald-600 text-white font-black text-xl">
                    {storeData?.managerName?.substring(0, 2).toUpperCase() || "JD"}
                  </AvatarFallback>
                </Avatar>
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-white border-slate-200 text-emerald-600 shadow-md hover:bg-emerald-50 transition-all"
                  onClick={() => setIsPhotoDialogOpen(true)}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">{storeData?.managerName || "New Controller"}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                  {storeData?.name || "Pending Designation"}
                </p>
              </div>
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[9px] border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                  onClick={() => setIsPhotoDialogOpen(true)}
                >
                  Update Visual ID
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-[2rem]">
            <CardHeader className="pb-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Security Cluster</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Node UID</span>
                </div>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="relative group">
                <div className="text-[10px] text-slate-400 font-mono break-all bg-slate-50 p-5 rounded-xl border border-slate-100 pr-12 shadow-inner">
                  {user?.uid}
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-300 hover:text-emerald-600"
                  onClick={copyUid}
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-[2.5rem]">
            <CardHeader className="p-10 pb-0">
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-emerald-600">Branch Registry</CardTitle>
              <CardDescription className="font-medium text-slate-500">Official regional node credentials stored in the Aether Network.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Controller Signature</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 opacity-30" />
                    <Input readOnly value={storeData?.managerName || ""} className="pl-14 h-14 bg-slate-50 border-none rounded-xl font-bold text-slate-900" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Comms Signal (Email)</Label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 opacity-30" />
                    <Input readOnly value={storeData?.email || user?.email || ""} className="pl-14 h-14 bg-slate-50 border-none rounded-xl font-bold text-slate-900" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Node Designation</Label>
                  <div className="relative">
                    <Building className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 opacity-30" />
                    <Input readOnly value={storeData?.name || "Awaiting Name..."} className="pl-14 h-14 bg-slate-50 border-none rounded-xl font-bold text-slate-900" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Grid Coordinate (Location)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 opacity-30" />
                    <Input readOnly value={storeData?.location || "Node Not Set"} className="pl-14 h-14 bg-slate-50 border-none rounded-xl font-bold text-slate-900" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-10 border-t border-slate-50 pt-8 flex justify-end items-center bg-slate-50/20">
               <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-black h-12 px-10 uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-50">Commit Registry Updates</Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Dialog open={isPhotoDialogOpen} onOpenChange={(open) => {
        if (!open) stopCamera();
        setIsPhotoDialogOpen(open);
      }}>
        <DialogContent className="rounded-[2.5rem] border-none p-10 bg-white max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-emerald-600 uppercase italic tracking-tighter">Identity Signature</DialogTitle>
          </DialogHeader>
          <div className="space-y-8 py-6 flex flex-col items-center">
            <div className="relative h-56 w-56 rounded-full overflow-hidden bg-slate-50 border-4 border-emerald-50 shadow-inner group">
              {isCameraActive ? (
                <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
              ) : previewUrl ? (
                <Image src={previewUrl} alt="New Profile" fill className="object-cover" data-ai-hint="profile preview" />
              ) : (
                <Image src={storeData?.imageUrl || `https://picsum.photos/seed/${user?.uid}/200`} alt="Current Profile" fill className="object-cover" data-ai-hint="current profile" />
              )}
            </div>

            <div className="flex flex-col w-full gap-3">
              {!isCameraActive ? (
                <>
                  <Button variant="secondary" className="h-14 rounded-xl font-black uppercase text-[10px] tracking-widest bg-emerald-600 text-white shadow-md hover:bg-emerald-700" onClick={startCamera}>
                    <Camera className="h-4 w-4 mr-2" /> Start Lens
                  </Button>
                  <Button variant="outline" className="h-14 rounded-xl font-black uppercase text-[10px] tracking-widest border-slate-200 text-slate-600" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" /> Upload Photo
                  </Button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                </>
              ) : (
                <Button className="h-14 rounded-xl font-black uppercase text-[10px] tracking-widest bg-emerald-500 text-white shadow-lg" onClick={capturePhoto}>
                  Capture Frame
                </Button>
              )}
            </div>
          </div>
          <DialogFooter className="gap-3 pt-4">
            <Button variant="ghost" className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400" onClick={() => setIsPhotoDialogOpen(false)}>Abort</Button>
            <Button className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest bg-slate-900 text-white px-10" onClick={savePhoto} disabled={!previewUrl}>Authorize Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
