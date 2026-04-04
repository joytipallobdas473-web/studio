"use client";

import { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Navbar } from "@/components/navbar";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
        <div className="flex flex-col items-center gap-6 text-primary">
          <div className="p-10 rounded-full bg-primary/5 animate-pulse border border-primary/20">
             <Loader2 className="h-12 w-12 animate-spin" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em]">Synchronizing Branch Node...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user?.email?.toLowerCase().includes("admin") || user?.uid === MASTER_ADMIN_UID;
  if (isAdmin) return null;

  return (
    <div className="min-h-screen bg-background portal-surface">
      <Navbar />
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}