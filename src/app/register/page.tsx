
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCardWrapper } from "@/components/auth-card-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Lock, User, Mail, MapPin, Building } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate store registration request
    setTimeout(() => {
      router.push("/");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="mb-8 flex flex-col items-center">
        <Package className="h-12 w-12 text-primary mb-2" />
        <h1 className="text-3xl font-headline font-bold text-primary">Retails Stocks</h1>
      </div>

      <AuthCardWrapper 
        headerTitle="Store Registration" 
        headerLabel="Submit your store details for admin approval"
      >
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manager">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="manager" placeholder="John Doe" className="pl-9" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="john@store.com" className="pl-9" required />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="storeName">Store Name</Label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="storeName" placeholder="Downtown BK Branch" className="pl-9" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Store Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="location" placeholder="City, State" className="pl-9" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Set Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="password" type="password" placeholder="••••••••" className="pl-9" required />
            </div>
          </div>

          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold" disabled={isLoading}>
            {isLoading ? "Submitting Request..." : "Apply for Registration"}
          </Button>
        </form>
        
        <div className="mt-6 text-center text-sm border-t pt-4">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link href="/" className="text-primary font-semibold hover:underline">
            Login
          </Link>
        </div>
      </AuthCardWrapper>
    </div>
  );
}
