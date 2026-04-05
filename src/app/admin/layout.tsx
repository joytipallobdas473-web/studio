"use client";

import { useEffect, useState, useMemo } from "react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarInset, SidebarTrigger, SidebarFooter } from "@/components/ui/sidebar";
import { LayoutDashboard, Store, Package, ShoppingCart, LogOut, Terminal, Loader2, Settings, Shield, Cpu, Activity } from "lucide-react";
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
    <Sidebar className="bg-black border-r border-primary/10">
      <SidebarHeader className="h-28 flex items-center px-8">
        <Link href="/admin" className="flex items-center gap-4 group">
          <div className="bg-primary/10 p-3 rounded-xl border border-primary/20 group-hover:scale-110 transition-all shadow-[0_0_20px_rgba(0,255,255,0.1)]">
            <Cpu className="h-6 w-6 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl leading-none uppercase tracking-tighter text-white italic">AETHER</span>
            <span className="text-[8px] font-black text-primary uppercase tracking-[0.4em] mt-1.5 animate-pulse">COMMAND_V4</span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-6 py-8">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[8px] uppercase font-black tracking-[0.5em] text-muted-foreground mb-6 opacity-50">Operations Console</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    className={cn(
                      "h-12 rounded-xl transition-all",
                      pathname === item.href 
                        ? "bg-primary text-black font-black shadow-[0_0_20px_rgba(0,255,255,0.3)]" 
                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className={cn("h-4 w-4", pathname === item.href ? "text-black" : "text-primary/40")} />
                      <span className="ml-3 uppercase tracking-widest font-black text-[10px]">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-8">
        <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-full w-1 bg-primary/40 shadow-[0_0_15px_rgba(0,255,255,0.5)] animate-pulse" />
          <div className="flex items-center justify-between">
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Protocol</span>
                <span className="text-[10px] font-black text-white uppercase mt-1 italic">Verified Link</span>
             </div>
             <Shield className="h-4 w-4 text-primary animate-pulse" />
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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-6">
          <div className="p-1 w-20 h-20 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <span className="text-[9px] font-black uppercase tracking-[0.8em] text-primary/60">Decrypting Node</span>
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
            <header className="sticky top-0 z-30 flex h-24 shrink-0 items-center gap-8 border-b border-primary/10 px-12 bg-black/60 backdrop-blur-xl">
              <SidebarTrigger className="text-muted-foreground hover:text-primary h-10 w-10 rounded-xl hover:bg-white/5 transition-all" />
              <Separator orientation="vertical" className="h-8 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Command Terminal</span>
                <div className="flex items-center gap-3 text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em] mt-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-cyan" />
                  Grid Status: Optimal
                </div>
              </div>
              <div className="ml-auto flex items-center gap-10">
                <div className="hidden md:flex flex-col items-end opacity-60">
                  <span className="text-[8px] font-black text-primary uppercase tracking-widest">Regional Controller</span>
                  <span className="text-[10px] font-bold text-white tracking-tight mt-1 font-mono">{user?.email?.split('@')[0] || "AUTHORITY"}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10" onClick={async () => {
                  await signOut(auth);
                  router.push("/admin/login");
                  toast({ title: "Terminal Terminated" });
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
    </div>
  );
}