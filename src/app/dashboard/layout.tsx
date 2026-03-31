"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Navbar } from "@/components/navbar";
import { Loader2 } from "lucide-react";

const MASTER_ADMIN_UID = "j96izCkggNcL002AHiJjzGb18Bf2";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const storeRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "stores", user.uid);
  }, [db, user]);

  const { data: store, isLoading: storeLoading } = useDoc(storeRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
      return;
    }

    if (!isUserLoading && !storeLoading && user) {
      const isAdmin = user.email?.toLowerCase().includes("admin") || user.uid === MASTER_ADMIN_UID;
      if (isAdmin) {
        router.push("/admin");
        return;
      }
      
      if (!store) {
        router.push("/register");
      }
    }
  }, [user, isUserLoading, store, storeLoading, router]);

  if (isUserLoading || (user && storeLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4 text-primary">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background portal-surface">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
