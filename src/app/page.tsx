
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  ShieldCheck, 
  Loader2, 
  MapPin, 
  Boxes,
  UserPlus,
  ArrowRight,
  ChevronRight,
  Lock
} from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { signInAnonymously } from "firebase/auth";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const auth = useAuth();
  const { isUserLoading, user } = useUser();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleEntry = async (role: "retailer" | "admin") => {
    if (user) {
      router.push(role === "admin" ? "/admin" : "/dashboard");
      return;
    }
    router.push("/login");
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ECF0F5]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#ECF0F5]">
      <div className="max-w-4xl w-full space-y-12">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="bg-primary p-4 rounded-2xl shadow-lg animate-in zoom-in duration-700">
            <Boxes className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">NE Retail Connect</h1>
            <p className="text-slate-500 font-medium flex items-center justify-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-accent" /> North East Regional Logistics Infrastructure
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Join Network Card */}
          <Card className="border-none shadow-sm hover:shadow-md transition-all bg-white rounded-[2.5rem] overflow-hidden border-t-4 border-t-accent">
            <CardHeader className="pt-10 text-center">
              <div className="mx-auto bg-accent/10 p-5 rounded-2xl text-accent">
                <UserPlus className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl font-bold pt-4">Register New Branch</CardTitle>
              <CardDescription className="px-6">Registration is compulsory for all regional nodes to access the network.</CardDescription>
            </CardHeader>
            <CardContent className="pb-10 px-10">
              <Link href="/register">
                <Button className="w-full h-14 rounded-2xl bg-accent text-primary hover:bg-primary hover:text-white font-black text-sm transition-all uppercase tracking-widest">
                  Start Registration <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Secure Login Card */}
          <Card className="border-none shadow-sm hover:shadow-md transition-all bg-white rounded-[2.5rem] overflow-hidden border-t-4 border-t-primary">
            <CardHeader className="pt-10 text-center">
              <div className="mx-auto bg-primary/10 p-5 rounded-2xl text-primary">
                <Lock className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl font-bold pt-4">Secure Identity Portal</CardTitle>
              <CardDescription className="px-6">Authorized administrators and registered branch managers only.</CardDescription>
            </CardHeader>
            <CardContent className="pb-10 px-10">
              <Link href="/login">
                <Button className="w-full h-14 rounded-2xl bg-primary text-white font-black text-sm shadow-lg transition-all uppercase tracking-widest">
                  Identity Login <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col items-center space-y-4 pt-8">
          <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">
            North East Logistics Infrastructure • v2.5 PRD
          </p>
        </div>
      </div>
    </div>
  );
}
