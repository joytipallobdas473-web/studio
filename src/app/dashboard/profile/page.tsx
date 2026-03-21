
"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Mail, MapPin, Building, Fingerprint, Loader2, BadgeCheck, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const storeRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "stores", user.uid);
  }, [db, user]);

  const { data: storeData, isLoading: storeLoading } = useDoc(storeRef);

  if (isUserLoading || storeLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-primary">Account Settings</h1>
          <p className="text-muted-foreground font-body">Manage your branch details and network identity.</p>
        </div>
        {storeData?.status && (
          <Badge className={cn(
            "h-8 px-4 font-bold uppercase tracking-widest text-[10px] rounded-xl",
            storeData.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'
          )}>
            {storeData.status === 'active' ? <BadgeCheck className="w-3 h-3 mr-2" /> : <Clock className="w-3 h-3 mr-2" />}
            {storeData.status}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden bg-white">
            <CardContent className="pt-8 text-center space-y-4">
              <Avatar className="h-24 w-24 mx-auto border-4 border-slate-100">
                <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/200`} />
                <AvatarFallback className="bg-primary text-white font-bold">
                  {storeData?.managerName?.substring(0, 2).toUpperCase() || "JD"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{storeData?.managerName || "New Manager"}</h3>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">
                  {storeData?.name || "Unregistered Branch"}
                </p>
              </div>
              <Button variant="outline" className="w-full h-11 rounded-xl font-bold border-slate-200 text-slate-600">Update Photo</Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Security Nodes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Fingerprint className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium text-slate-600">Secure Access</span>
                </div>
                <div className="h-2 w-8 rounded-full bg-emerald-500" />
              </div>
              <div className="text-[10px] text-slate-400 font-mono break-all bg-slate-50 p-2 rounded-lg">
                ID: {user?.uid}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Branch Registry</CardTitle>
              <CardDescription>Your current information in the regional logistics network.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 ml-1">Manager Identity</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input readOnly value={storeData?.managerName || ""} className="pl-10 h-12 bg-slate-50 border-none rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 ml-1">Contact Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input readOnly value={storeData?.email || user?.email || ""} className="pl-10 h-12 bg-slate-50 border-none rounded-xl" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 ml-1">Branch Designation</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input readOnly value={storeData?.name || "Pending..."} className="pl-10 h-12 bg-slate-50 border-none rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 ml-1">Node Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input readOnly value={storeData?.location || "Not Set"} className="pl-10 h-12 bg-slate-50 border-none rounded-xl" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-slate-50 pt-6 flex justify-between items-center bg-slate-50/30">
               <p className="text-[10px] text-slate-400 font-medium">To modify registry data, contact regional admin.</p>
               <Button className="bg-primary hover:bg-primary/90 rounded-xl font-bold h-11 px-8">Save Preferences</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
