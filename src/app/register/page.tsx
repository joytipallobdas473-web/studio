
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCardWrapper } from "@/components/auth-card-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Lock, User, Mail, MapPin, Building, Loader2 } from "lucide-react";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function RegisterPage() {
  const router = useRouter();
  const db = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    managerName: "",
    email: "",
    storeName: "",
    location: "",
    password: ""
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    
    setIsLoading(true);
    const storeData = {
      name: formData.storeName,
      managerName: formData.managerName,
      email: formData.email,
      location: formData.location,
      status: "pending",
      createdAt: serverTimestamp()
    };

    // Use non-blocking addDoc with proper error handling
    addDoc(collection(db, "stores"), storeData)
      .then(() => {
        toast({
          title: "Registration Submitted",
          description: "Your store registration is pending admin approval.",
        });
        router.push("/");
      })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: 'stores',
          operation: 'create',
          requestResourceData: storeData
        });
        errorEmitter.emit('permission-error', permissionError);
        setIsLoading(false); // Reset loading if it fails
      });
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
                <Input 
                  id="manager" 
                  placeholder="John Doe" 
                  className="pl-9" 
                  required 
                  value={formData.managerName}
                  onChange={(e) => setFormData({...formData, managerName: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john@store.com" 
                  className="pl-9" 
                  required 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="storeName">Store Name</Label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="storeName" 
                placeholder="Downtown BK Branch" 
                className="pl-9" 
                required 
                value={formData.storeName}
                onChange={(e) => setFormData({...formData, storeName: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Store Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="location" 
                placeholder="City, State" 
                className="pl-9" 
                required 
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Set Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                className="pl-9" 
                required 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Request...
              </>
            ) : "Apply for Registration"}
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
