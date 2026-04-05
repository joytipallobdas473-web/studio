"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Navbar } from "@/components/navbar";
import { Cpu, Loader2 } from "lucide-react";

const MASTER_ADMIN_UID = "j96izCkggNcL002AHiJjzGb18Bf2";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const storeRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "stores", user.uid);
  }, [db, user?.uid]);

  const { data: store, isLoading: storeLoading } = useDoc(storeRef);

  useEffect(() => {
    if (isUserLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    const isAdmin = user.email?.toLowerCase().includes("admin") || user.uid === MASTER_ADMIN_UID;
    if (isAdmin) {
      router.push("/admin");
      return;
    }

    if (storeLoading) return;

    if (!store) {
      router.push("/register");
    }
  }, [user, isUserLoading, store, storeLoading, router, pathname]);

  if (isUserLoading || (user && storeLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-100 blur-2xl rounded-full animate-pulse" />
            <div className="relative p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl">
               <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-400">Node Sync Active</p>
        </div>
      </div>
    );
  }

  const isAdmin = user?.email?.toLowerCase().includes("admin") || user?.uid === MASTER_ADMIN_UID;
  if (isAdmin) return null;

  return (
    <div className="min-h-screen bg-background portal-surface font-body">
      <Navbar />
      <main className="container mx-auto px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}