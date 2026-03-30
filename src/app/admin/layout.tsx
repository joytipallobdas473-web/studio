
"use client";

import { useEffect } from "react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarInset, SidebarTrigger, SidebarFooter } from "@/components/ui/sidebar";
import { LayoutDashboard, Store, Package, ShoppingCart, LogOut, MapPin, Boxes, UserCircle, Loader2, Settings, ShieldCheck } from "lucide-react";
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
    { title: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { title: "Retailers", icon: Store, href: "/admin/stores" },
    { title: "Inventory", icon: Package, href: "/admin/inventory" },
    { title: "Orders", icon: ShoppingCart, href: "/admin/orders" },
    { title: "Settings", icon: Settings, href: "/admin/settings" },
  ];

  return (
    <Sidebar className="bg-background border-r border-border/50">
      <SidebarHeader className="h-28 flex items-center px-8 border-b border-border/30">
        <Link href="/admin" className="flex items-center gap-4 group">
          <div className="command-gradient p-3 rounded-2xl shadow-[0_0_30px_rgba(38,205,242,0.3)] group-hover:scale-110 transition-transform duration-500">
            <Boxes className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl leading-none uppercase italic tracking-tighter text-white">NE HUB</span>
            <span className="text-[9px] font-black text-accent uppercase tracking-[0.3em] mt-1">Command Grid</span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-6 py-8">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] uppercase font-black tracking-[0.4em] text-muted-foreground/50 mb-6">Operations Hub</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-3">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    className={cn(
                      "h-14 rounded-2xl transition-all duration-500 border border-transparent",
                      pathname === item.href 
                        ? "bg-accent/10 text-accent font-black border-accent/20 shadow-[0_0_20px_rgba(38,205,242,0.1)]" 
                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className={cn("h-5 w-5", pathname === item.href ? "text-accent" : "text-muted-foreground/40")} />
                      <span className="ml-4 uppercase italic tracking-tight font-bold">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-8 border-t border-border/30">
        <div className="p-6 bg-accent/5 rounded-[2rem] border border-accent/10 backdrop-blur-md group">
          <div className="flex items-center justify-between">
             <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-accent/60 uppercase tracking-widest">Master Auth</span>
                <span className="text-[10px] font-black text-white uppercase tracking-tighter italic">Secure Node</span>
             </div>
             <ShieldCheck className="h-5 w-5 text-accent animate-pulse" />
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
    if (!isUserLoading) {
      if (!user && pathname !== "/admin/login") {
        router.push("/admin/login");
      } else if (user && pathname !== "/admin/login") {
        const isAdmin = user.email?.toLowerCase().includes("admin") || user.uid === MASTER_ADMIN_UID;
        if (!isAdmin) {
          signOut(auth).then(() => {
            router.push("/login");
            toast({ 
              title: "Identity Breach Alert", 
              description: "Unauthorized node signatures are purged from command paths.", 
              variant: "destructive" 
            });
          });
        }
      }
    }
  }, [user, isUserLoading, router, pathname, auth]);

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="command-gradient p-5 rounded-3xl animate-pulse shadow-[0_0_50px_rgba(38,205,242,0.2)]">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
          <span className="text-[10px] font-black text-accent uppercase tracking-[0.5em]">Identity Sync...</span>
        </div>
      </div>
    );
  }

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const isAdmin = user?.email?.toLowerCase().includes("admin") || user?.uid === MASTER_ADMIN_UID;
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AdminSidebar />
        <SidebarInset className="flex flex-col min-w-0 bg-transparent">
          <header className="sticky top-0 z-30 flex h-28 shrink-0 items-center gap-8 border-b border-border/30 bg-background/80 backdrop-blur-2xl px-12">
            <SidebarTrigger className="text-accent hover:bg-white/5 h-12 w-12 rounded-2xl border border-accent/20" />
            <Separator orientation="vertical" className="h-10 bg-border/50" />
            <div className="flex flex-col">
              <span className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Console Terminal</span>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-black uppercase tracking-[0.4em] mt-2">
                <div className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
                Regional Cluster Live
              </div>
            </div>
            <div className="ml-auto flex items-center gap-8">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] font-black text-accent uppercase tracking-widest">Session Active</span>
                <span className="text-[11px] font-bold text-white/50 lowercase tracking-tight">{user.email}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 border border-border/50 transition-all" onClick={async () => {
                await signOut(auth);
                router.push("/admin/login");
                toast({ title: "Console Terminated" });
              }}>
                <LogOut className="h-6 w-6" />
              </Button>
            </div>
          </header>
          
          <main className="flex-1 p-12 overflow-y-auto">
            <div className="max-w-[1400px] mx-auto space-y-12">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
