"use client";

import { useEffect, useState, useMemo } from "react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarInset, SidebarTrigger, SidebarFooter } from "@/components/ui/sidebar";
import { LayoutDashboard, Store, Package, ShoppingCart, LogOut, Terminal, Loader2, Settings, Shield } from "lucide-react";
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
    { title: "Security Core", icon: Settings, href: "/admin/settings" },
  ];

  return (
    <Sidebar className="bg-[#020617] border-r border-white/5">
      <SidebarHeader className="h-32 flex items-center px-10">
        <Link href="/admin" className="flex items-center gap-5 group">
          <div className="bg-primary p-4 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)] group-hover:scale-110 transition-transform duration-500">
            <Terminal className="h-7 w-7 text-background" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl leading-none uppercase tracking-tighter text-white italic">AETHER</span>
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.5em] mt-2">CORE CONSOLE</span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-8 py-10">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[9px] uppercase font-black tracking-[0.6em] text-muted-foreground mb-8">Operations Hub</SidebarGroupLabel>
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
                        ? "bg-primary text-background font-black shadow-[0_10px_30px_rgba(245,158,11,0.2)]" 
                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className={cn("h-5 w-5", pathname === item.href ? "text-background" : "text-primary/60")} />
                      <span className="ml-4 uppercase tracking-wider font-black text-[12px]">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-10">
        <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-full w-1.5 bg-primary/60 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
          <div className="flex items-center justify-between">
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Protocol Status</span>
                <span className="text-[11px] font-black text-white uppercase mt-1.5">Verified Link</span>
             </div>
             <Shield className="h-5 w-5 text-primary" />
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
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (isUserLoading) return;

    if (!user) {
      if (pathname !== "/admin/login") {
        router.push("/admin/login");
      }
    } else {
      const isAdmin = user.email?.toLowerCase().includes("admin") || user.uid === MASTER_ADMIN_UID;
      if (isAdmin) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
        if (pathname !== "/admin/login") {
          router.push("/dashboard");
          toast({ 
            title: "Security Violation", 
            description: "Unauthorized access to Command Core detected.", 
            variant: "destructive" 
          });
        }
      }
    }
  }, [user, isUserLoading, router, pathname]);

  if (isUserLoading || (user && authorized === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="flex flex-col items-center gap-8 text-primary">
          <div className="p-10 rounded-full bg-primary/5 animate-pulse border border-primary/20">
            <Loader2 className="h-12 w-12 animate-spin" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.8em]">Identity Handshake...</span>
        </div>
      </div>
    );
  }

  if (authorized === false && pathname !== "/admin/login") {
    return null;
  }

  if (pathname === "/admin/login") {
    return <div className="dark-admin admin-grid min-h-screen">{children}</div>;
  }

  return (
    <div className="dark-admin admin-grid">
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full bg-background text-foreground">
          <AdminSidebar />
          <SidebarInset className="flex flex-col min-w-0 bg-transparent">
            <header className="sticky top-0 z-30 flex h-28 shrink-0 items-center gap-10 glass-card border-none border-b border-white/5 px-16 bg-[#020617]/80">
              <SidebarTrigger className="text-muted-foreground hover:text-primary h-12 w-12 rounded-2xl hover:bg-white/5 transition-all" />
              <Separator orientation="vertical" className="h-10 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Command Terminal</span>
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-black uppercase tracking-[0.4em] mt-2.5">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                  Regional Grid: Online
                </div>
              </div>
              <div className="ml-auto flex items-center gap-12">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Regional Controller</span>
                  <span className="text-[11px] font-bold text-muted-foreground tracking-tight mt-1.5">{user?.email || "Master Authority"}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all" onClick={async () => {
                  await signOut(auth);
                  router.push("/admin/login");
                  toast({ title: "Terminal Closed" });
                }}>
                  <LogOut className="h-7 w-7" />
                </Button>
              </div>
            </header>
            
            <main className="flex-1 p-16 overflow-y-auto">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}