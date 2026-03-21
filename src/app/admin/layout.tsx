"use client";

import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarInset, SidebarTrigger, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { LayoutDashboard, Store, Package, ShoppingCart, LogOut, ShieldCheck, UserCircle, Cpu, Globe, Zap, Network } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

function AdminSidebar() {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  const { user } = useUser();

  const menuItems = [
    { title: "Network Status", icon: LayoutDashboard, href: "/admin" },
    { title: "Merchant Nodes", icon: Store, href: "/admin/stores" },
    { title: "SKU Registry", icon: Package, href: "/admin/inventory" },
    { title: "Traffic Control", icon: ShoppingCart, href: "/admin/orders" },
  ];

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="bg-[#050608] border-r border-white/5 text-slate-400">
      <SidebarHeader className="h-28 flex items-center px-8 border-b border-white/5 bg-[#050608]">
        <Link href="/admin" onClick={handleLinkClick} className="flex items-center gap-4 font-bold text-white overflow-hidden">
          <div className="bg-primary p-3 rounded-2xl shadow-[0_0_25px_rgba(59,130,246,0.3)] shrink-0">
            <Cpu className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-lg tracking-tighter font-black italic">RETAIL OS</span>
            <span className="text-[9px] text-primary font-black uppercase tracking-[0.3em]">Root Core</span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-4 pt-10 bg-[#050608]">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[9px] uppercase font-black tracking-[0.4em] text-slate-600 mb-6">Core Protocols</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-3">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href} 
                    tooltip={item.title}
                    className={cn(
                      "h-14 rounded-2xl transition-all duration-500",
                      pathname === item.href 
                        ? "bg-primary text-white font-black shadow-[0_12px_24px_rgba(59,130,246,0.2)]" 
                        : "hover:bg-white/[0.03] hover:text-white"
                    )}
                  >
                    <Link href={item.href} onClick={handleLinkClick}>
                      <item.icon className={cn("h-5 w-5", pathname === item.href ? "text-white" : "text-slate-500")} />
                      <span className="text-xs uppercase tracking-wider">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/5 p-8 space-y-8 bg-[#050608]">
        {user && (
          <div className="group-data-[collapsible=icon]:hidden p-5 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
            <div className="flex items-center justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest">
              <span className="flex items-center gap-2"><Network className="h-3 w-3" /> Node ID</span>
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6] animate-pulse" />
            </div>
            <div className="text-[10px] font-mono break-all text-primary bg-black/40 p-4 rounded-2xl border border-white/5 select-all leading-tight">
              {user.uid}
            </div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-14 rounded-2xl hover:bg-rose-500/10 hover:text-rose-500 transition-colors">
              <Link href="/" onClick={handleLinkClick}>
                <LogOut className="h-5 w-5" />
                <span className="text-xs font-black uppercase tracking-widest">Terminate</span>
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
      <div className="flex min-h-svh w-full bg-[#02040a] text-slate-200">
        <AdminSidebar />
        <SidebarInset className="flex flex-col min-w-0 bg-transparent border-l border-white/5">
          <header className="sticky top-0 z-30 flex h-28 shrink-0 items-center gap-8 border-b border-white/5 bg-[#02040a]/80 backdrop-blur-3xl px-12">
            <SidebarTrigger className="text-slate-500 hover:text-white transition-colors" />
            <div className="h-10 w-px bg-white/5 hidden md:block" />
            <div className="flex flex-col">
              <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">Operations Center</h2>
              <div className="flex items-center gap-3">
                <Globe className="h-3 w-3 text-primary animate-spin-slow" />
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Active Cluster: Global-Sync-01</span>
              </div>
            </div>
            
            <div className="ml-auto flex items-center gap-8">
              <div className="hidden lg:flex items-center gap-4 px-6 py-3 bg-primary/5 border border-primary/20 rounded-2xl">
                <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_#3b82f6]" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Latency: 24ms</span>
              </div>
              <Separator orientation="vertical" className="h-12 bg-white/5" />
              <Button variant="ghost" size="icon" className="rounded-2xl h-14 w-14 text-slate-500 hover:text-white hover:bg-white/5">
                <UserCircle className="h-7 w-7" />
              </Button>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-12">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}