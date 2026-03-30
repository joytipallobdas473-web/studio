
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { Loader2 } from "lucide-react";

const MASTER_ADMIN_UID = "j96izCkggNcL002AHiJjzGb18Bf2";

export default function Home() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading) {
      // Direct Command Centre Priority
      // If user is Master Admin or an admin by email, go to /admin
      // Otherwise, the /admin layout will handle unauthenticated users by sending them to /admin/login
      router.push("/admin");
    }
  }, [user, isUserLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617]">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="bg-primary p-5 rounded-[2rem] shadow-[0_0_50px_rgba(34,96,181,0.3)] animate-pulse">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Protocol Synchronization</p>
          <p className="text-sm font-black uppercase italic tracking-tighter text-slate-500">Opening Command Centre...</p>
        </div>
      </div>
    </div>
  );
}
