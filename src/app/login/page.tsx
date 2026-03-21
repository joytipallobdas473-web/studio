
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to root as it now contains the login logic
    router.replace("/");
  }, [router]);

  return null;
}
