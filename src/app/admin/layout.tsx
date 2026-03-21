
"use client";

import { useEffect } from "react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarInset, SidebarTrigger, SidebarFooter } from "@/components/ui/sidebar";
import { LayoutDashboard, Store, Package, ShoppingCart, LogOut, MapPin, Boxes, UserCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth, useUser } from "@/firebase";
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
      <SidebarHeader className="h-24 flex items-center px-8">
        <Link href="/admin" className="flex items-center gap-4">
          <div className="bg-white p-3 rounded-2xl shadow-xl">
            <Boxes className="h-6 w-6 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-base leading-none uppercase italic tracking-tighter">NE Hub</span>
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-1">Regional Admin</span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-6">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] uppercase font-black tracking-[0.3em] text-white/30 mb-4">Command Grid</SidebarGroupLabel>
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
                        ? "bg-white text-primary font-black shadow-2xl scale-[1.02]" 
                        : "text-white/50 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className={cn("h-5 w-5", pathname === item.href ? "text-primary" : "text-white/20")} />
                      <span className="ml-4 uppercase italic tracking-tight font-bold">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-8">
        <div className="p-5 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between">
             <div className="h-2 w-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_rgba(38,205,242,0.8)]" />
             <span className="text-[10px] font-black text-accent uppercase tracking-widest">System Online</span>
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
    if (!isUserLoading && !user && pathname !== "/admin/login") {
      router.push("/admin/login");
    } else if (!isUserLoading && user && !user.email?.toLowerCase().includes("admin") && pathname !== "/admin/login") {
      router.push("/");
      toast({ title: "Restricted Node", description: "Admin identity required.", variant: "destructive" });
    }
  }, [user, isUserLoading, router, pathname]);

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-[#ECF0F5]">
        <AdminSidebar />
        <SidebarInset className="flex flex-col min-w-0 bg-transparent">
          <header className="sticky top-0 z-30 flex h-24 shrink-0 items-center gap-6 border-b border-slate-200/60 bg-white/80 backdrop-blur-md px-10">
            <SidebarTrigger className="text-primary hover:bg-slate-100 h-11 w-11 rounded-2xl" />
            <Separator orientation="vertical" className="h-8 bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">Regional Console</span>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
                <MapPin className="h-3 w-3 text-accent" /> NE Cluster Control
              </div>
            </div>
            <div className="ml-auto flex items-center gap-6">
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all" onClick={async () => {
                await signOut(auth);
                router.push("/admin/login");
                toast({ title: "Console Terminated" });
              }}>
                <LogOut className="h-6 w-6" />
              </Button>
              <div className="h-12 w-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-inner">
                <UserCircle className="h-7 w-7" />
              </div>
            </div>
          </header>
          
          <main className="flex-1 p-10 md:p-12 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
