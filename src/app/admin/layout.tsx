"use client";

import { useEffect } from "react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarInset, SidebarTrigger, SidebarFooter } from "@/components/ui/sidebar";
import { LayoutDashboard, Store, Package, ShoppingCart, LogOut, MapPin, Boxes, UserCircle, Loader2, Settings, ShieldCheck, Cpu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth, useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { signOut } from "firebase/auth";
import { toast } from "@/hooks/use-toast";

const MASTER_ADMIN_UID = "j96izCkggNcL002AHiJjzGb18Bf2";

function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { title: "Grid Stats", icon: LayoutDashboard, href: "/admin" },
    { title: "Retail Nodes", icon: Store, href: "/admin/stores" },
    { title: "Inventory", icon: Package, href: "/admin/inventory" },
    { title: "Traffic Logs", icon: ShoppingCart, href: "/admin/orders" },
    { title: "Core Protocols", icon: Settings, href: "/admin/settings" },
  ];

  return (
    <Sidebar className="bg-sidebar border-r border-sidebar-border">
      <SidebarHeader className="h-24 flex items-center px-8">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="bg-primary p-2.5 rounded-xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg leading-none uppercase italic tracking-tighter text-white">NE HUB</span>
            <span className="text-[9px] font-black text-accent uppercase tracking-widest mt-1">LOGISTICS GRID</span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-4 py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[9px] uppercase font-black tracking-[0.3em] text-white/30 mb-4">Operations Console</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    className={cn(
                      "h-12 rounded-xl transition-all duration-200",
                      pathname === item.href 
                        ? "bg-white/10 text-accent font-black shadow-sm" 
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className={cn("h-4 w-4", pathname === item.href ? "text-accent" : "text-white/20")} />
                      <span className="ml-3 uppercase italic tracking-tight font-bold text-xs">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6">
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between">
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Protocol</span>
                <span className="text-[10px] font-black text-white uppercase italic">Active Node</span>
             </div>
             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();

  useEffect(() => {
    if (!isUserLoading) {
      if (!user && pathname !== "/admin/login") {
        router.push("/admin/login");
      } else if (user && pathname !== "/admin/login") {
        const isAdmin = user.email?.toLowerCase().includes("admin") || user.uid === MASTER_ADMIN_UID;
        if (!isAdmin) {
          signOut(auth).then(() => {
            router.push("/login");
            toast({ 
              title: "Identity Breach Alert", 
              description: "Unauthorized node signatures are purged from command paths.", 
              variant: "destructive" 
            });
          });
        }
      }
    }
  }, [user, isUserLoading, router, pathname, auth]);

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">Syncing Identity...</span>
        </div>
      </div>
    );
  }

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const isAdmin = user?.email?.toLowerCase().includes("admin") || user?.uid === MASTER_ADMIN_UID;
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AdminSidebar />
        <SidebarInset className="flex flex-col min-w-0 bg-transparent">
          <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center gap-6 border-b border-slate-200 bg-white/80 backdrop-blur-xl px-10">
            <SidebarTrigger className="text-slate-400 hover:text-primary h-10 w-10 rounded-xl" />
            <Separator orientation="vertical" className="h-8 bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-lg font-black text-slate-900 uppercase italic tracking-tighter leading-none">Console Terminal</span>
              <div className="flex items-center gap-2 text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">
                <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                Regional Cluster Live
              </div>
            </div>
            <div className="ml-auto flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[9px] font-black text-primary uppercase tracking-widest">Master Auth</span>
                <span className="text-[10px] font-bold text-slate-500 lowercase tracking-tight">{user.email}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors" onClick={async () => {
                await signOut(auth);
                router.push("/admin/login");
                toast({ title: "Console Terminated" });
              }}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </header>
          
          <main className="flex-1 p-10 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-10">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}