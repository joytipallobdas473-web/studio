
"use client";

import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarInset, SidebarTrigger, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { LayoutDashboard, Store, Package, ShoppingCart, LogOut, ShieldCheck, UserCircle, Key } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function AdminSidebar() {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  const { user } = useUser();

  const menuItems = [
    { title: "Overview", icon: LayoutDashboard, href: "/admin" },
    { title: "Stores", icon: Store, href: "/admin/stores" },
    { title: "Stock Management", icon: Package, href: "/admin/inventory" },
    { title: "All Orders", icon: ShoppingCart, href: "/admin/orders" },
  ];

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="bg-sidebar border-r">
      <SidebarHeader className="h-16 flex items-center px-4 border-b">
        <Link href="/admin" onClick={handleLinkClick} className="flex items-center gap-3 font-bold text-primary overflow-hidden">
          <div className="bg-primary p-2 rounded-lg shrink-0">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="truncate group-data-[collapsible=icon]:hidden">Official Admin</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">System Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                    <Link href={item.href} onClick={handleLinkClick}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4 space-y-4">
        {user && (
          <div className="group-data-[collapsible=icon]:hidden p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-tighter">
              <Key className="h-3 w-3" /> User Identity
            </div>
            <div className="text-[10px] font-mono break-all opacity-70 bg-white p-1 rounded border">
              {user.uid}
            </div>
            <p className="text-[9px] text-muted-foreground leading-tight">
              Add this UID to <code>roles_admin</code> in Firebase Console to enable full Admin rights.
            </p>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Logout">
              <Link href="/" onClick={handleLinkClick}>
                <LogOut className="h-4 w-4" />
                <span>Exit Portal</span>
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
      <div className="flex min-h-svh w-full bg-background">
        <AdminSidebar />
        <SidebarInset className="flex flex-col min-w-0">
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-[1px] bg-border md:hidden" />
            <h2 className="text-sm font-semibold truncate md:text-base">Control Center</h2>
            <div className="ml-auto flex items-center gap-4">
              <Badge variant="outline" className="hidden sm:flex bg-green-50 text-green-700 border-green-200 font-bold uppercase text-[10px]">
                Server Active
              </Badge>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
