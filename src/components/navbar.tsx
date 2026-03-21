
"use client";

import Link from "next/link";
import { Package, User, LogOut, History, PlusCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2 font-headline font-bold text-xl text-primary">
          <Package className="h-6 w-6 text-accent" />
          <span>Retails Stocks</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="hidden lg:flex gap-2 text-primary hover:bg-primary/5">
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Button>
          </Link>
          <Link href="/dashboard/order">
            <Button variant="ghost" size="sm" className="hidden sm:flex gap-2">
              <PlusCircle className="h-4 w-4" />
              New Order
            </Button>
          </Link>
          <Link href="/dashboard/history">
            <Button variant="ghost" size="sm" className="hidden sm:flex gap-2">
              <History className="h-4 w-4" />
              History
            </Button>
          </Link>
          <Link href="/dashboard/profile">
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
