"use client";

import Link from "next/link";
import { Package, User, LogOut, History, PlusCircle, Star, Zap, Cpu } from "lucide-react";
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
        description: "Boutique link terminated.",
      });
      router.push("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-xl border-slate-200">
      <div className="container flex h-24 items-center justify-between px-8 mx-auto max-w-7xl">
        <Link href="/dashboard" className="flex items-center gap-4 group">
          <div className="relative">
            <div className="relative bg-indigo-600 p-2.5 rounded-xl text-white group-hover:scale-110 transition-all">
              <Cpu className="h-5 w-5" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl text-slate-900 uppercase italic tracking-tighter leading-none">Neo Node</span>
            <span className="text-[8px] font-black text-indigo-600 uppercase tracking-[0.4em] mt-1.5">Logistics Hub</span>
          </div>
        </Link>

        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
            <Link href="/dashboard/order">
              <Button variant="ghost" size="sm" className={cn(
                "h-11 px-6 rounded-xl gap-2 font-black uppercase tracking-widest text-[9px] transition-all",
                pathname === "/dashboard/order" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-indigo-600"
              )}>
                <PlusCircle className="h-3.5 w-3.5" />
                Provision
              </Button>
            </Link>
            <Link href="/dashboard/history">
              <Button variant="ghost" size="sm" className={cn(
                "h-11 px-6 rounded-xl gap-2 font-black uppercase tracking-widest text-[9px] transition-all",
                pathname === "/dashboard/history" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-indigo-600"
              )}>
                <History className="h-3.5 w-3.5" />
                Telemetry
              </Button>
            </Link>
          </div>
          
          <div className="h-8 w-px bg-slate-200" />
          
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link href="/admin">
                <Button className="h-11 px-6 rounded-xl bg-slate-900 text-white font-black uppercase text-[9px] tracking-widest hover:bg-indigo-600 transition-all shadow-sm">
                  Command
                </Button>
              </Link>
            )}
            <Link href="/dashboard/profile">
              <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm">
                <User className="h-4.5 w-4.5" />
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-11 w-11 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}