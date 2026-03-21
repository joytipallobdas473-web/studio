
"use client";

import { Fingerprint, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function BiometricPrompt({ onComplete }: { onComplete: () => void }) {
  const [status, setStatus] = useState<"idle" | "scanning" | "success">("idle");

  const handleScan = () => {
    setStatus("scanning");
    setTimeout(() => {
      setStatus("success");
      setTimeout(onComplete, 800);
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      <div className={cn(
        "relative flex items-center justify-center w-24 h-24 rounded-full border-4 transition-all duration-300",
        status === "idle" && "border-muted bg-muted/20",
        status === "scanning" && "border-accent animate-pulse bg-accent/10",
        status === "success" && "border-green-500 bg-green-50"
      )}>
        {status === "success" ? (
          <CheckCircle2 className="h-12 w-12 text-green-500 animate-in zoom-in" />
        ) : (
          <Fingerprint className={cn(
            "h-12 w-12 transition-colors",
            status === "scanning" ? "text-accent" : "text-muted-foreground"
          )} />
        )}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          {status === "idle" && "Use Biometric Login"}
          {status === "scanning" && "Scanning Fingerprint..."}
          {status === "success" && "Authentication Successful"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {status === "idle" && "Place your finger on the sensor"}
        </p>
      </div>
      {status === "idle" && (
        <Button onClick={handleScan} variant="outline" className="w-full mt-2">
          Scan Now
        </Button>
      )}
    </div>
  );
}
