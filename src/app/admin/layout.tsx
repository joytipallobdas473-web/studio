"use client";

import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarInset, SidebarTrigger, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { LayoutDashboard, Store, Package, ShoppingCart, LogOut, ShieldCheck, UserCircle, Key, Cpu, Zap, Activity, Globe } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

function AdminSidebar() {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  const { user } = useUser();

  const menuItems = [
    { title: "Network Overview", icon: LayoutDashboard, href: "/admin" },
    { title: "Retail Partners", icon: Store, href: "/admin/stores" },
    { title: "Inventory Engine", icon: Package, href: "/admin/inventory" },
    { title: "Global Orders", icon: ShoppingCart, href: "/admin/orders" },
  ];

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="bg-[#0a0c10] border-r-white/5 text-slate-400">
      <SidebarHeader className="h-24 flex items-center px-6 border-b border-white/5 bg-[#0a0c10]">
        <Link href="/admin" onClick={handleLinkClick} className="flex items-center gap-4 font-bold text-white overflow-hidden">
          <div className="bg-primary p-2.5 rounded-xl shadow-[0_0_20px_rgba(var(--primary),0.3)] shrink-0">
            <Cpu className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-base tracking-tight font-black">RETAIL OS</span>
            <span className="text-[10px] text-primary font-mono uppercase tracking-widest">Global Node</span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-3 pt-8 bg-[#0a0c10]">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] uppercase font-bold tracking-[0.3em] text-slate-500 mb-4">Core Systems</SidebarGroupLabel>
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
                        ? "bg-primary text-white font-bold shadow-[0_8px_16px_rgba(var(--primary),0.2)]" 
                        : "hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Link href={item.href} onClick={handleLinkClick}>
                      <item.icon className={cn("h-5 w-5", pathname === item.href ? "text-white" : "text-slate-500")} />
                      <span className="text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/5 p-6 space-y-6 bg-[#0a0c10]">
        {user && (
          <div className="group-data-[collapsible=icon]:hidden p-4 bg-slate-900/40 border border-white/5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Identity</span>
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
            </div>
            <div className="text-[10px] font-mono break-all text-primary bg-black/40 p-3 rounded-xl border border-white/5 select-all">
              {user.uid}
            </div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-12 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-colors">
              <Link href="/" onClick={handleLinkClick}>
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-bold uppercase tracking-wider">Terminate</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-svh w-full bg-[#050608] text-slate-200">
        <AdminSidebar />
        <SidebarInset className="flex flex-col min-w-0 bg-transparent border-l border-white/5">
          <header className="sticky top-0 z-30 flex h-24 shrink-0 items-center gap-6 border-b border-white/5 bg-[#050608]/80 backdrop-blur-2xl px-10">
            <SidebarTrigger className="text-slate-400 hover:text-white" />
            <div className="h-8 w-px bg-white/5 hidden md:block" />
            <div className="flex flex-col">
              <h2 className="text-lg font-black text-white tracking-tight uppercase">Control Center</h2>
              <div className="flex items-center gap-2">
                <Globe className="h-3 w-3 text-primary animate-pulse" />
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Cluster: US-EAST-1</span>
              </div>
            </div>
            
            <div className="ml-auto flex items-center gap-6">
              <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 border border-primary/20 rounded-full">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-black text-primary uppercase tracking-wider">Sync Synchronized</span>
              </div>
              <Separator orientation="vertical" className="h-10 bg-white/5" />
              <Button variant="ghost" size="icon" className="rounded-2xl h-11 w-11 text-slate-400 hover:text-white hover:bg-white/5">
                <UserCircle className="h-6 w-6" />
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
