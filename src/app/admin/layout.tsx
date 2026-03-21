"use client";

import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarInset, SidebarTrigger, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { LayoutDashboard, Store, Package, ShoppingCart, LogOut, ShieldCheck, UserCircle, Globe, Zap, Network, Map, Mountain } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser, useAuth } from "@/firebase";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";
import { toast } from "@/hooks/use-toast";

function AdminSidebar() {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  const { user } = useUser();

  const menuItems = [
    { title: "Network Status", icon: LayoutDashboard, href: "/admin" },
    { title: "Retail Nodes", icon: Store, href: "/admin/stores" },
    { title: "SKU Registry", icon: Package, href: "/admin/inventory" },
    { title: "Transit Flows", icon: ShoppingCart, href: "/admin/orders" },
  ];

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="bg-primary border-r-0 text-primary-foreground">
      <SidebarHeader className="h-24 flex items-center px-6 border-b border-white/10">
        <Link href="/admin" onClick={handleLinkClick} className="flex items-center gap-3 font-bold text-white overflow-hidden">
          <div className="bg-accent p-2.5 rounded-xl shadow-lg shrink-0">
            <Mountain className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-base tracking-tighter font-black uppercase">NE CONNECT</span>
            <span className="text-[8px] text-accent font-black uppercase tracking-[0.3em]">Regional Operations</span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-3 pt-8">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[9px] uppercase font-black tracking-[0.4em] text-white/50 mb-4">Command Protocols</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href} 
                    tooltip={item.title}
                    className={cn(
                      "h-12 rounded-xl transition-all duration-300",
                      pathname === item.href 
                        ? "bg-white text-primary font-black shadow-lg" 
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Link href={item.href} onClick={handleLinkClick}>
                      <item.icon className={cn("h-5 w-5", pathname === item.href ? "text-primary" : "text-white/50")} />
                      <span className="text-xs uppercase tracking-wider font-bold">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6 space-y-6">
        {user && (
          <div className="group-data-[collapsible=icon]:hidden p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-[8px] font-black text-white/40 uppercase tracking-widest">
              <span className="flex items-center gap-2"><Network className="h-3 w-3" /> System Root</span>
              <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            </div>
            <div className="text-[9px] font-mono break-all text-accent/80 bg-black/20 p-3 rounded-xl border border-white/5 select-all leading-tight">
              {user.uid}
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Session Terminated", description: "Node disconnected from grid." });
      router.push("/");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-svh w-full bg-background text-foreground ne-gradient-bg">
        <AdminSidebar />
        <SidebarInset className="flex flex-col min-w-0 bg-transparent">
          <header className="sticky top-0 z-30 flex h-24 shrink-0 items-center gap-6 border-b bg-white/80 backdrop-blur-xl px-10">
            <SidebarTrigger className="text-primary hover:bg-secondary rounded-xl transition-colors" />
            <Separator orientation="vertical" className="h-8 bg-secondary" />
            <div className="flex flex-col">
              <h2 className="text-lg font-black text-primary tracking-tighter uppercase italic">Operations Command</h2>
              <div className="flex items-center gap-2">
                <Map className="h-3 w-3 text-accent animate-pulse" />
                <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em]">Active Sector: NE-Region-7</span>
              </div>
            </div>
            
            <div className="ml-auto flex items-center gap-6">
              <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-secondary rounded-xl border">
                <div className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
                <span className="text-[9px] font-black text-primary uppercase tracking-widest">Mesh Latency: 28ms</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="rounded-xl h-12 w-12 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-10">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}