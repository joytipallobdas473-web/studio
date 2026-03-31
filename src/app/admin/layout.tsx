"use client";

import { useEffect } from "react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarHeader as SBHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarInset, SidebarTrigger, SidebarFooter } from "@/components/ui/sidebar";
import { LayoutDashboard, Store, Package, ShoppingCart, LogOut, Cpu, Loader2, Settings, Zap } from "lucide-react";
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
    <Sidebar className="glass-card border-none">
      <SidebarHeader className="h-28 flex items-center px-10">
        <Link href="/admin" className="flex items-center gap-4 group">
          <div className="bg-primary p-3 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)] group-hover:rotate-12 transition-transform duration-300">
            <Cpu className="h-6 w-6 text-background" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl leading-none uppercase italic tracking-tighter text-white">AETHER</span>
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mt-2">NETWORK GRID</span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-6 py-8">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[9px] uppercase font-black tracking-[0.5em] text-muted-foreground mb-6">Operations Console</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-3">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    className={cn(
                      "h-14 rounded-2xl transition-all duration-300",
                      pathname === item.href 
                        ? "bg-primary text-background font-black shadow-[0_0_30px_rgba(6,182,212,0.2)]" 
                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className={cn("h-5 w-5", pathname === item.href ? "text-background" : "text-primary/40")} />
                      <span className="ml-4 uppercase italic tracking-tight font-black text-xs">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-8">
        <div className="p-6 bg-white/5 rounded-3xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-full w-1 bg-primary/30" />
          <div className="flex items-center justify-between">
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Neural Link</span>
                <span className="text-[10px] font-black text-white uppercase italic mt-1">Authorized Node</span>
             </div>
             <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(6,182,212,1)]" />
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
          // Instead of sign out, redirect to store dashboard to prevent session loss
          router.push("/dashboard");
          toast({ 
            title: "Access Restricted", 
            description: "Unauthorized node signatures are routed to the Branch Portal.", 
            variant: "destructive" 
          });
        }
      }
    }
  }, [user, isUserLoading, router, pathname, auth]);

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em]">Syncing Identity...</span>
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
          <header className="sticky top-0 z-30 flex h-24 shrink-0 items-center gap-8 glass-card border-none border-b border-white/5 px-12">
            <SidebarTrigger className="text-muted-foreground hover:text-primary h-12 w-12 rounded-2xl hover:bg-white/5 transition-all" />
            <Separator orientation="vertical" className="h-10 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Console Terminal</span>
              <div className="flex items-center gap-3 text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em] mt-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                Regional Grid Live
              </div>
            </div>
            <div className="ml-auto flex items-center gap-10">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">Master Identity</span>
                <span className="text-[10px] font-bold text-muted-foreground tracking-tight mt-1">{user.email}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all" onClick={async () => {
                await signOut(auth);
                router.push("/admin/login");
                toast({ title: "Console Terminated" });
              }}>
                <LogOut className="h-6 w-6" />
              </Button>
            </div>
          </header>
          
          <main className="flex-1 p-12 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}