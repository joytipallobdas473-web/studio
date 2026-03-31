"use client";

import Link from "next/link";
import { Package, User, LogOut, History, PlusCircle, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { toast } from "@/hooks/use-toast";

const MASTER_ADMIN_UID = "j96izCkggNcL002AHiJjzGb18Bf2";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();
  const isAdmin = user?.email?.toLowerCase().includes("admin") || user?.uid === MASTER_ADMIN_UID;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Node Session Terminated",
        description: "Secure terminal closed.",
      });
      router.push("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md border-slate-200">
      <div className="container flex h-20 items-center justify-between px-6 mx-auto">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="bg-primary p-2.5 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg text-slate-900 uppercase italic tracking-tighter leading-none">Branch Portal</span>
            <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em] mt-1">Regional Retail Node</span>
          </div>
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2">
            <Link href="/dashboard/order">
              <Button variant="ghost" size="sm" className={cn(
                "h-10 px-4 rounded-xl gap-2 font-bold uppercase tracking-widest text-[10px]",
                pathname === "/dashboard/order" ? "text-primary bg-primary/5" : "text-slate-500"
              )}>
                <PlusCircle className="h-4 w-4" />
                New Reorder
              </Button>
            </Link>
            <Link href="/dashboard/history">
              <Button variant="ghost" size="sm" className={cn(
                "h-10 px-4 rounded-xl gap-2 font-bold uppercase tracking-widest text-[10px]",
                pathname === "/dashboard/history" ? "text-primary bg-primary/5" : "text-slate-500"
              )}>
                <History className="h-4 w-4" />
                Log Registry
              </Button>
            </Link>
          </div>
          
          <div className="h-8 w-px bg-slate-200" />
          
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link href="/admin">
                <Button variant="outline" size="sm" className="h-10 rounded-xl border-primary/20 text-primary font-black uppercase text-[9px] tracking-widest">
                  Command Deck
                </Button>
              </Link>
            )}
            <Link href="/dashboard/profile">
              <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 hover:text-primary transition-colors">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
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

import { cn } from "@/lib/utils";
