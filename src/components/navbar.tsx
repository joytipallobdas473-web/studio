"use client";

import Link from "next/link";
import { Package, User, LogOut, History, PlusCircle, LayoutGrid, Star } from "lucide-react";
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
    <nav className="sticky top-0 z-50 w-full border-b bg-white/70 backdrop-blur-2xl border-primary/10 shadow-sm">
      <div className="container flex h-24 items-center justify-between px-10 mx-auto max-w-7xl">
        <Link href="/dashboard" className="flex items-center gap-4 group">
          <div className="bg-primary p-3 rounded-[1.25rem] text-white shadow-[0_10px_25px_-5px_rgba(15,50,45,0.4)] group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
            <Star className="h-6 w-6 fill-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl text-slate-900 uppercase italic tracking-tighter leading-none">Boutique Node</span>
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.5em] mt-1.5 opacity-60">Silk Logistics Grid</span>
          </div>
        </Link>
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-4">
            <Link href="/dashboard/order">
              <Button variant="ghost" size="sm" className={cn(
                "h-12 px-6 rounded-2xl gap-3 font-black uppercase tracking-[0.3em] text-[10px] transition-all",
                pathname === "/dashboard/order" ? "text-primary bg-primary/5 shadow-inner" : "text-slate-400 hover:text-primary hover:bg-primary/5"
              )}>
                <PlusCircle className="h-4.5 w-4.5" />
                Reorder
              </Button>
            </Link>
            <Link href="/dashboard/history">
              <Button variant="ghost" size="sm" className={cn(
                "h-12 px-6 rounded-2xl gap-3 font-black uppercase tracking-[0.3em] text-[10px] transition-all",
                pathname === "/dashboard/history" ? "text-primary bg-primary/5 shadow-inner" : "text-slate-400 hover:text-primary hover:bg-primary/5"
              )}>
                <History className="h-4.5 w-4.5" />
                Telemetry
              </Button>
            </Link>
          </div>
          
          <div className="h-10 w-px bg-primary/10" />
          
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link href="/admin">
                <Button variant="outline" size="sm" className="h-12 px-6 rounded-2xl border-primary/20 text-primary font-black uppercase text-[10px] tracking-[0.3em] hover:bg-primary hover:text-white transition-all">
                  Command
                </Button>
              </Link>
            )}
            <Link href="/dashboard/profile">
              <Button variant="secondary" size="icon" className="h-12 w-12 rounded-[1.25rem] bg-secondary text-slate-600 hover:text-primary hover:shadow-lg transition-all border border-primary/5">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-12 w-12 rounded-[1.25rem] text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}