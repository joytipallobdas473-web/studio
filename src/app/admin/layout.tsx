
"use client";

import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarInset, SidebarTrigger, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { LayoutDashboard, Store, Package, ShoppingCart, LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function AdminSidebar() {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

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
      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Logout">
              <Link href="/" onClick={handleLinkClick}>
                <LogOut className="h-4 w-4" />
                <span>Exit Admin Portal</span>
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
