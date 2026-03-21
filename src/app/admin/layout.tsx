"use client";

import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarInset, SidebarTrigger, SidebarFooter } from "@/components/ui/sidebar";
import { LayoutDashboard, Store, Package, ShoppingCart, LogOut, MapPin, Boxes, UserCircle } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { signOut } from "firebase/auth";
import { toast } from "@/hooks/use-toast";

function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { title: "Retailers", icon: Store, href: "/admin/stores" },
    { title: "Inventory", icon: Package, href: "/admin/inventory" },
    { title: "Orders", icon: ShoppingCart, href: "/admin/orders" },
  ];

  return (
    <Sidebar className="bg-primary border-none text-white">
      <SidebarHeader className="h-24 flex items-center px-8">
        <Link href="/admin" className="flex items-center gap-4">
          <div className="bg-white p-3 rounded-2xl shadow-xl">
            <Boxes className="h-6 w-6 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm tracking-widest uppercase italic leading-none">NE Hub</span>
            <span className="text-[9px] font-bold tracking-[0.2em] text-white/50 uppercase">Regional Node</span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-4 pt-8">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] uppercase font-black tracking-[0.3em] text-white/40 mb-6">Operations Command</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    className={cn(
                      "h-14 rounded-2xl transition-all duration-300",
                      pathname === item.href 
                        ? "bg-white text-primary font-black shadow-[0_10px_20px_rgba(0,0,0,0.1)] translate-x-1" 
                        : "text-white/60 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className={cn("h-5 w-5", pathname === item.href ? "text-primary" : "text-white/40")} />
                      <span className="text-xs font-bold uppercase tracking-widest ml-3">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-8">
        <div className="p-5 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mb-2 text-center">System Telemetry</p>
          <div className="flex items-center justify-between">
             <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
             <span className="text-[10px] font-mono text-accent font-bold">NE-PROD-LIVE</span>
          </div>
        </div>
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
      toast({ title: "Session Closed", description: "Node disconnected from mesh." });
      router.push("/");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-[#ECF0F5]">
        <AdminSidebar />
        <SidebarInset className="flex flex-col min-w-0 bg-transparent">
          <header className="sticky top-0 z-30 flex h-24 shrink-0 items-center gap-6 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl px-10">
            <SidebarTrigger className="text-primary hover:bg-slate-100 h-10 w-10 rounded-xl" />
            <Separator orientation="vertical" className="h-8 bg-slate-100" />
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-900 uppercase italic tracking-tight">Regional Console</span>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                <MapPin className="h-3 w-3 text-accent" /> North East Cluster
              </div>
            </div>
            <div className="ml-auto flex items-center gap-6">
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
              <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                <UserCircle className="h-6 w-6" />
              </div>
            </div>
          </header>
          
          <main className="flex-1 p-10 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
