"use client";

import Link from "next/link";
import { Package, User, LogOut, History, PlusCircle, Star, Zap, Cpu, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const MASTER_ADMIN_UID = "j96izCkggNcL002AHiJjzGb18Bf2";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();
  const isAdmin = user?.email?.toLowerCase().includes("admin") || user?.uid === MASTER_ADMIN_UID;

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({
        title: "Node Offline",
        description: "Branch session terminated securely.",
      });
      router.push("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur-md border-slate-200/60 shadow-sm">
      <div className="container flex h-20 items-center justify-between px-8 mx-auto max-w-7xl">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="relative bg-emerald-600 p-2 rounded-xl text-white group-hover:rotate-12 transition-all">
              <Leaf className="h-5 w-5" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg text-slate-900 uppercase tracking-tighter leading-none">Branch Hub</span>
            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.3em] mt-1">Regional Logistics</span>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-1 p-1 bg-slate-100/50 rounded-xl border border-slate-200/50">
            <Link href="/dashboard/order">
              <Button variant="ghost" size="sm" className={cn(
                "h-9 px-4 rounded-lg gap-2 font-black uppercase tracking-widest text-[9px] transition-all",
                pathname === "/dashboard/order" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-emerald-600"
              )}>
                <PlusCircle className="h-3.5 w-3.5" />
                Provision
              </Button>
            </Link>
            <Link href="/dashboard/history">
              <Button variant="ghost" size="sm" className={cn(
                "h-9 px-4 rounded-lg gap-2 font-black uppercase tracking-widest text-[9px] transition-all",
                pathname === "/dashboard/history" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-emerald-600"
              )}>
                <History className="h-3.5 w-3.5" />
                Telemetry
              </Button>
            </Link>
          </div>
          
          <div className="h-6 w-px bg-slate-200" />
          
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link href="/admin">
                <Button className="h-9 px-4 rounded-lg bg-slate-900 text-white font-black uppercase text-[9px] tracking-widest hover:bg-emerald-600 transition-all shadow-sm">
                  Command
                </Button>
              </Link>
            )}
            <Link href="/dashboard/profile">
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-slate-200 text-slate-500 hover:bg-white hover:text-emerald-600 transition-all shadow-sm">
                <User className="h-4 w-4" />
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}