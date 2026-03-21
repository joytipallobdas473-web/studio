"use client";

import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarInset, SidebarTrigger, SidebarFooter } from "@/components/ui/sidebar";
import { LayoutDashboard, Store, Package, ShoppingCart, LogOut, MapPin, Mountain, UserCircle } from "lucide-react";
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
      <SidebarHeader className="h-20 flex items-center px-6">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-xl">
            <Mountain className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight">NE Admin</span>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-3 pt-6">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] uppercase font-bold tracking-widest text-white/50 mb-4">Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    className={cn(
                      "h-11 rounded-xl transition-colors",
                      pathname === item.href 
                        ? "bg-white text-primary font-bold shadow-lg" 
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{item.title}</span>
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
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Regional Node</p>
          <p className="text-[10px] font-mono text-accent">NE-PROD-01</p>
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
      toast({ title: "Logged Out", description: "Session terminated." });
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
          <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center gap-4 border-b bg-white/80 backdrop-blur-md px-8">
            <SidebarTrigger className="text-primary" />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800">Regional Console</span>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <MapPin className="h-3 w-3 text-accent" /> North East
              </div>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-primary" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
              <div className="h-10 w-10 rounded-full bg-slate-100 border flex items-center justify-center">
                <UserCircle className="h-6 w-6 text-slate-400" />
              </div>
            </div>
          </header>
          
          <main className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}