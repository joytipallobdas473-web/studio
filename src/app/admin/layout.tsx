"use client";

import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarInset, SidebarTrigger, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { LayoutDashboard, Store, Package, ShoppingCart, LogOut, ShieldCheck, UserCircle, Key, Cpu, Zap } from "lucide-react";
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
    <Sidebar collapsible="icon" className="bg-slate-950 border-r-slate-800 text-slate-400">
      <SidebarHeader className="h-20 flex items-center px-6 border-b border-slate-800">
        <Link href="/admin" onClick={handleLinkClick} className="flex items-center gap-3 font-bold text-white overflow-hidden">
          <div className="bg-primary p-2 rounded-xl shadow-[0_0_15px_rgba(var(--primary),0.3)]">
            <Cpu className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm tracking-tight">RETAIL OS</span>
            <span className="text-[10px] text-slate-500 font-mono">v2.0.4-PRO</span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-2 pt-6">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500 mb-2">Systems</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href} 
                    tooltip={item.title}
                    className={cn(
                      "h-11 rounded-lg transition-all duration-200",
                      pathname === item.href 
                        ? "bg-primary/10 text-primary font-bold shadow-sm" 
                        : "hover:bg-slate-900 hover:text-white"
                    )}
                  >
                    <Link href={item.href} onClick={handleLinkClick}>
                      <item.icon className={cn("h-4 w-4", pathname === item.href ? "text-primary" : "text-slate-500")} />
                      <span className="text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-800 p-6 space-y-6">
        {user && (
          <div className="group-data-[collapsible=icon]:hidden p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span className="flex items-center gap-1"><Key className="h-3 w-3" /> Root ID</span>
              <Badge variant="outline" className="h-4 px-1 text-[8px] border-slate-700 text-slate-400">SECURE</Badge>
            </div>
            <div className="text-[10px] font-mono break-all text-slate-300 bg-slate-950 p-2 rounded border border-slate-800 select-all">
              {user.uid}
            </div>
            <p className="text-[9px] text-slate-500 italic leading-tight">
              UID restricted. Link this ID to <code>roles_admin</code> to escalate privileges.
            </p>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="hover:bg-red-500/10 hover:text-red-400 transition-colors">
              <Link href="/" onClick={handleLinkClick}>
                <LogOut className="h-4 w-4" />
                <span className="text-sm font-medium">Terminate Session</span>
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
      <div className="flex min-h-svh w-full bg-[#0a0c10]">
        <AdminSidebar />
        <SidebarInset className="flex flex-col min-w-0 bg-transparent">
          <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center gap-4 border-b border-slate-800/50 bg-[#0a0c10]/80 backdrop-blur-xl px-8">
            <SidebarTrigger className="text-slate-400 hover:text-white" />
            <div className="h-6 w-px bg-slate-800 hidden md:block" />
            <div className="flex flex-col">
              <h2 className="text-sm font-bold text-white tracking-tight">Command Center</h2>
              <span className="text-[10px] text-slate-500 font-medium">Real-time Node Monitoring</span>
            </div>
            
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/5 border border-green-500/20 rounded-full">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Sync Active</span>
              </div>
              <Separator orientation="vertical" className="h-8 bg-slate-800" />
              <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-white">
                <UserCircle className="h-5 w-5" />
              </Button>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}