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
    { title: "Overview", icon: LayoutDashboard, href: "/admin" },
    { title: "Retailers", icon: Store, href: "/admin/stores" },
    { title: "Inventory", icon: Package, href: "/admin/inventory" },
    { title: "Orders", icon: ShoppingCart, href: "/admin/orders" },
  ];

  return (
    <Sidebar className="bg-primary border-none text-white">
      <SidebarHeader className="h-20 flex items-center px-6">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="bg-white p-2.5 rounded-xl">
            <Boxes className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-none">NE Hub</span>
            <span className="text-[10px] text-white/50">Regional Admin</span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] uppercase font-bold tracking-widest text-white/40 mb-2">Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    className={cn(
                      "h-12 rounded-xl transition-all",
                      pathname === item.href 
                        ? "bg-white text-primary font-bold shadow-lg" 
                        : "text-white/60 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className={cn("h-4 w-4", pathname === item.href ? "text-primary" : "text-white/40")} />
                      <span className="ml-3">{item.title}</span>
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
             <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
             <span className="text-[10px] font-mono text-accent">SYSTEM ONLINE</span>
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
      toast({ title: "Session Closed", description: "Successfully signed out." });
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
          <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center gap-4 border-b border-slate-200/60 bg-white/80 backdrop-blur-md px-6">
            <SidebarTrigger className="text-primary hover:bg-slate-100 h-9 w-9 rounded-lg" />
            <Separator orientation="vertical" className="h-6 bg-slate-100" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900">Regional Console</span>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <MapPin className="h-3 w-3 text-accent" /> North East Cluster
              </div>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
              <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                <UserCircle className="h-6 w-6" />
              </div>
            </div>
          </header>
          
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}