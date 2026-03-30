
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

const MASTER_ADMIN_UID = "j96izCkggNcL002AHiJjzGb18Bf2";

export default function Home() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const storeRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "stores", user.uid);
  }, [db, user]);

  const { data: store, isLoading: storeLoading } = useDoc(storeRef);

  // Direct Command Routing: Priority redirect to Admin Panel
  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        const isAdmin = user.email?.toLowerCase().includes("admin") || user.uid === MASTER_ADMIN_UID;
        if (isAdmin) {
          router.push("/admin");
        } else if (!storeLoading) {
          if (store) {
            router.push("/dashboard");
          } else {
            router.push("/register");
          }
        }
      } else {
        // Default entry for unauthenticated users is now the Admin Console
        router.push("/admin");
      }
    }
  }, [user, isUserLoading, store, storeLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ECF0F5]">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="bg-primary p-4 rounded-2xl shadow-xl animate-pulse">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Regional Logistics Grid</p>
          <p className="text-sm font-black uppercase italic tracking-tighter text-slate-400">Initializing Command Console...</p>
        </div>
      </div>
    </div>
  );
}
